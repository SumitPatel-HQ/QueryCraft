"""Application configuration settings"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings and configuration"""
    
    # API Configuration
    APP_TITLE: str = "QueryCraft API"
    APP_DESCRIPTION: str = "Natural Language to SQL Platform API"
    APP_VERSION: str = "1.0.0"
    
    # CORS Configuration
    CORS_ORIGINS: list = ["http://localhost:3000"]
    
    # Paths
    BACKEND_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    PARENT_DIR: str = os.path.dirname(BACKEND_DIR)
    CORE_AI_PATH: str = os.path.join(PARENT_DIR, 'core_ai_services')
    
    @classmethod
    def setup_paths(cls):
        """Add core_ai_services to Python path"""
        import sys
        if os.path.exists(cls.CORE_AI_PATH) and cls.CORE_AI_PATH not in sys.path:
            sys.path.insert(0, cls.CORE_AI_PATH)


# Global settings instance
settings = Settings()
