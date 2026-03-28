"""Router package for API endpoints"""

from .databases import router as databases_router
from .queries import router as queries_router
from .schema import router as schema_router

__all__ = [
    "databases_router",
    "queries_router",
    "schema_router",
]
