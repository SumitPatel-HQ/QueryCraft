"""
SQLite query executor with optimized result handling
"""
from typing import List, Dict, Any, Tuple

from .base import QueryExecutor
from ..connections import ConnectionFactory


class SQLiteExecutor(QueryExecutor):
    """Executes queries on SQLite databases"""
    
    def execute(
        self, 
        connection_info: str, 
        query: str, 
        max_rows: int = 10000
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Execute query on SQLite database
        
        Args:
            connection_info: Path to SQLite file
            query: SQL query to execute
            max_rows: Maximum rows to return
            
        Returns:
            Tuple of (results as dicts, column names)
            
        Features:
            - Auto-adds LIMIT for safety
            - Converts rows to dictionaries
            - Proper resource cleanup
        """
        # Add LIMIT for safety
        query = self.add_limit_if_missing(query, max_rows)
        
        with ConnectionFactory.get_connection('sqlite', connection_info) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Get results and column names
            results = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Convert tuples to dictionaries for easier JSON serialization
            results_dict = [dict(zip(columns, row)) for row in results]
            
            cursor.close()
            return results_dict, columns
