"""
Schema extraction utilities
Extracts table, column, and relationship information
"""
import logging
from typing import Dict, List, Any

from .config import IntrospectionConfig
from .connection import DatabaseConnection

logger = logging.getLogger(__name__)


class SchemaExtractor:
    """Extracts database schema information"""
    
    def __init__(self, db_connection: DatabaseConnection):
        """
        Initialize schema extractor
        
        Args:
            db_connection: Database connection manager
        """
        self.db = db_connection
    
    def get_table_names(self) -> List[str]:
        """
        Get list of all table names in database
        
        Returns:
            List of table names
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            logger.debug(f"Found {len(tables)} tables")
            return tables
    
    def get_column_info(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get column information for a specific table
        
        Args:
            table_name: Name of the table
            
        Returns:
            List of column dictionaries with name, type, nullable, primary_key
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = [
                {
                    "name": col[IntrospectionConfig.PRAGMA_NAME],
                    "type": col[IntrospectionConfig.PRAGMA_TYPE],
                    "nullable": not col[IntrospectionConfig.PRAGMA_NOTNULL],
                    "primary_key": bool(col[IntrospectionConfig.PRAGMA_PK])
                }
                for col in cursor.fetchall()
            ]
            logger.debug(f"Table '{table_name}' has {len(columns)} columns")
            return columns
    
    def get_foreign_keys(self, table_name: str) -> List[Dict[str, str]]:
        """
        Get foreign key information for a specific table
        
        Args:
            table_name: Name of the table
            
        Returns:
            List of foreign key dictionaries
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(f"PRAGMA foreign_key_list({table_name});")
            foreign_keys = [
                {
                    "column": fk[IntrospectionConfig.FK_FROM],
                    "references_table": fk[IntrospectionConfig.FK_TABLE],
                    "references_column": fk[IntrospectionConfig.FK_TO]
                }
                for fk in cursor.fetchall()
            ]
            logger.debug(f"Table '{table_name}' has {len(foreign_keys)} foreign keys")
            return foreign_keys
    
    def get_row_count(self, table_name: str) -> int:
        """
        Get total row count for a table
        
        Args:
            table_name: Name of the table
            
        Returns:
            Number of rows in table
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            logger.debug(f"Table '{table_name}' has {count} rows")
            return count
    
    def get_sample_values(self, table_name: str, column_name: str) -> List[Any]:
        """
        Get sample values for a specific column
        
        Args:
            table_name: Name of the table
            column_name: Name of the column
            
        Returns:
            List of sample values (up to MAX_SAMPLE_VALUES)
        """
        try:
            with self.db.get_cursor() as cursor:
                query = f"""
                    SELECT DISTINCT {column_name} 
                    FROM {table_name} 
                    WHERE {column_name} IS NOT NULL 
                    LIMIT {IntrospectionConfig.MAX_SAMPLE_VALUES}
                """
                cursor.execute(query)
                samples = [row[0] for row in cursor.fetchall()]
                logger.debug(f"Got {len(samples)} sample values for {table_name}.{column_name}")
                return samples
        except Exception as e:
            logger.warning(f"Failed to get sample values for {table_name}.{column_name}: {e}")
            return []
    
    def get_schema_details(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get basic schema details (legacy format for backward compatibility)
        
        Returns:
            Dictionary mapping table names to column info lists
        """
        tables = self.get_table_names()
        schema = {}
        
        for table in tables:
            schema[table] = self.get_column_info(table)
        
        logger.info(f"Extracted schema for {len(schema)} tables")
        return schema
