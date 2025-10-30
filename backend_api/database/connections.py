"""
Database connection factory for user-uploaded databases
Handles SQLite and PostgreSQL connections with proper resource management
"""
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from typing import Union
from contextlib import contextmanager


class ConnectionFactory:
    """Factory for creating database connections with optimized settings"""
    
    # Cache connection strings for reuse validation
    _connection_cache = {}
    
    @staticmethod
    def create_sqlite_connection(file_path: str, timeout: float = 10.0) -> sqlite3.Connection:
        """
        Create SQLite connection with production-ready settings
        
        Args:
            file_path: Path to SQLite database file
            timeout: Connection timeout in seconds (prevents hanging)
            
        Returns:
            Configured SQLite connection
            
        Features:
            - Foreign key constraints enabled
            - Multi-threaded access support
            - Timeout protection
            - WAL mode for better concurrency
        """
        conn = sqlite3.connect(
            file_path,
            timeout=timeout,
            check_same_thread=False,  # Allow multi-threaded access
            isolation_level=None  # Auto-commit mode for better performance
        )
        
        # Enable foreign keys (disabled by default in SQLite)
        conn.execute("PRAGMA foreign_keys = ON")
        
        # Enable WAL mode for better read/write concurrency
        conn.execute("PRAGMA journal_mode = WAL")
        
        # Optimize for performance
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA cache_size = -64000")  # 64MB cache
        
        return conn
    
    @staticmethod
    def create_postgres_connection(connection_string: str, timeout: int = 10):
        """
        Create PostgreSQL connection with timeout protection
        
        Args:
            connection_string: PostgreSQL connection URL
            timeout: Connection timeout in seconds
            
        Returns:
            SQLAlchemy connection object
            
        Features:
            - No connection pooling (prevents resource leaks)
            - Connection timeout protection
            - Immediate failure on connection issues
        """
        engine = create_engine(
            connection_string,
            poolclass=NullPool,  # No pooling - create fresh connections
            connect_args={"connect_timeout": timeout},
            pool_pre_ping=False,  # Skip health check for one-time connections
        )
        return engine.connect()
    
    @staticmethod
    @contextmanager
    def get_connection(db_type: str, connection_info: str):
        """
        Context manager for safe database connections
        
        Args:
            db_type: Database type ('sqlite' or 'postgresql')
            connection_info: Connection string or file path
            
        Yields:
            Database connection
            
        Ensures:
            - Connection is always closed after use
            - Resources are properly released
            - Exceptions don't leak connections
        """
        conn = None
        try:
            if db_type == 'sqlite':
                conn = ConnectionFactory.create_sqlite_connection(connection_info)
            elif db_type == 'postgresql':
                conn = ConnectionFactory.create_postgres_connection(connection_info)
            else:
                raise ValueError(f"Unsupported database type: {db_type}")
            
            yield conn
            
        finally:
            if conn:
                conn.close()
