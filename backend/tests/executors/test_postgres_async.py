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

    rows = [
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
    connection = type("Conn", (), {"fetch": AsyncMock(return_value=rows)})()
    executor = PostgresExecutorAsync()
    executor.pool = FakePool(connection)

    schema = asyncio.run(executor.introspect_schema())

    assert schema == {
        "users": [
            {"column": "id", "type": "integer", "nullable": False},
            {"column": "email", "type": "character varying", "nullable": True},
        ]
    }


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
