import asyncio
import sys
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest


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


class FakeDBSession:
    def __init__(self):
        self.added = []
        self.committed = False
        self.refreshed = []

    def add(self, record):
        self.added.append(record)

    def commit(self):
        self.committed = True

    def refresh(self, record):
        record.id = 42
        record.created_at = datetime(2026, 4, 2, tzinfo=UTC)
        record.last_accessed = datetime(2026, 4, 2, tzinfo=UTC)
        self.refreshed.append(record)


def test_database_response_exposes_optional_mysql_connection_info_contract():
    from api.schemas import database_schemas

    assert hasattr(database_schemas, "DatabaseConnectionInfo")
    assert hasattr(database_schemas, "MySQLConnectionCreate")

    response_fields = database_schemas.DatabaseResponse.model_fields
    assert "connection_info" in response_fields
    assert response_fields["connection_info"].default is None


def test_serialize_database_adds_masked_mysql_connection_info_without_password():
    _install_firebase_stubs()

    from api.routers import databases

    assert hasattr(databases, "_serialize_database")

    database = SimpleNamespace(
        id=7,
        name="analytics_prod",
        display_name="Analytics Prod",
        description="Primary reporting database",
        db_type="mysql",
        connection_string="mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true",
        file_path=None,
        table_count=12,
        row_count=0,
        size_mb=None,
        created_at=datetime(2026, 4, 2, tzinfo=UTC),
        last_accessed=datetime(2026, 4, 2, tzinfo=UTC),
        is_active=True,
    )

    payload = databases._serialize_database(database)

    assert payload["connection_info"] == {
        "host": "db.internal",
        "port": 3306,
        "database": "analytics",
        "username": "reporter",
        "ssl_enabled": True,
    }
    assert "supersecret" not in str(payload)
    assert payload["db_type"] == "mysql"


def test_live_mysql_service_builds_and_parses_connection_strings():
    from api.services import live_mysql_service

    connection_string = live_mysql_service.build_mysql_connection_string(
        host="db.internal",
        port=3306,
        database="analytics",
        username="reporter",
        password="supersecret",
        ssl=True,
    )

    assert connection_string == (
        "mysql://reporter:supersecret@db.internal:3306/analytics?ssl=true"
    )
    assert live_mysql_service.parse_mysql_connection_string(connection_string) == {
        "host": "db.internal",
        "port": 3306,
        "database": "analytics",
        "username": "reporter",
        "ssl": True,
    }


def test_create_mysql_route_verifies_before_persisting(monkeypatch):
    _install_firebase_stubs()

    from api.routers import databases
    from api.schemas.database_schemas import MySQLConnectionCreate

    post_route = next(
        (
            route
            for route in databases.router.routes
            if "/mysql" in getattr(route, "path", "")
            and "POST" in getattr(route, "methods", set())
        ),
        None,
    )
    assert post_route is not None

    fake_db = FakeDBSession()

    @contextmanager
    def fake_get_db():
        yield fake_db

    verified_configs = []

    async def fake_test_mysql_connection(config):
        verified_configs.append(config)
        return True

    async def fake_fetch_mysql_schema(config):
        return {
            "users": [{"column": "id", "type": "int", "nullable": False}],
            "orders": [{"column": "id", "type": "int", "nullable": False}],
        }

    monkeypatch.setattr(databases, "get_db", fake_get_db)
    monkeypatch.setattr(databases, "set_current_user_context", lambda db, user_id: None)
    monkeypatch.setattr(
        databases, "test_mysql_connection", fake_test_mysql_connection, raising=False
    )
    monkeypatch.setattr(
        databases, "fetch_mysql_schema", fake_fetch_mysql_schema, raising=False
    )

    payload = MySQLConnectionCreate(
        display_name="Analytics",
        description="Warehouse",
        host="db.internal",
        port=3306,
        database="analytics",
        username="reporter",
        password="supersecret",
        ssl=True,
    )

    result = asyncio.run(post_route.endpoint(payload, {"uid": "user-123"}))

    assert verified_configs == [
        {
            "host": "db.internal",
            "port": 3306,
            "db": "analytics",
            "database": "analytics",
            "user": "reporter",
            "username": "reporter",
            "password": "supersecret",
            "ssl": True,
        }
    ]
    assert len(fake_db.added) == 1
    assert fake_db.added[0].db_type == "mysql"
    assert fake_db.added[0].table_count == 2
    assert fake_db.added[0].row_count == 0
    assert fake_db.added[0].is_active is True
    assert result["connection_info"]["host"] == "db.internal"
    assert result["connection_info"]["database"] == "analytics"
    assert "supersecret" not in str(result)
