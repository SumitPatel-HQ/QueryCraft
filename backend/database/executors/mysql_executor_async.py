"""Async MySQL executor backed by aiomysql connection pooling."""

from __future__ import annotations

import ssl as ssl_module
from types import SimpleNamespace
from typing import Any

try:
    import aiomysql
except ImportError:  # pragma: no cover - exercised only when dependency is absent
    aiomysql = SimpleNamespace(create_pool=None)

from database.exceptions import (
    AuthenticationError,
    ConnectionError,
    QueryTimeoutError,
    SchemaIntrospectionError,
)


_INTROSPECTION_SQL = """
SELECT
    TABLE_NAME AS table_name,
    COLUMN_NAME AS column_name,
    DATA_TYPE AS data_type,
    IS_NULLABLE AS is_nullable
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION
"""

_FOREIGN_KEY_SQL = """
SELECT
    kcu.TABLE_NAME AS table_name,
    kcu.COLUMN_NAME AS column_name,
    kcu.REFERENCED_TABLE_NAME AS referenced_table,
    kcu.REFERENCED_COLUMN_NAME AS referenced_column,
    kcu.CONSTRAINT_NAME AS constraint_name
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME
"""


class MySQLExecutorAsync:
    """Execute MySQL operations through an async pool."""

    def __init__(self) -> None:
        self.pool: Any | None = None
        self.config: dict[str, Any] = {}

    async def connect(self, config: dict[str, Any]) -> None:
        """Create an aiomysql pool for the supplied MySQL connection config."""
        if getattr(aiomysql, "create_pool", None) is None:
            raise ConnectionError("aiomysql is required for MySQL async execution")

        self.config = dict(config)
        ssl_context = None
        if self.config.get("ssl"):
            ssl_context = ssl_module.create_default_context()

        timeout = float(self.config.get("timeout", 30))

        auth_plugin = self.config.get("auth_plugin")

        pool_kwargs: dict[str, Any] = {
            "host": self.config.get("host"),
            "port": self.config.get("port", 3306),
            "user": self.config.get("user"),
            "password": self.config.get("password"),
            "db": self.config.get("db") or self.config.get("database"),
            "minsize": 1,
            "maxsize": 10,
            "connect_timeout": timeout,
            "autocommit": True,
            "ssl": ssl_context,
        }

        if auth_plugin:
            pool_kwargs["auth_plugin"] = auth_plugin

        try:
            try:
                self.pool = await aiomysql.create_pool(**pool_kwargs)
            except TypeError as exc:
                # Older aiomysql versions may not accept auth_plugin.
                if "auth_plugin" in pool_kwargs and "auth_plugin" in str(exc):
                    pool_kwargs.pop("auth_plugin", None)
                    self.pool = await aiomysql.create_pool(**pool_kwargs)
                else:
                    raise
        except (
            Exception
        ) as exc:  # pragma: no cover - covered via error mapping expectations
            exc_name = exc.__class__.__name__
            exc_message = str(exc)
            normalized = exc_message.lower()

            if exc_name in {"OperationalError", "ProgrammingError"}:
                auth_markers = [
                    "access denied",
                    "authentication",
                    "auth",
                    "password",
                    "denied",
                ]
                if any(marker in normalized for marker in auth_markers):
                    raise AuthenticationError(
                        f"Failed to authenticate with MySQL: {exc_message}", exc
                    ) from exc

            raise ConnectionError(
                f"Failed to connect to MySQL: {exc_message}", exc
            ) from exc

    async def disconnect(self) -> None:
        """Close the current aiomysql pool if one exists."""
        if self.pool is not None:
            self.pool.close()
            await self.pool.wait_closed()
            self.pool = None

    async def test_connection(self) -> bool:
        """Run a lightweight connectivity check against the active pool."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                async with connection.cursor() as cursor:
                    await cursor.execute("SELECT 1")
                    await cursor.fetchone()
            return True
        except Exception:
            return False

    async def introspect_schema(self) -> dict[str, list[dict[str, Any]]]:
        """Return MySQL schema metadata in the shared executor format with foreign keys."""
        try:
            if self.pool is None:
                await self.connect(self.config)
            async with self.pool.acquire() as connection:
                async with connection.cursor() as cursor:
                    # Fetch column metadata
                    await cursor.execute(_INTROSPECTION_SQL)
                    rows = await cursor.fetchall()
                    columns = [column[0] for column in cursor.description]

                    # Fetch foreign key metadata
                    await cursor.execute(_FOREIGN_KEY_SQL)
                    fk_rows = await cursor.fetchall()
                    fk_columns = [column[0] for column in cursor.description]
        except Exception as exc:
            raise SchemaIntrospectionError(
                "Failed to introspect MySQL schema", exc
            ) from exc

        # Build foreign key lookup map
        fk_map: dict[tuple[str, str], dict[str, str]] = {}
        for fk_row in self._rows_to_dicts(fk_rows, fk_columns):
            # Only add if all required FK fields are present
            if all(
                k in fk_row
                for k in [
                    "table_name",
                    "column_name",
                    "referenced_table",
                    "referenced_column",
                    "constraint_name",
                ]
            ):
                key = (fk_row["table_name"], fk_row["column_name"])
                fk_map[key] = {
                    "referenced_table": fk_row["referenced_table"],
                    "referenced_column": fk_row["referenced_column"],
                    "constraint_name": fk_row["constraint_name"],
                }

        # Build schema with enriched column metadata
        schema: dict[str, list[dict[str, Any]]] = {}
        for row in self._rows_to_dicts(rows, columns):
            table_name = row["table_name"]
            column_name = row["column_name"]

            column_info = {
                "column": column_name,
                "type": row["data_type"],
                "nullable": row["is_nullable"] == "YES",
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
                async with connection.cursor() as cursor:
                    await cursor.execute(sql, params)
                    rows = await cursor.fetchall()
                    columns = (
                        [column[0] for column in cursor.description]
                        if cursor.description
                        else []
                    )
        except TimeoutError as exc:
            raise QueryTimeoutError("MySQL query timed out", exc) from exc
        except Exception as exc:
            exc_name = exc.__class__.__name__
            exc_message = str(exc)
            normalized = exc_message.lower()

            # Check for permission/privilege errors
            if exc_name in {"OperationalError", "ProgrammingError", "InternalError"}:
                permission_markers = [
                    "access denied",
                    "command denied",
                    "permission denied",
                    "privilege",
                    "denied",
                ]
                if any(marker in normalized for marker in permission_markers):
                    from database.exceptions import UnsafeQueryError

                    raise UnsafeQueryError(
                        f"MySQL permission denied: {exc_message}", exc
                    ) from exc

            # Generic execution error with preserved detail
            raise ConnectionError(
                f"Failed to execute MySQL query: {exc_message}", exc
            ) from exc

        return self._rows_to_dicts(rows, columns)

    @staticmethod
    def _rows_to_dicts(
        rows: list[Any] | tuple[Any, ...], columns: list[str]
    ) -> list[dict[str, Any]]:
        """Convert cursor rows into a list of column-mapped dictionaries."""
        if rows and isinstance(rows[0], dict):
            return [dict(row) for row in rows]
        return [dict(zip(columns, row)) for row in rows]
