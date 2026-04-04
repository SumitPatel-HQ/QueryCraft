import asyncio
import sys
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _install_firebase_stubs():
    firebase_auth = SimpleNamespace(
        ExpiredIdTokenError=Exception,
        InvalidIdTokenError=Exception,
        verify_id_token=Mock(return_value={"uid": "user-123"}),
    )
    firebase_credentials = SimpleNamespace(Certificate=Mock(return_value=object()))
    firebase_admin = SimpleNamespace(
        initialize_app=Mock(), credentials=firebase_credentials, auth=firebase_auth
    )
    sys.modules.setdefault("firebase_admin", firebase_admin)
    sys.modules.setdefault("firebase_admin.credentials", firebase_credentials)
    sys.modules.setdefault("firebase_admin.auth", firebase_auth)


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *_args, **_kwargs):
        return self

    def first(self):
        return self.result


class FakeDBSession:
    def __init__(self, database):
        self.database = database
        self.added = []
        self.commits = 0

    def query(self, _model):
        return FakeQuery(self.database)

    def commit(self):
        self.commits += 1

    def add(self, record):
        self.added.append(record)


def test_mysql_service_can_rebuild_executor_config_from_connection_string():
    from api.services import live_mysql_service

    assert hasattr(live_mysql_service, "config_from_mysql_connection_string")

    config = live_mysql_service.config_from_mysql_connection_string(
        "mysql://reporter:supersecret@db.internal:3307/analytics?ssl=false"
    )

    assert config == {
        "host": "db.internal",
        "port": 3307,
        "db": "analytics",
        "database": "analytics",
        "user": "reporter",
        "username": "reporter",
        "password": "supersecret",
        "ssl": False,
    }


def test_fetch_mysql_schema_from_connection_string_disconnects_even_on_failure(
    monkeypatch,
):
    from api.services import live_mysql_service

    disconnected = []

    class FakeExecutor:
        async def connect(self, config):
            self.config = config

        async def introspect_schema(self):
            raise RuntimeError("boom")

        async def disconnect(self):
            disconnected.append(True)

    monkeypatch.setattr(live_mysql_service, "MySQLExecutorAsync", FakeExecutor)

    try:
        asyncio.run(
            live_mysql_service.fetch_mysql_schema_from_connection_string(
                "mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true"
            )
        )
    except RuntimeError:
        pass

    assert disconnected == [True]


def test_execute_mysql_query_from_connection_string_returns_row_dicts(monkeypatch):
    from api.services import live_mysql_service

    class FakeExecutor:
        async def connect(self, config):
            self.config = config

        async def execute_query(self, sql, params=None):
            assert sql == "SELECT id, email FROM users"
            assert params == [1]
            return [{"id": 1, "email": "a@example.com"}]

        async def disconnect(self):
            return None

    monkeypatch.setattr(live_mysql_service, "MySQLExecutorAsync", FakeExecutor)

    rows = asyncio.run(
        live_mysql_service.execute_mysql_query_from_connection_string(
            "mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
            "SELECT id, email FROM users",
            params=[1],
        )
    )

    assert rows == [{"id": 1, "email": "a@example.com"}]


def test_mysql_schema_route_uses_live_service_instead_of_sync_manager(monkeypatch):
    _install_firebase_stubs()

    from api.routers import databases

    database = SimpleNamespace(
        id=5,
        name="analytics",
        display_name="Analytics",
        description=None,
        db_type="mysql",
        connection_string="mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
        file_path=None,
        schema_data=None,
        created_at=datetime(2026, 4, 2, tzinfo=UTC),
        last_accessed=datetime(2026, 4, 2, tzinfo=UTC),
        is_active=True,
        table_count=0,
        row_count=0,
        size_mb=None,
    )
    fake_db = FakeDBSession(database)

    @contextmanager
    def fake_get_db():
        yield fake_db

    async def fake_fetch_schema(connection_string):
        assert connection_string == database.connection_string
        return {"users": [{"column": "id", "type": "int", "nullable": False}]}

    monkeypatch.setattr(databases, "get_db", fake_get_db)
    monkeypatch.setattr(databases, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        databases,
        "fetch_mysql_schema_from_connection_string",
        fake_fetch_schema,
        raising=False,
    )
    monkeypatch.setattr(
        databases.DatabaseConnectionManager,
        "get_schema",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("sync manager should not run for mysql")
        ),
    )

    result = asyncio.run(databases.get_database_schema(5, {"uid": "user-123"}))

    assert result == {
        "schema": {"users": [{"column": "id", "type": "int", "nullable": False}]},
        "source": "fresh",
    }


def test_mysql_query_route_uses_live_service_and_result_keys_for_columns(monkeypatch):
    _install_firebase_stubs()

    from api.routers import queries
    from api.schemas import QueryRequest

    database = SimpleNamespace(
        id=9,
        name="analytics",
        display_name="Analytics",
        db_type="mysql",
        file_path=None,
        connection_string="mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
        schema_data=None,
        last_queried=None,
    )
    fake_db = FakeDBSession(database)

    @contextmanager
    def fake_get_db():
        yield fake_db

    async def fake_fetch_schema(connection_string):
        assert connection_string == database.connection_string
        return {"users": [{"column": "id", "type": "int", "nullable": False}]}

    async def fake_execute_query(connection_string, sql, params=None):
        assert connection_string == database.connection_string
        assert sql == "SELECT id, email FROM users"
        assert params is None
        return [{"id": 1, "email": "a@example.com"}]

    class FakeProcessor:
        def __init__(self, schema_data, introspector=None):
            assert introspector is None
            self.schema_data = schema_data

        def process_query(self, question):
            assert question == "Show users"
            return {
                "sql_query": "SELECT id, email FROM users",
                "explanation": "Fetch users",
                "generation_method": "fallback",
                "confidence": 50,
                "tables_used": ["users"],
            }

    monkeypatch.setattr(queries, "get_db", fake_get_db)
    monkeypatch.setattr(queries, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        queries,
        "fetch_mysql_schema_from_connection_string",
        fake_fetch_schema,
        raising=False,
    )
    monkeypatch.setattr(
        queries,
        "execute_mysql_query_from_connection_string",
        fake_execute_query,
        raising=False,
    )
    monkeypatch.setattr(
        queries.DatabaseConnectionManager,
        "get_schema",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("sync manager should not run for mysql")
        ),
    )
    monkeypatch.setattr(
        queries.DatabaseConnectionManager,
        "execute_query",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("sync manager should not run for mysql")
        ),
    )
    sys.modules["core.nl_to_sql"] = SimpleNamespace(NLToSQLProcessor=FakeProcessor)

    result = asyncio.run(
        queries.query_database(
            9, QueryRequest(question="Show users"), {"uid": "user-123"}
        )
    )

    assert result.columns == ["id", "email"]
    assert result.results == [{"id": 1, "email": "a@example.com"}]


def test_empty_schema_allows_row_creation_guidance(monkeypatch):
    _install_firebase_stubs()

    from api.routers import queries
    from api.schemas import QueryRequest

    database = SimpleNamespace(
        id=11,
        name="empty_db",
        display_name="Empty DB",
        db_type="mysql",
        file_path=None,
        connection_string="mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
        schema_data=None,
        last_queried=None,
    )
    fake_db = FakeDBSession(database)

    @contextmanager
    def fake_get_db():
        yield fake_db

    async def fake_fetch_schema(_connection_string):
        return {}

    async def fail_if_called(*_args, **_kwargs):
        raise AssertionError("execution should not run for empty-schema guidance")

    monkeypatch.setattr(queries, "get_db", fake_get_db)
    monkeypatch.setattr(queries, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        queries,
        "fetch_mysql_schema_from_connection_string",
        fake_fetch_schema,
        raising=False,
    )
    monkeypatch.setattr(
        queries,
        "execute_mysql_query_from_connection_string",
        fail_if_called,
        raising=False,
    )

    result = asyncio.run(
        queries.query_database(
            11,
            QueryRequest(question="I want 3 rows to be created"),
            {"uid": "user-123"},
        )
    )

    assert result.generation_method == "empty_schema_guidance"
    assert "CREATE TABLE new_table" in result.sql_query
    assert "sample_3" in result.sql_query
    assert result.results == []


def test_empty_schema_blocks_non_creation_queries(monkeypatch):
    _install_firebase_stubs()

    from api.routers import queries
    from api.schemas import QueryRequest

    database = SimpleNamespace(
        id=12,
        name="empty_db",
        display_name="Empty DB",
        db_type="mysql",
        file_path=None,
        connection_string="mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
        schema_data=None,
        last_queried=None,
    )
    fake_db = FakeDBSession(database)

    @contextmanager
    def fake_get_db():
        yield fake_db

    async def fake_fetch_schema(_connection_string):
        return {}

    monkeypatch.setattr(queries, "get_db", fake_get_db)
    monkeypatch.setattr(queries, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        queries,
        "fetch_mysql_schema_from_connection_string",
        fake_fetch_schema,
        raising=False,
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            queries.query_database(
                12,
                QueryRequest(question="Show me all users"),
                {"uid": "user-123"},
            )
        )

    assert exc_info.value.status_code == 400
    assert "No tables to work on" in str(exc_info.value.detail)


def test_mysql_truncate_fk_error_returns_actionable_400(monkeypatch):
    _install_firebase_stubs()

    from api.routers import queries
    from api.schemas import QueryRequest

    database = SimpleNamespace(
        id=13,
        name="world",
        display_name="World",
        db_type="mysql",
        file_path=None,
        connection_string="mysql://reporter:supersecret@db.internal:3306/world?ssl=true",
        schema_data=None,
        last_queried=None,
    )
    fake_db = FakeDBSession(database)

    @contextmanager
    def fake_get_db():
        yield fake_db

    async def fake_fetch_schema(_connection_string):
        return {
            "city": [{"column": "id", "type": "int", "nullable": False}],
            "country": [{"column": "code", "type": "char", "nullable": False}],
        }

    async def fake_execute_query(_connection_string, _sql, params=None):
        _ = params
        raise Exception(
            "Failed to execute MySQL query: (1701, 'Cannot truncate a table referenced in a foreign key constraint (`world`.`city`, CONSTRAINT `city_ibfk_1`)')"
        )

    class FakeProcessor:
        def __init__(self, schema_data, introspector=None):
            assert introspector is None
            self.schema_data = schema_data

        def process_query(self, question):
            assert question == "TRUNCATE 2 tables"
            return {
                "sql_query": "TRUNCATE TABLE city; TRUNCATE TABLE country;",
                "explanation": "Truncate two tables",
                "generation_method": "llm",
                "confidence": 75,
                "tables_used": ["city", "country"],
            }

    monkeypatch.setattr(queries, "get_db", fake_get_db)
    monkeypatch.setattr(queries, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        queries,
        "fetch_mysql_schema_from_connection_string",
        fake_fetch_schema,
        raising=False,
    )
    monkeypatch.setattr(
        queries,
        "execute_mysql_query_from_connection_string",
        fake_execute_query,
        raising=False,
    )
    sys.modules["core.nl_to_sql"] = SimpleNamespace(NLToSQLProcessor=FakeProcessor)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            queries.query_database(
                13,
                QueryRequest(question="TRUNCATE 2 tables"),
                {"uid": "user-123"},
            )
        )

    assert exc_info.value.status_code == 400
    assert "Cannot TRUNCATE" in str(exc_info.value.detail)
    assert "foreign key constraints" in str(exc_info.value.detail)
