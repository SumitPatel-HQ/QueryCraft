"""Lightweight intent decomposition for compound NL-to-SQL questions."""

from __future__ import annotations

import re
from typing import Any

from .intent_contract import Intent, IntentPlan, IntentStatus, IntentType


_CONNECTOR_PATTERN = re.compile(
    r"\s+(?:and|also|plus|,)(?=\s+(?:list|show|count|find|get|describe|explain|understand))",
    re.IGNORECASE,
)
_SEMANTIC_COMPOUND_MARKERS = [
    "with",
    "including",
    "along with",
    "and their",
    "showing their",
]

_INTENT_KEYWORDS: dict[IntentType, tuple[str, ...]] = {
    IntentType.TABLE_INVENTORY: ("table", "tables", "schema", "structure"),
    IntentType.COLUMN_INVENTORY: ("column", "columns", "field", "fields"),
    IntentType.RELATIONSHIP_INVENTORY: (
        "relationship",
        "relationships",
        "foreign key",
        "foreign keys",
        "join",
        "joins",
        "related",
    ),
    IntentType.AGGREGATION: ("count", "sum", "average", "avg", "total"),
    IntentType.FILTERING: ("where", "equals", "greater", "less", "between"),
    IntentType.RANKING: ("top", "rank", "ranking", "highest", "lowest", "limit"),
    IntentType.SORTING: ("sort", "order by", "ordered", "ascending", "descending"),
    IntentType.JOINING: ("join", "combine", "merge"),
}


def split_by_connectors(question: str) -> list[str]:
    """Split a question into candidate clauses using explicit connectors."""
    clauses = [
        part.strip(" ,")
        for part in _CONNECTOR_PATTERN.split(question)
        if part.strip(" ,")
    ]
    return clauses or [question.strip()]


def has_semantic_compound_pattern(question: str) -> bool:
    """Detect implicit compound-intent phrasing."""
    normalized = question.lower()
    return any(marker in normalized for marker in _SEMANTIC_COMPOUND_MARKERS)


def extract_entities(clause: str, schema: dict[str, list[dict[str, Any]]]) -> list[str]:
    """Map clause words back to known schema tables and columns."""
    normalized = clause.lower()
    entities: list[str] = []

    for table_name, columns in schema.items():
        if table_name.lower() in normalized:
            entities.append(table_name)
        for column in columns or []:
            column_name = str(column.get("column") or column.get("name") or "").strip()
            if column_name and column_name.lower() in normalized:
                entities.append(f"{table_name}.{column_name}")

    deduped: list[str] = []
    for entity in entities:
        if entity not in deduped:
            deduped.append(entity)
    return deduped


def classify_clause(clause: str) -> IntentType:
    """Classify a clause using lightweight keyword scoring."""
    normalized = clause.lower()
    scores: dict[IntentType, int] = {}

    for intent_type, keywords in _INTENT_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in normalized)
        if score:
            scores[intent_type] = score

    if not scores:
        return IntentType.UNKNOWN

    return max(scores.items(), key=lambda item: item[1])[0]


def decompose_question(
    question: str, schema: dict[str, list[dict[str, Any]]]
) -> IntentPlan:
    """Split a user question into one or more intent units."""
    clauses = split_by_connectors(question)
    intents: list[Intent] = []

    for clause in clauses:
        intents.append(
            Intent(
                intent_type=classify_clause(clause),
                text=clause,
                entities=extract_entities(clause, schema),
                status=IntentStatus.DETECTED,
            )
        )

    detected_types = {intent.intent_type for intent in intents}
    normalized = question.lower()
    has_table_language = any(
        word in normalized for word in ("table", "tables", "schema", "structure")
    )
    has_relationship_language = any(
        word in normalized
        for word in (
            "relationship",
            "relationships",
            "foreign key",
            "foreign keys",
            "join",
            "related",
        )
    )

    if has_semantic_compound_pattern(question) or (
        has_table_language and has_relationship_language
    ):
        if IntentType.TABLE_INVENTORY not in detected_types and has_table_language:
            intents.append(
                Intent(
                    intent_type=IntentType.TABLE_INVENTORY,
                    text=question,
                    entities=extract_entities(question, schema),
                    status=IntentStatus.DETECTED,
                )
            )
        if (
            IntentType.RELATIONSHIP_INVENTORY not in detected_types
            and has_relationship_language
        ):
            intents.append(
                Intent(
                    intent_type=IntentType.RELATIONSHIP_INVENTORY,
                    text=question,
                    entities=extract_entities(question, schema),
                    status=IntentStatus.DETECTED,
                )
            )

    deduped_intents: list[Intent] = []
    seen: set[tuple[str, str]] = set()
    for intent in intents:
        key = (intent.intent_type.value, intent.text.lower())
        if key in seen:
            continue
        seen.add(key)
        deduped_intents.append(intent)

    if not deduped_intents:
        deduped_intents.append(
            Intent(
                intent_type=IntentType.UNKNOWN,
                text=question,
                entities=extract_entities(question, schema),
                status=IntentStatus.DETECTED,
            )
        )

    return IntentPlan(query=question, intents=deduped_intents)
