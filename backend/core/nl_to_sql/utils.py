"""
Utilities for NL-to-SQL processing
Extract tables, calculate confidence, identify entities
"""

import re
import logging
from typing import List

from .config import NLToSQLConfig

logger = logging.getLogger(__name__)


class SQLUtils:
    """Utility functions for SQL processing"""

    SQLITE_RESERVED_WORDS = {
        "select",
        "from",
        "where",
        "group",
        "order",
        "by",
        "join",
        "limit",
        "table",
        "index",
    }

    @staticmethod
    def quote_identifier(identifier: str) -> str:
        escaped = identifier.replace('"', '""')
        return f'"{escaped}"'

    @staticmethod
    def _strip_identifier_quotes(identifier: str) -> str:
        ident = identifier.strip()
        if (
            (ident.startswith('"') and ident.endswith('"'))
            or (ident.startswith("`") and ident.endswith("`"))
            or (ident.startswith("[") and ident.endswith("]"))
        ):
            return ident[1:-1]
        return ident

    @staticmethod
    def _needs_quoting(identifier: str) -> bool:
        ident = SQLUtils._strip_identifier_quotes(identifier)
        if not ident:
            return False
        if ident.lower() in SQLUtils.SQLITE_RESERVED_WORDS:
            return True
        return not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", ident)

    @staticmethod
    def quote_table_identifiers(sql: str, available_tables: List[str]) -> str:
        """Quote table identifiers appearing after FROM/JOIN when needed."""
        if not sql or not available_tables:
            return sql

        quoted_sql = sql
        for table in sorted(set(available_tables), key=len, reverse=True):
            if not SQLUtils._needs_quoting(table):
                continue

            replacement = SQLUtils.quote_identifier(table)
            table_pattern = re.escape(table)

            # FROM <table>
            quoted_sql = re.sub(
                rf"(?i)(\bFROM\s+)(?![\"`\[]){table_pattern}(\b)",
                rf"\1{replacement}\2",
                quoted_sql,
            )
            # JOIN <table>
            quoted_sql = re.sub(
                rf"(?i)(\bJOIN\s+)(?![\"`\[]){table_pattern}(\b)",
                rf"\1{replacement}\2",
                quoted_sql,
            )
            # Comma-separated table list in FROM clause
            quoted_sql = re.sub(
                rf"(?i)(,\s*)(?![\"`\[]){table_pattern}(\b)",
                rf"\1{replacement}\2",
                quoted_sql,
            )

        return quoted_sql

    @staticmethod
    def extract_tables_from_sql(sql: str) -> List[str]:
        """
        Extract table names from SQL query

        Args:
            sql: SQL query string

        Returns:
            List of unique table names found in the query
        """
        tables: List[str] = []

        identifier_pattern = r'(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)'

        # Find tables in FROM clause
        from_matches = re.findall(
            rf"(?i)FROM\s+({identifier_pattern})",
            sql,
        )
        tables.extend(from_matches)

        # Find tables in JOIN clauses
        join_matches = re.findall(
            rf"(?i)JOIN\s+({identifier_pattern})",
            sql,
        )
        tables.extend(join_matches)

        normalized = [SQLUtils._strip_identifier_quotes(t).lower() for t in tables]
        return list(set(normalized))

    @staticmethod
    def calculate_pattern_confidence(question_lower: str) -> int:
        """
        Calculate confidence score for pattern-matching results

        Args:
            question_lower: Lowercase version of user question

        Returns:
            Confidence score (0-100)
        """
        # Check for high confidence patterns
        if any(
            pattern in question_lower
            for pattern in NLToSQLConfig.HIGH_CONFIDENCE_KEYWORDS
        ):
            return NLToSQLConfig.PATTERN_HIGH_CONFIDENCE

        # Check for medium confidence patterns
        elif any(
            pattern in question_lower
            for pattern in NLToSQLConfig.MEDIUM_CONFIDENCE_KEYWORDS
        ):
            return NLToSQLConfig.PATTERN_MEDIUM_CONFIDENCE

        # Default to low confidence
        else:
            return NLToSQLConfig.PATTERN_LOW_CONFIDENCE


class TableIdentifier:
    """Identifies relevant tables from natural language"""

    def __init__(self, available_tables: List[str]):
        """
        Initialize table identifier

        Args:
            available_tables: List of available table names in database
        """
        self.available_tables = available_tables

    def identify_relevant_tables(self, question_lower: str) -> List[str]:
        """
        Identify which tables are relevant to the query

        Args:
            question_lower: Lowercase version of user question

        Returns:
            List of relevant table names
        """
        relevant_tables = []

        # Check for direct table name mentions
        for table in self.available_tables:
            table_lower = table.lower()
            # Check for exact match or singular form (e.g., 'customer' for 'customers')
            if (
                table_lower in question_lower
                or table_lower.rstrip("s") in question_lower
            ):
                relevant_tables.append(table)

        # Check for entity keywords
        for table_name, keywords in NLToSQLConfig.ENTITY_KEYWORDS.items():
            if table_name in self.available_tables:
                if any(keyword in question_lower for keyword in keywords):
                    relevant_tables.append(table_name)

        # Return unique tables
        return list(set(relevant_tables))
