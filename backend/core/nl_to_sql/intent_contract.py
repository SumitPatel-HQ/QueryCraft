"""
Intent Contract and Policy
===========================

This module defines the core contract for multi-intent NL-to-SQL behavior.
All downstream components must follow these rules.

Core Contract Rules:
-------------------
1. ALWAYS attempt to satisfy ALL detected intents in a compound query
2. NEVER silently drop parts of a query
3. If some intents fail (missing metadata, unavailable pattern), mark them
   as missing in coverage_report but return partial results for successful intents
4. Multi-intent support is MANDATORY, not optional
5. Fallbacks are acceptable ONLY with explicit failure markers

This is a design guardrail for all downstream changes.
"""

from enum import Enum
from typing import List, Optional
from dataclasses import dataclass, field


class IntentType(Enum):
    """Types of intents that can be detected in NL queries"""

    TABLE_INVENTORY = "table_inventory"
    RELATIONSHIP_INVENTORY = "relationship_inventory"
    AGGREGATION = "aggregation"
    FILTERING = "filtering"
    RANKING = "ranking"
    SORTING = "sorting"
    JOINING = "joining"
    COLUMN_INVENTORY = "column_inventory"
    UNKNOWN = "unknown"


class IntentStatus(Enum):
    """Status of intent processing"""

    DETECTED = "detected"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    MISSING = "missing"


@dataclass
class Intent:
    """Represents a single intent within a compound query"""

    intent_type: IntentType
    text: str
    entities: List[str] = field(default_factory=list)
    status: IntentStatus = IntentStatus.DETECTED
    error_message: Optional[str] = None
    sql_query: Optional[str] = None
    explanation: Optional[str] = None
    confidence: float = 1.0

    def to_dict(self):
        """Convert intent to dictionary for serialization"""
        return {
            "intent_type": self.intent_type.value,
            "text": self.text,
            "entities": self.entities,
            "status": self.status.value,
            "error_message": self.error_message,
            "sql_query": self.sql_query,
            "explanation": self.explanation,
            "confidence": self.confidence,
        }


@dataclass
class IntentPlan:
    """
    Represents the complete intent analysis for a user query.

    This is the contract object passed between components:
    - Intent decomposer creates it
    - Prompt builder consumes it
    - Processor validates against it
    - Coverage validator checks completion
    """

    query: str
    intents: List[Intent]

    @property
    def intent_count(self) -> int:
        """Number of intents detected"""
        return len(self.intents)

    @property
    def is_compound(self) -> bool:
        """Whether this is a compound (multi-intent) query"""
        return self.intent_count > 1

    @property
    def detected_intent_types(self) -> List[IntentType]:
        """List of detected intent types"""
        return [intent.intent_type for intent in self.intents]

    @property
    def successful_intents(self) -> List[Intent]:
        """Intents that were successfully processed"""
        return [i for i in self.intents if i.status == IntentStatus.SUCCESS]

    @property
    def failed_intents(self) -> List[Intent]:
        """Intents that failed to process"""
        return [i for i in self.intents if i.status == IntentStatus.FAILED]

    @property
    def missing_intents(self) -> List[Intent]:
        """Intents that were not addressed"""
        return [i for i in self.intents if i.status == IntentStatus.MISSING]

    def to_dict(self):
        """Convert plan to dictionary for serialization"""
        return {
            "query": self.query,
            "intents": [intent.to_dict() for intent in self.intents],
            "intent_count": self.intent_count,
            "is_compound": self.is_compound,
        }


@dataclass
class CoverageReport:
    """
    Report on intent coverage after processing.

    This is the accountability mechanism ensuring no intents are silently dropped.
    """

    detected_intents: List[str]
    satisfied_intents: List[str]
    missing_intents: List[str]
    retry_count: int = 0
    fallback_used: bool = False
    coverage_percentage: float = 0.0

    def __post_init__(self):
        """Calculate coverage percentage"""
        if self.detected_intents:
            self.coverage_percentage = (
                len(self.satisfied_intents) / len(self.detected_intents) * 100
            )

    def to_dict(self):
        """Convert report to dictionary for serialization"""
        return {
            "detected_intents": self.detected_intents,
            "satisfied_intents": self.satisfied_intents,
            "missing_intents": self.missing_intents,
            "retry_count": self.retry_count,
            "fallback_used": self.fallback_used,
            "coverage_percentage": round(self.coverage_percentage, 2),
        }


# Contract validation functions
def validate_intent_plan(plan: IntentPlan) -> bool:
    """
    Validate that an intent plan meets contract requirements.

    Returns:
        True if plan is valid, False otherwise
    """
    if not plan.query:
        return False
    if not plan.intents:
        return False
    # All intents must have valid intent_type
    for intent in plan.intents:
        if not isinstance(intent.intent_type, IntentType):
            return False
    return True


def validate_coverage(plan: IntentPlan) -> CoverageReport:
    """
    Validate that all intents in the plan have been addressed.

    Returns:
        CoverageReport showing which intents were satisfied
    """
    detected = [i.intent_type.value for i in plan.intents]
    satisfied = [i.intent_type.value for i in plan.successful_intents]
    missing = [i.intent_type.value for i in plan.missing_intents + plan.failed_intents]

    return CoverageReport(
        detected_intents=detected, satisfied_intents=satisfied, missing_intents=missing
    )


# Contract enforcement constants
INTENT_POLICY = {
    "multi_intent_mandatory": True,
    "silent_drop_forbidden": True,
    "partial_results_allowed": True,
    "failure_markers_required": True,
    "fallback_requires_marker": True,
}
