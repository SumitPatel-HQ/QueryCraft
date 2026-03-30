"""Clerk JWT authentication middleware"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient

from api.config.settings import settings

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme (optional)
bearer_scheme = HTTPBearer(auto_error=False)


def verify_clerk_token(token: str) -> dict:
    """
    Verify Clerk JWT token using JWKS endpoint.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload containing user_id (sub), email, etc.

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Initialize JWKS client with Clerk's public keys
        jwks_client = PyJWKClient(settings.CLERK_JWKS_URL)

        # Get the signing key from the token header
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_iss": True,
            },
        )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
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
            user_id = user["sub"]
            ...

    Returns:
        Decoded JWT payload with user information
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    payload = verify_clerk_token(credentials.credentials)
    logger.info(f"Authenticated user: {payload.get('sub')}")
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
                user_id = user["sub"]
                # Return personalized data
            else:
                # Return public data

    Returns:
        Decoded JWT payload if valid token provided, None otherwise
    """
    if not credentials:
        return None

    try:
        payload = verify_clerk_token(credentials.credentials)
        logger.info(f"Optional auth - authenticated user: {payload.get('sub')}")
        return payload
    except HTTPException:
        # Token invalid - return None instead of raising error
        logger.info("Optional auth - invalid/expired token, returning None")
        return None
