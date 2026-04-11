"""
Main NL-to-SQL processor
Orchestrates LLM and pattern-matching approaches
"""

import logging
import re
from typing import Dict, List, Any, Optional

from .config import NLToSQLConfig
from .intent_contract import CoverageReport, IntentPlan, IntentStatus
from .utils import SQLUtils
from .pattern_matcher import PatternMatchingEngine

logger = logging.getLogger(__name__)


class NLToSQLProcessor:
    """
    Main processor for converting natural language to SQL
    Uses hybrid approach: LLM first, then pattern-matching fallback
    """

    def __init__(
        self,
        schema: Dict[str, List[Dict]],
        introspector=None,
        db_type: Optional[str] = None,
    ):
        """
        Initialize NL-to-SQL processor

        Args:
            schema: Database schema dictionary
            introspector: Schema introspector instance
            db_type: Explicit database type ('mysql', 'postgresql', 'sqlite'). If not provided, will infer from introspector.
        """
        self.schema = schema
        self.table_names = list(schema.keys())
        self.introspector = introspector
        self.llm_generator = None
        # Use explicit db_type if provided, otherwise infer
        self.db_type = (
            db_type if db_type is not None else self._infer_db_type(introspector)
        )

        # Initialize pattern matching engine with db_type
        self.pattern_matcher = PatternMatchingEngine(
            self.table_names, self.db_type, self.schema
        )

        # Try to initialize LLM generator
        self._initialize_llm()

    def _initialize_llm(self):
        """Initialize LLM generator if available"""
        try:
            from core.llm import LLMSQLGenerator  # type: ignore

            self.llm_generator = LLMSQLGenerator()
            logger.info("✅ LLM SQL Generator initialized successfully")
        except Exception as e:
            logger.warning(
                f"⚠️ LLM Generator not available: {e}. Will use pattern-matching only."
            )

    @staticmethod
    def _infer_db_type(introspector: Any) -> str:
        if introspector is None:
            return "mysql"

        intro_cls = introspector.__class__.__name__.lower()
        intro_mod = getattr(introspector.__class__, "__module__", "").lower()
        if "sqlite" in intro_cls or "sqlite" in intro_mod:
            return "sqlite"
        if "postgres" in intro_cls or "postgres" in intro_mod:
            return "postgresql"
        if "mysql" in intro_cls or "mysql" in intro_mod:
            return "mysql"
        return "mysql"

    def process_query(self, question: str) -> Dict[str, Any]:
        """
        Convert natural language to SQL query using hybrid approach:
        1. Try LLM generation first (if available)
        2. Fall back to pattern-matching if LLM fails

        Args:
            question: Natural language question from user

        Returns:
            Dictionary containing:
                - sql_query: The generated SQL
                - explanation: Human-readable explanation
                - generation_method: "llm" or "fallback"
                - confidence: Confidence score (0-100)
                - tables_used: List of tables referenced
                - tokens_used: Number of tokens used (LLM only)
        """
        question_lower = question.lower()
        analytical_score = self._compute_analytical_complexity_score(question_lower)
        is_analytical_intent = (
            analytical_score >= NLToSQLConfig.ANALYTICAL_COMPLEXITY_THRESHOLD
        )

        # Route analytical intents to LLM first and only allow fallback when API is not responding.
        if self.llm_generator:
            llm_result, api_responding, llm_error = self._try_llm_generation(question)
            if llm_result:
                return llm_result

            if api_responding:
                return self._llm_failure_response(question, llm_error)

            logger.info("LLM API not responding; switching to pattern fallback")
            return self._pattern_matching_fallback(question)

        logger.warning("LLM generator unavailable; switching to pattern fallback")
        if is_analytical_intent:
            logger.warning(
                "Analytical intent detected (score=%s), but no LLM API is responding.",
                analytical_score,
            )

        # Fallback only when no API is responding/available.
        return self._pattern_matching_fallback(question)

    def process_intent_plan(self, intent_plan: IntentPlan) -> Dict[str, Any]:
        """Process each detected intent independently and preserve partial success."""
        query_items: list[Dict[str, Any]] = []

        for intent in intent_plan.intents:
            try:
                result = self.process_query(intent.text)
                intent.status = IntentStatus.SUCCESS
                intent.sql_query = result.get("sql_query")
                intent.explanation = result.get("explanation")
                intent.confidence = float(result.get("confidence", 0)) / 100.0
                query_items.append(
                    {
                        "intent_label": intent.intent_type.value,
                        "sql_query": result.get("sql_query", ""),
                        "explanation": result.get("explanation", ""),
                        "tables_used": result.get("tables_used", []),
                        "status": "success",
                        "error_message": None,
                        "result_rows": [],
                        "confidence": result.get("confidence", 0),
                    }
                )
            except Exception as exc:
                intent.status = IntentStatus.FAILED
                intent.error_message = str(exc)
                query_items.append(
                    {
                        "intent_label": intent.intent_type.value,
                        "sql_query": "",
                        "explanation": "",
                        "tables_used": [],
                        "status": "failed",
                        "error_message": str(exc),
                        "result_rows": [],
                        "confidence": 0,
                    }
                )

        first_success = next(
            (item for item in query_items if item["status"] == "success"), None
        )
        coverage_report = CoverageReport(
            detected_intents=[
                intent.intent_type.value for intent in intent_plan.intents
            ],
            satisfied_intents=[
                item["intent_label"]
                for item in query_items
                if item["status"] == "success"
            ],
            missing_intents=[
                item["intent_label"]
                for item in query_items
                if item["status"] != "success"
            ],
            retry_count=0,
            fallback_used=any(
                item["status"] != "success"
                or item.get("sql_query", "").startswith("SELECT '")
                for item in query_items
            ),
        )

        return {
            "sql_query": first_success["sql_query"] if first_success else "",
            "explanation": first_success["explanation"]
            if first_success
            else "No successful query generated.",
            "generation_method": "multi_intent"
            if intent_plan.is_compound
            else "fallback",
            "confidence": first_success["confidence"] if first_success else 0,
            "tables_used": first_success["tables_used"] if first_success else [],
            "tokens_used": 0,
            "query_items": query_items,
            "coverage_report": coverage_report.to_dict(),
            "multi_query_mode": intent_plan.is_compound,
        }

    def _try_llm_generation(
        self, question: str
    ) -> tuple[Optional[Dict[str, Any]], bool, Optional[str]]:
        """
        Attempt LLM-based SQL generation

        Args:
            question: Natural language question

        Returns:
            Result dictionary if successful, None if failed
        """
        try:
            logger.info(f"🤖 Attempting LLM generation for: {question}")

            # Get schema context for LLM (prefer introspector, fallback to in-memory schema)
            schema_context = self._build_schema_context()

            # Generate SQL with LLM
            try:
                result = self.llm_generator.generate_sql_with_llm(
                    question,
                    schema_context,
                    self.db_type,
                )
            except TypeError:
                # Backward compatibility for older generator signatures.
                result = self.llm_generator.generate_sql_with_llm(
                    question,
                    schema_context,
                )

            # Check if LLM generation was successful
            if result.get("sql_query") and not result.get("error"):
                sql_query = SQLUtils.quote_table_identifiers(
                    result["sql_query"], self.table_names
                )
                tables_used = SQLUtils.extract_tables_from_sql(sql_query)

                logger.info(
                    f"✅ LLM generation successful. Confidence: {result['confidence_score']:.2f}"
                )

                return (
                    {
                        "sql_query": sql_query,
                        "explanation": result["explanation"],
                        "generation_method": "llm",
                        "confidence": int(
                            result["confidence_score"] * 100
                        ),  # Convert to 0-100
                        "tables_used": tables_used,
                        "tokens_used": result.get("tokens_used", 0),
                    },
                    True,
                    None,
                )
            else:
                error_message = result.get("error") or "LLM returned no SQL output"
                logger.warning(f"⚠️ LLM generation failed: {error_message}")
                api_responding = not self._is_api_unresponsive_error(error_message)
                return None, api_responding, error_message

        except Exception as e:
            error_message = str(e)
            logger.error(f"❌ Error in LLM generation: {error_message}")
            api_responding = not self._is_api_unresponsive_error(error_message)
            return None, api_responding, error_message

    def _build_schema_context(self) -> str:
        """Build schema context for LLM calls, even when introspector is missing."""
        if self.introspector:
            return self.introspector.format_schema_for_llm()

        schema_lines: List[str] = []
        for table_name, columns in self.schema.items():
            column_defs = []
            relationship_defs = []
            for col in columns or []:
                col_name = col.get("name") or col.get("column") or "unknown"
                col_type = col.get("type", "TEXT")
                column_defs.append(f"{col_name} ({col_type})")
                fk_info = col.get("foreign_key") or {}
                if fk_info:
                    relationship_defs.append(
                        f"{table_name}.{col_name} -> {fk_info.get('referenced_table', 'unknown')}.{fk_info.get('referenced_column', 'unknown')}"
                    )
            schema_lines.append(f"Table: {table_name}")
            schema_lines.append(
                f"Columns: {', '.join(column_defs) if column_defs else 'unknown'}"
            )
            if relationship_defs:
                schema_lines.append(f"Relationships: {', '.join(relationship_defs)}")
            schema_lines.append("")

        return "\n".join(schema_lines).strip()

    def _compute_analytical_complexity_score(self, question_lower: str) -> int:
        """Score analytical intent from keywords and complexity signals."""
        keyword_hits = {
            kw
            for kw in NLToSQLConfig.ANALYTICAL_INTENT_KEYWORDS
            if kw in question_lower
        }
        score = len(keyword_hits)

        # Boost for common analytical patterns.
        if re.search(
            r"\b(group by|order by|between|compare|vs|rank|ranking)\b", question_lower
        ):
            score += 1
        if re.search(r"\b(top\s+\d+|most|least|highest|lowest)\b", question_lower):
            score += 1

        return score

    @staticmethod
    def _is_api_unresponsive_error(error_message: str) -> bool:
        """Detect provider non-response/network failures eligible for pattern fallback."""
        if not error_message:
            return False

        msg = error_message.lower()
        unresponsive_indicators = [
            "429",
            "resource_exhausted",
            "rate limit",
            "too many requests",
            "quota",
            "timeout",
            "timed out",
            "provider unavailable",
            "service unavailable",
            "connection refused",
            "failed to establish a new connection",
            "max retries exceeded",
            "name resolution",
            "network is unreachable",
        ]
        return any(token in msg for token in unresponsive_indicators)

    def _llm_failure_response(
        self, question: str, error_message: Optional[str]
    ) -> Dict[str, Any]:
        """Return explicit LLM failure without silently degrading to pattern SQL."""
        logger.warning(
            "LLM API responded but SQL generation failed; not using pattern fallback. Query: %s",
            question,
        )
        return {
            "blocked": True,
            "error": (
                "LLM could not generate a valid SQL query for this request. "
                "Please refine the query and try again."
                + (f" Details: {error_message}" if error_message else "")
            ),
            "generation_method": "llm",
            "confidence": 0,
            "tables_used": [],
            "tokens_used": 0,
        }

    def _pattern_matching_fallback(self, question: str) -> Dict[str, Any]:
        """
        Use pattern-matching as fallback

        Args:
            question: Natural language question

        Returns:
            Result dictionary with SQL and metadata
        """
        logger.info("🔄 Using pattern-matching approach")

        question_lower = question.lower()

        # Generate query using pattern matching
        result = self.pattern_matcher.generate_query(question, question_lower)

        # Add metadata
        sql = SQLUtils.quote_table_identifiers(result["sql_query"], self.table_names)
        result["sql_query"] = sql
        result["generation_method"] = "fallback"
        result["confidence"] = SQLUtils.calculate_pattern_confidence(question_lower)
        result["tables_used"] = SQLUtils.extract_tables_from_sql(sql)
        result["tokens_used"] = 0

        return result
