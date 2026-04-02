"""Compatibility router exposing /api/query from the new route module."""

from __future__ import annotations

from fastapi import APIRouter

from api.routes.query import router as nl_query_router


router = APIRouter()
router.include_router(nl_query_router, prefix="/api", tags=["query"])
