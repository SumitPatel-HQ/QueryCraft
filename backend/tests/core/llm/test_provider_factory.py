import logging


def _fake_provider(name: str):
    class _Provider:
        provider_name = name

        def generate(self, prompt: str):
            return {
                "text": f"{name}:{prompt}",
                "success": True,
                "error": None,
                "tokens_used": 7,
            }

    return _Provider()


def test_provider_exposes_generate_method(monkeypatch):
    from backend.core.llm.provider_factory import get_llm_provider

    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")

    provider = get_llm_provider()

    assert hasattr(provider, "generate")
    assert callable(provider.generate)


def test_response_envelope_parity(monkeypatch):
    from backend.core.llm import provider_factory

    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "dummy-key")

    provider_factory.register_provider(
        "openai",
        lambda **_: _fake_provider("openai"),
        required_api_key="OPENAI_API_KEY",
    )

    provider = provider_factory.get_llm_provider()
    response = provider.generate("hello")

    assert set(response.keys()) == {"text", "success", "error", "tokens_used"}


def test_invalid_provider_falls_back_to_gemini(monkeypatch, caplog):
    from backend.core.llm import provider_factory

    monkeypatch.setenv("LLM_PROVIDER", "does-not-exist")
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")

    provider_factory.register_provider(
        "gemini",
        lambda **_: _fake_provider("gemini"),
        required_api_key="GEMINI_API_KEY",
    )

    caplog.set_level(logging.INFO)
    provider = provider_factory.get_llm_provider()

    assert getattr(provider, "provider_name", None) == "gemini"
    assert "fallback" in caplog.text.lower()


def test_provider_order_drives_failover(monkeypatch):
    from backend.core.llm import provider_factory

    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.setenv("LLM_PROVIDER_ORDER", "openai,anthropic,gemini")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")

    provider_factory.register_provider(
        "openai",
        lambda **_: _fake_provider("openai"),
        required_api_key="OPENAI_API_KEY",
    )
    provider_factory.register_provider(
        "anthropic",
        lambda **_: _fake_provider("anthropic"),
        required_api_key="ANTHROPIC_API_KEY",
    )
    provider_factory.register_provider(
        "gemini",
        lambda **_: _fake_provider("gemini"),
        required_api_key="GEMINI_API_KEY",
    )

    provider = provider_factory.get_llm_provider()

    assert getattr(provider, "provider_name", None) == "gemini"


def test_missing_keys_skip_unavailable_provider(monkeypatch, caplog):
    from backend.core.llm import provider_factory

    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.setenv("LLM_PROVIDER_ORDER", "openai,gemini")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")

    provider_factory.register_provider(
        "openai",
        lambda **_: _fake_provider("openai"),
        required_api_key="OPENAI_API_KEY",
    )
    provider_factory.register_provider(
        "gemini",
        lambda **_: _fake_provider("gemini"),
        required_api_key="GEMINI_API_KEY",
    )

    caplog.set_level(logging.INFO)
    provider = provider_factory.get_llm_provider()

    assert getattr(provider, "provider_name", None) == "gemini"
    assert "openai" in caplog.text.lower()
    assert "skip" in caplog.text.lower()
