"""SQL safety validation for NL-to-SQL pipeline execution."""

from __future__ import annotations

import re

from database.exceptions import UnsafeQueryError


FORBIDDEN_KEYWORDS = (
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "REVOKE",
)

COMMENT_PREFIX = re.compile(r"^\s*(?:--.*(?:\n|$)|/\*.*?\*/\s*)*", re.DOTALL)
WORD_PATTERN = re.compile(r"^[A-Za-z]+")


def _fail(reason: str, raise_on_error: bool) -> tuple[bool, str | None]:
    if raise_on_error:
        raise UnsafeQueryError(reason)
    return False, reason


def _first_token_without_leading_comments(sql: str) -> str:
    stripped = COMMENT_PREFIX.sub("", sql)
    token_match = WORD_PATTERN.match(stripped)
    return token_match.group(0).upper() if token_match else ""


def validate_sql(
    sql: str,
    dialect: str,
    *,
    raise_on_error: bool = False,
) -> tuple[bool, str | None]:
    """Validate generated SQL against read-only constraints.

    Validation order:
    1) non-empty
    2) first token SELECT/WITH
    3) no forbidden keywords
    4) no semicolons
    5) max 4000 chars
    """
    _ = dialect

    if sql is None or not sql.strip():
        return _fail("Query is empty", raise_on_error)

    first_token = _first_token_without_leading_comments(sql)
    if first_token not in {"SELECT", "WITH"}:
        return _fail("Only SELECT allowed", raise_on_error)

    upper_sql = sql.upper()
    for keyword in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{re.escape(keyword)}\b", upper_sql):
            return _fail("Contains forbidden keyword", raise_on_error)

    if ";" in sql:
        return _fail("No semicolons allowed", raise_on_error)

    if len(sql) > 4000:
        return _fail("Exceeds 4000 char limit", raise_on_error)

    return True, None
