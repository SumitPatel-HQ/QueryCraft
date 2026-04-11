"""
Main LLM SQL generator
Orchestrates prompt generation, API calls, and validation
"""

import logging
from typing import Dict, Any, Optional

from .config import LLMConfig
from .prompts import PromptTemplates
from .validators import SQLValidator, ConfidenceScorer
from .provider_factory import get_llm_provider_chain

logger = logging.getLogger(__name__)


class LLMSQLGenerator:
    """Main class for LLM-based SQL generation"""

    def __init__(self, model_name: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize LLM SQL generator

        Args:
            model_name: Gemini model to use (default from config)
            timeout: API timeout in seconds (default from config)
        """
        self.config = LLMConfig
        self.prompts = PromptTemplates()
        self.validator = SQLValidator()
        self.confidence_scorer = ConfidenceScorer()
        self.provider_chain = get_llm_provider_chain(
            model_name=model_name, timeout=timeout
        )
        self.provider_name, self.provider = self.provider_chain[0]
        self.client = self.provider

        logger.info("LLMSQLGenerator initialized")

    @staticmethod
    def _is_retryable_provider_error(error: Optional[str]) -> bool:
        if not error:
            return False

        msg = str(error).lower()
        retryable_markers = [
            "429",
            "resource_exhausted",
            "rate limit",
            "quota",
            "too many requests",
            "provider unavailable",
            "service unavailable",
            "timeout",
            "timed out",
            "connection refused",
            "max retries exceeded",
            "network is unreachable",
            "name resolution",
        ]
        return any(marker in msg for marker in retryable_markers)

    def _generate_with_failover(self, prompt: str) -> Dict[str, Any]:
        last_response: Dict[str, Any] = {
            "text": None,
            "success": False,
            "error": "No provider available",
            "tokens_used": 0,
            "provider": None,
        }

        for idx, (provider_name, provider) in enumerate(self.provider_chain):
            response = provider.generate(prompt)
            response["provider"] = provider_name

            if response.get("success"):
                if idx > 0:
                    logger.info("Provider failover succeeded with '%s'", provider_name)
                return response

            last_response = response
            error = response.get("error")
            retryable = self._is_retryable_provider_error(error)

            if retryable and idx < len(self.provider_chain) - 1:
                next_provider = self.provider_chain[idx + 1][0]
                logger.warning(
                    "Provider '%s' failed with retryable error (%s). Retrying with '%s'.",
                    provider_name,
                    error,
                    next_provider,
                )
                continue

            if not retryable:
                logger.warning(
                    "Provider '%s' failed with non-retryable error: %s",
                    provider_name,
                    error,
                )
            break

        return last_response

    def generate_sql_with_llm(
        self, natural_language_query: str, schema_info: str, db_type: str = "sqlite"
    ) -> Dict[str, Any]:
        """
        Generate SQL from natural language using LLM

        Args:
            natural_language_query: User's question in natural language
            schema_info: Database schema information
            db_type: Type of database (sqlite, postgresql, etc.)

        Returns:
            Dictionary containing:
                - sql_query: Generated SQL query
                - confidence_score: Confidence in the query (0-1)
                - explanation: Explanation of what the query does
                - error: Error message if failed
        """
        try:
            logger.info(f"Generating SQL for query: {natural_language_query[:50]}...")

            # Generate prompt
            prompt = self.prompts.get_sql_generation_prompt(
                natural_language_query, schema_info, db_type
            )

            # Call provider API with runtime failover for retryable capacity/network errors
            response = self._generate_with_failover(prompt)

            if not response["success"]:
                return {
                    "sql_query": None,
                    "confidence_score": 0.0,
                    "explanation": "Failed to generate SQL",
                    "error": response["error"],
                    "provider": response.get("provider"),
                }

            # Clean and validate SQL
            raw_sql = response["text"]
            print(f"\n{'=' * 80}")
            print(f"RAW LLM RESPONSE:")
            print(f"{'=' * 80}")
            print(raw_sql)
            print(f"{'=' * 80}\n")

            logger.info(f"📄 Raw LLM response ({len(raw_sql)} chars)")

            sql_query = self.validator.clean_sql_response(raw_sql)

            print(f"\n{'=' * 80}")
            print(f"CLEANED SQL:")
            print(f"{'=' * 80}")
            print(sql_query)
            print(f"{'=' * 80}\n")

            logger.info(f"🧹 Cleaned SQL: {sql_query}")

            # Validate SQL syntax
            validation_result = self.validator.validate_sql_syntax(sql_query)
            if not validation_result["valid"]:
                logger.warning(f"SQL validation failed: {validation_result['error']}")
                return {
                    "sql_query": sql_query,
                    "confidence_score": 0.0,
                    "explanation": "SQL validation failed",
                    "error": validation_result["error"],
                }

            # Extract tables and check against dangerous operations
            tables = self.validator.extract_tables_from_sql(sql_query)
            logger.info(f"Extracted tables: {tables}")

            # Calculate confidence score
            confidence_score = self.confidence_scorer.calculate_confidence(
                natural_language_query, sql_query, schema_info
            )

            logger.info(
                f"✅ SQL generated successfully. Confidence: {confidence_score:.2f}"
            )

            # Generate explanation
            explanation_result = self.generate_query_explanation(
                natural_language_query, sql_query, tables
            )

            return {
                "sql_query": sql_query,
                "confidence_score": confidence_score,
                "explanation": explanation_result["explanation"],
                "error": None,
                "tokens_used": response["tokens_used"],
                "tables_used": tables,
                "provider": response.get("provider"),
            }

        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}", exc_info=True)
            return {
                "sql_query": None,
                "confidence_score": 0.0,
                "explanation": "An error occurred during SQL generation",
                "error": str(e),
            }

    def generate_query_explanation(
        self, natural_language_query: str, sql_query: str, tables_used: list
    ) -> Dict[str, Any]:
        """
        Generate explanation of what the SQL query does

        Args:
            natural_language_query: Original user question
            sql_query: Generated SQL query
            tables_used: List of tables used in query

        Returns:
            Dictionary containing:
                - explanation: Human-readable explanation
                - error: Error message if failed
        """
        try:
            logger.info("Generating query explanation...")

            # Generate explanation prompt
            prompt = self.prompts.get_explanation_prompt(
                natural_language_query, sql_query, tables_used
            )

            # Call provider API with failover protection (same as SQL generation)
            response = self._generate_with_failover(prompt)

            if not response["success"]:
                # Use fallback explanation if API call fails
                fallback = self.prompts.get_fallback_explanation(sql_query, tables_used)
                return {"explanation": fallback, "error": response["error"]}

            explanation_text = response.get("text")
            if not explanation_text:
                # Use fallback if response text is empty/None despite success
                fallback = self.prompts.get_fallback_explanation(sql_query, tables_used)
                logger.warning("Explanation API returned empty text, using fallback")
                return {"explanation": fallback, "error": None}

            explanation = explanation_text.strip()
            logger.info("✅ Explanation generated successfully")

            return {"explanation": explanation, "error": None}

        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            # Return fallback explanation
            fallback = self.prompts.get_fallback_explanation(sql_query, tables_used)
            return {"explanation": fallback, "error": str(e)}
