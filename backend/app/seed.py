"""Seed data for the AI/ML screening question bank."""
from __future__ import annotations

from sqlmodel import Session, select

from .models import Question

SEED_QUESTIONS: list[dict[str, str]] = [
    {
        "category": "Self-assessment",
        "question": "On a scale of 1-10, how would you rate your ML skills?",
        "framing_tip": (
            "Avoid extremes. Pick a number you can defend with concrete evidence, and "
            "immediately anchor it to what you have actually shipped and where you are "
            "still growing. Honesty + a growth mindset beats a confident 10."
        ),
        "sample_answer": (
            "I'd say a 7. I'm strong on the core supervised-learning workflow — framing "
            "the problem, building features, training and evaluating models, and getting "
            "them into production. I'm actively deepening my knowledge of [area you're "
            "learning], which is why I wouldn't claim a 9 or 10 yet."
        ),
    },
    {
        "category": "Research",
        "question": "How many A*/top-tier conference papers have you published?",
        "framing_tip": (
            "State the exact truth — this is trivially verifiable. If you have none, "
            "pivot to applied impact or other writing (blogs, internal reports, "
            "reproductions) without inflating anything."
        ),
        "sample_answer": (
            "I don't have A* publications — my focus has been applied ML in production. "
            "I have [e.g. written internal technical reports / reproduced key papers / "
            "shipped models used by real users]. If research output is central to this "
            "role, I'm keen to understand what that would look like here."
        ),
    },
    {
        "category": "Logistics",
        "question": "What is your notice period / last working day (LWD)?",
        "framing_tip": (
            "Be precise and factual. State your notice period, whether it's negotiable, "
            "and your earliest realistic start date. Don't over-promise a date you can't hit."
        ),
        "sample_answer": (
            "My notice period is [X weeks/months]. My earliest realistic LWD would be "
            "[date], and I can potentially expedite it to [date] if needed. I'm happy to "
            "align on a start date that works for the team."
        ),
    },
    {
        "category": "Technical",
        "question": "Walk me through how you'd build a recommendation system.",
        "framing_tip": (
            "Show structured thinking: clarify the goal and data, then cover candidate "
            "generation → ranking → evaluation → serving. Mention trade-offs. Speak only "
            "to approaches you actually understand; it's fine to flag what you'd learn."
        ),
        "sample_answer": (
            "First I'd clarify the objective (engagement, revenue, retention) and the "
            "available signals. I'd start with a simple baseline — collaborative "
            "filtering or content-based — then move to a two-stage design: cheap "
            "candidate generation (embeddings / ANN retrieval) followed by a learned "
            "ranker on richer features. I'd evaluate offline with ranking metrics "
            "(recall@k, NDCG) and validate online with A/B tests, watching for cold-start "
            "and feedback-loop bias. For serving I'd precompute candidates and rank in "
            "real time."
        ),
    },
    {
        "category": "Behavioural",
        "question": "Explain a challenging problem you solved.",
        "framing_tip": (
            "Use STAR (Situation, Task, Action, Result). Pick a real problem, be specific "
            "about YOUR contribution, and quantify the result only if you truly know the "
            "number — otherwise describe the outcome qualitatively."
        ),
        "sample_answer": (
            "Situation: [real project]. Task: [what needed solving]. Action: I [specific "
            "steps you personally took]. Result: [measurable outcome if known, e.g. "
            "reduced latency by X% — otherwise: the model shipped and [qualitative "
            "impact]]. The key lesson was [insight]."
        ),
    },
    {
        "category": "Motivation",
        "question": "Why do you want this role / why this company?",
        "framing_tip": (
            "Connect a genuine interest of yours to something specific about the role or "
            "company (their product, problem space, or tech). Generic flattery is obvious; "
            "specificity signals real research."
        ),
        "sample_answer": (
            "I'm drawn to this role because [specific aspect of the work, e.g. building "
            "GenAI features used at scale]. It lines up with what I've enjoyed most — "
            "[real experience] — and [company/team] is working on [specific thing] that I "
            "genuinely want to contribute to and learn from."
        ),
    },
    {
        "category": "Research",
        "question": "What is your preferred research / focus area in ML?",
        "framing_tip": (
            "Name a real area you've spent time in and can talk about in depth. Better to "
            "go deep on one honest interest than to list five you've only skimmed."
        ),
        "sample_answer": (
            "My focus has been [e.g. applied NLP / LLM systems / recommendation]. I enjoy "
            "it because [reason], and recently I've been going deeper into [specific "
            "sub-topic] through [project/reading]. I'm curious how that area shows up in "
            "your team's work."
        ),
    },
    {
        "category": "Technical",
        "question": "Which ML algorithms have you implemented yourself?",
        "framing_tip": (
            "List only what you've genuinely implemented (from scratch or applied hands-on) "
            "and be ready to discuss any of them. Distinguish 'implemented from scratch' "
            "from 'used via a library' — interviewers respect the honesty."
        ),
        "sample_answer": (
            "From scratch I've implemented [e.g. linear/logistic regression, k-means, a "
            "small neural net with backprop]. In applied work I've used [e.g. gradient "
            "boosting, transformers via Hugging Face, embedding-based retrieval]. I'm "
            "happy to go deep on any of these — for example, [one you know best]."
        ),
    },
]


def seed_questions_for_user(session: Session, user_id: int) -> None:
    """Give a user the default question bank, only if they have none (idempotent)."""
    existing = session.exec(
        select(Question).where(Question.user_id == user_id).limit(1)
    ).first()
    if existing:
        return
    for q in SEED_QUESTIONS:
        session.add(Question(user_id=user_id, **q))
    session.commit()
