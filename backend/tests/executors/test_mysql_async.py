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
        self.wait_closed = AsyncMock()
        self.close = AsyncMock()

    def acquire(self):
        return FakeAcquire(self.connection)


def test_connect_creates_aiomysql_pool_with_ssl(monkeypatch):
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    captured = {}
    fake_pool = FakePool()

    async def fake_create_pool(**kwargs):
        captured.update(kwargs)
        return fake_pool

    ssl_context = object()
    monkeypatch.setattr(
        "database.executors.mysql_executor_async.aiomysql.create_pool",
        fake_create_pool,
    )
    monkeypatch.setattr(
        "database.executors.mysql_executor_async.ssl_module.create_default_context",
        lambda: ssl_context,
    )

    executor = MySQLExecutorAsync()
    asyncio.run(
        executor.connect(
            {
                "host": "localhost",
                "port": 3306,
                "user": "root",
                "password": "secret",
                "db": "querycraft",
                "ssl": True,
            }
        )
    )

    assert executor.pool is fake_pool
    assert captured["minsize"] == 1
    assert captured["maxsize"] == 10
    assert captured["ssl"] is ssl_context


def test_disconnect_closes_pool():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    pool = FakePool()
    executor = MySQLExecutorAsync()
    executor.pool = pool

    asyncio.run(executor.disconnect())

    pool.close.assert_awaited_once()
    pool.wait_closed.assert_awaited_once()
    assert executor.pool is None


def test_test_connection_returns_true():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    connection = type(
        "Conn",
        (),
        {
            "cursor": lambda self=None: FakeAcquire(
                type(
                    "Cursor",
                    (),
                    {"execute": AsyncMock(), "fetchone": AsyncMock(return_value=(1,))},
                )()
            )
        },
    )()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    assert asyncio.run(executor.test_connection()) is True


def test_introspect_schema_returns_unified_dict():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    rows = [
        ("users", "id", "int", "NO"),
        ("users", "email", "varchar", "YES"),
    ]
    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=rows),
            "description": (
                ("table_name",),
                ("column_name",),
                ("data_type",),
                ("is_nullable",),
            ),
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    schema = asyncio.run(executor.introspect_schema())

    assert schema == {
        "users": [
            {"column": "id", "type": "int", "nullable": False},
            {"column": "email", "type": "varchar", "nullable": True},
        ]
    }
    executed_sql = cursor.execute.await_args.args[0]
    assert "TABLE_SCHEMA = DATABASE()" in executed_sql


def test_execute_query_returns_list_of_dicts_for_select():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    rows = [
        (1, "a@example.com"),
        (2, "b@example.com"),
    ]
    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=rows),
            "description": (("id",), ("email",)),
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("SELECT id, email FROM users", params=[1])
    )

    assert result == [
        {"id": 1, "email": "a@example.com"},
        {"id": 2, "email": "b@example.com"},
    ]
    cursor.execute.assert_awaited_once_with("SELECT id, email FROM users", [1])


def test_execute_query_rejects_non_select_queries():
    from database.exceptions import UnsafeQueryError
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    executor = MySQLExecutorAsync()

    with pytest.raises(UnsafeQueryError):
        asyncio.run(executor.execute_query("DELETE FROM users"))
