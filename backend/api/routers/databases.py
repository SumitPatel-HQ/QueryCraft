"""Database management API endpoints"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List
from datetime import datetime, UTC
import os
import logging

from api.schemas import DatabaseResponse
from database.models import Database as DatabaseModel, QueryHistory
from database.session import get_db, set_current_user_context
from database.manager import DatabaseConnectionManager
from api.services.upload_handler import DatabaseUploadHandler
from api.middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/databases", tags=["databases"])


@router.get("", response_model=List[DatabaseResponse])
async def list_databases(user: dict = Depends(get_current_user)):
    """Get list of all databases"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching database list")

    with get_db() as db:
        set_current_user_context(db, user_id)
        databases = (
            db.query(DatabaseModel)
            .filter(DatabaseModel.user_id == user_id)
            .filter(DatabaseModel.is_active == True)
            .order_by(DatabaseModel.last_accessed.desc())
            .all()
        )

        # Convert to dict to avoid DetachedInstanceError
        return [
            {
                "id": db_obj.id,
                "name": db_obj.name,
                "display_name": db_obj.display_name,
                "description": db_obj.description,
                "db_type": db_obj.db_type,
                "table_count": db_obj.table_count,
                "row_count": db_obj.row_count,
                "size_mb": db_obj.size_mb,
                "created_at": db_obj.created_at,
                "last_accessed": db_obj.last_accessed,
                "is_active": db_obj.is_active,
            }
            for db_obj in databases
        ]


@router.get("/{database_id}", response_model=DatabaseResponse)
async def get_database(database_id: int, user: dict = Depends(get_current_user)):
    """Get specific database details"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching database {database_id}")

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

        # Update last accessed
        database.last_accessed = datetime.now(UTC)
        db.commit()

        # Convert to dict to avoid DetachedInstanceError
        return {
            "id": database.id,
            "name": database.name,
            "display_name": database.display_name,
            "description": database.description,
            "db_type": database.db_type,
            "table_count": database.table_count,
            "row_count": database.row_count,
            "size_mb": database.size_mb,
            "created_at": database.created_at,
            "last_accessed": database.last_accessed,
            "is_active": database.is_active,
        }


@router.post("/upload")
async def upload_database(
    file: UploadFile = File(...),
    display_name: str = Form(...),
    description: str = Form(None),
    user: dict = Depends(get_current_user),
):
    """Upload a new database"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} uploading database: {display_name}")

    temp_file_path = None
    try:
        # Validate file type
        allowed_extensions = [".db", ".sqlite", ".sql", ".csv"]
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_ext}. Allowed: {', '.join(allowed_extensions)}",
            )

        # Generate safe database name
        db_name = display_name.lower().replace(" ", "_")
        db_name = "".join(c for c in db_name if c.isalnum() or c == "_")

        # Save uploaded file
        file_path = await DatabaseUploadHandler.save_upload_file(file, db_name)
        temp_file_path = file_path  # Track for cleanup on error

        # Determine database type and process accordingly
        if file_path.endswith(".db") or file_path.endswith(".sqlite"):
            db_type = "sqlite"
            # Validate SQLite file
            if not DatabaseUploadHandler.validate_sqlite_file(file_path):
                raise HTTPException(
                    status_code=400, detail="Invalid or empty SQLite database file"
                )
        elif file_path.endswith(".sql"):
            # Import SQL dump to SQLite
            db_type = "sqlite"
            try:
                original_path = file_path
                file_path = await DatabaseUploadHandler.import_sql_dump(
                    file_path, db_name
                )
                # Clean up the original .sql file
                if os.path.exists(original_path):
                    os.remove(original_path)
                temp_file_path = file_path
            except Exception as e:
                error_msg = str(e)
                # Provide user-friendly error messages
                if "syntax error" in error_msg.lower():
                    raise HTTPException(
                        status_code=400,
                        detail=f"SQL syntax error: The SQL file contains invalid syntax. {error_msg[:200]}",
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to import SQL file: {error_msg[:200]}",
                    )
        elif file_path.endswith(".csv"):
            # Import CSV to SQLite
            db_type = "sqlite"
            table_name = db_name
            try:
                original_path = file_path
                file_path = await DatabaseUploadHandler.import_csv(
                    file_path, table_name, db_name
                )
                # Clean up the original .csv file
                if os.path.exists(original_path):
                    os.remove(original_path)
                temp_file_path = file_path
            except Exception as e:
                raise HTTPException(
                    status_code=400, detail=f"Failed to import CSV file: {str(e)[:200]}"
                )
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Get database stats
        stats = DatabaseUploadHandler.get_database_stats(file_path, db_type)

        # Validate database has tables
        if stats["table_count"] == 0:
            raise HTTPException(status_code=400, detail="Database contains no tables")

        # Get schema
        schema_data = DatabaseConnectionManager.get_schema(db_type, file_path)

        # Save to PostgreSQL
        with get_db() as db:
            set_current_user_context(db, user_id)
            new_db = DatabaseModel(
                name=db_name,
                display_name=display_name,
                description=description,
                db_type=db_type,
                file_path=file_path,
                schema_data=schema_data,
                table_count=stats["table_count"],
                row_count=stats["row_count"],
                size_mb=stats["size_mb"],
                user_id=user_id,
            )
            db.add(new_db)
            db.commit()
            db.refresh(new_db)

            return {
                "success": True,
                "database_id": new_db.id,
                "message": f"Database '{display_name}' uploaded successfully",
                "stats": stats,
            }

    except HTTPException:
        # Clean up uploaded file on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
        raise
    except Exception as e:
        # Clean up uploaded file on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)[:200]}")


@router.delete("/{database_id}")
async def delete_database(database_id: int, user: dict = Depends(get_current_user)):
    """Delete a database"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} deleting database {database_id}")

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

        # Delete file if exists
        if database.file_path and os.path.exists(database.file_path):
            os.remove(database.file_path)

        # Soft delete
        database.is_active = False
        db.commit()

        return {"success": True, "message": "Database deleted"}


@router.get("/{database_id}/schema")
async def get_database_schema(database_id: int, user: dict = Depends(get_current_user)):
    """Get schema for specific database"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching schema for database {database_id}")

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

        # Validate file exists for SQLite
        if database.db_type == "sqlite" and database.file_path:
            import os

            if not os.path.exists(database.file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Database file not found at: {database.file_path}",
                )

        # Return cached schema if available
        if database.schema_data:
            return {"schema": database.schema_data, "source": "cached"}

        # Otherwise fetch fresh
        schema_data = DatabaseConnectionManager.get_schema(
            database.db_type, database.file_path or database.connection_string
        )

        # Cache it
        database.schema_data = schema_data
        db.commit()

        return {"schema": schema_data, "source": "fresh"}


@router.get("/{database_id}/erd")
async def get_database_erd(database_id: int, user: dict = Depends(get_current_user)):
    """Get ERD (Entity Relationship Diagram) for specific database as Mermaid syntax"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching ERD for database {database_id}")

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

        # Validate file exists for SQLite
        if database.db_type == "sqlite" and database.file_path:
            import os

            if not os.path.exists(database.file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Database file not found at: {database.file_path}",
                )

        # Get schema data
        schema_data = database.schema_data or DatabaseConnectionManager.get_schema(
            database.db_type, database.file_path or database.connection_string
        )

        # Convert to tables format for ERD service
        tables = []
        for table_name, columns in schema_data.items():
            table_info = {
                "name": table_name,
                "columns": [
                    {
                        "name": col.get("name", ""),
                        "type": col.get("type", "TEXT"),
                        "key": "PK" if col.get("primary_key") else ("FK" if col.get("foreign_key") else ""),
                    }
                    for col in columns
                ],
            }
            tables.append(table_info)

        # Infer relationships
        from api.services import infer_relationships
        relationships = infer_relationships(schema_data)

        # Generate Mermaid ERD
        from api.services import generate_mermaid_erd
        mermaid_erd = generate_mermaid_erd(tables, relationships)

        return {
            "mermaid": mermaid_erd,
            "tables": tables,
            "relationships": relationships,
        }


@router.get("/{database_id}/tables")
async def get_database_tables(database_id: int, user: dict = Depends(get_current_user)):
    """Get list of tables in a specific database (for debugging)"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching tables for database {database_id}")

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

        # Validate file exists for SQLite
        if database.db_type == "sqlite" and database.file_path:
            import os

            if not os.path.exists(database.file_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Database file not found at: {database.file_path}",
                )

        # Get schema
        schema_data = database.schema_data or DatabaseConnectionManager.get_schema(
            database.db_type, database.file_path or database.connection_string
        )

        return {
            "database_id": database_id,
            "database_name": database.display_name,
            "file_path": database.file_path,
            "tables": list(schema_data.keys()) if schema_data else [],
            "table_count": len(schema_data) if schema_data else 0,
        }


@router.get("/{database_id}/history")
async def get_database_history(database_id: int, user: dict = Depends(get_current_user)):
    """Get query history for a specific database"""
    user_id = user.get("uid")
    logger.info(f"User {user_id} fetching query history for database {database_id}")

    with get_db() as db:
        set_current_user_context(db, user_id)

        # Verify database ownership
        database = (
            db.query(DatabaseModel)
            .filter(DatabaseModel.id == database_id)
            .filter(DatabaseModel.user_id == user_id)
            .first()
        )
        if not database:
            raise HTTPException(status_code=404, detail="Database not found")

        history = (
            db.query(QueryHistory)
            .filter(QueryHistory.database_id == database_id)
            .filter(QueryHistory.user_id == user_id)
            .order_by(QueryHistory.created_at.desc())
            .limit(50)
            .all()
        )

        return {
            "database_id": database_id,
            "database_name": database.display_name,
            "history": [
                {
                    "id": h.id,
                    "question": h.question,
                    "sql_query": h.sql_query,
                    "success": h.success,
                    "result_count": h.result_count,
                    "confidence_score": h.confidence_score,
                    "execution_time_ms": h.execution_time_ms,
                    "error_message": h.error_message,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                }
                for h in history
            ],
        }
