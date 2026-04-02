"""
Configuration for NL-to-SQL processing
"""


class NLToSQLConfig:
    """Configuration constants for NL-to-SQL conversion"""

    # Confidence score thresholds
    HIGH_CONFIDENCE_THRESHOLD = 75
    MEDIUM_CONFIDENCE_THRESHOLD = 65
    LOW_CONFIDENCE_THRESHOLD = 50

    # Default limits
    DEFAULT_LIMIT = 10
    MAX_LIMIT = 100

    # Pattern matching confidence scores
    PATTERN_HIGH_CONFIDENCE = 75
    PATTERN_MEDIUM_CONFIDENCE = 65
    PATTERN_LOW_CONFIDENCE = 50

    # High confidence pattern keywords
    HIGH_CONFIDENCE_KEYWORDS = ["count", "how many", "total", "sum", "average", "avg"]

    # Medium confidence pattern keywords
    MEDIUM_CONFIDENCE_KEYWORDS = [
        "top",
        "list",
        "show",
        "all",
        "highest",
        "most",
        "best",
    ]

    # Analytical intent routing keywords
    ANALYTICAL_INTENT_KEYWORDS = [
        "top",
        "revenue",
        "total",
        "average",
        "avg",
        "rank",
        "ranking",
        "group",
        "grouped",
        "per",
        "compare",
        "most",
        "least",
        "between",
        "join",
        "by",
    ]

    ANALYTICAL_COMPLEXITY_THRESHOLD = 2

    # Entity keyword mappings
    ENTITY_KEYWORDS = {
        "customers": ["customer", "client", "user"],
        "products": ["product", "item"],
        "orders": ["order", "purchase", "sale"],
        "employees": ["employee", "staff", "worker"],
        "patients": ["patient"],
        "doctors": ["doctor", "physician"],
        "appointments": ["appointment", "schedule", "booking"],
    }
