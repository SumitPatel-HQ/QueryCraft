import logging
from typing import Callable, Dict, Optional

from .config import LLMConfig
from .gemini_client import GeminiClient
from .provider_base import LLMProvider

logger = logging.getLogger(__name__)


ProviderFactory = Callable[..., LLMProvider]
PROVIDER_REGISTRY: Dict[str, Dict[str, Optional[str] | ProviderFactory]] = {}


def register_provider(
    provider_name: str,
    factory: ProviderFactory,
    required_api_key: Optional[str] = None,
) -> None:
    PROVIDER_REGISTRY[provider_name.lower()] = {
        "factory": factory,
        "required_api_key": required_api_key,
    }


def _bootstrap_registry() -> None:
    if "gemini" not in PROVIDER_REGISTRY:
        register_provider(
            "gemini", lambda **kwargs: GeminiClient(**kwargs), "GEMINI_API_KEY"
        )


def _provider_available(provider_name: str, required_api_key: Optional[str]) -> bool:
    if not required_api_key:
        return True
    value = LLMConfig.get_api_key(provider_name)
    return bool(value)


def get_llm_provider(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    timeout: Optional[int] = None,
) -> LLMProvider:
    _bootstrap_registry()

    requested = (
        (provider_name or LLMConfig.get_default_provider() or "").strip().lower()
    )
    order = LLMConfig.get_provider_order()
    fallback_order = [requested] if requested else []
    fallback_order.extend([name for name in order if name not in fallback_order])
    if "gemini" not in fallback_order:
        fallback_order.append("gemini")

    skipped: list[str] = []

    for candidate in fallback_order:
        entry = PROVIDER_REGISTRY.get(candidate)
        if not entry:
            skipped.append(candidate)
            logger.warning(
                "Unknown provider '%s' in selection chain; skipping", candidate
            )
            continue

        required_api_key = entry.get("required_api_key")
        if isinstance(required_api_key, str) and not _provider_available(
            candidate, required_api_key
        ):
            skipped.append(candidate)
            logger.info(
                "Skipping provider '%s' due to missing required key '%s'",
                candidate,
                required_api_key,
            )
            continue

        factory = entry["factory"]
        provider = factory(model_name=model_name, timeout=timeout)
        logger.info(
            "Selected LLM provider '%s' (chain=%s)",
            candidate,
            " -> ".join(fallback_order),
        )
        if skipped:
            logger.info(
                "Provider fallback chain applied: %s",
                " -> ".join(skipped + [candidate]),
            )
        return provider

    logger.warning("No configured provider available. Falling back to Gemini.")
    gemini_factory = PROVIDER_REGISTRY["gemini"]["factory"]
    provider = gemini_factory(model_name=model_name, timeout=timeout)
    logger.info(
        "Provider fallback chain applied: %s -> gemini",
        " -> ".join(skipped) if skipped else "none",
    )
    return provider
