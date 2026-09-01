"""Tests for account registration, login, and per-user data isolation."""
from tests.conftest import register

SAMPLE_PROFILE = {
    "full_name": "Owner One",
    "email": "owner@example.com",
    "experience": [{"company": "Acme", "role": "Eng", "bullets": ["Did a thing"]}],
}


def test_protected_route_requires_auth(anon_client):
    # No token -> 401 on a feature route.
    assert anon_client.get("/api/profile").status_code == 401
    # Health stays public.
    assert anon_client.get("/api/health").status_code == 200


def test_register_login_me(anon_client):
    r = anon_client.post(
        "/api/auth/register", json={"email": "New@Example.com", "password": "password123"}
    )
    assert r.status_code == 201
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "new@example.com"  # normalized to lowercase
    token = body["access_token"]

    # Duplicate registration is rejected.
    dup = anon_client.post(
        "/api/auth/register", json={"email": "new@example.com", "password": "password123"}
    )
    assert dup.status_code == 409

    # Wrong password fails, correct password logs in.
    assert (
        anon_client.post(
            "/api/auth/login", json={"email": "new@example.com", "password": "wrong"}
        ).status_code
        == 401
    )
    ok = anon_client.post(
        "/api/auth/login", json={"email": "new@example.com", "password": "password123"}
    )
    assert ok.status_code == 200

    # /me echoes the authenticated user.
    me = anon_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "new@example.com"


def test_short_password_rejected(anon_client):
    r = anon_client.post(
        "/api/auth/register", json={"email": "x@example.com", "password": "short"}
    )
    assert r.status_code == 422  # fails min_length validation


def test_bad_token_rejected(anon_client):
    r = anon_client.get("/api/profile", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


def test_profiles_are_isolated_between_users(anon_client):
    token_a = register(anon_client, "a@example.com")
    token_b = register(anon_client, "b@example.com")
    ha = {"Authorization": f"Bearer {token_a}"}
    hb = {"Authorization": f"Bearer {token_b}"}

    # User A saves a profile.
    anon_client.put("/api/profile", json=SAMPLE_PROFILE, headers=ha)

    # User A sees it; user B sees an empty profile.
    assert anon_client.get("/api/profile", headers=ha).json()["full_name"] == "Owner One"
    assert anon_client.get("/api/profile", headers=hb).json()["full_name"] == ""


def test_saved_resumes_are_isolated(anon_client):
    token_a = register(anon_client, "ra@example.com")
    token_b = register(anon_client, "rb@example.com")
    ha = {"Authorization": f"Bearer {token_a}"}
    hb = {"Authorization": f"Bearer {token_b}"}

    created = anon_client.post(
        "/api/resumes",
        json={"label": "A's resume", "kind": "base", "data": {"name": "A"}},
        headers=ha,
    ).json()

    # B cannot list or fetch A's resume.
    assert anon_client.get("/api/resumes", headers=hb).json() == []
    assert anon_client.get(f"/api/resumes/{created['id']}", headers=hb).status_code == 404
    # A can.
    assert anon_client.get(f"/api/resumes/{created['id']}", headers=ha).status_code == 200


def test_each_user_gets_own_question_bank(anon_client):
    token = register(anon_client, "q@example.com")
    h = {"Authorization": f"Bearer {token}"}
    assert len(anon_client.get("/api/questions", headers=h).json()) == 8  # seeded on register
