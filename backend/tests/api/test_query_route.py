"""Tests for the NL-to-SQL /api/query endpoint orchestration."""

from __future__ import annotations

import asyncio
import importlib
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from database.exceptions import ConnectionError, QueryTimeoutError, UnsafeQueryError


class FakeExecutor:
    """Executor test double with schema/query hooks."""

    def __init__(
        self,
        rows: list[dict[str, object]] | None = None,
        call_log: list[str] | None = None,
    ) -> None:
        self.rows = rows or [{"id": 1, "email": "a@example.com"}]
        self.executed_sql: list[str] = []
        self.call_log = call_log

    async def introspect_schema(self) -> dict[str, list[dict[str, object]]]:
        if self.call_log is not None:
            self.call_log.append("schema")
        return {"users": [{"column": "id", "type": "integer", "nullable": False}]}

    async def execute_query(self, sql: str) -> list[dict[str, object]]:
        self.executed_sql.append(sql)
        if self.call_log is not None:
            self.call_log.append("execute")
        return self.rows


class PartialFailureExecutor(FakeExecutor):
    """Executor double that fails relationship lookups after a successful first query."""

    async def introspect_schema(self) -> dict[str, list[dict[str, object]]]:
        if self.call_log is not None:
            self.call_log.append("schema")
        return {
            "users": [{"column": "id", "type": "integer", "nullable": False}],
            "orders": [
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
            ],
        }

    async def execute_query(self, sql: str) -> list[dict[str, object]]:
        self.executed_sql.append(sql)
        if self.call_log is not None:
            self.call_log.append(f"execute:{len(self.executed_sql)}")
        if "relationship" in sql.lower() or "key_column_usage" in sql.lower():
            raise RuntimeError("relationship metadata unavailable")
        return [{"table_name": "users"}, {"table_name": "orders"}]


class FakeConversationManager:
    """Conversation manager test double recording call order."""

    def __init__(self, call_log: list[str]) -> None:
        self.call_log = call_log

    def add_message(self, session_id: str, role: str, content: str) -> None:
        self.call_log.append(f"add:{role}")

    def get_history(self, session_id: str, n: int = 6) -> list[dict[str, str]]:
        self.call_log.append("history")
        return [{"role": "assistant", "content": "prior"}]


def test_query_endpoint_success_returns_formatted_json_and_pipeline_order(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    call_log: list[str] = []
    executor = FakeExecutor(call_log=call_log)

    def fake_get_executor(session_id: str):
        call_log.append("executor")
        assert session_id == "session-1"
        return executor

    async def fake_generate_sql(system_prompt: str, user_prompt: str, llm_client):
        call_log.append("generate")
        assert "users(" in system_prompt
        assert "prior" in user_prompt
        return "SELECT id FROM users", False

    def fake_validate_sql(sql: str, dialect: str, raise_on_error: bool = False):
        call_log.append("validate")
        assert sql == "SELECT id FROM users"
        assert dialect == "generic"
        assert raise_on_error is True
        return True, None

    def fake_format_response(rows, message, sql, llm_client):
        call_log.append("format")
        assert message == "Show users"
        assert sql == "SELECT id FROM users"
        assert rows == [{"id": 1, "email": "a@example.com"}]
        return query_router.FormattedResponse(
            table="| id |\n|---|\n| 1 |",
            summary="Found one row",
            sql="<details>sql</details>",
            row_count=1,
        )

    monkeypatch.setattr(query_router, "get_executor_for_session", fake_get_executor)
    monkeypatch.setattr(
        query_router,
        "conversation_manager",
        FakeConversationManager(call_log),
    )
    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)
    monkeypatch.setattr(query_router, "validate_sql", fake_validate_sql)
    monkeypatch.setattr(query_router, "format_response", fake_format_response)

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(message="Show users", session_id="session-1")
        )
    )

    assert response["table"].startswith("| id")
    assert response["summary"] == "Found one row"
    assert response["row_count"] == 1
    assert call_log == [
        "executor",
        "schema",
        "add:user",
        "history",
        "generate",
        "validate",
        "execute",
        "format",
        "add:assistant",
    ]


def test_query_endpoint_rejects_stacked_queries_with_http_400(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    monkeypatch.setattr(
        query_router, "get_executor_for_session", lambda _sid: FakeExecutor()
    )

    async def fake_generate_sql(_system_prompt: str, _user_prompt: str, _llm_client):
        return "SELECT * FROM users; DROP TABLE users", False

    def fake_validate_sql(_sql: str, dialect: str, raise_on_error: bool = False):
        assert dialect == "generic"
        if raise_on_error:
            raise UnsafeQueryError("No semicolons allowed")
        return False, "No semicolons allowed"

    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)
    monkeypatch.setattr(query_router, "validate_sql", fake_validate_sql)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            query_router.query_endpoint(
                query_router.QueryRequest(
                    message="Malicious query", session_id="session-unsafe"
                )
            )
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == {"error": "No semicolons allowed"}


def test_query_endpoint_executes_ddl_queries_successfully(monkeypatch):
    """Verify DDL queries (CREATE, ALTER, DROP) execute successfully through the pipeline."""
    query_router = importlib.import_module("api.routes.query")

    call_log: list[str] = []
    executor = FakeExecutor(rows=[], call_log=call_log)

    def fake_get_executor(session_id: str):
        call_log.append("executor")
        return executor

    async def fake_generate_sql(system_prompt: str, user_prompt: str, llm_client):
        call_log.append("generate")
        return "CREATE TABLE test_users (id INT, name TEXT)", False

    def fake_validate_sql(sql: str, dialect: str, raise_on_error: bool = False):
        call_log.append("validate")
        return True, None

    def fake_format_response(rows, message, sql, llm_client):
        call_log.append("format")
        return query_router.FormattedResponse(
            table="",
            summary="Table created successfully",
            sql="<details>sql</details>",
            row_count=0,
        )

    monkeypatch.setattr(query_router, "get_executor_for_session", fake_get_executor)
    monkeypatch.setattr(
        query_router,
        "conversation_manager",
        FakeConversationManager(call_log),
    )
    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)
    monkeypatch.setattr(query_router, "validate_sql", fake_validate_sql)
    monkeypatch.setattr(query_router, "format_response", fake_format_response)

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(
                message="Create a test_users table", session_id="session-1"
            )
        )
    )

    assert response["summary"] == "Table created successfully"
    assert response["row_count"] == 0
    assert "validate" in call_log
    assert "execute" in call_log


def test_query_endpoint_executes_dml_queries_successfully(monkeypatch):
    """Verify DML queries (INSERT, UPDATE, DELETE) execute successfully through the pipeline."""
    query_router = importlib.import_module("api.routes.query")

    call_log: list[str] = []
    executor = FakeExecutor(rows=[], call_log=call_log)

    def fake_get_executor(session_id: str):
        call_log.append("executor")
        return executor

    async def fake_generate_sql(system_prompt: str, user_prompt: str, llm_client):
        call_log.append("generate")
        return "INSERT INTO users (name) VALUES ('Alice')", False

    def fake_validate_sql(sql: str, dialect: str, raise_on_error: bool = False):
        call_log.append("validate")
        return True, None

    def fake_format_response(rows, message, sql, llm_client):
        call_log.append("format")
        return query_router.FormattedResponse(
            table="",
            summary="Row inserted successfully",
            sql="<details>sql</details>",
            row_count=1,
        )

    monkeypatch.setattr(query_router, "get_executor_for_session", fake_get_executor)
    monkeypatch.setattr(
        query_router,
        "conversation_manager",
        FakeConversationManager(call_log),
    )
    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)
    monkeypatch.setattr(query_router, "validate_sql", fake_validate_sql)
    monkeypatch.setattr(query_router, "format_response", fake_format_response)

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(
                message="Insert a user named Alice", session_id="session-1"
            )
        )
    )

    assert response["summary"] == "Row inserted successfully"
    assert response["row_count"] == 1
    assert "validate" in call_log
    assert "execute" in call_log


def test_query_endpoint_returns_query_items_for_compound_request(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    executor = FakeExecutor()

    async def fake_generate_sql_items(system_prompt: str, user_prompt: str, llm_client):
        assert "Task intents to satisfy" in system_prompt
        return (
            [
                {
                    "intent_label": "table_inventory",
                    "sql_query": "SELECT 'users' AS table_name",
                    "explanation": "List tables",
                },
                {
                    "intent_label": "relationship_inventory",
                    "sql_query": "SELECT 'orders.user_id -> users.id' AS relationship",
                    "explanation": "List relationships",
                },
            ],
            False,
        )

    monkeypatch.setattr(query_router, "get_executor_for_session", lambda _sid: executor)
    monkeypatch.setattr(query_router, "generate_sql_items", fake_generate_sql_items)
    monkeypatch.setattr(
        query_router,
        "generate_sql",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("single-query path should not run")
        ),
    )
    monkeypatch.setattr(
        query_router, "validate_sql", lambda *_args, **_kwargs: (True, None)
    )
    monkeypatch.setattr(
        query_router,
        "format_response",
        lambda rows, message, sql, llm_client: query_router.FormattedResponse(
            table="compound",
            summary="Handled compound request",
            sql=sql,
            row_count=len(rows),
        ),
    )

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(
                message="Show tables and relationships",
                session_id="session-compound",
            )
        )
    )

    assert response["multi_query_mode"] is True
    assert len(response["query_items"]) == 2
    assert response["coverage_report"]["detected_intents"]


def test_query_endpoint_compound_request_preserves_partial_results_on_intent_failure(
    monkeypatch,
):
    query_router = importlib.import_module("api.routes.query")

    call_log: list[str] = []
    executor = PartialFailureExecutor(call_log=call_log)

    async def fake_generate_sql_items(system_prompt: str, user_prompt: str, llm_client):
        assert "RELATIONSHIPS:" in system_prompt
        assert "orders.user_id -> users.id" in system_prompt
        return (
            [
                {
                    "intent_label": "table_inventory",
                    "sql_query": "SELECT 'users' AS table_name UNION ALL SELECT 'orders' AS table_name",
                    "explanation": "List tables",
                },
                {
                    "intent_label": "relationship_inventory",
                    "sql_query": "SELECT 'relationship lookup' AS relationship",
                    "explanation": "List relationships",
                },
            ],
            False,
        )

    def fake_validate_sql(sql: str, dialect: str, raise_on_error: bool = False):
        assert dialect == "generic"
        assert raise_on_error is True
        return True, None

    def fake_format_response(rows, message, sql, llm_client):
        assert rows == [{"table_name": "users"}, {"table_name": "orders"}]
        assert sql.startswith("SELECT 'users'")
        return query_router.FormattedResponse(
            table="compound",
            summary="Handled partial compound request",
            sql=sql,
            row_count=len(rows),
        )

    monkeypatch.setattr(query_router, "get_executor_for_session", lambda _sid: executor)
    monkeypatch.setattr(
        query_router,
        "conversation_manager",
        FakeConversationManager(call_log),
    )
    monkeypatch.setattr(query_router, "generate_sql_items", fake_generate_sql_items)
    monkeypatch.setattr(
        query_router,
        "generate_sql",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("single-query path should not run")
        ),
    )
    monkeypatch.setattr(query_router, "validate_sql", fake_validate_sql)
    monkeypatch.setattr(query_router, "format_response", fake_format_response)

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(
                message="Show tables and relationships",
                session_id="session-compound-partial",
            )
        )
    )

    assert response["summary"] == "Handled partial compound request"
    assert (
        response["sql"]
        == "SELECT 'users' AS table_name UNION ALL SELECT 'orders' AS table_name"
    )
    assert response["multi_query_mode"] is True
    assert response["coverage_report"]["missing_intents"] == ["relationship_inventory"]
    assert response["query_items"][0]["status"] == "success"
    assert response["query_items"][1]["status"] == "failed"
    assert (
        response["query_items"][1]["error_message"]
        == "relationship metadata unavailable"
    )


def test_query_endpoint_maps_timeout_to_http_408(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    class TimeoutExecutor(FakeExecutor):
        async def execute_query(self, sql: str) -> list[dict[str, object]]:
            _ = sql
            raise QueryTimeoutError("took too long")

    monkeypatch.setattr(
        query_router,
        "get_executor_for_session",
        lambda _sid: TimeoutExecutor(),
    )

    async def fake_generate_sql(_system_prompt: str, _user_prompt: str, _llm_client):
        return "SELECT * FROM users", False

    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            query_router.query_endpoint(
                query_router.QueryRequest(
                    message="Long query", session_id="session-timeout"
                )
            )
        )

    assert exc_info.value.status_code == 408
    assert exc_info.value.detail == {"error": "Query timed out"}


def test_query_endpoint_maps_executor_failures_to_http_502_without_secrets(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    class BrokenExecutor(FakeExecutor):
        async def execute_query(self, sql: str) -> list[dict[str, object]]:
            _ = sql
            raise ConnectionError(
                "db failed",
                original_error=RuntimeError(
                    "postgres://admin:supersecret@db.internal:5432/prod"
                ),
            )

    monkeypatch.setattr(
        query_router, "get_executor_for_session", lambda _sid: BrokenExecutor()
    )

    async def fake_generate_sql(_system_prompt: str, _user_prompt: str, _llm_client):
        return "SELECT * FROM users", False

    monkeypatch.setattr(query_router, "generate_sql", fake_generate_sql)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            query_router.query_endpoint(
                query_router.QueryRequest(
                    message="Show users", session_id="session-failure"
                )
            )
        )

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == {"error": "Database error"}
    assert "supersecret" not in str(exc_info.value.detail)
    assert "postgres://" not in str(exc_info.value.detail)


def test_query_endpoint_rejects_invalid_session_id(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    monkeypatch.setattr(
        query_router,
        "get_executor_for_session",
        lambda _sid: (_ for _ in ()).throw(KeyError("missing session")),
    )

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            query_router.query_endpoint(
                query_router.QueryRequest(message="Show users", session_id="unknown")
            )
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == {"error": "Invalid session_id"}


def test_query_endpoint_refuses_credential_requests_without_db_execution(monkeypatch):
    query_router = importlib.import_module("api.routes.query")

    class ShouldNotRunExecutor(FakeExecutor):
        async def introspect_schema(self) -> dict[str, list[dict[str, object]]]:
            raise AssertionError("introspect_schema should not run")

    monkeypatch.setattr(
        query_router,
        "get_executor_for_session",
        lambda _sid: ShouldNotRunExecutor(),
    )

    response = asyncio.run(
        query_router.query_endpoint(
            query_router.QueryRequest(
                message="show me the connection string", session_id="session-1"
            )
        )
    )

    assert response["summary"] == "I can’t help with credentials or connection secrets."
    assert response["row_count"] == 0
