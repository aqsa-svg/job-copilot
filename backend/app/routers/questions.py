"""Editable screening question bank (per user)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import get_current_user
from ..database import get_session
from ..models import Question, User
from ..schemas import QuestionIn, QuestionOut

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
def list_questions(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Question]:
    return list(
        session.exec(
            select(Question).where(Question.user_id == user.id).order_by(Question.id)
        ).all()
    )


@router.post("", response_model=QuestionOut)
def create_question(
    payload: QuestionIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Question:
    q = Question(user_id=user.id, **payload.model_dump())
    session.add(q)
    session.commit()
    session.refresh(q)
    return q


def _owned_question(session: Session, question_id: int, user_id: int) -> Question:
    q = session.get(Question, question_id)
    if not q or q.user_id != user_id:
        raise HTTPException(status_code=404, detail="Question not found.")
    return q


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionIn,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Question:
    q = _owned_question(session, question_id, user.id)
    for key, value in payload.model_dump().items():
        setattr(q, key, value)
    session.add(q)
    session.commit()
    session.refresh(q)
    return q


@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    q = _owned_question(session, question_id, user.id)
    session.delete(q)
    session.commit()
    return {"ok": True}
