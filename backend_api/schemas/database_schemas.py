"""Schemas for database-related requests and responses"""

from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime


class DatabaseCreate(BaseModel):
    """Request model for creating a new database"""
    display_name: str
    description: Optional[str] = None


class DatabaseResponse(BaseModel):
    """Response model for database information"""
    id: int
    name: str
    display_name: str
    description: Optional[str]
    db_type: str
    table_count: int
    row_count: int
    size_mb: Optional[float]
    created_at: datetime
    last_accessed: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class SchemaResponse(BaseModel):
    """Response model for database schema"""
    schema: Dict[str, Any]
