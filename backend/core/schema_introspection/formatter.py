"""
LLM context formatting utilities
Formats schema information for LLM consumption
"""
import logging
from typing import Dict, Any

from .config import IntrospectionConfig

logger = logging.getLogger(__name__)


class LLMContextFormatter:
    """Formats schema context for LLM prompts"""
    
    @staticmethod
    def format_as_dict(
        tables: Dict[str, Dict[str, Any]],
        db_type: str = "SQLite"
    ) -> Dict[str, Any]:
        """
        Format schema as structured dictionary for LLM
        
        Args:
            tables: Dictionary of table information
            db_type: Type of database
            
        Returns:
            Structured dictionary with database type and tables
        """
        return {
            "database_type": db_type,
            "tables": tables
        }
    
    @staticmethod
    def format_as_text(
        tables: Dict[str, Dict[str, Any]],
        db_type: str = "SQLite"
    ) -> str:
        """
        Format schema as human-readable text for LLM prompt
        
        Args:
            tables: Dictionary of table information
            db_type: Type of database
            
        Returns:
            Human-readable schema description
        """
        schema_text = f"Database Type: {db_type}\n\n"
        schema_text += "Tables and Schema:\n"
        schema_text += IntrospectionConfig.SECTION_SEPARATOR + "\n\n"
        
        for table_name, table_info in tables.items():
            schema_text += LLMContextFormatter._format_table(table_name, table_info)
        
        return schema_text
    
    @staticmethod
    def _format_table(table_name: str, table_info: Dict[str, Any]) -> str:
        """
        Format a single table's information
        
        Args:
            table_name: Name of the table
            table_info: Table information dictionary
            
        Returns:
            Formatted table description
        """
        text = f"Table: {table_name}\n"
        text += f"Row Count: {table_info.get('row_count', 0)}\n"
        text += "Columns:\n"
        
        # Format columns
        for col in table_info.get("columns", []):
            text += LLMContextFormatter._format_column(col, table_info.get("sample_values", {}))
        
        # Format foreign keys
        if table_info.get("foreign_keys"):
            text += "Foreign Keys:\n"
            for fk in table_info["foreign_keys"]:
                text += f"  - {fk['column']} -> {fk['references_table']}.{fk['references_column']}\n"
        
        text += "\n" + IntrospectionConfig.SUBSECTION_SEPARATOR + "\n\n"
        return text
    
    @staticmethod
    def _format_column(col: Dict[str, Any], sample_values: Dict[str, list]) -> str:
        """
        Format a single column's information
        
        Args:
            col: Column information dictionary
            sample_values: Dictionary of sample values by column name
            
        Returns:
            Formatted column description
        """
        pk_marker = " [PRIMARY KEY]" if col.get("primary_key") else ""
        nullable = "NULL" if col.get("nullable") else "NOT NULL"
        text = f"  - {col['name']} ({col['type']}) {nullable}{pk_marker}\n"
        
        # Add sample values if available
        if col["name"] in sample_values and sample_values[col["name"]]:
            samples = sample_values[col["name"]]
            text += f"    Sample values: {samples}\n"
        
        return text
