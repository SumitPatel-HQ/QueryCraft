import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def test_database_response_exposes_optional_mysql_connection_info_contract():
    from api.schemas import database_schemas

    assert hasattr(database_schemas, "DatabaseConnectionInfo")
    assert hasattr(database_schemas, "MySQLConnectionCreate")

    response_fields = database_schemas.DatabaseResponse.model_fields
    assert "connection_info" in response_fields
    assert response_fields["connection_info"].default is None


def test_serialize_database_adds_masked_mysql_connection_info_without_password():
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
