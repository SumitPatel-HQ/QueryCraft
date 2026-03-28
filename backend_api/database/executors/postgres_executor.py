"""
PostgreSQL query executor with optimized result handling
"""
from typing import List, Dict, Any, Tuple
from sqlalchemy import text

from .base import QueryExecutor
from ..connections import ConnectionFactory


class PostgreSQLExecutor(QueryExecutor):
    """Executes queries on PostgreSQL databases"""
    
    def execute(
        self, 
        connection_info: str, 
        query: str, 
        max_rows: int = 10000
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Execute query on PostgreSQL database
        
        Args:
            connection_info: PostgreSQL connection string
            query: SQL query to execute
            max_rows: Maximum rows to return
            
        Returns:
            Tuple of (results as dicts, column names)
            
        Features:
            - Auto-adds LIMIT for safety
            - Efficient row fetching
            - Proper resource cleanup
        """
        # Add LIMIT for safety
        query = self.add_limit_if_missing(query, max_rows)
        
        with ConnectionFactory.get_connection('postgresql', connection_info) as conn:
            # Execute with SQLAlchemy text() for parameter safety
            result = conn.execute(text(query))
            
            # Get column names
            columns = list(result.keys())
            
            # Fetch results (limited by max_rows for memory safety)
            rows = result.fetchmany(max_rows)
            
            # Convert to dictionaries
            results_dict = [dict(row._mapping) for row in rows]
            
            return results_dict, columns
