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

    # System schemas/databases that should always bypass table validation
    # These are metadata sources that exist across all database instances
    SYSTEM_SCHEMAS = {
        # SQLite system tables
        "sqlite_master",
        "sqlite_temp_master",
        "sqlite_sequence",
        # MySQL system databases
        "information_schema",
        "mysql",
        "performance_schema",
        "sys",
        # PostgreSQL system schemas
        "pg_catalog",
        "pg_toast",
        "pg_temp",
        "pg_temp_1",
        "pg_toast_temp_1",
        # ANSI standard (used by MySQL and PostgreSQL)
        "information_schema",
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
            List of unique table names found in the query (excludes table-valued functions and system schemas)
        """
        try:
            sql_lower = sql.lower()
            tables: List[str] = []

            # Regex to find table names after FROM and JOIN keywords
            # Captures the identifier and optional parentheses to detect function calls
            identifier_pattern = r'(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)'
            from_pattern = rf"from\s+({identifier_pattern})(\s*\()?"
            join_pattern = rf"join\s+({identifier_pattern})(\s*\()?"

            from_matches = re.findall(from_pattern, sql_lower)
            join_matches = re.findall(join_pattern, sql_lower)

            # Filter out function calls (identifiers followed by parentheses)
            # This excludes pragma_table_info(), pragma_table_list(), and other table-valued functions
            for match, has_paren in from_matches:
                if not has_paren:  # Only include if NOT followed by parentheses
                    tables.append(match)

            for match, has_paren in join_matches:
                if not has_paren:  # Only include if NOT followed by parentheses
                    tables.append(match)

            # Strip quotes from identifiers
            tables = [SQLUtils._strip_identifier_quotes(t) for t in tables]

            # Filter out system schemas/databases
            # These are metadata sources that should always be allowed
            original_tables = tables.copy()
            tables = [t for t in tables if t.lower() not in SQLUtils.SYSTEM_SCHEMAS]

            # Log system schema filtering for diagnostics
            filtered_out = set(original_tables) - set(tables)
            if filtered_out:
                logger.info(
                    f"🔧 [utils.py] Filtered out system schemas: {filtered_out}"
                )

            # Remove duplicates and return
            normalized = [t.lower() for t in tables]
            return list(set(normalized))

        except Exception as e:
            logger.error(f"Error extracting tables: {str(e)}")
            return []

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
