"""Vercel Python serverless entrypoint.

Exposes the FastAPI ASGI app and ensures the schema exists on cold start
(Vercel does not reliably run ASGI lifespan events). Question banks are seeded
per user at registration. Not used for local dev — locally you run
`uvicorn app.main:app`.
"""
from app.database import init_db
from app.main import app

# Idempotent: create any missing tables once per cold start.
init_db()

# `app` is the ASGI application Vercel serves.
__all__ = ["app"]
