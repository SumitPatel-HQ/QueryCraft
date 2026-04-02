"""Tests for AI response formatting behavior."""

from __future__ import annotations

from dataclasses import is_dataclass

from backend.ai.response_formatter import FormattedResponse, format_response


class StubLLMClient:
    """Simple LLM stub exposing generate()."""

    def __init__(self, text: str = "Summary sentence.") -> None:
        self.text = text
        self.prompts: list[str] = []

    def generate(self, prompt: str) -> str:
        self.prompts.append(prompt)
        return self.text


def test_formatted_response_is_dataclass_with_expected_fields() -> None:
    assert is_dataclass(FormattedResponse)
    assert list(FormattedResponse.__annotations__.keys()) == [
        "table",
        "summary",
        "sql",
        "row_count",
    ]


def test_format_response_with_no_rows_returns_friendly_message_and_sql() -> None:
    llm = StubLLMClient()
    sql = "SELECT * FROM users"

    response = format_response([], "show users", sql, llm)

    assert response.row_count == 0
    assert response.table == ""
    assert response.summary == "No results found"
    assert sql in response.sql
    assert "<details>" in response.sql
    assert llm.prompts == []


def test_format_response_with_ten_rows_renders_markdown_summary_and_sql() -> None:
    rows = [
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"},
    ]
    llm = StubLLMClient("There are two users.")

    response = format_response(rows, "list users", "SELECT id, name FROM users", llm)

    assert response.row_count == 2
    assert "| id | name |" in response.table
    assert "| 1 | Alice |" in response.table
    assert response.summary == "There are two users."
    assert len(llm.prompts) == 1
    assert "columns id, name" in llm.prompts[0]
    assert "<details>" in response.sql
    assert "SELECT id, name FROM users" in response.sql


def test_format_response_caps_rows_at_five_hundred_with_notice() -> None:
    rows = [{"value": i} for i in range(600)]
    llm = StubLLMClient("Returned many rows.")

    response = format_response(rows, "show values", "SELECT value FROM t", llm)

    assert response.row_count == 600
    assert "Showing 500 of 600" in response.table
    assert "| value |" in response.table
    assert "| 0 |" in response.table
    assert "| 499 |" in response.table
    assert "| 500 |" not in response.table
    assert response.summary == "Returned many rows."
    assert "<details>" in response.sql
