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

    def __init__(
        self,
        available_tables: List[str],
        db_type: str = "mysql",
        schema: Dict[str, List[Dict]] = None,
    ):
        """
        Initialize pattern matching engine

        Args:
            available_tables: List of available table names
            db_type: Database type ('mysql', 'postgresql', 'sqlite')
            schema: Full schema dictionary with column metadata
        """
        self.available_tables = available_tables
        self.table_identifier = TableIdentifier(available_tables)
        self.db_type = db_type
        self.schema = schema or {}

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
        if any(word in question_lower for word in ["top", "highest", "most", "best"]):
            return self._handle_top_queries(question_lower)

        elif "count" in question_lower or "how many" in question_lower:
            return self._handle_count_queries(question_lower)

        elif any(word in question_lower for word in ["average", "avg", "mean"]):
            return self._handle_average_queries(question_lower)

        elif any(word in question_lower for word in ["total", "sum"]):
            return self._handle_sum_queries(question_lower)

        elif any(
            word in question_lower
            for word in ["list", "show", "all", "get", "relation", "relationship"]
        ):
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
            "explanation": f"This query shows the top {NLToSQLConfig.DEFAULT_LIMIT} most recent records from the {main_table} table.",
        }

    def _handle_count_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle count queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        return {
            "sql_query": f"SELECT COUNT(*) as count FROM {main_table}",
            "explanation": f"This query counts the total number of records in the {main_table} table.",
        }

    def _handle_average_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle average queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows data from {main_table}. Note: Average calculation requires specific column names.",
        }

    def _handle_sum_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle sum/total queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows data from {main_table}. Note: Sum calculation requires specific column names.",
        }

    def _handle_list_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle list/show/relation queries with relationship awareness"""
        # Check if this is a relationship query
        is_relationship_query = any(
            keyword in question_lower
            for keyword in [
                "relation",
                "relationship",
                "foreign key",
                "fk",
                "connect",
                "link",
            ]
        )

        if is_relationship_query:
            return self._handle_relationship_query(question_lower)

        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        # If multiple tables mentioned, DO NOT create cartesian join
        # Instead, return safe table list
        if len(relevant_tables) >= 2:
            table1, table2 = relevant_tables[0], relevant_tables[1]

            # Check if we have FK metadata to create a proper JOIN
            fk_found = self._find_foreign_key_relationship(table1, table2)
            if fk_found:
                fk_table, fk_col, ref_table, ref_col = fk_found
                return {
                    "sql_query": f"SELECT * FROM {fk_table} JOIN {ref_table} ON {fk_table}.{fk_col} = {ref_table}.{ref_col} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                    "explanation": f"This query shows related data from {fk_table} and {ref_table} tables joined on {fk_col}.",
                }

            # No FK metadata available - return safe table listing instead of cartesian join
            return {
                "sql_query": f"SELECT '{table1}' as table_name UNION ALL SELECT '{table2}'",
                "explanation": f"Multiple tables ({table1}, {table2}) were mentioned but relationship metadata is unavailable. Showing table names instead of cartesian join.",
            }

        # Single table
        main_table = relevant_tables[0]
        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query lists records from the {main_table} table.",
        }

    def _handle_relationship_query(self, question_lower: str) -> Dict[str, Any]:
        """Handle relationship/foreign key queries using metadata or safe fallback"""
        # Check if schema has FK metadata
        has_fk_metadata = self._schema_has_foreign_keys()

        if has_fk_metadata:
            # Generate FK listing query based on db_type
            return self._generate_relationship_metadata_query()
        else:
            # FK metadata unavailable - use dialect-specific information_schema query
            return self._generate_relationship_introspection_query()

    def _schema_has_foreign_keys(self) -> bool:
        """Check if any column in schema has foreign_key metadata"""
        for table_name, columns in self.schema.items():
            for column in columns:
                if "foreign_key" in column:
                    return True
        return False

    def _find_foreign_key_relationship(self, table1: str, table2: str) -> tuple:
        """Find FK relationship between two tables"""
        for table_name, columns in self.schema.items():
            if table_name not in (table1, table2):
                continue
            for column in columns:
                fk_info = column.get("foreign_key")
                if not fk_info:
                    continue
                ref_table = fk_info.get("referenced_table")
                if ref_table in (table1, table2) and ref_table != table_name:
                    return (
                        table_name,
                        column.get("column") or column.get("name"),
                        ref_table,
                        fk_info.get("referenced_column"),
                    )
        return None

    def _generate_relationship_metadata_query(self) -> Dict[str, Any]:
        """Generate SQL to list relationships from schema FK metadata"""
        # Build SELECT from in-memory schema FK data
        relationships = []
        for table_name, columns in self.schema.items():
            for column in columns:
                fk_info = column.get("foreign_key")
                if fk_info:
                    col_name = column.get("column") or column.get("name")
                    ref_table = fk_info.get("referenced_table")
                    ref_col = fk_info.get("referenced_column")
                    relationships.append(
                        f"SELECT '{table_name}' as table_name, '{col_name}' as column_name, "
                        f"'{ref_table}' as referenced_table, '{ref_col}' as referenced_column"
                    )

        if relationships:
            sql = " UNION ALL ".join(relationships)
            return {
                "sql_query": sql,
                "explanation": "This query shows foreign key relationships from schema metadata.",
            }

        return {
            "sql_query": "SELECT 'No relationships found' as message",
            "explanation": "No foreign key relationships found in schema metadata.",
        }

    def _generate_relationship_introspection_query(self) -> Dict[str, Any]:
        """Generate dialect-specific information_schema query for relationships"""
        if self.db_type == "mysql":
            return {
                "sql_query": (
                    "SELECT kcu.table_name, kcu.column_name, kcu.referenced_table_name, "
                    "kcu.referenced_column_name, kcu.constraint_name "
                    "FROM information_schema.key_column_usage kcu "
                    "WHERE kcu.table_schema = DATABASE() AND kcu.referenced_table_name IS NOT NULL "
                    "ORDER BY kcu.table_name"
                ),
                "explanation": "This query shows foreign key relationships from information_schema.",
            }
        elif self.db_type == "postgresql":
            return {
                "sql_query": (
                    "SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, "
                    "ccu.column_name AS referenced_column, tc.constraint_name "
                    "FROM information_schema.table_constraints tc "
                    "JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name "
                    "JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name "
                    "WHERE tc.constraint_type = 'FOREIGN KEY'"
                ),
                "explanation": "This query shows foreign key relationships from information_schema.",
            }
        elif self.db_type == "sqlite":
            return {
                "sql_query": (
                    'SELECT m.name as table_name, f."from" as column_name, '
                    'f."table" as referenced_table, f."to" as referenced_column '
                    "FROM sqlite_master m, pragma_foreign_key_list(m.name) f "
                    "WHERE m.type = 'table'"
                ),
                "explanation": "This query shows foreign key relationships using SQLite pragma.",
            }
        else:
            return {
                "sql_query": "SELECT 'Relationship introspection not supported for this database type' as message",
                "explanation": "Relationship queries require explicit FK metadata for this database type.",
            }

        # Single table
        main_table = relevant_tables[0]
        return {
            "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query lists records from the {main_table} table.",
        }

    def _handle_generic_query(self, question_lower: str) -> Dict[str, Any]:
        """Handle generic queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if relevant_tables:
            main_table = relevant_tables[0]
            return {
                "sql_query": f"SELECT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                "explanation": f"This query shows data from the {main_table} table which seems relevant to your question.",
            }

        return self._get_fallback_query()

    def _get_fallback_query(self) -> Dict[str, Any]:
        """Get default fallback query when no tables identified"""
        if self.available_tables:
            first_table = self.available_tables[0]
            return {
                "sql_query": f"SELECT * FROM {first_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
                "explanation": f"This is a default query showing data from {first_table}. Please try rephrasing your question for better results.",
            }

        return {
            "sql_query": "SELECT 1",
            "explanation": "No tables available in database.",
        }
