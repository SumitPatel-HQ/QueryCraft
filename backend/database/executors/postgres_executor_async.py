"""Async PostgreSQL executor backed by asyncpg connection pooling."""

from __future__ import annotations

import re
import ssl as ssl_module
from types import SimpleNamespace
from typing import Any

try:
    import asyncpg
except ImportError:  # pragma: no cover - exercised only when dependency is absent
    asyncpg = SimpleNamespace(create_pool=None)

from database.exceptions import (
    AuthenticationError,
    ConnectionError,
    QueryTimeoutError,
    SchemaIntrospectionError,
    UnsafeQueryError,
)


_SELECT_PATTERN = re.compile(r"^\s*select\b", re.IGNORECASE)
_INTROSPECTION_SQL = """
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_catalog = current_database()
  AND table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_name, ordinal_position
"""


class PostgresExecutorAsync:
    """Execute safe read-only PostgreSQL operations through an async pool."""

    def __init__(self) -> None:
        self.pool: Any | None = None
        self.config: dict[str, Any] = {}

    async def connect(self, config: dict[str, Any]) -> None:
        """Create an asyncpg pool for the supplied PostgreSQL connection config."""
        if getattr(asyncpg, "create_pool", None) is None:
            raise ConnectionError("asyncpg is required for PostgreSQL async execution")

        self.config = dict(config)
        ssl_context = None
        if self.config.get("ssl"):
            ssl_context = ssl_module.create_default_context()

        timeout = float(self.config.get("timeout", 30))

        try:
            self.pool = await asyncpg.create_pool(
                host=self.config.get("host"),
                port=self.config.get("port", 5432),
                user=self.config.get("user"),
                password=self.config.get("password"),
                database=self.config.get("db") or self.config.get("database"),
                min_size=1,
                max_size=10,
                ssl=ssl_context,
                timeout=timeout,
                command_timeout=timeout,
            )
        except (
            Exception
        ) as exc:  # pragma: no cover - covered via error mapping expectations
            if exc.__class__.__name__ in {
                "InvalidAuthorizationSpecificationError",
                "InvalidPasswordError",
            }:
                raise AuthenticationError(
                    "Failed to authenticate with PostgreSQL", exc
                ) from exc
            raise ConnectionError("Failed to connect to PostgreSQL", exc) from exc

    async def disconnect(self) -> None:
        """Close the current asyncpg pool if one exists."""
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    async def test_connection(self) -> bool:
        """Run a lightweight connectivity check against the active pool."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                await connection.fetchval("SELECT 1")
            return True
        except Exception:
            return False

    async def introspect_schema(self) -> dict[str, list[dict[str, Any]]]:
        """Return PostgreSQL schema metadata in the shared executor format."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                rows = await connection.fetch(_INTROSPECTION_SQL)
        except Exception as exc:
            raise SchemaIntrospectionError(
                "Failed to introspect PostgreSQL schema", exc
            ) from exc

        schema: dict[str, list[dict[str, Any]]] = {}
        for row in rows:
            record = dict(row)
            schema.setdefault(record["table_name"], []).append(
                {
                    "column": record["column_name"],
                    "type": record["data_type"],
                    "nullable": record["is_nullable"] == "YES",
                }
            )
        return schema

    async def execute_query(
        self,
        sql: str,
        params: list[Any] | tuple[Any, ...] | None = None,
    ) -> list[dict[str, Any]]:
        """Execute a SELECT query and return rows as dictionaries."""
        if not _SELECT_PATTERN.match(sql):
            raise UnsafeQueryError("Only SELECT statements are allowed")

        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                rows = await connection.fetch(sql, *(params or ()))
        except UnsafeQueryError:
            raise
        except TimeoutError as exc:
            raise QueryTimeoutError("PostgreSQL query timed out", exc) from exc
        except Exception as exc:
            raise ConnectionError("Failed to execute PostgreSQL query", exc) from exc

        return [dict(row) for row in rows]
