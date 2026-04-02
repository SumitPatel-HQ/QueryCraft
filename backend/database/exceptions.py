"""Structured database exception hierarchy for executor implementations."""

from __future__ import annotations

from typing import Optional


class DatabaseError(Exception):
    """Base exception for database executor errors."""

    def __init__(self, message: str, original_error: Exception | None = None) -> None:
        super().__init__(message)
        self.original_error = original_error
        if original_error is not None:
            self.__cause__ = original_error


class ConnectionError(DatabaseError):
    """Raised when a database connection cannot be established."""


class AuthenticationError(DatabaseError):
    """Raised when database credentials are rejected."""


class QueryTimeoutError(DatabaseError):
    """Raised when database operations exceed the configured timeout."""


class SchemaIntrospectionError(DatabaseError):
    """Raised when schema metadata cannot be retrieved."""


class UnsafeQueryError(DatabaseError):
    """Raised when a query violates executor safety rules."""
