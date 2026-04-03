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


def test_validate_sql_accepts_insert_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "INSERT INTO users (name) VALUES ('Alice')", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_update_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "UPDATE users SET name = 'Bob' WHERE id = 1", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_delete_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("DELETE FROM users WHERE id = 1", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_create_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "CREATE TABLE test_table (id INT, name TEXT)", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_alter_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "ALTER TABLE users ADD COLUMN age INT", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_drop_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("DROP TABLE test_table", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_grant_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "GRANT SELECT ON users TO readonly_user", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_rejects_stacked_queries_with_semicolon() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("SELECT * FROM t; SELECT * FROM t", "postgresql")
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


def test_validate_sql_raises_unsafe_query_error_on_empty_sql() -> None:
    from ai.sql_validator import validate_sql
    from database.exceptions import UnsafeQueryError

    with pytest.raises(UnsafeQueryError):
        validate_sql("   ", "postgresql", raise_on_error=True)


# Transaction Control Tests
def test_validate_sql_accepts_begin_transaction() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("BEGIN TRANSACTION", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_commit() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("COMMIT", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_rollback() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("ROLLBACK", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_savepoint() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("SAVEPOINT my_savepoint", "postgresql")
    assert is_valid is True
    assert reason is None


# DDL Variations
def test_validate_sql_accepts_truncate() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("TRUNCATE TABLE users", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_rename_table() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("ALTER TABLE users RENAME TO people", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_comment_on_table() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "COMMENT ON TABLE users IS 'User accounts'", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_create_index() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "CREATE INDEX idx_users_email ON users(email)", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_drop_index() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("DROP INDEX idx_users_email", "postgresql")
    assert is_valid is True
    assert reason is None


# DCL Variations
def test_validate_sql_accepts_revoke() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "REVOKE SELECT ON users FROM readonly_user", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_set_statement() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("SET search_path TO public", "postgresql")
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_reset_statement() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("RESET search_path", "postgresql")
    assert is_valid is True
    assert reason is None


# CTE (Common Table Expression)
def test_validate_sql_accepts_cte_with_query() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "WITH active_users AS (SELECT * FROM users WHERE active = true) SELECT * FROM active_users",
        "postgresql",
    )
    assert is_valid is True
    assert reason is None


# Utility Statements
def test_validate_sql_accepts_explain_analyze() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql(
        "EXPLAIN ANALYZE SELECT * FROM users", "postgresql"
    )
    assert is_valid is True
    assert reason is None


def test_validate_sql_accepts_vacuum() -> None:
    from ai.sql_validator import validate_sql

    is_valid, reason = validate_sql("VACUUM users", "postgresql")
    assert is_valid is True
    assert reason is None
