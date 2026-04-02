"""
QueryCraft API - Main Application Entry Point

Optimized and refactored FastAPI application with modular architecture.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from api.config import settings
from database.session import init_db
from api.routers import (
    databases_router,
    queries_router,
    schema_router,
    chat_router,
    query_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    init_db()
    logger.info("✅ Database initialized")
    yield


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(databases_router)
app.include_router(queries_router)
app.include_router(schema_router)
app.include_router(chat_router)
app.include_router(query_router)


@app.get("/")
async def root():
    """Root endpoint - redirect to API docs"""
    return {"message": "QueryCraft API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "service": "QueryCraft API",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
