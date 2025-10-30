"""
Main NL-to-SQL processor
Orchestrates LLM and pattern-matching approaches
"""
import logging
from typing import Dict, List, Any, Optional

from .config import NLToSQLConfig
from .utils import SQLUtils
from .pattern_matcher import PatternMatchingEngine

logger = logging.getLogger(__name__)


class NLToSQLProcessor:
    """
    Main processor for converting natural language to SQL
    Uses hybrid approach: LLM first, then pattern-matching fallback
    """
    
    def __init__(self, schema: Dict[str, List[Dict]], introspector=None):
        """
        Initialize NL-to-SQL processor
        
        Args:
            schema: Database schema dictionary
            introspector: Schema introspector instance
        """
        self.schema = schema
        self.table_names = list(schema.keys())
        self.introspector = introspector
        self.llm_generator = None
        
        # Initialize pattern matching engine
        self.pattern_matcher = PatternMatchingEngine(self.table_names)
        
        # Try to initialize LLM generator
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize LLM generator if available"""
        try:
            from llm import LLMSQLGenerator  # type: ignore
            self.llm_generator = LLMSQLGenerator()
            logger.info("✅ LLM SQL Generator initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ LLM Generator not available: {e}. Will use pattern-matching only.")
    
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
        # Try LLM approach first
        if self.llm_generator and self.introspector:
            llm_result = self._try_llm_generation(question)
            if llm_result:
                return llm_result
        
        # Fall back to pattern-matching
        return self._pattern_matching_fallback(question)
    
    def _try_llm_generation(self, question: str) -> Optional[Dict[str, Any]]:
        """
        Attempt LLM-based SQL generation
        
        Args:
            question: Natural language question
            
        Returns:
            Result dictionary if successful, None if failed
        """
        try:
            logger.info(f"🤖 Attempting LLM generation for: {question}")
            
            # Get schema context for LLM
            schema_context = self.introspector.format_schema_for_llm()
            
            # Generate SQL with LLM
            result = self.llm_generator.generate_sql_with_llm(question, schema_context)
            
            # Check if LLM generation was successful
            if result.get("sql_query") and not result.get("error"):
                logger.info(f"✅ LLM generation successful. Confidence: {result['confidence_score']:.2f}")
                
                return {
                    "sql_query": result["sql_query"],
                    "explanation": result["explanation"],
                    "generation_method": "llm",
                    "confidence": int(result["confidence_score"] * 100),  # Convert to 0-100
                    "tables_used": result["tables_used"],
                    "tokens_used": result.get("tokens_used", 0)
                }
            else:
                logger.warning(f"⚠️ LLM generation failed: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error in LLM generation: {str(e)}")
            return None
    
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
        sql = result["sql_query"]
        result["generation_method"] = "fallback"
        result["confidence"] = SQLUtils.calculate_pattern_confidence(question_lower)
        result["tables_used"] = SQLUtils.extract_tables_from_sql(sql)
        result["tokens_used"] = 0
        
        return result
