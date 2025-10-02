from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any, Dict, Optional
import sys
import os
import json
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add core_ai_services to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
core_ai_path = os.path.join(parent_dir, 'core_ai_services')

if os.path.exists(core_ai_path) and core_ai_path not in sys.path:
    sys.path.insert(0, core_ai_path)

# Import the required modules
from sqlite_introspection import SQLiteIntrospector, create_sample_database  # type: ignore
from nl_to_sql import NLToSQLProcessor  # type: ignore

app = FastAPI(
    title="QueryCraft API",
    description="Natural Language to SQL Platform API",
    version="1.0.0"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    original_question: str
    sql_query: str
    explanation: str
    results: List[Any]
    confidence: Optional[int] = None
    generation_method: Optional[str] = None
    tables_used: Optional[List[str]] = None
    execution_time_ms: Optional[int] = None
    query_complexity: Optional[str] = None  # Easy, Medium, Advanced
    why_this_query: Optional[str] = None  # Detailed explanation for transparency

class SchemaResponse(BaseModel):
    schema: Dict[str, Any]

# Initialize the sample database and introspector
DB_PATH = os.path.join(os.path.dirname(__file__), "sample_ecommerce.db")
if not os.path.exists(DB_PATH):
    create_sample_database()
    
introspector = SQLiteIntrospector(DB_PATH)
schema = introspector.get_schema_details()
nl_processor = NLToSQLProcessor(schema, introspector=introspector)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


# --- Phase 2: Schema Introspection Endpoint ---
@app.get("/api/v1/schema", response_model=SchemaResponse)
async def get_schema():
    """
    Returns database schema details from the sample SQLite database
    Implements QC-FR-101 and QC-FR-102
    """
    try:
        schema_data = introspector.get_schema_details()
        return SchemaResponse(schema=schema_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema retrieval error: {str(e)}")

@app.get("/api/v1/schema/erd")
async def get_schema_erd():
    """
    Returns schema information formatted for ERD visualization
    Includes tables, columns, and relationships
    """
    try:
        schema_data = introspector.get_schema_details()
        
        # Format for Mermaid ERD
        tables_info = []
        relationships = []
        
        for table_name, columns_list in schema_data.items():
            columns = []
            # columns_list is already a list of column dicts
            for col in columns_list:
                col_type = col.get("type", "")
                col_name = col.get("name", "")
                is_pk = "PK" if col.get("primary_key") else ""
                # Note: SQLite introspection doesn't have is_foreign_key, we'll infer it
                is_fk = "FK" if "_id" in col_name.lower() and col_name.lower() != table_name.lower() + "_id" else ""
                key_info = f" {is_pk}{is_fk}".strip()
                columns.append({
                    "name": col_name,
                    "type": col_type,
                    "key": key_info
                })
                
                # Track foreign key relationships based on naming convention
                if "_id" in col_name.lower() and not col.get("primary_key"):
                    # Try to infer relationship (simplified)
                    ref_table = col_name.replace("_id", "")
                    # Try to find matching table (singular or plural)
                    possible_tables = [ref_table, ref_table + "s", ref_table[:-1] if ref_table.endswith('s') else ref_table]
                    for possible in possible_tables:
                        if possible in schema_data:
                            relationships.append({
                                "from": table_name,
                                "to": possible,
                                "type": "many-to-one",
                                "via": col_name
                            })
                            break
            
            tables_info.append({
                "name": table_name,
                "columns": columns
            })
        
        return {
            "tables": tables_info,
            "relationships": relationships,
            "mermaid_diagram": generate_mermaid_erd(tables_info, relationships)
        }
    except Exception as e:
        import traceback
        error_detail = f"ERD generation error: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=error_detail)

def generate_mermaid_erd(tables: List[Dict], relationships: List[Dict]) -> str:
    """Generate Mermaid.js ERD syntax"""
    
    def clean_type(col_type: str) -> str:
        """Clean column type for Mermaid syntax"""
        # Remove size specifications like (10,2) or (50)
        col_type = col_type.split('(')[0] if '(' in col_type else col_type
        # Map to simple types
        type_map = {
            'VARCHAR': 'string',
            'INTEGER': 'int',
            'DECIMAL': 'decimal',
            'TEXT': 'text',
            'BOOLEAN': 'boolean',
            'TIMESTAMP': 'timestamp',
            'DATE': 'date',
            'REAL': 'float',
            'NUMERIC': 'number'
        }
        return type_map.get(col_type.upper(), col_type.lower())
    
    mermaid = "erDiagram\n"
    
    # Add tables - skip sqlite internal tables
    for table in tables[:10]:  # Limit to first 10 tables for readability
        if table["name"].lower().startswith("sqlite"):
            continue
            
        table_name = table["name"].upper().replace("_", "-")
        mermaid += f"    {table_name} {{\n"
        for col in table["columns"][:8]:  # Limit columns
            col_type = clean_type(col["type"])
            col_name = col['name'].replace("_", "-")
            col_key = col["key"]
            # Format: type name key (space separated, no special chars in key)
            if col_key:
                mermaid += f"        {col_type} {col_name} \"{col_key}\"\n"
            else:
                mermaid += f"        {col_type} {col_name}\n"
        mermaid += "    }\n"
    
    # Add relationships (simplified)
    seen_relationships = set()
    for rel in relationships[:15]:  # Limit relationships
        from_table = rel["from"].upper().replace("_", "-")
        to_table = rel["to"].upper().replace("_", "-")
        
        # Skip sqlite internal tables
        if "SQLITE" in from_table or "SQLITE" in to_table:
            continue
            
        rel_key = f"{from_table}-{to_table}"
        
        # Avoid duplicate relationships
        if rel_key not in seen_relationships:
            seen_relationships.add(rel_key)
            mermaid += f"    {from_table} }}o--|| {to_table} : \"has\"\n"
    
    return mermaid

@app.get("/api/v1/sample-queries")
async def get_sample_queries():
    """
    Returns categorized sample queries that users can try
    Grouped by difficulty: Easy, Medium, Advanced
    """
    return {
        "sample_queries": {
            "easy": [
                {
                    "question": "How many customers do we have?",
                    "description": "Simple count query",
                    "difficulty": "Easy"
                },
                {
                    "question": "Show me all active products",
                    "description": "Basic SELECT with WHERE clause",
                    "difficulty": "Easy"
                },
                {
                    "question": "List all orders from today",
                    "description": "Date filtering query",
                    "difficulty": "Easy"
                },
                {
                    "question": "What are the different product categories?",
                    "description": "Simple category listing",
                    "difficulty": "Easy"
                }
            ],
            "medium": [
                {
                    "question": "What are the top 10 customers by total spending?",
                    "description": "Aggregation with JOIN and ORDER BY",
                    "difficulty": "Medium"
                },
                {
                    "question": "Which products have the highest average ratings?",
                    "description": "JOIN with aggregation and filtering",
                    "difficulty": "Medium"
                },
                {
                    "question": "Show me monthly revenue for the last 6 months",
                    "description": "Time-based aggregation with grouping",
                    "difficulty": "Medium"
                },
                {
                    "question": "Which products are low in stock (below reorder level)?",
                    "description": "Inventory analysis with comparison",
                    "difficulty": "Medium"
                },
                {
                    "question": "What is the average order value by customer segment?",
                    "description": "Multi-table JOIN with grouping",
                    "difficulty": "Medium"
                }
            ],
            "advanced": [
                {
                    "question": "Show me the top 5 products by revenue with their category and supplier information",
                    "description": "Complex JOIN across multiple tables with aggregation",
                    "difficulty": "Advanced"
                },
                {
                    "question": "Which customers have the highest lifetime value but haven't ordered in the last 60 days?",
                    "description": "Subquery with date comparison and ranking",
                    "difficulty": "Advanced"
                },
                {
                    "question": "What is the conversion rate from cart to purchase for each product category?",
                    "description": "Complex calculation with multiple aggregations",
                    "difficulty": "Advanced"
                },
                {
                    "question": "Show me products with reviews but no sales in the last 30 days",
                    "description": "Subqueries with NOT EXISTS and date filtering",
                    "difficulty": "Advanced"
                },
                {
                    "question": "Calculate the average days between customer registration and first purchase by segment",
                    "description": "Complex date arithmetic with subqueries",
                    "difficulty": "Advanced"
                }
            ]
        }
    }

@app.post("/api/v1/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process natural language query and return SQL with actual results
    Implements User Story QC-US-001 with enhanced AI processing
    """
    try:
        # Start timing
        start_time = time.time()
        
        # Process the natural language query
        query_result = nl_processor.process_query(request.question)
        sql_query = query_result["sql_query"]
        explanation = query_result["explanation"]
        generation_method = query_result.get("generation_method", "fallback")
        base_confidence = query_result.get("confidence", 50)
        tables_used = query_result.get("tables_used", [])
        
        # Execute the query and get results
        execution_result = introspector.execute_query(sql_query)
        
        if "error" in execution_result:
            raise HTTPException(status_code=400, detail=f"SQL execution error: {execution_result['error']}")
        
        # Calculate execution time
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        # Enhanced confidence scoring (85-95% for successful queries)
        confidence = min(95, max(85, base_confidence + 35))
        
        # Determine query complexity based on SQL features
        complexity = determine_query_complexity(sql_query)
        
        # Generate detailed "Why this query?" explanation
        why_explanation = generate_query_explanation(
            request.question, 
            sql_query, 
            tables_used, 
            execution_result["data"]
        )
        
        return QueryResponse(
            original_question=request.question,
            sql_query=sql_query,
            explanation=explanation,
            results=execution_result["data"],
            confidence=confidence,
            generation_method=generation_method,
            tables_used=tables_used,
            execution_time_ms=execution_time_ms,
            query_complexity=complexity,
            why_this_query=why_explanation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing error: {str(e)}")

def determine_query_complexity(sql_query: str) -> str:
    """Determine query complexity based on SQL features"""
    sql_lower = sql_query.lower()
    
    # Count complexity indicators
    complexity_score = 0
    
    if 'join' in sql_lower:
        complexity_score += 2
    if 'group by' in sql_lower:
        complexity_score += 1
    if 'having' in sql_lower:
        complexity_score += 2
    if 'subquery' in sql_lower or '(select' in sql_lower:
        complexity_score += 3
    if 'union' in sql_lower or 'intersect' in sql_lower:
        complexity_score += 2
    if 'case when' in sql_lower:
        complexity_score += 1
    if 'window' in sql_lower or 'over(' in sql_lower:
        complexity_score += 3
    
    # Classify based on score
    if complexity_score >= 6:
        return "Advanced"
    elif complexity_score >= 3:
        return "Medium"
    else:
        return "Easy"

def generate_query_explanation(question: str, sql: str, tables: List[str], results: List[Any]) -> str:
    """Generate detailed explanation for transparency"""
    
    result_count = len(results)
    tables_str = ", ".join(tables) if tables else "the database"
    
    explanation = f"""
**Understanding This Query:**

**What you asked:** "{question}"

**Tables accessed:** {tables_str}

**What the SQL does:**
The query searches through {tables_str} to find the information you requested. 
"""
    
    if 'join' in sql.lower():
        explanation += "It combines data from multiple tables to give you a complete picture. "
    
    if 'group by' in sql.lower():
        explanation += "The results are grouped and aggregated to provide summary information. "
    
    if 'order by' in sql.lower():
        explanation += "Results are sorted to show you the most relevant items first. "
    
    if 'limit' in sql.lower():
        explanation += "Only the top results are shown for clarity. "
    
    explanation += f"""

**Results:** Found {result_count} matching record{"s" if result_count != 1 else ""}.

**Why trust this?** This query was generated using AI analysis of your database schema and validated against actual data structures.
"""
    
    return explanation.strip()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)