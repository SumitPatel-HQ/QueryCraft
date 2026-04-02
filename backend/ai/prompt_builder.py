"""Prompt construction utilities for NL-to-SQL generation."""

from __future__ import annotations

from typing import Any


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
