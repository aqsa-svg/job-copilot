"""Normalize the LLM's resume JSON into a strict, consistent shape.

The model almost always returns the requested structure, but this guarantees
the frontend/PDF/Markdown layers never crash on a missing key or a wrong type.
It only ever drops/coerces malformed fields — it never invents content.
"""
from __future__ import annotations

from typing import Any


def _s(v: Any) -> str:
    if isinstance(v, str):
        return v
    if v is None:
        return ""
    if isinstance(v, (int, float, bool)):
        return str(v)
    return ""


def _list(v: Any) -> list:
    return v if isinstance(v, list) else []


def _str_list(v: Any) -> list[str]:
    return [s for s in (_s(x) for x in _list(v)) if s]


def normalize_resume(data: Any) -> dict[str, Any]:
    data = data if isinstance(data, dict) else {}
    contact = data.get("contact") if isinstance(data.get("contact"), dict) else {}

    links = [
        {"label": _s(l.get("label")), "url": _s(l.get("url"))}
        for l in _list(contact.get("links"))
        if isinstance(l, dict)
    ]
    skills = [
        {"category": _s(g.get("category")), "items": _str_list(g.get("items"))}
        for g in _list(data.get("skills"))
        if isinstance(g, dict)
    ]
    experience = [
        {
            "company": _s(e.get("company")),
            "role": _s(e.get("role")),
            "location": _s(e.get("location")),
            "start": _s(e.get("start")),
            "end": _s(e.get("end")),
            "bullets": _str_list(e.get("bullets")),
        }
        for e in _list(data.get("experience"))
        if isinstance(e, dict)
    ]
    projects = [
        {
            "name": _s(p.get("name")),
            "link": _s(p.get("link")),
            "tech": _str_list(p.get("tech")),
            "bullets": _str_list(p.get("bullets")),
        }
        for p in _list(data.get("projects"))
        if isinstance(p, dict)
    ]
    education = [
        {
            "school": _s(ed.get("school")),
            "degree": _s(ed.get("degree")),
            "field": _s(ed.get("field")),
            "start": _s(ed.get("start")),
            "end": _s(ed.get("end")),
            "details": _s(ed.get("details")),
        }
        for ed in _list(data.get("education"))
        if isinstance(ed, dict)
    ]

    return {
        "name": _s(data.get("name")),
        "title": _s(data.get("title")),
        "contact": {
            "email": _s(contact.get("email")),
            "phone": _s(contact.get("phone")),
            "location": _s(contact.get("location")),
            "links": links,
        },
        "summary": _s(data.get("summary")),
        "skills": skills,
        "experience": experience,
        "projects": projects,
        "education": education,
    }


def clamp_score(score: Any) -> int | None:
    """Coerce a match score into an int in [0, 100], or None if unusable."""
    try:
        if score is None:
            return None
        return max(0, min(100, int(round(float(score)))))
    except (TypeError, ValueError):
        return None
