"""
Database schema introspection for multiple database types
Optimized queries to extract schema information efficiently
"""
from typing import Dict, List, Any
from sqlalchemy import text

from .connections import ConnectionFactory


class SchemaIntrospector:
    """Extract schema information from databases"""
    
    @staticmethod
    def get_schema(db_type: str, connection_info: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get complete database schema
        
        Args:
            db_type: Database type ('sqlite' or 'postgresql')
            connection_info: Connection string or file path
            
        Returns:
            Dictionary mapping table names to column information
            
        Example:
            {
                "customers": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "primary_key": True},
                    {"name": "email", "type": "TEXT", "nullable": True, "primary_key": False}
                ],
                "orders": [...]
            }
        """
        if db_type == 'sqlite':
            return SchemaIntrospector._get_sqlite_schema(connection_info)
        elif db_type == 'postgresql':
            return SchemaIntrospector._get_postgres_schema(connection_info)
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
    
    @staticmethod
    def _get_sqlite_schema(file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract schema from SQLite database
        
        Uses sqlite_introspection module for compatibility
        """
        from sqlite_introspection import SQLiteIntrospector
        introspector = SQLiteIntrospector(file_path)
        return introspector.get_schema_details()
    
    @staticmethod
    def _get_postgres_schema(connection_string: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract schema from PostgreSQL database
        
        Uses optimized single-query approach to avoid N+1 problem
        Fetches all tables and columns in one roundtrip
        """
        with ConnectionFactory.get_connection('postgresql', connection_string) as conn:
            # Optimized query: fetch all tables and columns in ONE query
            # Avoids N+1 problem (querying each table separately)
            schema_query = """
                SELECT 
                    c.table_name,
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    CASE 
                        WHEN pk.column_name IS NOT NULL THEN true 
                        ELSE false 
                    END as is_primary_key
                FROM information_schema.columns c
                LEFT JOIN (
                    -- Subquery to identify primary key columns
                    SELECT ku.table_name, ku.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage ku
                        ON tc.constraint_name = ku.constraint_name
                        AND tc.table_schema = ku.table_schema
                    WHERE tc.constraint_type = 'PRIMARY KEY'
                        AND tc.table_schema = 'public'
                ) pk ON c.table_name = pk.table_name 
                    AND c.column_name = pk.column_name
                WHERE c.table_schema = 'public'
                ORDER BY c.table_name, c.ordinal_position
            """
            
            result = conn.execute(text(schema_query))
            
            # Build schema dictionary
            schema = {}
            for row in result:
                table_name = row[0]
                
                # Initialize table entry if not exists
                if table_name not in schema:
                    schema[table_name] = []
                
                # Add column information
                schema[table_name].append({
                    "name": row[1],           # column_name
                    "type": row[2],           # data_type
                    "nullable": row[3] == 'YES',  # is_nullable
                    "primary_key": row[4]     # is_primary_key
                })
            
            return schema
