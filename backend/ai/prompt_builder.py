"""Prompt construction utilities for NL-to-SQL generation."""

from __future__ import annotations

import logging
from typing import Any


logger = logging.getLogger(__name__)
FORBIDDEN_KEYWORDS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "EXEC"]


def _format_schema(schema_dict: dict[str, list[dict[str, Any]]]) -> str:
    """Render schema metadata as compact one-line table definitions."""
    if not schema_dict:
        return "(no schema available)"

    lines: list[str] = []
    for table_name in sorted(schema_dict.keys()):
        columns = schema_dict.get(table_name, [])
        formatted_columns: list[str] = []

        for column in columns:
            column_name = str(column.get("column", "unknown"))
            column_type = str(column.get("type", "unknown"))
            formatted_columns.append(f"{column_name}:{column_type}")

        lines.append(f"{table_name}({', '.join(formatted_columns)})")

    return "\n".join(lines)


def _format_history(conversation_history: list[dict[str, str]]) -> str:
    """Format last six conversation messages for user prompt context."""
    if not conversation_history:
        return "(no prior conversation)"

    recent = conversation_history[-6:]
    return "\n".join(
        f"{entry.get('role', 'unknown')}: {entry.get('content', '').strip()}"
        for entry in recent
    )


def _get_metadata_examples(dialect: str) -> str:
    """Return dialect-specific examples for metadata queries."""
    dialect_lower = dialect.lower()

    if dialect_lower == "mysql":
        return """
METADATA QUERY EXAMPLES:
When users ask about schema/structure (columns, tables, relationships), use information_schema:

Question: "Show me all columns in the database"
Answer: SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY table_name, ordinal_position

Question: "What tables exist?"
Answer: SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name

Question: "Show me the structure of the users table"
Answer: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' ORDER BY ordinal_position
"""
    elif dialect_lower == "postgresql":
        return """
METADATA QUERY EXAMPLES:
When users ask about schema/structure (columns, tables, relationships), use information_schema:

Question: "Show me all columns in the database"
Answer: SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position

Question: "What tables exist?"
Answer: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name

Question: "Show me the structure of the users table"
Answer: SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position
"""
    elif dialect_lower == "sqlite":
        return """
METADATA QUERY EXAMPLES:
When users ask about schema/structure (columns, tables, relationships), use SQLite system tables:

Question: "Show me all columns in the database"
Answer: SELECT m.name as table_name, p.name as column_name, p.type as data_type FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type = 'table' ORDER BY m.name, p.cid

Question: "What tables exist?"
Answer: SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name

Question: "Show me the structure of the users table"
Answer: SELECT name as column_name, type as data_type, "notnull" as is_nullable FROM pragma_table_info('users') ORDER BY cid
"""
    else:
        # Generic fallback
        return """
METADATA QUERY EXAMPLES:
When users ask about schema/structure, try to use information_schema if available:

Question: "Show me all columns in the database"
Answer: SELECT table_name, column_name, data_type FROM information_schema.columns ORDER BY table_name, ordinal_position

Question: "What tables exist?"
Answer: SELECT table_name FROM information_schema.tables ORDER BY table_name
"""


def build_prompt(
    schema_dict: dict[str, list[dict[str, Any]]],
    conversation_history: list[dict[str, str]],
    user_message: str,
    dialect: str,
) -> tuple[str, str]:
    """Build system and user prompts for dialect-aware SQL generation."""
    schema_block = _format_schema(schema_dict)
    history_block = _format_history(conversation_history)
    forbidden = ", ".join(FORBIDDEN_KEYWORDS)
    metadata_examples = _get_metadata_examples(dialect)

    # Log that metadata examples are being added (for deployment verification)
    logger.info(f"🔧 Building prompt with metadata examples for dialect: {dialect}")
    if "information_schema" in metadata_examples:
        logger.info("🔧 Metadata examples include information_schema guidance")

    system_prompt = (
        "You are an expert SQL assistant.\n"
        f"Database dialect: {dialect}.\n"
        "Generate ONLY valid SQL for this dialect.\n"
        "Output constraints:\n"
        "- Return SQL only (no markdown, no prose, no explanation).\n"
        "- The final query MUST be a SELECT statement (CTE WITH is allowed).\n"
        f"- Forbidden keywords: {forbidden}.\n"
        "- Use table aliases for multi-table queries.\n"
        "- Use COALESCE for NULL handling where needed.\n"
        f"{metadata_examples}\n"
        "Schema:\n"
        f"{schema_block}"
    )

    user_prompt = (
        "Conversation history (most recent up to 6 messages):\n"
        f"{history_block}\n\n"
        "Current user request:\n"
        f"user: {user_message.strip()}"
    )

    return system_prompt, user_prompt
