"""Response formatting utilities for NL-to-SQL query outputs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class FormattedResponse:
    """Formatted response payload used by the NL query pipeline."""

    table: str
    summary: str
    sql: str
    row_count: int
    query_items: list[dict[str, Any]] | None = None
    coverage_report: dict[str, Any] | None = None
    multi_query_mode: bool = False


def _to_markdown_table(rows: list[dict[str, Any]]) -> str:
    """Convert a list of dict rows into a Markdown table string."""
    if not rows:
        return ""

    columns = list(rows[0].keys())
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join(["---"] * len(columns)) + " |"
    body_lines = [
        "| " + " | ".join(str(row.get(column, "")) for column in columns) + " |"
        for row in rows
    ]
    return "\n".join([header, separator, *body_lines])


def _sql_collapsible(sql: str) -> str:
    """Wrap SQL in a collapsible Markdown details block."""
    return (
        f"<details>\n<summary>Generated SQL</summary>\n\n```sql\n{sql}\n```\n</details>"
    )


def format_response(
    rows: list[dict[str, Any]],
    question: str,
    sql: str,
    llm_client: Any,
) -> FormattedResponse:
    """Format query rows into table, summary, and SQL transparency block."""
    total_rows = len(rows)
    sql_block = _sql_collapsible(sql)

    if total_rows == 0:
        return FormattedResponse(
            table="", summary="No results found", sql=sql_block, row_count=0
        )

    display_rows = rows[:500]
    table = _to_markdown_table(display_rows)
    if total_rows > 500:
        table = f"Showing 500 of {total_rows}\n\n{table}"

    columns = ", ".join(display_rows[0].keys()) if display_rows else ""
    prompt = (
        "Summarize in one sentence: "
        f"{question} returned {total_rows} rows with columns {columns}"
    )
    summary = llm_client.generate(prompt)

    return FormattedResponse(
        table=table, summary=summary, sql=sql_block, row_count=total_rows
    )
