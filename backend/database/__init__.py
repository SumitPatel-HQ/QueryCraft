"""
Database package - Optimized database connection and query management

Architecture:
    - session.py: PostgreSQL metadata database session management
    - connections.py: Connection factory for SQLite and PostgreSQL
    - executors/: Query execution strategies (Strategy pattern)
    - schema_introspection.py: Database schema extraction
    - manager.py: Unified facade for all database operations

Public API:
    - init_db(): Initialize metadata database
    - get_db(): Get database session context manager
    - DatabaseConnectionManager: Execute queries and get schemas

Usage:
    # Initialize metadata DB
    from database import init_db
    init_db()
    
    # Use database session
    from database import get_db
    with get_db() as db:
        databases = db.query(Database).all()
    
    # Execute query on user database
    from database import DatabaseConnectionManager
    results, columns = DatabaseConnectionManager.execute_query(
        'sqlite',
        'path/to/database.db',
        'SELECT * FROM customers LIMIT 10'
    )
    
    # Get database schema
    schema = DatabaseConnectionManager.get_schema('sqlite', 'path/to/database.db')
"""

# Public API exports
from .session import init_db, get_db
from .manager import DatabaseConnectionManager

__all__ = [
    "init_db",
    "get_db",
    "DatabaseConnectionManager"
]
