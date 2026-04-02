import sys
from pathlib import Path

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def test_validate_sql_accepts_select_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("SELECT * FROM users", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_rejects_delete_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("DELETE FROM users", "postgresql")
    assert is_valid is False
    assert "only select" in (reason or "").lower()


def test_validate_sql_rejects_stacked_queries_with_semicolon() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("SELECT * FROM t; DROP TABLE t", "postgresql")
    assert is_valid is False
    assert "semicolon" in (reason or "").lower()


def test_validate_sql_rejects_empty_sql() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("   ", "postgresql")
    assert is_valid is False
    assert "empty" in (reason or "").lower()


def test_validate_sql_rejects_long_sql() -> None:
    from ai.sql_validator import validate_sql

    sql = "SELECT " + ("x" * 4001)
    is_valid, reason = validate_sql(sql, "postgresql")
    assert is_valid is False
    assert "4000" in (reason or "")


def test_validate_sql_raises_unsafe_query_error_on_invalid_sql() -> None:
    from ai.sql_validator import validate_sql
    from database.exceptions import UnsafeQueryError

    with pytest.raises(UnsafeQueryError):
        validate_sql("UPDATE users SET email='x'", "postgresql", raise_on_error=True)
