"""Profile intake: get, upsert, and parse-from-pasted-resume."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session

from .. import llm
from ..auth import get_current_user
from ..crud import get_or_create_profile, profile_to_dict
from ..database import get_session
from ..extract import ExtractError, extract_text
from ..models import User
from ..ratelimit import rate_limit_llm
from ..schemas import ParseResumeRequest, ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ProfileOut:
    profile = get_or_create_profile(session, user.id)
    return ProfileOut(id=profile.id, **profile_to_dict(profile))


@router.put("", response_model=ProfileOut)
def update_profile(
    payload: ProfileIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ProfileOut:
    profile = get_or_create_profile(session, user.id)

    profile.full_name = payload.full_name
    profile.email = payload.email
    profile.phone = payload.phone
    profile.location = payload.location
    profile.summary = payload.summary
    # JSON columns: dump nested pydantic models to plain dicts.
    profile.links = [x.model_dump() for x in payload.links]
    profile.skills = [x.model_dump() for x in payload.skills]
    profile.experience = [x.model_dump() for x in payload.experience]
    profile.projects = [x.model_dump() for x in payload.projects]
    profile.education = [x.model_dump() for x in payload.education]

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return ProfileOut(id=profile.id, **profile_to_dict(profile))


@router.post("/parse")
def parse_resume(
    payload: ParseResumeRequest,
    user: User = Depends(rate_limit_llm),
) -> dict:
    """Parse pasted resume text into structured profile fields (not saved)."""
    parsed = llm.parse_resume(payload.text)
    return parsed


@router.post("/parse-file")
async def parse_resume_file(
    file: UploadFile = File(...),
    user: User = Depends(rate_limit_llm),
) -> dict:
    """Extract text from an uploaded PDF/DOCX/TXT, then parse it (not saved)."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    try:
        text = extract_text(file.filename or "", file.content_type, data)
    except ExtractError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted (it may be a scanned image). Paste the text instead.",
        )
    return llm.parse_resume(text)
