import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


class StubLLMClient:
    def __init__(self, responses: list[str]) -> None:
        self._responses = responses
        self.calls: list[tuple[str, str]] = []

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        self.calls.append((system_prompt, user_prompt))
        return self._responses[len(self.calls) - 1]


def test_generate_sql_extracts_sql_from_markdown_fence() -> None:
    from ai.sql_generator import generate_sql

    client = StubLLMClient(["""```sql\nSELECT id FROM users\n```"""])
    sql, was_refined = generate_sql("sys", "user", client)

    assert sql == "SELECT id FROM users"
    assert was_refined is False
    assert len(client.calls) == 1


def test_generate_sql_extracts_raw_sql_without_fence() -> None:
    from ai.sql_generator import generate_sql

    client = StubLLMClient(["SELECT email FROM users WHERE id = 1"])
    sql, was_refined = generate_sql("sys", "user", client)

    assert sql == "SELECT email FROM users WHERE id = 1"
    assert was_refined is False


def test_generate_sql_retries_when_initial_response_has_no_sql() -> None:
    from ai.sql_generator import generate_sql

    client = StubLLMClient(
        [
            "I cannot answer that directly.",
            "```sql\nSELECT count(*) FROM users\n```",
        ]
    )

    sql, was_refined = generate_sql("sys", "user", client)

    assert sql == "SELECT count(*) FROM users"
    assert was_refined is True
    assert len(client.calls) == 2
    assert (
        "failed" in client.calls[1][1].lower() or "error" in client.calls[1][1].lower()
    )


def test_generate_sql_raises_after_max_retries() -> None:
    from ai.sql_generator import generate_sql

    client = StubLLMClient(["no sql", "still no sql", "again no sql"])

    try:
        generate_sql("sys", "user", client)
        assert False, "Expected ValueError for exhausted retries"
    except ValueError as exc:
        assert "extract" in str(exc).lower() or "generate" in str(exc).lower()
