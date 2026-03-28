"""File management for database uploads"""

import os
import aiofiles
from typing import Optional
from fastapi import UploadFile


class FileManager:
    """Handles file upload and storage operations"""
    
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    ALLOWED_EXTENSIONS = {'.db', '.sqlite', '.sql', '.csv'}
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
    
    def __init__(self):
        """Initialize file manager and ensure upload directory exists"""
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
    
    @staticmethod
    def sanitize_filename(name: str) -> str:
        """
        Sanitize filename to prevent directory traversal and special characters
        
        Args:
            name: Original filename
            
        Returns:
            Sanitized filename
        """
        # Remove any path components
        name = os.path.basename(name)
        # Keep only alphanumeric, underscore, and hyphen
        safe_name = "".join(c for c in name if c.isalnum() or c in ('_', '-'))
        # Ensure non-empty
        return safe_name or "database"
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        Get normalized file extension
        
        Args:
            filename: Original filename
            
        Returns:
            File extension including dot (e.g., '.db')
        """
        if filename.endswith('.db') or filename.endswith('.sqlite'):
            return '.db'
        elif filename.endswith('.sql'):
            return '.sql'
        elif filename.endswith('.csv'):
            return '.csv'
        else:
            return os.path.splitext(filename)[1].lower()
    
    def validate_file_extension(self, filename: str) -> bool:
        """
        Check if file extension is allowed
        
        Args:
            filename: Filename to check
            
        Returns:
            True if extension is allowed
        """
        ext = self.get_file_extension(filename)
        return ext in self.ALLOWED_EXTENSIONS
    
    async def save_upload_file(self, upload_file: UploadFile, db_name: str) -> str:
        """
        Save uploaded file to disk with proper naming and validation
        
        Args:
            upload_file: FastAPI UploadFile object
            db_name: Desired database name
            
        Returns:
            Path to saved file
            
        Raises:
            ValueError: If file extension is not allowed or file is too large
        """
        # Validate extension
        if not self.validate_file_extension(upload_file.filename):
            raise ValueError(
                f"Unsupported file extension. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Sanitize and create filename
        safe_name = self.sanitize_filename(db_name)
        file_extension = self.get_file_extension(upload_file.filename)
        file_path = os.path.join(self.UPLOAD_DIR, f"{safe_name}{file_extension}")
        
        # Read content with size validation
        content = await upload_file.read()
        
        if len(content) > self.MAX_FILE_SIZE:
            raise ValueError(
                f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024):.0f} MB"
            )
        
        # Save file asynchronously
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(content)
        
        return file_path
    
    @staticmethod
    def get_file_size_mb(file_path: str) -> float:
        """
        Get file size in megabytes
        
        Args:
            file_path: Path to file
            
        Returns:
            File size in MB
        """
        try:
            return os.path.getsize(file_path) / (1024 * 1024)
        except OSError:
            return 0.0
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Safely delete a file
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except OSError:
            pass
        return False
    
    def get_upload_path(self, filename: str) -> str:
        """
        Get full path for uploaded file
        
        Args:
            filename: Name of file
            
        Returns:
            Full path to file in upload directory
        """
        return os.path.join(self.UPLOAD_DIR, filename)
