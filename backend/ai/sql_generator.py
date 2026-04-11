"""LLM response parsing and refinement loop for SQL generation."""

from __future__ import annotations

import re
from typing import Protocol

from ai.sql_validator import validate_sql


FENCED_SQL_PATTERN = re.compile(r"```(?:sql)?\s*(.*?)\s*```", re.IGNORECASE | re.DOTALL)
RAW_SQL_PATTERN = re.compile(r"\b(?:SELECT|WITH)\b[\s\S]*", re.IGNORECASE)
INTENT_BLOCK_PATTERN = re.compile(
    r"INTENT:\s*(?P<intent>.+?)\s*SQL:\s*(?P<sql>.+?)(?:\s*EXPLANATION:\s*(?P<explanation>.*?))?(?=\n\s*INTENT:|\Z)",
    re.IGNORECASE | re.DOTALL,
)


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


def parse_intent_blocks(response: str) -> list[dict[str, str]]:
    """Parse strict INTENT / SQL / EXPLANATION output blocks."""
    items: list[dict[str, str]] = []
    for match in INTENT_BLOCK_PATTERN.finditer(response):
        sql = match.group("sql").strip()
        extracted_sql = _extract_sql(sql) or sql
        items.append(
            {
                "intent_label": match.group("intent").strip(),
                "sql_query": extracted_sql.strip(),
                "explanation": (match.group("explanation") or "").strip(),
            }
        )
    return items


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
            is_valid, reason = validate_sql(extracted_sql, dialect="generic")
            if is_valid:
                return extracted_sql, was_refined

            if attempt < 2:
                was_refined = True
                current_user_prompt = (
                    f"{current_user_prompt}\n\n"
                    f"Previous output failed validation: {reason}. "
                    "Return only valid SELECT/WITH SQL without markdown or explanation."
                )
                continue

        if attempt < 2:
            was_refined = True
            current_user_prompt = (
                f"{current_user_prompt}\n\n"
                "Previous output failed: SQL extraction failed. "
                "Return only valid SQL without markdown or explanation."
            )

    raise ValueError("Failed to extract SQL after maximum retry attempts")


def generate_sql_items(
    system_prompt: str,
    user_prompt: str,
    llm_client: SQLGeneratorClient,
) -> tuple[list[dict[str, str]], bool]:
    """Generate one SQL item per intent block with light retry support."""
    current_user_prompt = user_prompt
    was_refined = False

    for attempt in range(3):
        response = llm_client.generate(system_prompt, current_user_prompt)
        items = parse_intent_blocks(response)
        valid_items: list[dict[str, str]] = []

        for item in items:
            is_valid, _reason = validate_sql(item["sql_query"], dialect="generic")
            if is_valid:
                valid_items.append(item)

        if valid_items:
            return valid_items, was_refined

        if attempt < 2:
            was_refined = True
            current_user_prompt = (
                f"{current_user_prompt}\n\n"
                "Previous output failed. Return one or more INTENT / SQL / EXPLANATION blocks only."
            )

    raise ValueError("Failed to extract multi-intent SQL after maximum retry attempts")
