"""Pydantic request/response schemas for the API."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Profile ----------
class Link(BaseModel):
    label: str = ""
    url: str = ""


class SkillGroup(BaseModel):
    category: str = ""
    items: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    location: str = ""
    start: str = ""
    end: str = ""
    current: bool = False
    bullets: list[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: str = ""
    link: str = ""
    tech: list[str] = Field(default_factory=list)
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    school: str = ""
    degree: str = ""
    field: str = ""
    start: str = ""
    end: str = ""
    details: str = ""


class ProfileIn(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    links: list[Link] = Field(default_factory=list)
    skills: list[SkillGroup] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)


class ProfileOut(ProfileIn):
    id: int


# ---------- LLM feature requests ----------
class ParseResumeRequest(BaseModel):
    text: str


class TailorRequest(BaseModel):
    job_description: str


class ImproveBulletRequest(BaseModel):
    bullet: str
    role: Optional[str] = ""
    context: Optional[str] = ""


class ApplyRequest(BaseModel):
    job_description: str


# ---------- Question bank ----------
class QuestionIn(BaseModel):
    category: str = "General"
    question: str
    framing_tip: str = ""
    sample_answer: str = ""


class QuestionOut(QuestionIn):
    id: int


# ---------- Saved resumes ----------
class SavedResumeIn(BaseModel):
    label: str = "Untitled resume"
    kind: str = "base"
    data: dict[str, Any] = Field(default_factory=dict)
    job_description: str = ""
    match_score: Optional[int] = None
    match_summary: str = ""
    gaps: list[str] = Field(default_factory=list)
    changes: list[str] = Field(default_factory=list)


class SavedResumeUpdate(BaseModel):
    label: Optional[str] = None
    data: Optional[dict[str, Any]] = None


class SavedResumeOut(SavedResumeIn):
    id: int
    created_at: Any = None
    updated_at: Any = None


# ---------- Generic LLM payloads (kept loose; validated in the frontend UI) ----------
class ResumeResponse(BaseModel):
    resume: dict[str, Any]


class GapsResponse(BaseModel):
    resume: dict[str, Any]
    gaps: list[str] = Field(default_factory=list)
    changes: list[str] = Field(default_factory=list)
