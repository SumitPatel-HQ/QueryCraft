"""Firebase JWT authentication middleware"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth

from api.config.settings import settings

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme (optional)
bearer_scheme = HTTPBearer(auto_error=False)

# Initialize Firebase Admin SDK
_firebase_initialized = False


def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    global _firebase_initialized
    if not _firebase_initialized:
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
            raise


# Initialize on module load
try:
    if settings.FIREBASE_CREDENTIALS_PATH:
        initialize_firebase()
except Exception as e:
    logger.warning(f"Firebase initialization skipped: {str(e)}")


def verify_firebase_token(token: str) -> dict:
    """
    Verify Firebase ID token using Firebase Admin SDK.

    Args:
        token: Firebase ID token string

    Returns:
        Decoded token payload containing uid, email, etc.

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Verify the ID token with small clock skew tolerance.
        # This avoids intermittent "Token used too early" errors when
        # local machine time and Firebase time differ by a few seconds.
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=10)

        # Return the decoded token with uid
        return decoded_token

    except auth.ExpiredIdTokenError:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency for REQUIRED authentication.
    Raises 401 if no valid token is provided.

    Usage:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            user_id = user["uid"]
            ...

    Returns:
        Decoded JWT payload with user information (uid, email, etc.)
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    payload = verify_firebase_token(credentials.credentials)
    logger.info(f"Authenticated user: {payload.get('uid')}")
    return payload


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """
    FastAPI dependency for OPTIONAL authentication.
    Returns None if no token provided or token is invalid.

    Usage:
        @router.get("/public-or-private")
        async def flexible_route(user: Optional[dict] = Depends(get_optional_user)):
            if user:
                user_id = user["uid"]
                # Return personalized data
            else:
                # Return public data

    Returns:
        Decoded JWT payload if valid token provided, None otherwise
    """
    if not credentials:
        return None

    try:
        payload = verify_firebase_token(credentials.credentials)
        logger.info(f"Optional auth - authenticated user: {payload.get('uid')}")
        return payload
    except HTTPException:
        # Token invalid - return None instead of raising error
        logger.info("Optional auth - invalid/expired token, returning None")
        return None
