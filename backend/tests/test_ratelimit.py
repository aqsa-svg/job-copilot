"""Tests for the per-user LLM rate limit."""
import app.llm as llm_module
from app.config import settings
from tests.conftest import register

BULLET = {"bullet": "did a thing", "role": "", "context": ""}


def _mock_llm(monkeypatch):
    monkeypatch.setattr(
        llm_module,
        "improve_bullet",
        lambda bullet, role, context: {"improved": "Did X", "variants": [], "note": ""},
    )
    monkeypatch.setattr(
        llm_module, "generate_resume", lambda profile: {"name": "T", "summary": "s"}
    )


def test_per_minute_limit_blocks(client, monkeypatch):
    _mock_llm(monkeypatch)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MIN", 2)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_DAY", 1000)

    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    blocked = client.post("/api/resume/improve-bullet", json=BULLET)
    assert blocked.status_code == 429
    assert "minute" in blocked.json()["detail"].lower()
    assert blocked.headers.get("Retry-After") == "60"


def test_daily_limit_blocks(client, monkeypatch):
    _mock_llm(monkeypatch)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MIN", 1000)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_DAY", 2)

    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    blocked = client.post("/api/resume/improve-bullet", json=BULLET)
    assert blocked.status_code == 429
    assert "daily" in blocked.json()["detail"].lower()


def test_limit_shared_across_llm_endpoints(client, monkeypatch):
    _mock_llm(monkeypatch)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MIN", 2)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_DAY", 1000)
    client.put("/api/profile", json={"full_name": "T", "experience": [{"company": "A", "role": "R", "bullets": ["b"]}]})

    assert client.post("/api/resume/generate").status_code == 200
    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    # Third LLM call of any kind is blocked by the shared counter.
    assert client.post("/api/resume/generate").status_code == 429


def test_non_llm_routes_not_limited(client, monkeypatch):
    _mock_llm(monkeypatch)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MIN", 1)
    # Exhaust the LLM limit.
    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 200
    assert client.post("/api/resume/improve-bullet", json=BULLET).status_code == 429
    # Reading the profile / questions is never rate limited.
    assert client.get("/api/profile").status_code == 200
    assert client.get("/api/questions").status_code == 200


def test_limit_is_per_user(anon_client, monkeypatch):
    _mock_llm(monkeypatch)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MIN", 1)
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_DAY", 1000)
    ha = {"Authorization": f"Bearer {register(anon_client, 'rl-a@example.com')}"}
    hb = {"Authorization": f"Bearer {register(anon_client, 'rl-b@example.com')}"}

    # A uses its single allowance, then is blocked.
    assert anon_client.post("/api/resume/improve-bullet", json=BULLET, headers=ha).status_code == 200
    assert anon_client.post("/api/resume/improve-bullet", json=BULLET, headers=ha).status_code == 429
    # B is unaffected.
    assert anon_client.post("/api/resume/improve-bullet", json=BULLET, headers=hb).status_code == 200
