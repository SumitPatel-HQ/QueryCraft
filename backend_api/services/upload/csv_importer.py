"""CSV file import handler"""

import os
import sqlite3
from typing import Optional


class CSVImporter:
    """Handles CSV file imports to SQLite"""
    
    @staticmethod
    async def import_csv(file_path: str, table_name: str, target_db_name: str, upload_dir: str) -> str:
        """
        Import CSV file to SQLite database
        
        Args:
            file_path: Path to CSV file
            table_name: Name for the table in SQLite
            target_db_name: Name for target database
            upload_dir: Directory for output database
            
        Returns:
            Path to created SQLite database
            
        Raises:
            Exception: If import fails
        """
        try:
            import pandas as pd
        except ImportError:
            raise Exception("pandas is required for CSV import. Install with: pip install pandas")
        
        # Create SQLite database path
        db_path = os.path.join(upload_dir, f"{target_db_name}.db")
        
        conn = None
        try:
            # Read CSV with error handling
            try:
                df = pd.read_csv(file_path, encoding='utf-8')
            except UnicodeDecodeError:
                # Try alternative encodings
                df = pd.read_csv(file_path, encoding='latin-1')
            
            # Validate CSV has data
            if df.empty:
                raise Exception("CSV file is empty")
            
            # Sanitize column names for SQL
            df.columns = [CSVImporter._sanitize_column_name(col) for col in df.columns]
            
            # Create SQLite connection
            conn = sqlite3.connect(db_path, timeout=30.0)
            
            # Import to SQLite
            df.to_sql(table_name, conn, if_exists='replace', index=False, chunksize=1000)
            
            conn.close()
            return db_path
            
        except Exception as e:
            # Clean up on failure
            if conn:
                conn.close()
            if os.path.exists(db_path):
                os.remove(db_path)
            raise Exception(f"CSV import failed: {str(e)}")
    
    @staticmethod
    def _sanitize_column_name(name: str) -> str:
        """
        Sanitize column name for SQL compatibility
        
        Args:
            name: Original column name
            
        Returns:
            Sanitized column name
        """
        # Remove special characters, replace spaces with underscores
        sanitized = ''.join(c if c.isalnum() or c == '_' else '_' for c in str(name))
        
        # Ensure doesn't start with number
        if sanitized and sanitized[0].isdigit():
            sanitized = 'col_' + sanitized
        
        # Ensure non-empty
        return sanitized or 'column'
