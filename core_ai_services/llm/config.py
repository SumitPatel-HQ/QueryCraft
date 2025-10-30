"""
Configuration for LLM services
Handles API keys, model selection, and environment settings
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class LLMConfig:
    """Configuration manager for LLM services"""
    
    # Gemini API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
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
        "drop", "delete", "truncate", "alter", 
        "create", "insert", "update", "exec",
        "execute", "grant", "revoke"
    ]
    
    @classmethod
    def validate(cls) -> None:
        """
        Validate that required configuration is present
        
        Raises:
            ValueError: If GEMINI_API_KEY is not set
        """
        if not cls.GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please set it in your .env file or environment."
            )
    
    @classmethod
    def get_model_name(cls, custom_model: Optional[str] = None) -> str:
        """
        Get the model name to use
        
        Args:
            custom_model: Optional custom model override
            
        Returns:
            Model name to use
        """
        return custom_model or cls.GEMINI_MODEL
    
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
