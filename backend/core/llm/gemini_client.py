"""
Gemini API client wrapper
Handles all interactions with Google Gemini API
"""
import logging
from typing import Dict, Any, Optional
from google import genai

from .config import LLMConfig

logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper for Google Gemini API interactions"""
    
    def __init__(self, model_name: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize Gemini API client
        
        Args:
            model_name: Gemini model to use (default from config)
            timeout: API timeout in seconds (default from config)
        """
        # Validate configuration
        LLMConfig.validate()
        
        # Initialize Gemini API client
        self.client = genai.Client(api_key=LLMConfig.GEMINI_API_KEY)
        
        # Set model and timeout
        self.model_name = LLMConfig.get_model_name(model_name)
        self.timeout = LLMConfig.get_timeout(timeout)
        
        logger.info(f"Initialized Gemini client with model: {self.model_name}")
    
    def generate_content(self, prompt: str) -> Dict[str, Any]:
        """
        Generate content using Gemini API
        
        Args:
            prompt: The prompt to send to Gemini
            
        Returns:
            Dictionary containing:
                - text: Generated text
                - success: Boolean indicating success
                - error: Error message if failed
                - tokens_used: Estimated token count
        """
        try:
            logger.info(f"🤖 CALLING GEMINI API - Model: {self.model_name}")
            logger.info(f"⚡ SENDING REQUEST TO GEMINI...")
            
            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            logger.info(f"✅ RECEIVED RESPONSE FROM GEMINI")
            
            # Extract text
            generated_text = response.text.strip()
            
            # Log the actual response for debugging
            logger.info(f"📝 Generated text length: {len(generated_text)} characters")
            logger.debug(f"Full response: {generated_text}")
            
            # Estimate tokens (Gemini free tier doesn't provide exact count)
            tokens_used = self._estimate_tokens(prompt, generated_text)
            
            logger.info(f"Successfully generated content. Estimated tokens: {tokens_used}")
            
            return {
                "text": generated_text,
                "success": True,
                "error": None,
                "tokens_used": tokens_used
            }
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return {
                "text": None,
                "success": False,
                "error": str(e),
                "tokens_used": 0
            }
    
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
        # Rough estimation: ~0.75 tokens per word
        prompt_words = len(prompt.split())
        response_words = len(response.split())
        return int((prompt_words + response_words) * 0.75)
