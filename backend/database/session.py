"""
PostgreSQL session management for QueryCraft metadata database
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from .models import Base

# PostgreSQL connection for metadata
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://querycraft_user:querycraft_pass@localhost:5432/querycraft_main"
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
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)


def init_db():
    """
    Initialize database tables from SQLAlchemy models
    Creates all tables defined in Base.metadata if they don't exist
    """
    Base.metadata.create_all(bind=engine)


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
