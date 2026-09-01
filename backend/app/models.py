"""SQLModel database models.

Design note: the profile's nested lists (skills, experience, projects,
education, links) are stored as JSON columns on a single Profile row per user.
A one-row-per-user upsert is far simpler and cleaner than syncing child tables.
Every user-owned row carries a `user_id` so accounts are fully isolated.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """A registered account. Owns exactly one profile plus resumes/questions."""

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=_utcnow)


class Profile(SQLModel, table=True):
    """A user's master profile — the single source of truth for their data."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True, foreign_key="user.id")

    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""

    # links: list[{"label": str, "url": str}]
    links: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # skills: list[{"category": str, "items": list[str]}]
    skills: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # experience: list[{company, role, location, start, end, current, bullets[]}]
    experience: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # projects: list[{name, link, tech[], bullets[]}]
    projects: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    # education: list[{school, degree, field, start, end, details}]
    education: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))


class LlmUsage(SQLModel, table=True):
    """One row per LLM-backed request, used for per-user rate limiting.

    Rows older than the largest rate-limit window are pruned opportunistically,
    so the table stays small.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    created_at: datetime = Field(default_factory=_utcnow, index=True)


class Question(SQLModel, table=True):
    """A screening question with a framing tip and a sample answer (per user)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    category: str = "General"
    question: str
    framing_tip: str = ""
    sample_answer: str = ""


class SavedResume(SQLModel, table=True):
    """A saved resume version — a base generation or a job-tailored copy."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    label: str = "Untitled resume"
    kind: str = "base"  # "base" | "tailored"

    # The full normalized resume object.
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    # Tailoring metadata (empty for base resumes).
    job_description: str = ""
    match_score: Optional[int] = None
    match_summary: str = ""
    gaps: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    changes: list[str] = Field(default_factory=list, sa_column=Column(JSON))

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
