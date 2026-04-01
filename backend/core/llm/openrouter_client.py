"""
OpenRouter API client wrapper
Handles all interactions with OpenRouter API (unified gateway to multiple LLM providers)
"""

import logging
from typing import Dict, Any, Optional
import os
import requests

from .config import LLMConfig

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Wrapper for OpenRouter API interactions"""

    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, model_name: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize OpenRouter API client

        Args:
            model_name: OpenRouter model to use (default from config)
            timeout: API timeout in seconds (default from config)
        """
        self.api_key = LLMConfig.get_api_key("openrouter")

        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY not found in environment variables. "
                "Please set it in your .env file or environment."
            )

        self.model_name = LLMConfig.get_model_name("openrouter", model_name)
        self.timeout = LLMConfig.get_timeout(timeout)

        logger.info(f"Initialized OpenRouter client with model: {self.model_name}")

    def generate(self, prompt: str) -> Dict[str, Any]:
        """
        Generate content using OpenRouter API

        Args:
            prompt: The prompt to send to OpenRouter

        Returns:
            Dictionary containing:
                - text: Generated text
                - success: Boolean indicating success
                - error: Error message if failed
                - tokens_used: Estimated token count
        """
        try:
            logger.info(f"🤖 CALLING OPENROUTER API - Model: {self.model_name}")
            logger.info(f"⚡ SENDING REQUEST TO OPENROUTER...")

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://querycraft.local",
                "X-Title": "QueryCraft",
            }

            payload = {
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}],
            }

            response = requests.post(
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )

            response.raise_for_status()

            result = response.json()

            generated_text = result["choices"][0]["message"]["content"].strip()

            logger.info(f"✅ RECEIVED RESPONSE FROM OPENROUTER")
            logger.info(f"📝 Generated text length: {len(generated_text)} characters")

            tokens_used = result.get("usage", {}).get(
                "total_tokens", self._estimate_tokens(prompt, generated_text)
            )

            logger.info(f"Successfully generated content. Tokens: {tokens_used}")

            return {
                "text": generated_text,
                "success": True,
                "error": None,
                "tokens_used": tokens_used,
            }

        except requests.exceptions.Timeout:
            logger.error(f"OpenRouter API timeout after {self.timeout}s")
            return {
                "text": None,
                "success": False,
                "error": f"Request timeout after {self.timeout} seconds",
                "tokens_used": 0,
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenRouter API request error: {str(e)}")
            return {"text": None, "success": False, "error": str(e), "tokens_used": 0}
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            return {"text": None, "success": False, "error": str(e), "tokens_used": 0}

    @staticmethod
    def _estimate_tokens(prompt: str, response: str) -> int:
        """
        Estimate token count (rough approximation)

        Args:
            prompt: Input prompt
            response: Generated response

        Returns:
            Estimated token count
        """
        prompt_words = len(prompt.split())
        response_words = len(response.split())
        return int((prompt_words + response_words) * 0.75)
