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


def _parse_mysql_connection_string_with_password(
    connection_string: str,
) -> dict[str, Any]:
    parsed = urlparse(connection_string)
    query = parse_qs(parsed.query)
    ssl_values = query.get("ssl", ["true"])
    return {
        "host": parsed.hostname or "",
        "port": parsed.port or 3306,
        "database": parsed.path.lstrip("/"),
        "username": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "ssl": ssl_values[0].lower() == "true",
    }


def parse_mysql_connection_string(connection_string: str) -> dict[str, Any]:
    parsed = _parse_mysql_connection_string_with_password(connection_string)
    return {
        "host": parsed["host"],
        "port": parsed["port"],
        "database": parsed["database"],
        "username": parsed["username"],
        "ssl": parsed["ssl"],
    }


def config_from_mysql_connection_string(connection_string: str) -> dict[str, Any]:
    parsed = _parse_mysql_connection_string_with_password(connection_string)
    return {
        "host": parsed["host"],
        "port": parsed["port"],
        "db": parsed["database"],
        "database": parsed["database"],
        "user": parsed["username"],
        "username": parsed["username"],
        "password": parsed["password"],
        "ssl": parsed["ssl"],
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


async def fetch_mysql_schema_from_connection_string(
    connection_string: str,
) -> dict[str, list[dict[str, Any]]]:
    return await fetch_mysql_schema(
        config_from_mysql_connection_string(connection_string)
    )


async def execute_mysql_query_from_connection_string(
    connection_string: str,
    sql: str,
    params: list[Any] | tuple[Any, ...] | None = None,
) -> list[dict[str, Any]]:
    executor = MySQLExecutorAsync()
    try:
        await executor.connect(config_from_mysql_connection_string(connection_string))
        return await executor.execute_query(sql, params=params)
    finally:
        await executor.disconnect()
