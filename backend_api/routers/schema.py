"""Schema and ERD visualization API endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import traceback

from schemas import SchemaResponse
from services import generate_mermaid_erd, infer_relationships

router = APIRouter(prefix="/api/v1", tags=["schema"])


@router.get("/schema", response_model=SchemaResponse)
async def get_schema():
    """
    DEPRECATED: Use /api/v1/databases/{id}/schema instead
    
    This endpoint previously returned schema for a sample database.
    Please upload your own database and use the database-specific schema endpoint.
    """
    raise HTTPException(
        status_code=410,  # 410 Gone
        detail={
            "error": "This endpoint has been deprecated and removed.",
            "message": "Please use /api/v1/databases/{database_id}/schema instead.",
            "instructions": [
                "1. Upload your database using POST /api/v1/databases/upload",
                "2. Get your database_id from the upload response",
                "3. Get schema using GET /api/v1/databases/{database_id}/schema"
            ]
        }
    )


@router.get("/schema/erd")
async def get_schema_erd():
    """
    DEPRECATED: Use /api/v1/databases/{id}/erd instead
    
    This endpoint previously returned ERD for a sample database.
    Please upload your own database and use the database-specific ERD endpoint.
    """
    raise HTTPException(
        status_code=410,  # 410 Gone
        detail={
            "error": "This endpoint has been deprecated and removed.",
            "message": "Please use /api/v1/databases/{database_id}/erd instead.",
            "instructions": [
                "1. Upload your database using POST /api/v1/databases/upload",
                "2. Get your database_id from the upload response",
                "3. Get ERD using GET /api/v1/databases/{database_id}/erd"
            ]
        }
    )


# /sample-queries endpoint removed - sample questions feature deprecated
