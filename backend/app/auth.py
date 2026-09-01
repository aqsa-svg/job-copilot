"""Authentication: password hashing, JWT tokens, and the current-user dependency.

Email + password accounts. Passwords are hashed with bcrypt; sessions are
stateless signed JWTs carried in the `Authorization: Bearer <token>` header.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from .config import settings
from .database import get_session
from .models import User

# auto_error=False so we can return our own 401 with a helpful message.
_bearer = HTTPBearer(auto_error=False)

# bcrypt hashes at most 72 bytes; longer input is truncated to stay within that.
_BCRYPT_MAX_BYTES = 72

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated. Please sign in.",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(pw, hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the authenticated user from the bearer token, or raise 401."""
    if creds is None or not creds.credentials:
        raise _credentials_error
    try:
        payload = jwt.decode(
            creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALG]
        )
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _credentials_error

    user = session.get(User, user_id)
    if user is None:
        raise _credentials_error
    return user
