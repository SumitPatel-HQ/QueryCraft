"""Async PostgreSQL executor backed by asyncpg connection pooling."""

from __future__ import annotations

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
)


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

_FOREIGN_KEY_SQL = """
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY tc.table_name, kcu.column_name
"""


class PostgresExecutorAsync:
    """Execute PostgreSQL operations through an async pool."""

    def __init__(self) -> None:
        self.pool: Any | None = None
        self.config: dict[str, Any] = {}

    async def connect(self, config: dict[str, Any]) -> None:
        """Create an asyncpg pool for the supplied PostgreSQL connection config."""
        if getattr(asyncpg, "create_pool", None) is None:
            raise ConnectionError("asyncpg is required for PostgreSQL async execution")

        self.config = dict(config)
        ssl = "require" if self.config.get("ssl") else None

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
                ssl=ssl,
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
        """Return PostgreSQL schema metadata in the shared executor format with foreign keys."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                # Fetch column metadata
                rows = await connection.fetch(_INTROSPECTION_SQL)
                # Fetch foreign key metadata
                fk_rows = await connection.fetch(_FOREIGN_KEY_SQL)
        except Exception as exc:
            raise SchemaIntrospectionError(
                "Failed to introspect PostgreSQL schema", exc
            ) from exc

        # Build foreign key lookup map
        fk_map: dict[tuple[str, str], dict[str, str]] = {}
        for fk_row in fk_rows:
            fk_record = dict(fk_row)
            # Only add if all required FK fields are present
            if all(
                k in fk_record
                for k in [
                    "table_name",
                    "column_name",
                    "referenced_table",
                    "referenced_column",
                    "constraint_name",
                ]
            ):
                key = (fk_record["table_name"], fk_record["column_name"])
                fk_map[key] = {
                    "referenced_table": fk_record["referenced_table"],
                    "referenced_column": fk_record["referenced_column"],
                    "constraint_name": fk_record["constraint_name"],
                }

        # Build schema with enriched column metadata
        schema: dict[str, list[dict[str, Any]]] = {}
        for row in rows:
            record = dict(row)
            table_name = record["table_name"]
            column_name = record["column_name"]

            column_info = {
                "column": column_name,
                "type": record["data_type"],
                "nullable": record["is_nullable"] == "YES",
            }

            # Add foreign key metadata if present
            fk_info = fk_map.get((table_name, column_name))
            if fk_info:
                column_info["foreign_key"] = fk_info

            schema.setdefault(table_name, []).append(column_info)

        return schema

    async def execute_query(
        self,
        sql: str,
        params: list[Any] | tuple[Any, ...] | None = None,
    ) -> list[dict[str, Any]]:
        """Execute a query and return rows as dictionaries."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                rows = await connection.fetch(sql, *(params or ()))
        except TimeoutError as exc:
            raise QueryTimeoutError("PostgreSQL query timed out", exc) from exc
        except Exception as exc:
            exc_name = exc.__class__.__name__
            exc_message = str(exc)
            normalized = exc_message.lower()

            # Check for permission/privilege errors
            if exc_name in {
                "InsufficientPrivilegeError",
                "OperationalError",
                "ProgrammingError",
            }:
                permission_markers = [
                    "permission denied",
                    "must be owner",
                    "insufficient privilege",
                    "access denied",
                ]
                if any(marker in normalized for marker in permission_markers):
                    from database.exceptions import UnsafeQueryError

                    raise UnsafeQueryError(
                        f"PostgreSQL permission denied: {exc_message}", exc
                    ) from exc

            # Generic execution error with preserved detail
            raise ConnectionError(
                f"Failed to execute PostgreSQL query: {exc_message}", exc
            ) from exc

        return [dict(row) for row in rows]
