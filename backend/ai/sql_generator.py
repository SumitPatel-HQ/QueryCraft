"""LLM response parsing and refinement loop for SQL generation."""

from __future__ import annotations

import re
from typing import Protocol


FENCED_SQL_PATTERN = re.compile(r"```(?:sql)?\s*(.*?)\s*```", re.IGNORECASE | re.DOTALL)
RAW_SQL_PATTERN = re.compile(r"\b(?:SELECT|WITH)\b[\s\S]*", re.IGNORECASE)


class SQLGeneratorClient(Protocol):
    """Provider-agnostic client protocol exposing generate(system, user)."""

    def generate(self, system_prompt: str, user_prompt: str) -> str: ...


def _extract_sql(response: str) -> str | None:
    """Extract SQL from fenced or raw LLM response."""
    fenced_match = FENCED_SQL_PATTERN.search(response)
    if fenced_match:
        return fenced_match.group(1).strip()

    raw_match = RAW_SQL_PATTERN.search(response)
    if raw_match:
        return raw_match.group(0).strip()

    return None


def generate_sql(
    system_prompt: str,
    user_prompt: str,
    llm_client: SQLGeneratorClient,
) -> tuple[str, bool]:
    """Generate SQL from an LLM response with up to two refinement retries."""
    current_user_prompt = user_prompt
    was_refined = False

    for attempt in range(3):
        response = llm_client.generate(system_prompt, current_user_prompt)
        extracted_sql = _extract_sql(response)

        if extracted_sql:
            return extracted_sql, was_refined

        if attempt < 2:
            was_refined = True
            current_user_prompt = (
                f"{current_user_prompt}\n\n"
                "Previous output failed: SQL extraction failed. "
                "Return only valid SQL without markdown or explanation."
            )

    raise ValueError("Failed to extract SQL after maximum retry attempts")
