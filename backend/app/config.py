"""Application configuration, loaded from environment variables."""
from __future__ import annotations

import os

from dotenv import load_dotenv

# Load .env from the backend directory (if present) before reading values.
load_dotenv()


class Settings:
    """Central place for runtime configuration."""

    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./jobcopilot.db")

    # Secret used to sign user JWT access tokens. MUST be set to a strong random
    # value in production (e.g. `openssl rand -hex 32`). The default is for local
    # development only and is intentionally obvious.
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-insecure-change-me")
    JWT_ALG: str = "HS256"
    # How long a login stays valid before the user must sign in again.
    JWT_EXPIRE_DAYS: int = int(os.getenv("JWT_EXPIRE_DAYS", "30"))

    # Per-user rate limits on LLM-backed requests, to protect the shared Groq
    # quota. A short burst cap plus a daily cap.
    RATE_LIMIT_PER_MIN: int = int(os.getenv("RATE_LIMIT_PER_MIN", "8"))
    RATE_LIMIT_PER_DAY: int = int(os.getenv("RATE_LIMIT_PER_DAY", "60"))

    # CORS: comma-separated origins.
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]

    @property
    def groq_enabled(self) -> bool:
        return bool(self.GROQ_API_KEY)

    @property
    def sqlalchemy_url(self) -> str:
        """Normalize a Postgres URL (e.g. Neon) to the psycopg v3 driver.

        Managed Postgres providers hand out `postgres://` / `postgresql://`
        URLs; SQLAlchemy would default those to psycopg2. We ship psycopg v3,
        so rewrite the scheme. SQLite and other URLs pass through unchanged.
        """
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url


settings = Settings()
