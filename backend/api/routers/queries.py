"""Query processing API endpoints"""

from fastapi import APIRouter, HTTPException, Depends
import time
import logging
import hashlib
from datetime import datetime, UTC

from api.schemas import QueryRequest, QueryResponse
from database.models import Database as DatabaseModel, QueryHistory
from database.session import get_db, set_current_user_context
from database.manager import DatabaseConnectionManager
from api.services import determine_query_complexity, generate_query_explanation
from api.middleware.auth import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["queries"])


# Import query cache
try:
    from api.services.query_cache import query_cache

    CACHE_ENABLED = True
    logger.info("✅ Query caching enabled")
except ImportError:
    CACHE_ENABLED = False
    logger.warning("⚠️  Query cache not available")


@router.post("/databases/{database_id}/query", response_model=QueryResponse)
async def query_database(
    database_id: int,
    request: QueryRequest,
    user: dict = Depends(get_current_user),
):
    """Query a specific database with natural language"""
    user_id = user.get("uid")
    logger.info(
        f"User {user_id} querying database {database_id}: {request.question[:50]}"
    )

    with get_db() as db:
        set_current_user_context(db, user_id)
        # Get database
        database = (
            db.query(DatabaseModel)
            .filter(DatabaseModel.id == database_id)
            .filter(DatabaseModel.user_id == user_id)
            .first()
        )
        if not database:
            raise HTTPException(status_code=404, detail="Database not found")

        # Validate database file exists for SQLite
        if database.db_type == "sqlite" and database.file_path:
            import os

            if not os.path.exists(database.file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Database file not found at: {database.file_path}",
                )

        # Update last queried
        database.last_queried = datetime.now(UTC)

        try:
            start_time = time.time()

            # Get schema for this database
            logger.debug(f"Database type: {database.db_type}")
            logger.debug(f"File path: {database.file_path}")
            logger.debug(f"Connection string: {database.connection_string}")
            logger.debug(f"Schema data exists: {database.schema_data is not None}")

            # Always fetch fresh schema to ensure accuracy
            schema_data = DatabaseConnectionManager.get_schema(
                database.db_type, database.file_path or database.connection_string
            )

            # Update cached schema if different
            if schema_data != database.schema_data:
                database.schema_data = schema_data
                db.commit()

            available_tables = list(schema_data.keys()) if schema_data else []
            logger.info(
                f"📊 Schema tables available in database '{database.name}': {available_tables}"
            )

            if not available_tables:
                raise HTTPException(
                    status_code=400,
                    detail=f"Database '{database.display_name}' has no tables. Please upload a valid database with tables.",
                )

            # Check cache first (speeds up repeated queries)
            schema_hash = hashlib.md5(
                str(sorted(schema_data.keys())).encode()
            ).hexdigest()
            if CACHE_ENABLED:
                cached_result = query_cache.get(request.question, schema_hash)
                if cached_result:
                    logger.info(
                        f"⚡ CACHE HIT - Returning cached result for: {request.question}"
                    )
                    # Add execution time for cache hit
                    cached_result["execution_time_ms"] = int(
                        (time.time() - start_time) * 1000
                    )
                    cached_result["generation_method"] = cached_result.get(
                        "generation_method", "cached"
                    )
                    return QueryResponse(**cached_result)
                else:
                    logger.info(f"🔍 CACHE MISS - Processing query: {request.question}")

            # Create introspector for SQLite databases (enables LLM usage)
            db_introspector = None
            if database.db_type == "sqlite" and database.file_path:
                try:
                    # Use the packaged schema introspector (no external dependency)
                    from core.schema_introspection import SQLiteIntrospector

                    db_introspector = SQLiteIntrospector(database.file_path)
                    logger.info(
                        f"Created introspector for SQLite database: {database.name}"
                    )
                except Exception as e:
                    logger.warning(f"Could not create introspector: {e}")

            # Create NL processor for this database
            from core.nl_to_sql import NLToSQLProcessor

            db_processor = NLToSQLProcessor(schema_data, introspector=db_introspector)

            # Process query
            query_result = db_processor.process_query(request.question)

            if query_result.get("blocked"):
                raise HTTPException(status_code=400, detail=query_result.get("error"))

            sql_query = query_result["sql_query"]
            explanation = query_result["explanation"]
            generation_method = query_result.get("generation_method", "fallback")
            base_confidence = query_result.get("confidence", 50)
            tables_used = query_result.get("tables_used", [])

            # Validate generated SQL uses tables from THIS database
            logger.info(f"🔍 Generated SQL uses tables: {tables_used}")
            logger.info(f"📊 Available tables in database: {available_tables}")

            # Check if any referenced tables don't exist
            invalid_tables = [t for t in tables_used if t not in available_tables]
            if invalid_tables and available_tables:
                error_msg = (
                    f"Query references tables that don't exist: {invalid_tables}. "
                    f"Available tables in '{database.display_name}': {available_tables}. "
                    f"Please rephrase your question to match the tables in this database."
                )
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)

            # Execute on the specific database
            try:
                logger.info(
                    f"Executing query on database: {database.file_path or database.connection_string}"
                )
                logger.info(f"SQL Query: {sql_query}")
                results, columns = DatabaseConnectionManager.execute_query(
                    database.db_type,
                    database.file_path or database.connection_string,
                    sql_query,
                )

                # Log result count
                logger.info(
                    f"✅ Query executed successfully. Returned {len(results)} rows."
                )

            except Exception as exec_error:
                error_str = str(exec_error)
                logger.error(f"Query execution error: {error_str}")

                # Better error message if table doesn't exist
                if "no such table" in error_str.lower():
                    # Extract table name from error
                    import re

                    match = re.search(r"no such table: (\w+)", error_str, re.IGNORECASE)
                    missing_table = match.group(1) if match else "unknown"

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Table '{missing_table}' does not exist in database '{database.display_name}'. "
                            f"Available tables: {available_tables}. "
                            f"Please ask a question relevant to the tables in this database, "
                            f"or check GET /api/v1/databases/{database_id}/tables for the schema."
                        ),
                    )
                else:
                    raise HTTPException(
                        status_code=400, detail=f"SQL execution error: {error_str}"
                    )

            execution_time_ms = int((time.time() - start_time) * 1000)
            confidence = min(95, max(85, base_confidence + 35))
            complexity = determine_query_complexity(sql_query)
            why_explanation = generate_query_explanation(
                request.question, sql_query, tables_used, results
            )

            # Prepare response
            response_data = {
                "original_question": request.question,
                "sql_query": sql_query,
                "explanation": explanation,
                "results": results,
                "columns": columns,  # Include columns for frontend table rendering
                "confidence": confidence,
                "generation_method": generation_method,
                "tables_used": tables_used,
                "execution_time_ms": execution_time_ms,
                "query_complexity": complexity,
                "why_this_query": why_explanation,
            }

            # Cache the result for future queries (exclude execution_time)
            if CACHE_ENABLED and generation_method == "llm":
                cache_data = response_data.copy()
                cache_data.pop("execution_time_ms", None)  # Don't cache timing
                query_cache.set(request.question, schema_hash, cache_data)
                logger.info(f"💾 Cached query result for: {request.question}")

            # Save to query history
            history = QueryHistory(
                database_id=database_id,
                user_id=user_id,
                question=request.question,
                sql_query=sql_query,
                execution_time_ms=execution_time_ms,
                result_count=len(results),
                confidence_score=confidence,
                success=True,
            )
            db.add(history)
            db.commit()

            return QueryResponse(**response_data)

        except HTTPException:
            raise
        except Exception as e:
            # Save failed query to history
            logger.error(f"ERROR in query endpoint: {str(e)}")
            import traceback

            traceback.print_exc()

            history = QueryHistory(
                database_id=database_id,
                user_id=user_id,
                question=request.question,
                sql_query="",
                success=False,
                error_message=str(e),
            )
            db.add(history)
            db.commit()
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    DEPRECATED: Use /api/v1/databases/{id}/query instead

    This endpoint previously processed queries on a sample database.
    Please upload your own database and use the database-specific query endpoint.
    """
    raise HTTPException(
        status_code=410,  # 410 Gone - indicates this endpoint is no longer available
        detail={
            "error": "This endpoint has been deprecated and removed.",
            "message": "Please use /api/v1/databases/{database_id}/query instead.",
            "instructions": [
                "1. Upload your database using POST /api/v1/databases/upload",
                "2. Get your database_id from the upload response",
                "3. Query using POST /api/v1/databases/{database_id}/query",
            ],
            "documentation": "See /docs for API documentation",
        },
    )


@router.get("/cache/stats")
async def get_cache_stats(user: dict = Depends(get_current_user)):
    """Get query cache statistics"""
    logger.info(f"User {user.get('uid')} fetching cache stats")

    if not CACHE_ENABLED:
        return {"error": "Cache not enabled"}

    stats = query_cache.get_stats()
    return {
        "cache_enabled": True,
        "total_cached_queries": stats["total_entries"],
        "valid_entries": stats["valid_entries"],
        "cache_ttl_minutes": 60,
    }


@router.post("/cache/clear")
async def clear_cache(user: dict = Depends(get_current_user)):
    """Clear all cached queries"""
    logger.info(f"User {user.get('uid')} clearing query cache")

    if not CACHE_ENABLED:
        return {"error": "Cache not enabled"}

    query_cache.clear()
    return {"success": True, "message": "Query cache cleared successfully"}


@router.get("/databases/{database_id}/tables")
async def get_database_tables_info(
    database_id: int, user: dict = Depends(get_current_user)
):
    """
    Get detailed table information for a specific database
    Useful for debugging schema issues
    """
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching table info for database {database_id}")

    with get_db() as db:
        set_current_user_context(db, user_id)
        database = (
            db.query(DatabaseModel)
            .filter(DatabaseModel.id == database_id)
            .filter(DatabaseModel.user_id == user_id)
            .first()
        )
        if not database:
            raise HTTPException(status_code=404, detail="Database not found")

        # Get fresh schema
        schema_data = DatabaseConnectionManager.get_schema(
            database.db_type, database.file_path or database.connection_string
        )

        # Build detailed table info
        tables_info = []
        for table_name, columns in schema_data.items():
            tables_info.append(
                {
                    "table_name": table_name,
                    "column_count": len(columns),
                    "columns": [
                        {
                            "name": col.get("name"),
                            "type": col.get("type"),
                            "primary_key": col.get("primary_key", False),
                        }
                        for col in columns
                    ],
                }
            )

        return {
            "database_id": database_id,
            "database_name": database.display_name,
            "file_path": database.file_path,
            "total_tables": len(tables_info),
            "tables": tables_info,
        }
