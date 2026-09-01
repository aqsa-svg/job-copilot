"""Groq LLM layer.

Wraps the Groq chat API in JSON mode and parses responses safely. All feature
logic lives in prompts.py; this module just calls the model and returns dicts.
"""
from __future__ import annotations

import json
import time
from typing import Any

from fastapi import HTTPException

from . import prompts
from .config import settings

# Lazily created singleton client so importing this module never crashes when the
# key is missing (routes raise a clean 400/500 instead).
_client: Any = None

# Retry policy for transient Groq failures (rate limits, timeouts, 5xx).
MAX_LLM_ATTEMPTS = 3


def _backoff_seconds(attempt: int) -> float:
    return 0.5 * (2 ** attempt)  # 0.5s, 1s, 2s


def _get_client() -> Any:
    global _client
    if _client is not None:
        return _client
    if not settings.groq_enabled:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is not set. Create backend/.env from .env.example.",
        )
    try:
        from groq import Groq
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(
            status_code=500,
            detail="The 'groq' package is not installed. Run: pip install -r requirements.txt",
        ) from exc
    # Disable the SDK's own retries so our explicit backoff loop is in control.
    _client = Groq(api_key=settings.GROQ_API_KEY, max_retries=0, timeout=60.0)
    return _client


def _strip_fences(text: str) -> str:
    """Defensive: remove ```json ... ``` fences if the model adds them."""
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t.strip("`")
        if t.endswith("```"):
            t = t[: t.rfind("```")]
    return t.strip()


def _chat_json(messages: list[dict[str, str]], temperature: float = 0.3) -> dict[str, Any]:
    """Call Groq in JSON mode and return a parsed dict, retrying transient errors."""
    client = _get_client()
    completion = None
    last_exc: Exception | None = None
    for attempt in range(MAX_LLM_ATTEMPTS):
        try:
            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
                max_tokens=4096,
            )
            break
        except Exception as exc:  # network / rate-limit / 5xx / timeout
            last_exc = exc
            status = getattr(exc, "status_code", None)
            # Auth/permission problems won't fix themselves — fail fast.
            if status in (401, 403):
                raise HTTPException(
                    status_code=502, detail=f"Groq authentication failed: {exc}"
                ) from exc
            if attempt < MAX_LLM_ATTEMPTS - 1:
                time.sleep(_backoff_seconds(attempt))

    if completion is None:
        raise HTTPException(
            status_code=502,
            detail=f"Groq request failed after {MAX_LLM_ATTEMPTS} attempts: {last_exc}",
        ) from last_exc

    content = completion.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        try:
            return json.loads(_strip_fences(content))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=502,
                detail="Model returned invalid JSON. Please try again.",
            ) from exc


# ---------- Public feature functions ----------
def parse_resume(raw_text: str) -> dict[str, Any]:
    return _chat_json(prompts.parse_resume_messages(raw_text), temperature=0.1)


def generate_resume(profile: dict[str, Any]) -> dict[str, Any]:
    return _chat_json(prompts.generate_resume_messages(profile), temperature=0.3)


def tailor_resume(profile: dict[str, Any], job_description: str) -> dict[str, Any]:
    return _chat_json(prompts.tailor_resume_messages(profile, job_description), temperature=0.3)


def improve_bullet(bullet: str, role: str = "", context: str = "") -> dict[str, Any]:
    return _chat_json(prompts.improve_bullet_messages(bullet, role, context), temperature=0.4)


def application_answers(profile: dict[str, Any], job_description: str) -> dict[str, Any]:
    return _chat_json(prompts.application_answers_messages(profile, job_description), temperature=0.4)
