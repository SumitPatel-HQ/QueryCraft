"""
SQL validation and cleaning utilities
Handles SQL syntax validation and response cleanup
"""

import re
import logging
from typing import List, Optional, Dict, Any

from .config import LLMConfig

logger = logging.getLogger(__name__)


class SQLValidator:
    """Validates and cleans SQL queries"""

    @staticmethod
    def clean_sql_response(sql: str) -> str:
        """
        Clean the SQL response by removing markdown formatting and extra text

        Args:
            sql: Raw SQL response from LLM

        Returns:
            Cleaned SQL query
        """
        # Remove markdown code blocks
        sql = re.sub(r"```sql\n?", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"```\n?", "", sql)

        # Remove "SQL:" or "Answer:" prefixes
        sql = re.sub(r"^(SQL|Answer):\s*", "", sql, flags=re.IGNORECASE)

        # Remove extra whitespace at start and end
        sql = sql.strip()

        # If multiple lines, try to extract complete SQL query
        lines = [line.strip() for line in sql.split("\n") if line.strip()]

        if len(lines) > 1:
            # Look for the first SQL-start line (preserve CTEs beginning with WITH)
            sql_start_idx = None
            sql_starts = ("WITH", "SELECT", "INSERT", "UPDATE", "DELETE")
            for idx, line in enumerate(lines):
                if line.upper().startswith(sql_starts):
                    sql_start_idx = idx
                    break

            if sql_start_idx is not None:
                sql_lines = []
                for idx in range(sql_start_idx, len(lines)):
                    line = lines[idx]
                    # Stop if we hit a line that looks like explanation text
                    if any(
                        marker in line.lower()
                        for marker in [
                            "this query",
                            "explanation:",
                            "note:",
                            "the above",
                        ]
                    ):
                        break
                    sql_lines.append(line)

                sql = " ".join(sql_lines)
            else:
                sql = " ".join(lines)

        # Clean up extra spaces
        sql = re.sub(r"\s+", " ", sql).strip()

        return sql

    @staticmethod
    def validate_sql_syntax(sql: str) -> Dict[str, Any]:
        """
        Validate basic SQL syntax and security

        Args:
            sql: SQL query to validate

        Returns:
            Dictionary containing:
                - valid: Boolean indicating if SQL is valid
                - error: Error message if invalid, None otherwise
        """
        try:
            if not sql or not isinstance(sql, str):
                logger.warning("SQL validation failed: Empty or invalid type")
                return {"valid": False, "error": "Empty or invalid SQL"}

            sql_lower = sql.lower().strip()

            # Basic balanced parentheses check
            if sql.count("(") != sql.count(")"):
                logger.warning("SQL validation failed: Unbalanced parentheses")
                return {"valid": False, "error": "Unbalanced parentheses"}

            return {"valid": True, "error": None}

        except Exception as e:
            logger.error(f"Error validating SQL: {str(e)}")
            return {"valid": False, "error": str(e)}

    @staticmethod
    def extract_tables_from_sql(sql: str) -> List[str]:
        """
        Extract table names from a SQL query

        Args:
            sql: SQL query string

        Returns:
            List of table names found in the query
        """
        try:
            sql_lower = sql.lower()
            tables = []

            # Regex to find table names after FROM and JOIN keywords
            identifier_pattern = r'(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|\w+)'
            from_pattern = rf"from\s+({identifier_pattern})"
            join_pattern = rf"join\s+({identifier_pattern})"

            from_matches = re.findall(from_pattern, sql_lower)
            join_matches = re.findall(join_pattern, sql_lower)

            tables.extend(from_matches)
            tables.extend(join_matches)

            def _strip_quotes(identifier: str) -> str:
                ident = identifier.strip()
                if (
                    (ident.startswith('"') and ident.endswith('"'))
                    or (ident.startswith("`") and ident.endswith("`"))
                    or (ident.startswith("[") and ident.endswith("]"))
                ):
                    return ident[1:-1]
                return ident

            tables = [_strip_quotes(t) for t in tables]

            # Remove duplicates and return
            return list(set(tables))

        except Exception as e:
            logger.error(f"Error extracting tables: {str(e)}")
            return []


class ConfidenceScorer:
    """Calculates confidence scores for generated SQL"""

    @staticmethod
    def calculate_confidence(
        natural_language_query: str, sql: str, schema_info
    ) -> float:
        """
        Calculate a confidence score for the generated SQL query

        Args:
            natural_language_query: Original user question
            sql: The generated SQL query
            schema_info: Database schema (can be dict or string)

        Returns:
            Confidence score (0.0-1.0)
        """
        try:
            score = LLMConfig.BASE_CONFIDENCE_SCORE

            # Check if query is valid (basic syntax check)
            sql_lower = sql.lower()

            # Deduct points for potential issues
            if not sql_lower.startswith("select"):
                score -= 20

            # Extract table names from schema if it's a dict
            table_names = []
            if isinstance(schema_info, dict):
                table_names = list(schema_info.keys())
            elif isinstance(schema_info, str):
                # Extract table names from formatted schema string
                import re

                table_matches = re.findall(r"Table: (\w+)", schema_info)
                table_names = table_matches if table_matches else []

            # Check for table names in schema
            tables_found = sum(1 for table in table_names if table.lower() in sql_lower)

            if tables_found == 0:
                score -= 30  # No valid tables found
            elif tables_found == 1:
                score += 5  # Single table query
            else:
                score += 10  # Multi-table query with joins

            # Check for proper SQL keywords
            good_keywords = ["where", "group by", "order by", "join", "limit"]
            keywords_found = sum(1 for kw in good_keywords if kw in sql_lower)
            score += keywords_found * 2

            # Ensure score is within range
            score = max(
                LLMConfig.MIN_CONFIDENCE_SCORE,
                min(LLMConfig.MAX_CONFIDENCE_SCORE, score),
            )

            # Convert to 0.0-1.0 range
            return score / 100.0

        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}")
            return 0.7  # Default moderate confidence (70%)
