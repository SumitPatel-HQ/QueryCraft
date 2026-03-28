"""
File upload and database import handler
Refactored to use modular upload services
"""
import os
from typing import Dict
from fastapi import UploadFile

from services.upload import FileManager, DatabaseValidator, SQLImporter, CSVImporter


class DatabaseUploadHandler:
    """
    Handles database file uploads and imports
    Orchestrates file management, validation, and import services
    """
    
    def __init__(self):
        """Initialize upload handler with service instances"""
        self.file_manager = FileManager()
        self.validator = DatabaseValidator()
        self.sql_importer = SQLImporter()
        self.csv_importer = CSVImporter()
    
    async def save_upload_file(self, upload_file: UploadFile, db_name: str) -> str:
        """
        Save uploaded file to disk
        
        Args:
            upload_file: FastAPI UploadFile object
            db_name: Desired database name
            
        Returns:
            Path to saved file
        """
        return await self.file_manager.save_upload_file(upload_file, db_name)
    
    def validate_sqlite_file(self, file_path: str) -> bool:
        """
        Validate SQLite database file
        
        Args:
            file_path: Path to SQLite file
            
        Returns:
            True if valid
        """
        return self.validator.validate_sqlite_file(file_path)
    
    def get_database_stats(self, file_path: str, db_type: str) -> Dict:
        """
        Get database statistics
        
        Args:
            file_path: Path to database file
            db_type: Type of database
            
        Returns:
            Dictionary with statistics
        """
        return self.validator.get_database_stats(file_path, db_type)
    
    async def import_sql_dump(self, file_path: str, target_db_name: str) -> str:
        """
        Import SQL dump file to SQLite
        
        Args:
            file_path: Path to SQL file
            target_db_name: Name for target database
            
        Returns:
            Path to created database
        """
        return await self.sql_importer.import_sql_dump(
            file_path, 
            target_db_name, 
            self.file_manager.UPLOAD_DIR
        )
    
    async def import_csv(self, file_path: str, table_name: str, target_db_name: str) -> str:
        """
        Import CSV file to SQLite
        
        Args:
            file_path: Path to CSV file
            table_name: Name for the table
            target_db_name: Name for target database
            
        Returns:
            Path to created database
        """
        return await self.csv_importer.import_csv(
            file_path, 
            table_name, 
            target_db_name, 
            self.file_manager.UPLOAD_DIR
        )


# Backward compatibility: Create default instance for static-like access
_default_handler = DatabaseUploadHandler()

# Export static-like methods for backward compatibility
class DatabaseUploadHandlerCompat:
    """Backward compatibility wrapper providing static-like interface"""
    
    @staticmethod
    async def save_upload_file(upload_file: UploadFile, db_name: str) -> str:
        return await _default_handler.save_upload_file(upload_file, db_name)
    
    @staticmethod
    def validate_sqlite_file(file_path: str) -> bool:
        return _default_handler.validate_sqlite_file(file_path)
    
    @staticmethod
    def get_database_stats(file_path: str, db_type: str) -> Dict:
        return _default_handler.get_database_stats(file_path, db_type)
    
    @staticmethod
    async def import_sql_dump(file_path: str, target_db_name: str) -> str:
        return await _default_handler.import_sql_dump(file_path, target_db_name)
    
    @staticmethod
    async def import_csv(file_path: str, table_name: str, target_db_name: str) -> str:
        return await _default_handler.import_csv(file_path, table_name, target_db_name)


# Use compatibility wrapper as main export
DatabaseUploadHandler = DatabaseUploadHandlerCompat

