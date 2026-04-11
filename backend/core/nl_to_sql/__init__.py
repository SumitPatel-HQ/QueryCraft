"""
NL-to-SQL package
Provides modular natural language to SQL conversion
"""

from .processor import NLToSQLProcessor
from .config import NLToSQLConfig
from .utils import SQLUtils, TableIdentifier
from .pattern_matcher import PatternMatchingEngine
from .intent_decomposer import decompose_question
from .coverage_validator import validate_intent_coverage

__all__ = [
    "NLToSQLProcessor",
    "NLToSQLConfig",
    "SQLUtils",
    "TableIdentifier",
    "PatternMatchingEngine",
    "decompose_question",
    "validate_intent_coverage",
]
