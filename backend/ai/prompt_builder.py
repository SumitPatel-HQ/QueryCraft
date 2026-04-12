"""Prompt construction utilities for NL-to-SQL generation."""

from __future__ import annotations

import logging
from typing import Any


logger = logging.getLogger(__name__)


def _format_schema(schema_dict: dict[str, list[dict[str, Any]]]) -> str:
    """Render schema metadata as compact one-line table definitions with relationships."""
    if not schema_dict:
        return "(no schema available)"

    lines: list[str] = []
    relationships: list[str] = []

    for table_name in sorted(schema_dict.keys()):
        columns = schema_dict.get(table_name, [])
        formatted_columns: list[str] = []

        for column in columns:
            # Support both 'column' and 'name' keys for backward compatibility
            column_name = str(column.get("column") or column.get("name", "unknown"))
            column_type = str(column.get("type", "unknown"))
            formatted_columns.append(f"{column_name}:{column_type}")

            # Extract foreign key relationships if present
            fk_info = column.get("foreign_key")
            if fk_info:
                ref_table = fk_info.get("referenced_table", "unknown")
                ref_column = fk_info.get("referenced_column", "unknown")
                relationships.append(
                    f"  {table_name}.{column_name} -> {ref_table}.{ref_column}"
                )

        lines.append(f"{table_name}({', '.join(formatted_columns)})")

    schema_text = "\n".join(lines)

    # Add relationships section if any exist
    if relationships:
        schema_text += "\n\nRELATIONSHIPS:\n" + "\n".join(relationships)

    return schema_text


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
    """Return dialect-specific examples for metadata queries including relationships."""
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

Question: "What are the relationships in this database?" OR "Show me foreign keys"
Answer: SELECT kcu.table_name, kcu.column_name, kcu.referenced_table_name, kcu.referenced_column_name, kcu.constraint_name FROM information_schema.key_column_usage kcu WHERE kcu.table_schema = DATABASE() AND kcu.referenced_table_name IS NOT NULL ORDER BY kcu.table_name

Question: "How does the orders table relate to other tables?"
Answer: SELECT kcu.table_name, kcu.column_name, kcu.referenced_table_name, kcu.referenced_column_name FROM information_schema.key_column_usage kcu WHERE kcu.table_schema = DATABASE() AND (kcu.table_name = 'orders' OR kcu.referenced_table_name = 'orders') AND kcu.referenced_table_name IS NOT NULL
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

Question: "What are the relationships in this database?" OR "Show me foreign keys"
Answer: SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'

Question: "How does the orders table relate to other tables?"
Answer: SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND (tc.table_name = 'orders' OR ccu.table_name = 'orders')
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

Question: "What are the relationships in this database?" OR "Show me foreign keys"
Answer: SELECT m.name as table_name, f."from" as column_name, f."table" as referenced_table, f."to" as referenced_column FROM sqlite_master m, pragma_foreign_key_list(m.name) f WHERE m.type = 'table'

Question: "How does the orders table relate to other tables?"
Answer: SELECT f."from" as column_name, f."table" as referenced_table, f."to" as referenced_column FROM pragma_foreign_key_list('orders')
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

Question: "What are the relationships in this database?"
Answer: SELECT table_name, column_name, referenced_table_name, referenced_column_name FROM information_schema.key_column_usage WHERE referenced_table_name IS NOT NULL
"""


def build_prompt(
    schema_dict: dict[str, list[dict[str, Any]]],
    conversation_history: list[dict[str, str]],
    user_message: str,
    dialect: str,
    intent_plan: Any | None = None,
    multi_query_mode: bool = False,
) -> tuple[str, str]:
    """Build system and user prompts for dialect-aware SQL generation."""
    schema_block = _format_schema(schema_dict)
    history_block = _format_history(conversation_history)
    metadata_examples = _get_metadata_examples(dialect)
    intent_summary = ""
    multi_query_instructions = ""

    if intent_plan and getattr(intent_plan, "intents", None):
        summary_lines = [
            f"{index}. {intent.intent_type.value}: {intent.text}"
            for index, intent in enumerate(intent_plan.intents, start=1)
        ]
        intent_summary = (
            "\nTask intents to satisfy:\n" + "\n".join(summary_lines) + "\n"
        )

    if multi_query_mode and intent_plan and getattr(intent_plan, "is_compound", False):
        multi_query_instructions = (
            "\nMULTI-QUERY OUTPUT FORMAT:\n"
            "- Do NOT omit any user-requested intent.\n"
            "- Generate exactly one SQL statement per intent.\n"
            "- Output format is strict:\n"
            "INTENT: [intent_label]\n"
            "SQL: [sql_query]\n"
            "EXPLANATION: [brief explanation]\n"
        )

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
        "- Generate the appropriate SQL statement for the user's request.\n"
        "- Use table aliases for multi-table queries.\n"
        "- Use COALESCE for NULL handling where needed.\n"
        "\n"
        "COMPOUND INTENT HANDLING:\n"
        "- If the user asks for BOTH tables AND relationships (or any compound request), "
        "you MUST address ALL parts of the question.\n"
        "- DO NOT collapse compound questions into single-intent answers.\n"
        "- When relationship metadata is available (see RELATIONSHIPS section in schema), "
        "use it to answer relationship questions.\n"
        "- If relationships are explicitly requested but not available in schema, "
        "query information_schema or system tables for foreign key metadata.\n"
        f"{intent_summary}"
        f"{multi_query_instructions}"
        "\n"
        f"{metadata_examples}\n"
        "DDL EXAMPLES:\n"
        "When users ask to modify schema (add/drop/change columns or tables), generate appropriate ALTER statements:\n\n"
        "Question: drop column temp_C from weather_data\n"
        "Answer: ALTER TABLE weather_data DROP COLUMN temp_C\n\n"
        "Question: delete the price column from products\n"
        "Answer: ALTER TABLE products DROP COLUMN price\n\n"
        "Question: add column email to users table\n"
        "Answer: ALTER TABLE users ADD COLUMN email VARCHAR(255)\n\n"
        "Question: remove table old_logs\n"
        "Answer: DROP TABLE old_logs\n\n"
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
