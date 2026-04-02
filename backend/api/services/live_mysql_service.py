"""Helpers for validating and introspecting live MySQL connections."""

from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse

from database.executors.mysql_executor_async import MySQLExecutorAsync


def build_mysql_connection_string(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl: bool,
) -> str:
    ssl_value = "true" if ssl else "false"
    return f"mysql://{quote(username)}:{quote(password)}@{host}:{port}/{database}?ssl={ssl_value}"


def parse_mysql_connection_string(connection_string: str) -> dict[str, Any]:
    parsed = urlparse(connection_string)
    query = parse_qs(parsed.query)
    ssl_values = query.get("ssl", ["true"])
    return {
        "host": parsed.hostname or "",
        "port": parsed.port or 3306,
        "database": parsed.path.lstrip("/"),
        "username": unquote(parsed.username or ""),
        "ssl": ssl_values[0].lower() == "true",
    }


async def test_mysql_connection(config: dict[str, Any]) -> bool:
    executor = MySQLExecutorAsync()
    try:
        await executor.connect(config)
        return await executor.test_connection()
    finally:
        await executor.disconnect()


async def fetch_mysql_schema(config: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    executor = MySQLExecutorAsync()
    try:
        await executor.connect(config)
        return await executor.introspect_schema()
    finally:
        await executor.disconnect()
