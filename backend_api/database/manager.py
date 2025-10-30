"""
Main database connection manager - Facade pattern
Provides unified interface for all database operations
"""
from typing import List, Dict, Any, Tuple

from .executors import SQLiteExecutor, PostgreSQLExecutor
from .schema_introspection import SchemaIntrospector


class DatabaseConnectionManager:
    """
    Unified interface for database operations
    
    Responsibilities:
        - Route operations to appropriate executor/introspector
        - Provide backward-compatible API
        - Abstract database-specific implementation details
    """
    
    # Executor instances (Strategy pattern)
    _executors = {
        'sqlite': SQLiteExecutor(),
        'postgresql': PostgreSQLExecutor()
    }
    
    @staticmethod
    def execute_query(
        db_type: str, 
        connection_info: str, 
        query: str, 
        max_rows: int = 10000
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Execute query on user database with safety limits
        
        Args:
            db_type: Database type ('sqlite' or 'postgresql')
            connection_info: Connection string or file path
            query: SQL query to execute
            max_rows: Maximum rows to return (prevents memory issues)
            
        Returns:
            Tuple of (results as list of dicts, column names)
            
        Raises:
            ValueError: If database type is unsupported
            
        Features:
            - Automatic LIMIT injection for SELECT queries
            - Memory-safe result fetching
            - Consistent dict-based result format
            - Proper connection cleanup
        """
        executor = DatabaseConnectionManager._get_executor(db_type)
        return executor.execute(connection_info, query, max_rows)
    
    @staticmethod
    def get_schema(db_type: str, connection_info: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get database schema information
        
        Args:
            db_type: Database type ('sqlite' or 'postgresql')
            connection_info: Connection string or file path
            
        Returns:
            Dictionary mapping table names to column definitions
            
        Performance:
            - SQLite: Delegates to existing SQLiteIntrospector
            - PostgreSQL: Single-query optimization (30-40x faster than N+1)
        """
        return SchemaIntrospector.get_schema(db_type, connection_info)
    
    @staticmethod
    def _get_executor(db_type: str):
        """
        Get appropriate executor for database type
        
        Args:
            db_type: Database type
            
        Returns:
            QueryExecutor instance
            
        Raises:
            ValueError: If database type is unsupported
        """
        executor = DatabaseConnectionManager._executors.get(db_type)
        if not executor:
            raise ValueError(
                f"Unsupported database type: {db_type}. "
                f"Supported types: {list(DatabaseConnectionManager._executors.keys())}"
            )
        return executor
