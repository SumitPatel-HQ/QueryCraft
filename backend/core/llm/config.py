"""
Configuration for LLM services
Handles API keys, model selection, and environment settings
"""

import os
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class LLMConfig:
    """Configuration manager for LLM services"""

    # Provider Selection
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")
    LLM_PROVIDER_ORDER: str = os.getenv("LLM_PROVIDER_ORDER", "gemini")

    # Gemini API Configuration
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # OpenRouter Configuration
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    # Timeout and Performance
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "10"))
    MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "3"))

    # SQL Generation Settings
    BASE_CONFIDENCE_SCORE: int = 85
    MIN_CONFIDENCE_SCORE: int = 0
    MAX_CONFIDENCE_SCORE: int = 100

    # Validation Settings
    ALLOWED_SQL_OPERATIONS: list = ["select"]
    DANGEROUS_KEYWORDS: list = [
        "drop",
        "delete",
        "truncate",
        "alter",
        "create",
        "insert",
        "update",
        "exec",
        "execute",
        "grant",
        "revoke",
    ]

    @classmethod
    def validate(cls) -> None:
        """
        Validate that required configuration is present

        Raises:
            ValueError: If GEMINI_API_KEY is not set
        """
        if not cls.get_api_key("gemini"):
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please set it in your .env file or environment."
            )

    @classmethod
    def get_default_provider(cls) -> str:
        return os.getenv("LLM_PROVIDER", "").strip().lower()

    @classmethod
    def get_provider_order(cls) -> List[str]:
        raw_order = os.getenv("LLM_PROVIDER_ORDER", cls.LLM_PROVIDER_ORDER)
        providers = [
            item.strip().lower() for item in raw_order.split(",") if item.strip()
        ]
        return providers or ["gemini"]

    @classmethod
    def get_api_key(cls, provider_name: str) -> str:
        key_map = {
            "gemini": "GEMINI_API_KEY",
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
        }
        key_var = key_map.get(provider_name.lower(), f"{provider_name.upper()}_API_KEY")
        return os.getenv(key_var, "")

    @classmethod
    def get_model_name(
        cls, provider: str = "gemini", custom_model: Optional[str] = None
    ) -> str:
        """
        Get the model name to use for a specific provider

        Args:
            provider: Provider name (gemini, openai, anthropic, openrouter)
            custom_model: Optional custom model override

        Returns:
            Model name to use
        """
        if custom_model:
            return custom_model

        if not provider:
            provider = "gemini"

        model_env_map = {
            "gemini": "GEMINI_MODEL",
            "openai": "OPENAI_MODEL",
            "anthropic": "ANTHROPIC_MODEL",
            "openrouter": "OPENROUTER_MODEL",
        }
        env_var = model_env_map.get(provider.lower(), "GEMINI_MODEL")
        return os.getenv(env_var, cls.GEMINI_MODEL)

    @classmethod
    def get_timeout(cls, custom_timeout: Optional[int] = None) -> int:
        """
        Get the timeout to use

        Args:
            custom_timeout: Optional custom timeout override

        Returns:
            Timeout in seconds
        """
        return custom_timeout or cls.LLM_TIMEOUT
