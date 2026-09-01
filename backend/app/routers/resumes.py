"""Saved resume library — persist, list, open, rename, and delete versions (per user)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, desc, select

from ..auth import get_current_user
from ..database import get_session
from ..models import SavedResume, User, _utcnow
from ..normalize import clamp_score, normalize_resume
from ..schemas import SavedResumeIn, SavedResumeOut, SavedResumeUpdate

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


def _to_out(r: SavedResume) -> dict:
    return {
        "id": r.id,
        "label": r.label,
        "kind": r.kind,
        "data": r.data or {},
        "job_description": r.job_description,
        "match_score": r.match_score,
        "match_summary": r.match_summary,
        "gaps": r.gaps or [],
        "changes": r.changes or [],
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _owned_resume(session: Session, resume_id: int, user_id: int) -> SavedResume:
    r = session.get(SavedResume, resume_id)
    if not r or r.user_id != user_id:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return r


@router.get("", response_model=list[SavedResumeOut])
def list_resumes(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[dict]:
    rows = session.exec(
        select(SavedResume)
        .where(SavedResume.user_id == user.id)
        .order_by(desc(SavedResume.updated_at))
    ).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=SavedResumeOut)
def create_resume(
    payload: SavedResumeIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    r = SavedResume(
        user_id=user.id,
        label=(payload.label or "Untitled resume").strip()[:120],
        kind=payload.kind if payload.kind in ("base", "tailored") else "base",
        data=normalize_resume(payload.data),
        job_description=payload.job_description or "",
        match_score=clamp_score(payload.match_score),
        match_summary=payload.match_summary or "",
        gaps=[g for g in payload.gaps if isinstance(g, str)],
        changes=[c for c in payload.changes if isinstance(c, str)],
    )
    session.add(r)
    session.commit()
    session.refresh(r)
    return _to_out(r)


@router.get("/{resume_id}", response_model=SavedResumeOut)
def get_resume(
    resume_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    return _to_out(_owned_resume(session, resume_id, user.id))


@router.put("/{resume_id}", response_model=SavedResumeOut)
def update_resume(
    resume_id: int,
    payload: SavedResumeUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    r = _owned_resume(session, resume_id, user.id)
    if payload.label is not None:
        r.label = payload.label.strip()[:120] or r.label
    if payload.data is not None:
        r.data = normalize_resume(payload.data)
    r.updated_at = _utcnow()
    session.add(r)
    session.commit()
    session.refresh(r)
    return _to_out(r)


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    r = _owned_resume(session, resume_id, user.id)
    session.delete(r)
    session.commit()
    return {"ok": True}
