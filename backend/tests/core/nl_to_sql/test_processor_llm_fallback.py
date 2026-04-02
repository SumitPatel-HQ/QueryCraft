def test_processor_fallback_when_provider_fails(monkeypatch):
    from core.nl_to_sql.processor import NLToSQLProcessor

    class _Introspector:
        @staticmethod
        def format_schema_for_llm():
            return "Table users(id INTEGER, name TEXT)"

    class _FailingGenerator:
        @staticmethod
        def generate_sql_with_llm(question, schema):
            return {
                "sql_query": None,
                "confidence_score": 0.0,
                "explanation": "llm failed",
                "error": "provider unavailable",
                "tokens_used": 0,
                "tables_used": [],
            }

    processor = NLToSQLProcessor(schema={"users": []}, introspector=_Introspector())
    processor.llm_generator = _FailingGenerator()
    monkeypatch.setattr(
        processor.pattern_matcher,
        "generate_query",
        lambda *_: {
            "sql_query": "SELECT * FROM users;",
            "explanation": "fallback used",
        },
    )

    result = processor.process_query("show all users")

    assert result["generation_method"] == "fallback"
    assert result["sql_query"].lower().startswith("select")
    assert result["tokens_used"] == 0
    assert set(result.keys()) == {
        "sql_query",
        "explanation",
        "generation_method",
        "confidence",
        "tables_used",
        "tokens_used",
    }


def test_processor_fallback_on_rate_limit_error(monkeypatch):
    from core.nl_to_sql.processor import NLToSQLProcessor

    class _FailingGenerator:
        @staticmethod
        def generate_sql_with_llm(question, schema):
            return {
                "sql_query": None,
                "confidence_score": 0.0,
                "explanation": "rate limited",
                "error": "429 RESOURCE_EXHAUSTED",
                "tokens_used": 0,
            }

    processor = NLToSQLProcessor(
        schema={"users": [{"name": "id", "type": "INTEGER"}]}, introspector=None
    )
    processor.llm_generator = _FailingGenerator()
    monkeypatch.setattr(
        processor.pattern_matcher,
        "generate_query",
        lambda *_: {
            "sql_query": "SELECT * FROM users;",
            "explanation": "fallback used",
        },
    )

    result = processor.process_query("top users by total revenue")

    assert result["generation_method"] == "fallback"
    assert result["sql_query"].lower().startswith("select")
