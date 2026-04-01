"""
OpenAI API client wrapper
Handles all interactions with OpenAI API
"""

import logging
from typing import Dict, Any, Optional
from openai import OpenAI

from .config import LLMConfig

logger = logging.getLogger(__name__)


class OpenAIClient:
    """Wrapper for OpenAI API interactions"""

    def __init__(self, model_name: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize OpenAI API client

        Args:
            model_name: OpenAI model to use (default from config)
            timeout: API timeout in seconds (default from config)
        """
        api_key = LLMConfig.get_api_key("openai")

        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not found in environment variables. "
                "Please set it in your .env file or environment."
            )

        self.client = OpenAI(api_key=api_key)
        self.model_name = (
            LLMConfig.get_model_name("openai", model_name) or "gpt-4o-mini"
        )
        self.timeout = LLMConfig.get_timeout(timeout)

        logger.info(f"Initialized OpenAI client with model: {self.model_name}")

    def generate(self, prompt: str) -> Dict[str, Any]:
        """
        Generate content using OpenAI API

        Args:
            prompt: The prompt to send to OpenAI

        Returns:
            Dictionary containing:
                - text: Generated text
                - success: Boolean indicating success
                - error: Error message if failed
                - tokens_used: Token count
        """
        try:
            logger.info(f"🤖 CALLING OPENAI API - Model: {self.model_name}")
            logger.info(f"⚡ SENDING REQUEST TO OPENAI...")

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                timeout=self.timeout,
            )

            generated_text = response.choices[0].message.content.strip()

            logger.info(f"✅ RECEIVED RESPONSE FROM OPENAI")
            logger.info(f"📝 Generated text length: {len(generated_text)} characters")

            tokens_used = (
                response.usage.total_tokens
                if response.usage
                else self._estimate_tokens(prompt, generated_text)
            )

            logger.info(f"Successfully generated content. Tokens: {tokens_used}")

            return {
                "text": generated_text,
                "success": True,
                "error": None,
                "tokens_used": tokens_used,
            }

        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            return {"text": None, "success": False, "error": str(e), "tokens_used": 0}

    @staticmethod
    def _estimate_tokens(prompt: str, response: str) -> int:
        prompt_words = len(prompt.split())
        response_words = len(response.split())
        return int((prompt_words + response_words) * 0.75)
