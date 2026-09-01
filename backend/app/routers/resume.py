"""Resume generation, tailoring, and per-bullet improvement."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import llm
from ..crud import get_or_create_profile, profile_is_empty, profile_to_dict
from ..database import get_session
from ..models import User
from ..normalize import clamp_score, normalize_resume
from ..ratelimit import rate_limit_llm
from ..schemas import ImproveBulletRequest, TailorRequest

router = APIRouter(prefix="/api/resume", tags=["resume"])


def _require_profile(session: Session, user_id: int) -> dict:
    profile = get_or_create_profile(session, user_id)
    if profile_is_empty(profile):
        raise HTTPException(
            status_code=400,
            detail="Your profile is empty. Add your details on the Profile page first.",
        )
    return profile_to_dict(profile)


@router.post("/generate")
def generate(
    session: Session = Depends(get_session),
    user: User = Depends(rate_limit_llm),
) -> dict:
    profile = _require_profile(session, user.id)
    resume = normalize_resume(llm.generate_resume(profile))
    return {"resume": resume}


@router.post("/tailor")
def tailor(
    payload: TailorRequest,
    session: Session = Depends(get_session),
    user: User = Depends(rate_limit_llm),
) -> dict:
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    profile = _require_profile(session, user.id)
    result = llm.tailor_resume(profile, payload.job_description)
    # Normalize the shape so the frontend can rely on it.
    raw_resume = result.get("resume") if isinstance(result.get("resume"), dict) else result
    gaps = [g for g in (result.get("gaps") or []) if isinstance(g, str)]
    changes = [c for c in (result.get("changes") or []) if isinstance(c, str)]
    return {
        "resume": normalize_resume(raw_resume),
        "gaps": gaps,
        "changes": changes,
        "match_score": clamp_score(result.get("match_score")),
        "match_summary": result.get("match_summary", "") if isinstance(result.get("match_summary"), str) else "",
    }


@router.post("/improve-bullet")
def improve_bullet(
    payload: ImproveBulletRequest,
    user: User = Depends(rate_limit_llm),
) -> dict:
    if not payload.bullet.strip():
        raise HTTPException(status_code=400, detail="Bullet text is required.")
    result = llm.improve_bullet(payload.bullet, payload.role or "", payload.context or "")
    return {
        "improved": result.get("improved", ""),
        "variants": result.get("variants", []),
        "note": result.get("note", ""),
    }
