"""NL-to-SQL pipeline orchestration endpoint for session-based querying."""

from __future__ import annotations

from dataclasses import asdict
import inspect
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai import build_prompt, generate_sql, validate_sql
from ai.conversation_manager import ConversationManager
from ai.response_formatter import FormattedResponse, format_response
from core.llm.provider_factory import get_llm_provider
from database.exceptions import ConnectionError, QueryTimeoutError, UnsafeQueryError


router = APIRouter()
conversation_manager = ConversationManager()


class QueryRequest(BaseModel):
    """Request payload for NL query execution."""

    message: str
    session_id: str


_SESSION_EXECUTORS: dict[str, Any] = {}
_SENSITIVE_KEYWORDS = ("password", "credential", "connection string")
_SENSITIVE_REFUSAL = "I can’t help with credentials or connection secrets."


def register_executor_for_session(session_id: str, executor: Any) -> None:
    """Register an active executor instance for a given session id."""
    _SESSION_EXECUTORS[session_id] = executor


def get_executor_for_session(session_id: str) -> Any:
    """Return active executor for session id or raise KeyError."""
    if not session_id or session_id not in _SESSION_EXECUTORS:
        raise KeyError(session_id)
    return _SESSION_EXECUTORS[session_id]


class _SQLGenerationClient:
    """Adapter exposing generate(system_prompt, user_prompt) for SQL generation."""

    def __init__(self, provider: Any) -> None:
        self.provider = provider

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        payload = f"{system_prompt}\n\n{user_prompt}"
        response = self.provider.generate(payload)
        if isinstance(response, dict):
            if response.get("success") is False:
                return ""
            return str(response.get("text", "")).strip()
        return str(response).strip()


class _SummaryClient:
    """Adapter exposing generate(prompt) for response formatting summaries."""

    def __init__(self, provider: Any) -> None:
        self.provider = provider

    def generate(self, prompt: str) -> str:
        response = self.provider.generate(prompt)
        if isinstance(response, dict):
            if response.get("success") is False:
                return "Generated summary unavailable."
            return str(response.get("text", "Generated summary unavailable.")).strip()
        return str(response).strip()


async def _maybe_await(result: Any) -> Any:
    """Await value when it is awaitable, otherwise return it as-is."""
    if inspect.isawaitable(result):
        return await result
    return result


def _is_sensitive_request(message: str) -> bool:
    normalized = message.lower()
    return any(keyword in normalized for keyword in _SENSITIVE_KEYWORDS)


def _dialect_from_executor(executor: Any) -> str:
    name = executor.__class__.__name__.lower()
    if "mysql" in name:
        return "mysql"
    if "postgres" in name:
        return "postgresql"
    return "generic"


@router.post("/query")
async def query_endpoint(request: QueryRequest) -> dict[str, Any]:
    """Execute complete NL-to-SQL pipeline for a session-bound executor."""
    try:
        executor = get_executor_for_session(request.session_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=400, detail={"error": "Invalid session_id"}
        ) from exc

    if _is_sensitive_request(request.message):
        return asdict(
            FormattedResponse(table="", summary=_SENSITIVE_REFUSAL, sql="", row_count=0)
        )

    try:
        schema = await executor.introspect_schema()

        conversation_manager.add_message(request.session_id, "user", request.message)
        history = conversation_manager.get_history(request.session_id, n=6)

        dialect = _dialect_from_executor(executor)
        system_prompt, user_prompt = build_prompt(
            schema,
            history,
            request.message,
            dialect,
        )

        provider = get_llm_provider()
        sql_client = _SQLGenerationClient(provider)
        generated_sql, _ = await _maybe_await(
            generate_sql(system_prompt, user_prompt, sql_client)
        )

        validate_sql(generated_sql, dialect=dialect, raise_on_error=True)

        rows = await executor.execute_query(generated_sql)

        formatted = format_response(
            rows,
            request.message,
            generated_sql,
            _SummaryClient(provider),
        )

        conversation_manager.add_message(
            request.session_id,
            "assistant",
            formatted.summary,
        )
        return asdict(formatted)
    except UnsafeQueryError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    except QueryTimeoutError as exc:
        raise HTTPException(
            status_code=408, detail={"error": "Query timed out"}
        ) from exc
    except ConnectionError as exc:
        raise HTTPException(
            status_code=502, detail={"error": "Database error"}
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail={"error": "Database error"}
        ) from exc
