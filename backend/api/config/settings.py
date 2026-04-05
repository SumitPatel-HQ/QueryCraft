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
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Firebase authentication
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    # Paths
    BASE_DIR: str = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    CORE_PATH: str = os.path.join(BASE_DIR, "core")
    UPLOADS_DIR: str = os.path.join(BASE_DIR, "uploads")

    @classmethod
    def setup_paths(cls):
        """Add core and database packages to Python path for older entry points"""
        import sys

        if os.path.exists(cls.CORE_PATH) and cls.CORE_PATH not in sys.path:
            sys.path.insert(0, cls.CORE_PATH)
        if os.path.exists(cls.BASE_DIR) and cls.BASE_DIR not in sys.path:
            sys.path.insert(0, cls.BASE_DIR)


# Global settings instance
settings = Settings()
