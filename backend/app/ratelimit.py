"""Per-user rate limiting for LLM-backed endpoints.

Every LLM request spends the shared Groq quota, so we cap how many a single
account can make. Counts are stored in the database (not in memory) so the limit
holds across serverless instances and cold starts.
"""
from __future__ import annotations

from datetime import timedelta

from fastapi import Depends, HTTPException, status
from sqlalchemy import delete, func
from sqlmodel import Session, select

from .auth import get_current_user
from .config import settings
from .database import get_session
from .models import LlmUsage, User, _utcnow


def _count_since(session: Session, user_id: int, since) -> int:
    return (
        session.scalar(
            select(func.count())
            .select_from(LlmUsage)
            .where(LlmUsage.user_id == user_id, LlmUsage.created_at >= since)
        )
        or 0
    )


def rate_limit_llm(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> User:
    """Enforce the per-user LLM rate limits, then record this request.

    Returns the current user so endpoints can depend on this instead of
    get_current_user. Raises 429 when a limit is exceeded.
    """
    now = _utcnow()
    minute_ago = now - timedelta(minutes=1)
    day_ago = now - timedelta(days=1)

    # Drop this user's events outside the largest window to keep the table small.
    session.execute(
        delete(LlmUsage).where(
            LlmUsage.user_id == user.id, LlmUsage.created_at < day_ago
        )
    )
    session.commit()

    if _count_since(session, user.id, minute_ago) >= settings.RATE_LIMIT_PER_MIN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"You're going a bit fast (max {settings.RATE_LIMIT_PER_MIN} "
                "requests/minute). Please wait a moment and try again."
            ),
            headers={"Retry-After": "60"},
        )
    if _count_since(session, user.id, day_ago) >= settings.RATE_LIMIT_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Daily limit reached ({settings.RATE_LIMIT_PER_DAY} AI requests/day). "
                "This keeps the shared free quota fair - try again tomorrow."
            ),
        )

    session.add(LlmUsage(user_id=user.id, created_at=now))
    session.commit()
    return user
