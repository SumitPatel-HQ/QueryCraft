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
        
        Uses builtin PRAGMA queries to avoid external dependency
        """
        import sqlite3

        schema: Dict[str, List[Dict[str, Any]]] = {}
        conn = sqlite3.connect(file_path)
        try:
            cursor = conn.cursor()
            # List user tables (exclude SQLite internal tables)
            cursor.execute(
                """
                SELECT name FROM sqlite_master
                WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
                """
            )
            tables = [row[0] for row in cursor.fetchall()]

            for table_name in tables:
                cursor.execute(f"PRAGMA table_info('{table_name.replace("'", "''")}')")
                columns = cursor.fetchall()

                # Get foreign keys: id, seq, table, from, to, on_update, on_delete, match
                cursor.execute(f"PRAGMA foreign_key_list('{table_name.replace("'", "''")}')")
                fks = cursor.fetchall()
                fk_map = {fk[3]: {"table": fk[2], "column": fk[4]} for fk in fks}

                # PRAGMA table_info returns: cid, name, type, notnull, dflt_value, pk
                schema[table_name] = [
                    {
                        "name": col[1],
                        "type": col[2],
                        "nullable": (col[3] == 0),
                        "primary_key": (col[5] > 0),
                        "default": col[4],
                        "foreign_key": fk_map.get(col[1])
                    }
                    for col in columns
                ]
        finally:
            conn.close()

        return schema
    
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
                    END as is_primary_key,
                    c.column_default,
                    fk.foreign_table_name,
                    fk.foreign_column_name
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
                LEFT JOIN (
                    -- Subquery to identify foreign key columns
                    SELECT 
                        kcu.table_name, 
                        kcu.column_name, 
                        ccu.table_name AS foreign_table_name, 
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_schema = 'public'
                ) fk ON c.table_name = fk.table_name 
                    AND c.column_name = fk.column_name
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
                col_data = {
                    "name": row[1],           # column_name
                    "type": row[2],           # data_type
                    "nullable": row[3] == 'YES',  # is_nullable
                    "primary_key": row[4],     # is_primary_key
                    "default": row[5]          # column_default
                }

                # Add foreign key if exists
                if row[6]: # foreign_table_name
                    col_data["foreign_key"] = {
                        "table": row[6],
                        "column": row[7]
                    }

                schema[table_name].append(col_data)
            
            return schema
