"""Job Copilot — FastAPI entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import apply, auth, profile, questions, resume, resumes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup. Question banks are seeded per user at register.
    init_db()
    yield


app = FastAPI(
    title="Job Copilot API",
    description="Create and tailor honest, ATS-friendly resumes for AI/ML/GenAI roles.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # Accept any localhost port (Next.js may fall back to :3001) and any
    # *.vercel.app deployment domain (preview + production).
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+|https://([a-z0-9-]+\.)*vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes are public (register/login); every feature router enforces auth
# per-endpoint via the get_current_user dependency.
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(resume.router)
app.include_router(resumes.router)
app.include_router(apply.router)
app.include_router(questions.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    """Basic health check that also reports whether the LLM key is configured."""
    return {
        "status": "ok",
        "groq_configured": settings.groq_enabled,
        "model": settings.GROQ_MODEL,
    }
