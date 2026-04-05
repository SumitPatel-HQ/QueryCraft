"""Coverage validation for multi-intent NL-to-SQL responses."""

from __future__ import annotations

from typing import Any

from .intent_contract import CoverageReport, IntentPlan, IntentType


def _sql_satisfies_relationship_intent(sql_query: str) -> bool:
    normalized = sql_query.lower()
    return any(
        marker in normalized
        for marker in (
            "referenced_table",
            "referenced_column",
            "foreign key",
            "key_column_usage",
            "pragma_foreign_key_list",
            " join ",
        )
    )


def _sql_satisfies_table_intent(sql_query: str) -> bool:
    normalized = sql_query.lower()
    return any(
        marker in normalized
        for marker in (
            "information_schema.tables",
            "sqlite_master",
            "table_name",
            "show tables",
        )
    )


def _is_item_satisfied(intent_type: str, item: dict[str, Any]) -> bool:
    if item.get("status") != "success":
        return False

    sql_query = str(item.get("sql_query", ""))
    if not sql_query:
        return False

    if intent_type == IntentType.RELATIONSHIP_INVENTORY.value:
        return _sql_satisfies_relationship_intent(sql_query)
    if intent_type == IntentType.TABLE_INVENTORY.value:
        return _sql_satisfies_table_intent(sql_query)
    return True


def validate_intent_coverage(
    intent_plan: IntentPlan,
    query_items: list[dict[str, Any]],
    retry_count: int = 0,
) -> CoverageReport:
    """Validate that each detected intent is represented by a satisfying query item."""
    satisfied_intents: list[str] = []
    missing_intents: list[str] = []

    for intent in intent_plan.intents:
        matching_item = next(
            (
                item
                for item in query_items
                if item.get("intent_label") == intent.intent_type.value
            ),
            None,
        )
        if matching_item and _is_item_satisfied(
            intent.intent_type.value, matching_item
        ):
            satisfied_intents.append(intent.intent_type.value)
        else:
            missing_intents.append(intent.intent_type.value)

    return CoverageReport(
        detected_intents=[intent.intent_type.value for intent in intent_plan.intents],
        satisfied_intents=satisfied_intents,
        missing_intents=missing_intents,
        retry_count=retry_count,
        fallback_used=bool(missing_intents),
    )
