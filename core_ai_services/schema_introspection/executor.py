"""
Query executor for schema introspection
Executes SQL queries and returns formatted results
"""
import logging
from typing import Dict, Any, List

from .connection import DatabaseConnection

logger = logging.getLogger(__name__)


class QueryExecutor:
    """Executes SQL queries and formats results"""
    
    def __init__(self, db_connection: DatabaseConnection):
        """
        Initialize query executor
        
        Args:
            db_connection: Database connection manager
        """
        self.db = db_connection
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a SQL query and return formatted results
        
        Args:
            query: SQL query to execute
            
        Returns:
            Dictionary containing:
                - columns: List of column names
                - data: List of row dictionaries
                - row_count: Number of rows returned
                - error: Error message if query failed
        """
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(query)
                
                # Get column names
                columns = (
                    [description[0] for description in cursor.description]
                    if cursor.description
                    else []
                )
                
                # Get results
                results = cursor.fetchall()
                
                # Convert to list of dictionaries
                formatted_results = [
                    dict(zip(columns, row)) for row in results
                ]
                
                logger.info(f"Query executed successfully. Returned {len(results)} rows.")
                
                return {
                    "columns": columns,
                    "data": formatted_results,
                    "row_count": len(results)
                }
                
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return {"error": str(e)}
