from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any, Dict
import sys
import os
import json

# Add core_ai_services to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../core_ai_services')))
from sqlite_introspection import SQLiteIntrospector, create_sample_database
from nl_to_sql import NLToSQLProcessor

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

class SchemaResponse(BaseModel):
    schema: Dict[str, Any]

# Initialize the sample database and introspector
DB_PATH = os.path.join(os.path.dirname(__file__), "sample_ecommerce.db")
if not os.path.exists(DB_PATH):
    create_sample_database()
    
introspector = SQLiteIntrospector(DB_PATH)
schema = introspector.get_schema_details()
nl_processor = NLToSQLProcessor(schema)

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

@app.get("/api/v1/sample-queries")
async def get_sample_queries():
    """
    Returns sample queries that users can try
    """
    return {
        "sample_queries": [
            "What are the top 10 customers by spending?",
            "How many customers do we have?",
            "Show me all products",
            "What is the average order value?",
            "Which products are selling the most?",
            "List all customers from the USA",
            "What is the total revenue?",
            "Show me recent orders"
        ]
    }

@app.post("/api/v1/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process natural language query and return SQL with actual results
    Implements User Story QC-US-001 with enhanced AI processing
    """
    try:
        # Process the natural language query
        query_result = nl_processor.process_query(request.question)
        sql_query = query_result["sql_query"]
        explanation = query_result["explanation"]
        
        # Execute the query and get results
        execution_result = introspector.execute_query(sql_query)
        
        if "error" in execution_result:
            raise HTTPException(status_code=400, detail=f"SQL execution error: {execution_result['error']}")
        
        return QueryResponse(
            original_question=request.question,
            sql_query=sql_query,
            explanation=explanation,
            results=execution_result["data"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query processing error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)