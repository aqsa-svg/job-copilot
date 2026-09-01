"""Secondary feature: tailor application answers to a job description."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from .. import llm
from ..crud import get_or_create_profile, profile_is_empty, profile_to_dict
from ..database import get_session
from ..models import User
from ..ratelimit import rate_limit_llm
from ..schemas import ApplyRequest

router = APIRouter(prefix="/api/apply", tags=["apply"])


@router.post("/answers")
def answers(
    payload: ApplyRequest,
    session: Session = Depends(get_session),
    user: User = Depends(rate_limit_llm),
) -> dict:
    if not payload.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    profile = get_or_create_profile(session, user.id)
    if profile_is_empty(profile):
        raise HTTPException(
            status_code=400,
            detail="Your profile is empty. Add your details on the Profile page first.",
        )
    result = llm.application_answers(profile_to_dict(profile), payload.job_description)
    return {
        "why_interested": result.get("why_interested", ""),
        "questions": result.get("questions", []),
    }
