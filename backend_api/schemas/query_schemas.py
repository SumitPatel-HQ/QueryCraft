"""Schemas for query-related requests and responses"""

from pydantic import BaseModel
from typing import List, Any, Optional


class QueryRequest(BaseModel):
    """Request model for natural language queries"""
    question: str


class QueryResponse(BaseModel):
    """Response model for query results with metadata"""
    original_question: str
    sql_query: str
    explanation: str
    results: List[Any]
    columns: Optional[List[str]] = None  # Column names for table rendering (even if results empty)
    confidence: Optional[int] = None
    generation_method: Optional[str] = None
    tables_used: Optional[List[str]] = None
    execution_time_ms: Optional[int] = None
    query_complexity: Optional[str] = None  # Easy, Medium, Advanced
    why_this_query: Optional[str] = None  # Detailed explanation for transparency
