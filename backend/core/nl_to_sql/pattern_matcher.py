"""
Pattern-based query handlers
Fallback logic for when LLM is unavailable or fails
"""
import logging
from typing import Dict, Any, List

from .config import NLToSQLConfig
from .utils import TableIdentifier

logger = logging.getLogger(__name__)


class PatternMatchingEngine:
    """Pattern-based SQL generation for common query types"""
    
    def __init__(self, available_tables: List[str]):
        """
        Initialize pattern matching engine
        
        Args:
            available_tables: List of available table names
        """
        self.available_tables = available_tables
        self.table_identifier = TableIdentifier(available_tables)
    
    def generate_query(self, question: str, question_lower: str) -> Dict[str, Any]:
        """
        Generate SQL query using pattern matching
        
        Args:
            question: Original user question
            question_lower: Lowercase version of question
            
        Returns:
            Dictionary with sql_query and explanation
        """
        # Route to appropriate handler based on keywords
        if any(word in question_lower for word in ['top', 'highest', 'most', 'best']):
            return self._handle_top_queries(question_lower)
        
        elif 'count' in question_lower or 'how many' in question_lower:
            return self._handle_count_queries(question_lower)
        
        elif any(word in question_lower for word in ['average', 'avg', 'mean']):
            return self._handle_average_queries(question_lower)
        
        elif any(word in question_lower for word in ['total', 'sum']):
            return self._handle_sum_queries(question_lower)
        
        elif any(word in question_lower for word in ['list', 'show', 'all', 'get', 'relation', 'relationship']):
            return self._handle_list_queries(question_lower)
        
        else:
            return self._handle_generic_query(question_lower)
    
    def _handle_top_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle queries asking for top/highest/most items"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if not relevant_tables:
            return self._get_fallback_query()
        
        main_table = relevant_tables[0]
        
        return {
            "sql_query": f"SELECT * FROM {main_table} ORDER BY {main_table}_id DESC LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows the top {NLToSQLConfig.DEFAULT_LIMIT} most recent records from the {main_table} table."
        }
    
    def _handle_count_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle count queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if not relevant_tables:
            return self._get_fallback_query()
        
        main_table = relevant_tables[0]
        
        return {
            "sql_query": f"SELECT COUNT(*) as count FROM {main_table}",
            "explanation": f"This query counts the total number of records in the {main_table} table."
        }
    
    def _handle_average_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle average queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if not relevant_tables:
            return self._get_fallback_query()
        
        main_table = relevant_tables[0]
        
        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows data from {main_table}. Note: Average calculation requires specific column names."
        }
    
    def _handle_sum_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle sum/total queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if not relevant_tables:
            return self._get_fallback_query()
        
        main_table = relevant_tables[0]
        
        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows data from {main_table}. Note: Sum calculation requires specific column names."
        }
    
    def _handle_list_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle list/show/relation queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if not relevant_tables:
            return self._get_fallback_query()
        
        # If multiple tables mentioned, try to create a JOIN
        if len(relevant_tables) >= 2:
            table1, table2 = relevant_tables[0], relevant_tables[1]
            
            return {
                "sql_query": f"SELECT * FROM {table1}, {table2} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                "explanation": f"This query shows related data from {table1} and {table2} tables. Note: A proper JOIN requires knowing the relationship columns."
            }
        
        # Single table
        main_table = relevant_tables[0]
        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query lists records from the {main_table} table."
        }
    
    def _handle_generic_query(self, question_lower: str) -> Dict[str, Any]:
        """Handle generic queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)
        
        if relevant_tables:
            main_table = relevant_tables[0]
            return {
                "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                "explanation": f"This query shows data from the {main_table} table which seems relevant to your question."
            }
        
        return self._get_fallback_query()
    
    def _get_fallback_query(self) -> Dict[str, Any]:
        """Get default fallback query when no tables identified"""
        if self.available_tables:
            first_table = self.available_tables[0]
            return {
                "sql_query": f"SELECT * FROM {first_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                "explanation": f"This is a default query showing data from {first_table}. Please try rephrasing your question for better results."
            }
        
        return {
            "sql_query": "SELECT 1",
            "explanation": "No tables available in database."
        }
