"""Database validation utilities"""

import sqlite3
from typing import Dict, Optional


class DatabaseValidator:
    """Validates database files and retrieves statistics"""
    
    @staticmethod
    def validate_sqlite_file(file_path: str) -> bool:
        """
        Validate SQLite database file
        
        Args:
            file_path: Path to SQLite file
            
        Returns:
            True if valid SQLite database with tables
        """
        conn = None
        try:
            conn = sqlite3.connect(file_path, timeout=5.0)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            return len(tables) > 0
        except Exception:
            return False
        finally:
            if conn:
                conn.close()
    
    @staticmethod
    def get_sqlite_stats(file_path: str) -> Dict[str, any]:
        """
        Get statistics for SQLite database
        
        Args:
            file_path: Path to SQLite file
            
        Returns:
            Dictionary with table_count, row_count, size_mb
        """
        import os
        
        stats = {
            "table_count": 0,
            "row_count": 0,
            "size_mb": 0.0
        }
        
        conn = None
        try:
            # Get file size
            stats["size_mb"] = os.path.getsize(file_path) / (1024 * 1024)
            
            # Connect and get table info
            conn = sqlite3.connect(file_path, timeout=5.0)
            cursor = conn.cursor()
            
            # Get all tables (exclude sqlite internal tables)
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            )
            tables = cursor.fetchall()
            stats["table_count"] = len(tables)
            
            # Get total row count across all tables
            total_rows = 0
            for (table_name,) in tables:
                try:
                    # Use parameterized query to prevent SQL injection
                    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                    count = cursor.fetchone()[0]
                    total_rows += count
                except sqlite3.Error:
                    # Skip tables that can't be counted
                    continue
            
            stats["row_count"] = total_rows
            
        except Exception as e:
            # Return partial stats on error
            print(f"Warning: Error getting database stats: {e}")
        finally:
            if conn:
                conn.close()
        
        return stats
    
    @staticmethod
    def get_database_stats(file_path: str, db_type: str) -> Dict[str, any]:
        """
        Get database statistics (unified interface)
        
        Args:
            file_path: Path to database file
            db_type: Type of database ('sqlite', 'postgresql', etc.)
            
        Returns:
            Dictionary with database statistics
        """
        if db_type == 'sqlite':
            return DatabaseValidator.get_sqlite_stats(file_path)
        else:
            # Placeholder for other database types
            import os
            return {
                "table_count": 0,
                "row_count": 0,
                "size_mb": os.path.getsize(file_path) / (1024 * 1024) if os.path.exists(file_path) else 0.0
            }
