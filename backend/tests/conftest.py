"""Pytest fixtures. Uses an isolated SQLite file and never calls the real LLM."""
import os

# Point at a throwaway DB and dummy secrets BEFORE importing the app.
os.environ["DATABASE_URL"] = "sqlite:///./test_jobcopilot.db"
os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ.setdefault("JWT_SECRET", "test-secret")

import pytest
from sqlmodel import SQLModel
from starlette.testclient import TestClient

from app import models  # noqa: F401  (register tables on metadata)
from app.database import engine
from app.main import app


def register(c: TestClient, email: str, password: str = "password123") -> str:
    """Register an account and return its bearer token."""
    r = c.post("/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


@pytest.fixture()
def client():
    # Fresh schema per test; TestClient's lifespan re-creates tables.
    SQLModel.metadata.drop_all(engine)
    with TestClient(app) as c:
        # Register a default user and send its token on every request, so the
        # existing feature tests run as an authenticated user.
        token = register(c, "primary@example.com")
        c.headers.update({"Authorization": f"Bearer {token}"})
        yield c
    SQLModel.metadata.drop_all(engine)


@pytest.fixture()
def anon_client():
    """A client with no auth header, for testing the public/unauthenticated paths."""
    SQLModel.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c
    SQLModel.metadata.drop_all(engine)
