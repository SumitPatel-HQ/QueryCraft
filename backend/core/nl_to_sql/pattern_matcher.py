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
            for word in [
                "list", "show", "all", "get", "describe",
                "relation", "relationship", "foreign key", "constraint", "constraints",
                "index", "indexes", "indices", "schema", "structure", "meta",
                "primary key", "pk", "unique", "column", "columns",
            ]
        ):
            return self._handle_list_queries(question_lower)

        elif any(word in question_lower for word in ["min", "minimum", "max", "maximum", "least", "lowest"]):
            return self._handle_min_max_queries(question_lower)

        elif any(word in question_lower for word in ["distinct", "unique values", "different", "unique"]):
            return self._handle_distinct_queries(question_lower)

        elif any(word in question_lower for word in ["sort", "order by", "ascending", "descending", "alphabetical", "asc", "desc"]):
            return self._handle_order_queries(question_lower)

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
                "constraint",
                "reference",
                "referencing",
                "parent",
                "child",
                "pk",
                "primary key",
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
        # Check if asking about a specific referenced table
        # e.g., "which tables reference country?", "what references the users table?"
        referenced_table = self._extract_referenced_table_from_question(question_lower)

        # Check if schema has FK metadata
        has_fk_metadata = self._schema_has_foreign_keys()

        if has_fk_metadata:
            if referenced_table:
                return self._generate_filtered_relationship_query(referenced_table)
            # Generate all FK listing query
            return self._generate_relationship_metadata_query()
        else:
            # FK metadata unavailable - cannot answer specific reference queries
            if referenced_table:
                return {
                    "sql_query": f"SELECT 'Cannot determine which tables reference {referenced_table}' as message",
                    "explanation": f"Foreign key metadata not available to find tables referencing {referenced_table}.",
                }
            return self._generate_relationship_introspection_query()

    def _extract_referenced_table_from_question(self, question_lower: str) -> str | None:
        """Extract referenced table name from questions like 'which tables reference country?'"""
        import re

        # Patterns like: "which tables reference X?", "what references X?", "who references X?"
        patterns = [
            r"which tables reference\s+(\w+)",
            r"what tables reference\s+(\w+)",
            r"what references\s+(\w+)",
            r"who references\s+(\w+)",
            r"tables referencing\s+(\w+)",
            r"referenced by\s+(\w+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, question_lower)
            if match:
                return match.group(1)

        # Check if any available table is mentioned as being referenced
        for table_name in self.available_tables:
            # Look for "reference[s] [table_name]" or "[table_name] referenced"
            if re.search(rf"reference[s]?\s+{table_name}\b", question_lower):
                return table_name
            if re.search(rf"{table_name}\b.*referenced", question_lower):
                return table_name

        return None

    def _generate_filtered_relationship_query(self, referenced_table: str) -> Dict[str, Any]:
        """Generate SQL showing only tables that reference the specified table"""
        relationships = []
        for table_name, columns in self.schema.items():
            for column in columns:
                fk_info = column.get("foreign_key")
                if fk_info and fk_info.get("referenced_table") == referenced_table:
                    col_name = column.get("column") or column.get("name")
                    ref_col = fk_info.get("referenced_column")
                    relationships.append(
                        f"SELECT '{table_name}' as table_name, '{col_name}' as column_name, "
                        f"'{referenced_table}' as referenced_table, '{ref_col}' as referenced_column"
                    )

        if relationships:
            sql = " UNION ALL ".join(relationships)
            return {
                "sql_query": sql,
                "explanation": f"These tables have foreign keys referencing the {referenced_table} table.",
            }

        return {
            "sql_query": f"SELECT 'No tables found referencing {referenced_table}' as message",
            "explanation": f"No foreign key relationships found where tables reference {referenced_table}.",
        }

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

    def _handle_min_max_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle min/max/minimum/maximum/least/lowest queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        # Detect if it's min or max
        is_min = any(word in question_lower for word in ["min", "minimum", "least", "lowest"])
        direction = "ASC" if is_min else "DESC"
        description = "minimum" if is_min else "maximum"

        return {
            "sql_query": f"SELECT * FROM {main_table} ORDER BY {main_table}_id {direction} LIMIT 1",
            "explanation": f"This query finds the {description} value from the {main_table} table.",
        }

    def _handle_distinct_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle distinct/unique values/different queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        return {
            "sql_query": f"SELECT DISTINCT * FROM {main_table} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows distinct/unique records from the {main_table} table.",
        }

    def _handle_order_queries(self, question_lower: str) -> Dict[str, Any]:
        """Handle sort/order by/ascending/descending/alphabetical queries"""
        relevant_tables = self.table_identifier.identify_relevant_tables(question_lower)

        if not relevant_tables:
            return self._get_fallback_query()

        main_table = relevant_tables[0]

        # Detect ascending or descending
        is_desc = any(word in question_lower for word in ["descending", "desc", "highest", "top"])
        direction = "DESC" if is_desc else "ASC"
        description = "descending" if is_desc else "ascending"

        return {
            "sql_query": f"SELECT * FROM {main_table} ORDER BY {main_table}_id {direction} LIMIT {NLToSQLConfig.DEFAULT_LIMIT}",
            "explanation": f"This query shows records from the {main_table} table sorted in {description} order.",
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
