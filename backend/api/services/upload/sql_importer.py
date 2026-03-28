"""SQL file import handler"""

import os
import sqlite3
import aiofiles
from typing import Optional


class SQLImporter:
    """Handles SQL dump file imports to SQLite"""
    
    @staticmethod
    def _clean_sql_for_sqlite(sql_content: str) -> str:
        """
        Clean PostgreSQL SQL dump for SQLite compatibility
        
        Args:
            sql_content: Raw SQL content
            
        Returns:
            Cleaned SQL compatible with SQLite
        """
        lines = sql_content.split('\n')
        cleaned_lines = []
        in_create_table = False
        create_buffer = []
        
        for line in lines:
            line_stripped = line.strip()
            line_upper = line_stripped.upper()
            
            # Skip comments and empty lines
            if not line_stripped or line_stripped.startswith('--'):
                continue
            
            # Detect CREATE TABLE start
            if line_upper.startswith('CREATE TABLE'):
                in_create_table = True
                # Remove schema qualifier (public.)
                line_cleaned = line.replace('public.', '').replace('PUBLIC.', '')
                create_buffer = [line_cleaned]
                continue
            
            # Collect CREATE TABLE lines
            if in_create_table:
                create_buffer.append(line)
                # Check if CREATE TABLE ends
                if ');' in line or line_stripped.endswith(';'):
                    in_create_table = False
                    # Filter out PostgreSQL-specific constraints
                    create_sql = '\n'.join(create_buffer)
                    # Remove CONSTRAINT lines (foreign keys, etc.)
                    create_lines = create_sql.split('\n')
                    filtered_create = []
                    for cline in create_lines:
                        cline_upper = cline.strip().upper()
                        # Skip constraint definitions
                        if 'CONSTRAINT' in cline_upper or 'FOREIGN KEY' in cline_upper:
                            continue
                        # Remove trailing commas before closing paren
                        if cline.strip() == ');':
                            # Check if previous line has comma
                            if filtered_create and filtered_create[-1].rstrip().endswith(','):
                                filtered_create[-1] = filtered_create[-1].rstrip()[:-1]
                        filtered_create.append(cline)
                    cleaned_lines.extend(filtered_create)
                    create_buffer = []
                continue
            
            # Detect INSERT statements
            if line_upper.startswith('INSERT INTO'):
                # Remove schema qualifier
                line_cleaned = line.replace('public.', '').replace('PUBLIC.', '')
                cleaned_lines.append(line_cleaned)
                continue
            
            # Skip SET, ALTER, GRANT, and other PostgreSQL-specific statements
            skip_keywords = ['SET ', 'ALTER ', 'GRANT ', 'REVOKE ', 'COMMENT ', 'SELECT pg_']
            if any(line_upper.startswith(kw) for kw in skip_keywords):
                continue
        
        return '\n'.join(cleaned_lines)
    
    @staticmethod
    async def import_sql_dump(file_path: str, target_db_name: str, upload_dir: str) -> str:
        """
        Import SQL dump file to SQLite database
        
        Args:
            file_path: Path to SQL dump file
            target_db_name: Name for target database
            upload_dir: Directory for output database
            
        Returns:
            Path to created SQLite database
            
        Raises:
            Exception: If import fails completely
        """
        # Create new SQLite database path
        db_path = os.path.join(upload_dir, f"{target_db_name}.db")
        
        # Read SQL file
        async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            sql_content = await f.read()
        
        # Clean SQL for SQLite compatibility
        cleaned_sql = SQLImporter._clean_sql_for_sqlite(sql_content)
        
        # Execute SQL
        conn = None
        try:
            conn = sqlite3.connect(db_path, timeout=30.0)
            cursor = conn.cursor()
            
            # Try executescript first (faster for well-formed SQL)
            try:
                cursor.executescript(cleaned_sql)
                conn.commit()
            except Exception as script_error:
                # If executescript fails, try statement-by-statement
                conn.rollback()
                
                # Split into statements
                statements = [s.strip() for s in cleaned_sql.split(';') if s.strip()]
                
                error_count = 0
                success_count = 0
                
                for statement in statements:
                    if not statement:
                        continue
                    try:
                        cursor.execute(statement + ';')
                        success_count += 1
                    except Exception as stmt_error:
                        error_count += 1
                        # Log but continue
                        print(f"Warning: Skipped statement due to error: {str(stmt_error)[:100]}")
                
                conn.commit()
                
                # If no statements succeeded, raise error
                if success_count == 0:
                    raise Exception(f"Failed to import SQL: {str(script_error)}")
                
                # Log summary if some statements failed
                if error_count > 0:
                    print(f"Import completed with {error_count} skipped statements ({success_count} succeeded)")
            
            return db_path
            
        except Exception as e:
            # Clean up failed database
            if conn:
                conn.close()
            if os.path.exists(db_path):
                os.remove(db_path)
            raise Exception(f"SQL import failed: {str(e)}")
        finally:
            if conn:
                conn.close()
