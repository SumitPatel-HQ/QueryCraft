"""
Base executor interface for database query execution
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple


class QueryExecutor(ABC):
    """Abstract base class for database query executors"""
    
    @abstractmethod
    def execute(
        self, 
        connection_info: str, 
        query: str, 
        max_rows: int = 10000
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Execute query and return results with column names
        
        Args:
            connection_info: Connection string or file path
            query: SQL query to execute
            max_rows: Maximum rows to return (safety limit)
            
        Returns:
            Tuple of (results as list of dicts, column names)
        """
        pass
    
    @staticmethod
    def add_limit_if_missing(query: str, max_rows: int) -> str:
        """
        Add LIMIT clause to SELECT queries if not present
        
        Args:
            query: SQL query string
            max_rows: Maximum rows limit
            
        Returns:
            Query with LIMIT clause added
        """
        query_lower = query.lower()
        
        # Only add LIMIT to SELECT queries
        if 'select' not in query_lower:
            return query
        
        # Skip if LIMIT already present
        if 'limit' in query_lower:
            return query
        
        # Add LIMIT
        return f"{query.rstrip(';')} LIMIT {max_rows}"
