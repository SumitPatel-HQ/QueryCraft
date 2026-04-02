import asyncio
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


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
