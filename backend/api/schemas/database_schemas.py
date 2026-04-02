"""Schemas for database-related requests and responses"""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class DatabaseConnectionInfo(BaseModel):
    """Safe connection details returned for live database records."""

    host: str
    port: int
    database: str
    username: str
    ssl_enabled: bool
    password: Optional[str] = None
    auth_plugin: Optional[str] = None


class MySQLConnectionCreate(BaseModel):
    """Request model for creating a live MySQL connection."""

    display_name: str
    description: Optional[str] = None
    host: str
    port: int = 3306
    database: str
    username: str
    password: str
    ssl: bool = True
    auth_plugin: Optional[str] = None


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
    connection_info: Optional[DatabaseConnectionInfo] = None

    class Config:
        from_attributes = True


class SchemaResponse(BaseModel):
    """Response model for database schema"""

    schema_data: Dict[str, Any]
