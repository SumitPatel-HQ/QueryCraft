"""
Database connection management for schema introspection
"""
import sqlite3
import logging
from typing import Optional
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Manages database connections with context manager support"""
    
    def __init__(self, db_path: str):
        """
        Initialize database connection manager
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
    
    def connect(self) -> sqlite3.Connection:
        """
        Establish database connection
        
        Returns:
            SQLite connection object
        """
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            logger.debug(f"Connected to database: {self.db_path}")
        return self._conn
    
    def close(self):
        """Close database connection if open"""
        if self._conn:
            self._conn.close()
            self._conn = None
            logger.debug(f"Closed connection to: {self.db_path}")
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections
        
        Yields:
            SQLite connection object
            
        Example:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM table")
        """
        try:
            conn = self.connect()
            yield conn
        finally:
            self.close()
    
    @contextmanager
    def get_cursor(self):
        """
        Context manager for database cursors
        
        Yields:
            SQLite cursor object
            
        Example:
            with db.get_cursor() as cursor:
                cursor.execute("SELECT * FROM table")
                results = cursor.fetchall()
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
            finally:
                cursor.close()
