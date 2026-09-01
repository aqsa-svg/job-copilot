"""Prompt templates for the Groq LLM.

Every prompt embeds a strict HONESTY CONTRACT. The model is only ever allowed to
reorganize, rephrase, and emphasize what the user actually provided — never to
invent experience, skills, employers, dates, or metrics.
"""
from __future__ import annotations

import json
from typing import Any

# The single most important instruction in this app.
HONESTY_CONTRACT = """
CRITICAL HONESTY RULES (non-negotiable — follow exactly):
1. NEVER fabricate or infer experience, skills, employers, job titles, dates,
   degrees, or metrics. Use ONLY facts present in the user's provided data.
2. You may reorganize, reorder, rephrase, and emphasize existing content. You may
   improve wording and use stronger action verbs. You may NOT add new claims.
3. NEVER invent numbers or impact. If a bullet lacks a measurable result, either
   keep it qualitative or insert the literal placeholder "[add metric]" — never a
   made-up figure.
4. Do NOT add a skill, tool, or technology unless the user already listed it or it
   is unambiguously present in their experience/projects text.
5. If a target job requires something the user's data does not support, DO NOT add
   it to the resume. Instead record it in the "gaps" list so the user can decide.
6. Keep the user's real voice and seniority level. Do not exaggerate scope or
   inflate titles.
Output MUST be valid JSON only, with no prose, no markdown fences, no comments.
""".strip()

# The canonical resume JSON structure used across generate/tailor/render/export.
RESUME_SCHEMA_DOC = """
Return a JSON object with EXACTLY this shape:
{
  "name": string,
  "title": string,                       // short professional headline, e.g. "Machine Learning Engineer". Derive only from real roles.
  "contact": {
    "email": string,
    "phone": string,
    "location": string,
    "links": [ { "label": string, "url": string } ]
  },
  "summary": string,                      // 2-3 sentences, honest, grounded in real experience
  "skills": [ { "category": string, "items": [string] } ],
  "experience": [
    {
      "company": string, "role": string, "location": string,
      "start": string, "end": string,     // keep the user's date strings; "" if unknown
      "bullets": [string]                  // strong, action-verb-first, results-oriented where real
    }
  ],
  "projects": [
    { "name": string, "link": string, "tech": [string], "bullets": [string] }
  ],
  "education": [
    { "school": string, "degree": string, "field": string, "start": string, "end": string, "details": string }
  ]
}
Omit no keys. Use empty strings / empty arrays where data is missing. Do not add keys.
""".strip()


def _profile_json(profile: dict[str, Any]) -> str:
    return json.dumps(profile, ensure_ascii=False, indent=2)


def parse_resume_messages(raw_text: str) -> list[dict[str, str]]:
    system = (
        "You are a precise resume parser. Extract structured data from the pasted "
        "resume text into JSON. Copy facts verbatim where possible; do not invent, "
        "summarize away, or embellish anything. If a field is not present, leave it "
        "empty.\n\n" + HONESTY_CONTRACT
    )
    user = (
        "Parse the following resume text into this JSON shape:\n"
        '{\n'
        '  "full_name": string, "email": string, "phone": string, "location": string,\n'
        '  "summary": string,\n'
        '  "links": [ { "label": string, "url": string } ],\n'
        '  "skills": [ { "category": string, "items": [string] } ],\n'
        '  "experience": [ { "company": string, "role": string, "location": string, "start": string, "end": string, "current": boolean, "bullets": [string] } ],\n'
        '  "projects": [ { "name": string, "link": string, "tech": [string], "bullets": [string] } ],\n'
        '  "education": [ { "school": string, "degree": string, "field": string, "start": string, "end": string, "details": string } ]\n'
        "}\n\n"
        "Group skills into sensible categories (e.g. Languages, ML/AI, Frameworks, "
        "Tools) using ONLY skills that appear in the text.\n"
        "If a 'LINKS FOUND IN DOCUMENT' section is present, use those exact URLs for "
        "the links field, pairing each with a sensible label (GitHub, LinkedIn, "
        "Portfolio, etc.) inferred from the URL.\n\n"
        "RESUME TEXT:\n"
        '"""\n' + raw_text.strip() + '\n"""'
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def generate_resume_messages(profile: dict[str, Any]) -> list[dict[str, str]]:
    system = (
        "You are an expert resume writer for AI / ML / GenAI roles. Produce a clean, "
        "professional, ATS-friendly resume from the user's profile data. Single "
        "column, standard sections, strong action verbs. Improve phrasing and "
        "ordering, but stay strictly within the honesty rules.\n\n" + HONESTY_CONTRACT
    )
    user = (
        "Create the resume JSON from this profile.\n\n"
        + RESUME_SCHEMA_DOC
        + "\n\nGuidance:\n"
        "- Write a concise, honest summary grounded in the real experience.\n"
        "- Rewrite bullets to be action-verb-first and results-oriented, but never "
        "invent metrics — use \"[add metric]\" if impact is unknown.\n"
        "- Order experience most-recent-first; order skills with the strongest, most "
        "relevant groups first.\n\n"
        "PROFILE DATA:\n" + _profile_json(profile)
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def tailor_resume_messages(profile: dict[str, Any], job_description: str) -> list[dict[str, str]]:
    system = (
        "You are an expert resume tailor for AI / ML / GenAI roles. Given the user's "
        "real profile and a target job description, produce a tailored resume that "
        "surfaces the most relevant real experience, skills, and projects FIRST, "
        "mirrors the job's language where truthful, and adjusts the summary to the "
        "role. You must not add anything the user cannot back up.\n\n" + HONESTY_CONTRACT
    )
    user = (
        "Tailor the resume to the JOB DESCRIPTION below. Return a JSON object with "
        "this shape:\n"
        "{\n"
        '  "resume": <resume object exactly as specified below>,\n'
        '  "gaps": [string],     // requirements in the job the profile does NOT support; be specific and honest\n'
        '  "changes": [string],  // short notes on what you reordered/rephrased and why\n'
        '  "match_score": number,   // 0-100 HONEST estimate of how well the real profile fits this job\n'
        '  "match_summary": string  // one honest sentence explaining the score (strengths vs gaps)\n'
        "}\n\n"
        "The resume object must follow EXACTLY this shape:\n"
        + RESUME_SCHEMA_DOC
        + "\n\nTailoring rules:\n"
        "- Reorder skills, experience bullets, and projects so the most job-relevant "
        "real content comes first.\n"
        "- Rephrase existing bullets to echo the job's terminology ONLY when it "
        "remains truthful. Do not bolt on new tools/skills.\n"
        "- Rewrite the summary to target this role using only real strengths.\n"
        "- For every requirement the profile does not clearly satisfy, add a specific "
        "entry to \"gaps\" (e.g. \"JD requires Kubernetes; not present in profile\"). "
        "Never silently insert missing requirements into the resume.\n\n"
        "PROFILE DATA:\n" + _profile_json(profile) + "\n\n"
        "JOB DESCRIPTION:\n"
        '"""\n' + job_description.strip() + '\n"""'
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def improve_bullet_messages(bullet: str, role: str, context: str) -> list[dict[str, str]]:
    system = (
        "You improve resume bullet points for AI / ML / GenAI roles. Make each bullet "
        "strong and results-oriented: action verb + what was done + impact. You must "
        "not invent numbers, tools, or outcomes.\n\n" + HONESTY_CONTRACT
    )
    user = (
        "Rewrite the bullet below. Return JSON:\n"
        "{\n"
        '  "improved": string,          // the single best rewrite\n'
        '  "variants": [string],        // 2 alternative honest rewrites\n'
        '  "note": string               // brief note, e.g. what placeholder to fill\n'
        "}\n\n"
        "Rules: keep it one line; lead with a strong action verb; keep it truthful; "
        "if the impact/number is unknown, include the literal placeholder \"[add metric]\" "
        "rather than inventing a figure.\n\n"
        f"ROLE CONTEXT: {role or 'N/A'}\n"
        f"ADDITIONAL CONTEXT: {context or 'N/A'}\n"
        f'ORIGINAL BULLET: "{bullet.strip()}"'
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def application_answers_messages(profile: dict[str, Any], job_description: str) -> list[dict[str, str]]:
    system = (
        "You help candidates answer job application and screening questions for "
        "AI / ML / GenAI roles. Write in the candidate's authentic voice using only "
        "their real background. Strong but never inflated or fabricated.\n\n"
        + HONESTY_CONTRACT
    )
    user = (
        "Using the candidate's profile and the job description, return JSON:\n"
        "{\n"
        '  "why_interested": string,     // a ready-to-send \"why I am interested\" paragraph, honest and specific\n'
        '  "questions": [                // 4-6 likely screening questions with strong honest answers\n'
        '     { "question": string, "answer": string }\n'
        "  ]\n"
        "}\n\n"
        "Rules: ground every claim in the profile; if the role wants something the "
        "candidate lacks, answer honestly (show learning path / adjacent experience) "
        "rather than pretending. Keep answers concise and in first person.\n\n"
        "PROFILE DATA:\n" + _profile_json(profile) + "\n\n"
        "JOB DESCRIPTION:\n"
        '"""\n' + job_description.strip() + '\n"""'
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
