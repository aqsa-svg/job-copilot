"""Database engine and session helpers (SQLModel).

Uses SQLite locally and a hosted Postgres (via DATABASE_URL) in production.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

_url = settings.sqlalchemy_url
# check_same_thread=False lets FastAPI use the SQLite connection across threads.
connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}
# pool_pre_ping avoids stale connections on serverless/hosted Postgres.
engine = create_engine(_url, echo=False, pool_pre_ping=True, connect_args=connect_args)


def init_db() -> None:
    """Create tables. Import models first so they register on SQLModel.metadata."""
    from . import models  # noqa: F401  (ensures models are registered)

    SQLModel.metadata.create_all(engine)


def reset_db() -> None:
    """Drop and recreate all app tables. Destructive — used only for a one-off
    schema reset, guarded by an explicit env flag at cold start (see api/index.py)."""
    from . import models  # noqa: F401  (ensures models are registered)

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """FastAPI dependency that yields a database session."""
    with Session(engine) as session:
        yield session
