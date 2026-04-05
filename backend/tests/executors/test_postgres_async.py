import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


class FakeAcquire:
    def __init__(self, connection):
        self.connection = connection

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakePool:
    def __init__(self, connection=None):
        self.connection = connection
        self.close = AsyncMock()

    def acquire(self):
        return FakeAcquire(self.connection)


def test_connect_creates_asyncpg_pool_with_ssl(monkeypatch):
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    captured = {}
    fake_pool = FakePool()

    async def fake_create_pool(**kwargs):
        captured.update(kwargs)
        return fake_pool

    monkeypatch.setattr(
        "database.executors.postgres_executor_async.asyncpg.create_pool",
        fake_create_pool,
    )

    executor = PostgresExecutorAsync()
    asyncio.run(
        executor.connect(
            {
                "host": "localhost",
                "port": 5432,
                "user": "postgres",
                "password": "secret",
                "db": "querycraft",
                "ssl": True,
            }
        )
    )

    assert executor.pool is fake_pool
    assert captured["min_size"] == 1
    assert captured["max_size"] == 10
    assert captured["ssl"] == "require"


def test_disconnect_closes_pool():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    pool = FakePool()
    executor = PostgresExecutorAsync()
    executor.pool = pool

    asyncio.run(executor.disconnect())

    pool.close.assert_awaited_once()
    assert executor.pool is None


def test_test_connection_returns_true(monkeypatch):
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetchval": AsyncMock(return_value=1)})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    assert asyncio.run(executor.test_connection()) is True
    connection.fetchval.assert_awaited_once_with("SELECT 1")


def test_introspect_schema_returns_unified_dict():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    column_rows = [
        {
            "table_name": "users",
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO",
        },
        {
            "table_name": "users",
            "column_name": "email",
            "data_type": "character varying",
            "is_nullable": "YES",
        },
    ]
    connection = type(
        "Conn",
        (),
        {"fetch": AsyncMock(side_effect=[column_rows, []])},
    )()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    schema = asyncio.run(executor.introspect_schema())

    assert schema == {
        "users": [
            {"column": "id", "type": "integer", "nullable": False},
            {"column": "email", "type": "character varying", "nullable": True},
        ]
    }


def test_introspect_schema_includes_foreign_key_metadata():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    column_rows = [
        {
            "table_name": "users",
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO",
        },
        {
            "table_name": "orders",
            "column_name": "user_id",
            "data_type": "integer",
            "is_nullable": "NO",
        },
    ]
    fk_rows = [
        {
            "table_name": "orders",
            "column_name": "user_id",
            "referenced_table": "users",
            "referenced_column": "id",
            "constraint_name": "fk_orders_users",
        }
    ]
    connection = type(
        "Conn",
        (),
        {"fetch": AsyncMock(side_effect=[column_rows, fk_rows])},
    )()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    schema = asyncio.run(executor.introspect_schema())

    assert schema["users"] == [{"column": "id", "type": "integer", "nullable": False}]
    assert schema["orders"] == [
        {
            "column": "user_id",
            "type": "integer",
            "nullable": False,
            "foreign_key": {
                "referenced_table": "users",
                "referenced_column": "id",
                "constraint_name": "fk_orders_users",
            },
        }
    ]


def test_execute_query_returns_list_of_dicts_for_select():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    rows = [
        {"id": 1, "email": "a@example.com"},
        {"id": 2, "email": "b@example.com"},
    ]
    connection = type("Conn", (), {"fetch": AsyncMock(return_value=rows)})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("SELECT id, email FROM users", params=["ignored"])
    )

    assert result == rows
    connection.fetch.assert_awaited_once_with("SELECT id, email FROM users", "ignored")


def test_execute_insert_query():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("INSERT INTO users (name) VALUES ('Alice')")
    )

    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_update_query():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("UPDATE users SET name = 'Bob' WHERE id = 1")
    )

    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_create_table_query():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("CREATE TABLE test_table (id INT, name TEXT)")
    )

    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_alter_table_query():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("ALTER TABLE users ADD COLUMN age INT"))

    assert result == []
    connection.fetch.assert_awaited_once()


# Transaction Control Tests
def test_execute_begin_transaction():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("BEGIN TRANSACTION"))
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_commit_transaction():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("COMMIT"))
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_rollback_transaction():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("ROLLBACK"))
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_truncate_table():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("TRUNCATE TABLE users"))
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_create_index():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("CREATE INDEX idx_users_email ON users(email)")
    )
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_drop_index():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("DROP INDEX idx_users_email"))
    assert result == []
    connection.fetch.assert_awaited_once()


def test_execute_explain_query():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    mock_record = {"QUERY PLAN": "Seq Scan on users"}
    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[mock_record])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("EXPLAIN SELECT * FROM users"))
    assert len(result) == 1
    assert result[0]["QUERY PLAN"] == "Seq Scan on users"
    connection.fetch.assert_awaited_once()


def test_execute_vacuum():
    from database.executors.postgres_executor_async import PostgresExecutorAsync

    connection = type("Conn", (), {"fetch": AsyncMock(return_value=[])})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("VACUUM users"))
    assert result == []
    connection.fetch.assert_awaited_once()
