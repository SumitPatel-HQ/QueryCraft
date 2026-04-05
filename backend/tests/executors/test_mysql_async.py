import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, Mock

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
        self.close = Mock()

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

    pool.close.assert_called_once()
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

    column_rows = [
        ("users", "id", "int", "NO"),
        ("users", "email", "varchar", "YES"),
    ]
    fk_rows = []
    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(side_effect=[column_rows, fk_rows]),
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
    assert "REFERENCED_TABLE_NAME IS NOT NULL" in executed_sql


def test_introspect_schema_includes_foreign_key_metadata():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    column_rows = [
        ("users", "id", "int", "NO"),
        ("orders", "user_id", "int", "NO"),
    ]
    fk_rows = [
        ("orders", "user_id", "users", "id", "fk_orders_users"),
    ]

    class Cursor:
        def __init__(self):
            self.execute = AsyncMock()
            self.fetchall = AsyncMock(side_effect=[column_rows, fk_rows])
            self._descriptions = [
                (
                    ("table_name",),
                    ("column_name",),
                    ("data_type",),
                    ("is_nullable",),
                ),
                (
                    ("table_name",),
                    ("column_name",),
                    ("referenced_table",),
                    ("referenced_column",),
                    ("constraint_name",),
                ),
            ]
            self._description_index = 0

        @property
        def description(self):
            index = min(self._description_index, len(self._descriptions) - 1)
            value = self._descriptions[index]
            self._description_index += 1
            return value

    cursor = Cursor()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    schema = asyncio.run(executor.introspect_schema())

    assert schema["users"] == [{"column": "id", "type": "int", "nullable": False}]
    assert schema["orders"] == [
        {
            "column": "user_id",
            "type": "int",
            "nullable": False,
            "foreign_key": {
                "referenced_table": "users",
                "referenced_column": "id",
                "constraint_name": "fk_orders_users",
            },
        }
    ]


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


def test_execute_insert_query():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("INSERT INTO users (name) VALUES ('Alice')")
    )

    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_update_query():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("UPDATE users SET name = 'Bob' WHERE id = 1")
    )

    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_create_table_query():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("CREATE TABLE test_table (id INT, name TEXT)")
    )

    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_alter_table_query():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()


# Transaction Control Tests
def test_execute_begin_transaction():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("BEGIN"))
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_commit_transaction():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("COMMIT"))
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_rollback_transaction():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("ROLLBACK"))
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_truncate_table():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("TRUNCATE TABLE users"))
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_create_index():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(
        executor.execute_query("CREATE INDEX idx_users_email ON users(email)")
    )
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_drop_index():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("DROP INDEX idx_users_email ON users"))
    assert result == []
    cursor.execute.assert_awaited_once()


def test_execute_explain_query():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(
                return_value=[{"table": "users", "type": "ALL", "rows": 1000}]
            ),
            "description": (
                ("table", "varchar"),
                ("type", "varchar"),
                ("rows", "int"),
            ),
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("EXPLAIN SELECT * FROM users"))
    assert len(result) == 1
    assert result[0]["table"] == "users"
    cursor.execute.assert_awaited_once()


def test_execute_optimize_table():
    from database.executors.mysql_executor_async import MySQLExecutorAsync

    cursor = type(
        "Cursor",
        (),
        {
            "execute": AsyncMock(),
            "fetchall": AsyncMock(return_value=[]),
            "description": None,
        },
    )()
    connection = type("Conn", (), {"cursor": lambda self=None: FakeAcquire(cursor)})()
    executor = MySQLExecutorAsync()
    executor.pool = FakePool(connection)

    result = asyncio.run(executor.execute_query("OPTIMIZE TABLE users"))
    assert result == []
    cursor.execute.assert_awaited_once()
