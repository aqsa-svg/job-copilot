"""API tests. The LLM layer is monkeypatched so no real Groq calls are made."""

SAMPLE_PROFILE = {
    "full_name": "Test User",
    "email": "test@example.com",
    "skills": [{"category": "ML", "items": ["PyTorch"]}],
    "experience": [
        {"company": "Acme", "role": "ML Eng", "bullets": ["Built a model"]}
    ],
}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["groq_configured"] is True  # dummy key set in conftest


def test_profile_roundtrip(client):
    r = client.put("/api/profile", json=SAMPLE_PROFILE)
    assert r.status_code == 200
    assert r.json()["full_name"] == "Test User"

    r = client.get("/api/profile")
    assert r.json()["skills"][0]["items"] == ["PyTorch"]


def test_questions_seeded_and_crud(client):
    r = client.get("/api/questions")
    assert r.status_code == 200
    assert len(r.json()) == 8  # seeded set

    created = client.post(
        "/api/questions",
        json={"category": "Custom", "question": "Q?", "framing_tip": "t", "sample_answer": "a"},
    ).json()
    assert created["id"]
    assert len(client.get("/api/questions").json()) == 9

    assert client.delete(f"/api/questions/{created['id']}").json() == {"ok": True}
    assert len(client.get("/api/questions").json()) == 8


def test_generate_requires_profile(client):
    r = client.post("/api/resume/generate")
    assert r.status_code == 400  # empty profile


def test_generate_normalizes(client, monkeypatch):
    # Model returns a partial/messy object; endpoint must return the strict shape.
    monkeypatch.setattr(
        "app.llm.generate_resume",
        lambda profile: {"name": "Test User", "summary": "hi"},  # missing most keys
    )
    client.put("/api/profile", json=SAMPLE_PROFILE)
    r = client.post("/api/resume/generate")
    assert r.status_code == 200
    resume = r.json()["resume"]
    assert resume["name"] == "Test User"
    for key in ("contact", "skills", "experience", "projects", "education", "title"):
        assert key in resume


def test_tailor_clamps_and_passes_gaps(client, monkeypatch):
    monkeypatch.setattr(
        "app.llm.tailor_resume",
        lambda profile, jd: {
            "resume": {"name": "Test User"},
            "gaps": ["JD requires Kubernetes; not present in profile", 42],
            "changes": ["Reordered skills"],
            "match_score": 150,  # out of range on purpose
            "match_summary": "Strong fit with gaps.",
        },
    )
    client.put("/api/profile", json=SAMPLE_PROFILE)
    r = client.post("/api/resume/tailor", json={"job_description": "Need Kubernetes"})
    assert r.status_code == 200
    body = r.json()
    assert body["match_score"] == 100  # clamped
    assert body["gaps"] == ["JD requires Kubernetes; not present in profile"]  # non-str dropped
    assert body["resume"]["experience"] == []  # normalized shape


def test_tailor_requires_jd(client):
    r = client.post("/api/resume/tailor", json={"job_description": "  "})
    assert r.status_code == 400


def test_improve_bullet(client, monkeypatch):
    monkeypatch.setattr(
        "app.llm.improve_bullet",
        lambda bullet, role, context: {
            "improved": "Built X [add metric]",
            "variants": ["Designed X [add metric]"],
            "note": "fill metric",
        },
    )
    r = client.post("/api/resume/improve-bullet", json={"bullet": "did x"})
    assert r.status_code == 200
    assert "[add metric]" in r.json()["improved"]


def test_saved_resume_crud(client):
    payload = {
        "label": "Base resume",
        "kind": "base",
        "data": {"name": "Test User", "summary": "hi"},
    }
    created = client.post("/api/resumes", json=payload).json()
    rid = created["id"]
    assert created["label"] == "Base resume"
    assert "skills" in created["data"]  # normalized on save

    assert len(client.get("/api/resumes").json()) == 1

    updated = client.put(f"/api/resumes/{rid}", json={"label": "Renamed"}).json()
    assert updated["label"] == "Renamed"

    assert client.delete(f"/api/resumes/{rid}").json() == {"ok": True}
    assert client.get(f"/api/resumes/{rid}").status_code == 404
