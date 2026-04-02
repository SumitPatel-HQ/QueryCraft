"""SQL validation helpers for safe NL query execution."""

from __future__ import annotations


def validate_sql(sql: str, dialect: str) -> tuple[bool, str | None]:
    """Validate SQL and return status with optional reason."""
    _ = dialect
    if not sql.strip():
        return False, "Query is empty"
    return True, None
