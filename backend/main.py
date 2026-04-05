"""
QueryCraft API - Main Application Entry Point
Production-ready FastAPI setup for Render deployment
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

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Lifespan (Startup / Shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()  # make sure this uses checkfirst=True internally
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database init failed: {e}")
    yield


# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # set your Vercel domain here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routers
# -----------------------------
app.include_router(databases_router)
app.include_router(queries_router)
app.include_router(schema_router)
app.include_router(chat_router)
app.include_router(query_router)

# -----------------------------
# Routes
# -----------------------------
@app.get("/")
async def root():
    return {
        "message": "QueryCraft API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "service": "QueryCraft API",
    }


# -----------------------------
# Local Development Only
# -----------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))  # IMPORTANT FIX
    uvicorn.run(app, host="0.0.0.0", port=port)