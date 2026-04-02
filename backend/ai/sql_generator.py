"""Provider-agnostic SQL generation helpers for NL query pipeline."""

from __future__ import annotations

from typing import Any


def generate_sql(
    system_prompt: str, user_prompt: str, llm_client: Any
) -> tuple[str, bool]:
    """Generate SQL from prompts using an injected LLM client."""
    response = llm_client.generate(system_prompt, user_prompt)
    return str(response), False
