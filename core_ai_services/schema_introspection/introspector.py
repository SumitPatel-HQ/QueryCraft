"""
Main SQLite introspector
Orchestrates schema extraction, formatting, and query execution
"""
import logging
from typing import Dict, List, Any

from .connection import DatabaseConnection
from .extractor import SchemaExtractor
from .formatter import LLMContextFormatter
from .executor import QueryExecutor

logger = logging.getLogger(__name__)


class SQLiteIntrospector:
    """
    Main class for SQLite database introspection
    Provides schema extraction, LLM context generation, and query execution
    """
    
    def __init__(self, db_path: str):
        """
        Initialize SQLite introspector
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.connection = DatabaseConnection(db_path)
        self.extractor = SchemaExtractor(self.connection)
        self.executor = QueryExecutor(self.connection)
        self.formatter = LLMContextFormatter()
        
        logger.info(f"Initialized SQLiteIntrospector for: {db_path}")
    
    # Legacy methods for backward compatibility
    def connect(self):
        """Legacy method - connection is now managed automatically"""
        self.connection.connect()
    
    def close(self):
        """Legacy method - connection is now managed automatically"""
        self.connection.close()
    
    def get_schema_details(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get basic schema details (legacy format)
        
        Returns:
            Dictionary mapping table names to column info lists
        """
        return self.extractor.get_schema_details()
    
    def get_llm_context(self) -> Dict[str, Any]:
        """
        Generate comprehensive schema context for LLM
        
        Returns:
            Dictionary containing:
                - database_type: Type of database
                - tables: Detailed table information with columns, FKs, samples
        """
        logger.info("Generating LLM context...")
        
        tables = self.extractor.get_table_names()
        tables_info = {}
        
        for table in tables:
            table_info = {
                "columns": [],
                "primary_keys": [],
                "foreign_keys": [],
                "row_count": 0,
                "sample_values": {}
            }
            
            # Get column information
            columns = self.extractor.get_column_info(table)
            table_info["columns"] = columns
            
            # Extract primary keys
            table_info["primary_keys"] = [
                col["name"] for col in columns if col.get("primary_key")
            ]
            
            # Get foreign keys
            table_info["foreign_keys"] = self.extractor.get_foreign_keys(table)
            
            # Get row count
            table_info["row_count"] = self.extractor.get_row_count(table)
            
            # Get sample values for each column
            for col in columns:
                samples = self.extractor.get_sample_values(table, col["name"])
                if samples:
                    table_info["sample_values"][col["name"]] = samples
            
            tables_info[table] = table_info
        
        return self.formatter.format_as_dict(tables_info)
    
    def format_schema_for_llm(self) -> str:
        """
        Format schema context as human-readable string for LLM prompt
        
        Returns:
            Formatted schema description
        """
        logger.info("Formatting schema for LLM...")
        
        context = self.get_llm_context()
        return self.formatter.format_as_text(context["tables"])
    
    def execute_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a SQL query and return results
        
        Args:
            query: SQL query to execute
            
        Returns:
            Dictionary with columns, data, row_count, or error
        """
        logger.info(f"Executing query: {query[:100]}...")
        return self.executor.execute_query(query)
