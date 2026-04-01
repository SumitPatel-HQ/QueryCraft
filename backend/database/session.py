"""
PostgreSQL session management for QueryCraft metadata database
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from .models import Base
from . import chat_models  # noqa: F401

# PostgreSQL connection for metadata
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://querycraft_user:querycraft_pass@localhost:5432/querycraft_main",
)

# Create engine with connection health checks
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Check connection health before using
    echo=False,
    pool_size=5,  # Connection pool size
    max_overflow=10,  # Additional connections if pool exhausted
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize database tables from SQLAlchemy models
    Creates all tables defined in Base.metadata if they don't exist
    """
    Base.metadata.create_all(bind=engine)

    # Backfill schema changes for legacy deployments where tables already existed
    # before user-isolation columns were introduced.
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE databases ADD COLUMN IF NOT EXISTS user_id VARCHAR(128)")
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_databases_user_id ON databases(user_id)"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE query_history ADD COLUMN IF NOT EXISTS user_id VARCHAR(128)"
            )
        )
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id)"
            )
        )


def set_current_user_context(db: Session, user_id: str) -> None:
    """Set PostgreSQL session variable for RLS policies."""
    if not user_id:
        return
    db.execute(
        text("SELECT set_config('app.current_user_id', :user_id, true)"),
        {"user_id": user_id},
    )


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """
    Database session context manager with automatic cleanup

    Usage:
        with get_db() as db:
            # Use db session
            db.query(Database).all()

    Yields:
        Session: SQLAlchemy database session

    Features:
        - Auto-commit on success
        - Auto-rollback on exception
        - Auto-close after use
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
