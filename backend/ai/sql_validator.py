"""SQL safety validation for NL-to-SQL pipeline execution."""

from __future__ import annotations

from database.exceptions import UnsafeQueryError


def _fail(reason: str, raise_on_error: bool) -> tuple[bool, str | None]:
    if raise_on_error:
        raise UnsafeQueryError(reason)
    return False, reason


def validate_sql(
    sql: str,
    dialect: str,
    *,
    raise_on_error: bool = False,
) -> tuple[bool, str | None]:
    """Validate generated SQL against basic constraints.

    Validation order:
    1) non-empty
    2) max 4000 chars (prevent resource exhaustion)
    """
    _ = dialect

    if sql is None or not sql.strip():
        return _fail("Query is empty", raise_on_error)

    if len(sql) > 4000:
        return _fail("Exceeds 4000 char limit", raise_on_error)

    return True, None
