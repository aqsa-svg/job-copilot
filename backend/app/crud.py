"""Small data-access helpers shared across routers."""
from __future__ import annotations

from typing import Any

from sqlmodel import Session, select

from .models import Profile


def get_or_create_profile(session: Session, user_id: int) -> Profile:
    """Return the user's profile row, creating an empty one if needed."""
    profile = session.exec(
        select(Profile).where(Profile.user_id == user_id)
    ).first()
    if profile is None:
        profile = Profile(user_id=user_id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile


def profile_to_dict(profile: Profile) -> dict[str, Any]:
    """Serialize a profile to a plain dict for prompting / responses."""
    return {
        "full_name": profile.full_name,
        "email": profile.email,
        "phone": profile.phone,
        "location": profile.location,
        "summary": profile.summary,
        "links": profile.links or [],
        "skills": profile.skills or [],
        "experience": profile.experience or [],
        "projects": profile.projects or [],
        "education": profile.education or [],
    }


def profile_is_empty(profile: Profile) -> bool:
    return not (
        profile.full_name
        or profile.experience
        or profile.projects
        or profile.education
        or profile.skills
    )
