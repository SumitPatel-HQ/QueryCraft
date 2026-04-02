"""Top-level API router registration."""

from fastapi import APIRouter

from .routes import query


router = APIRouter()
router.include_router(query.router, prefix="/api", tags=["query"])
