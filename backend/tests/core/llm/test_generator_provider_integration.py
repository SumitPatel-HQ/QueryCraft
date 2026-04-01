class _FakeProvider:
    provider_name = "gemini"

    def __init__(self):
        self.prompts = []

    def generate(self, prompt: str):
        self.prompts.append(prompt)
        if "Explain" in prompt or "explain" in prompt:
            text = "This query returns all users."
        else:
            text = "SELECT * FROM users;"
        return {
            "text": text,
            "success": True,
            "error": None,
            "tokens_used": 21,
        }


def test_generator_uses_factory_provider(monkeypatch):
    from backend.core.llm import generator as generator_module
    from backend.core.llm.generator import LLMSQLGenerator

    fake_provider = _FakeProvider()
    monkeypatch.setattr(generator_module, "get_llm_provider", lambda **_: fake_provider)

    generator = LLMSQLGenerator()
    result = generator.generate_sql_with_llm(
        "show all users", "Table users(id INTEGER, name TEXT)", "sqlite"
    )

    assert result["sql_query"].lower().startswith("select")
    assert result["tokens_used"] == 21
    assert len(fake_provider.prompts) >= 1


def test_gemini_default_provider_parity(monkeypatch):
    from backend.core.llm import generator as generator_module
    from backend.core.llm.generator import LLMSQLGenerator

    fake_provider = _FakeProvider()
    monkeypatch.setenv("LLM_PROVIDER", "")
    monkeypatch.setenv("LLM_PROVIDER_ORDER", "invalid,gemini")
    monkeypatch.setattr(generator_module, "get_llm_provider", lambda **_: fake_provider)

    generator = LLMSQLGenerator()

    assert getattr(generator.provider, "provider_name", None) == "gemini"
