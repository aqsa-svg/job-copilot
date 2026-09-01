"""Tests for the Groq retry/backoff wrapper (no real network calls)."""
import types

import pytest
from fastapi import HTTPException

from app import llm


class _Msg:
    content = '{"ok": 1}'


class _Choice:
    message = _Msg()


class _Completion:
    choices = [_Choice()]


class FakeClient:
    """Fails `fail_times` times, then returns a valid completion."""

    def __init__(self, fail_times: int, status: int | None = None):
        self.calls = 0
        self.fail_times = fail_times
        self.status = status
        self.chat = types.SimpleNamespace(
            completions=types.SimpleNamespace(create=self._create)
        )

    def _create(self, **_kwargs):
        self.calls += 1
        if self.calls <= self.fail_times:
            exc = RuntimeError("transient boom")
            if self.status is not None:
                exc.status_code = self.status  # type: ignore[attr-defined]
            raise exc
        return _Completion()


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch):
    monkeypatch.setattr(llm.time, "sleep", lambda _s: None)


def test_retry_succeeds_after_transient_failures(monkeypatch):
    fake = FakeClient(fail_times=2)
    monkeypatch.setattr(llm, "_get_client", lambda: fake)
    out = llm._chat_json([{"role": "user", "content": "hi"}])
    assert out == {"ok": 1}
    assert fake.calls == 3  # failed twice, succeeded on the third


def test_retry_exhausts_and_raises(monkeypatch):
    fake = FakeClient(fail_times=99)
    monkeypatch.setattr(llm, "_get_client", lambda: fake)
    with pytest.raises(HTTPException) as ei:
        llm._chat_json([{"role": "user", "content": "hi"}])
    assert ei.value.status_code == 502
    assert fake.calls == llm.MAX_LLM_ATTEMPTS  # no more than the cap


def test_auth_error_fails_fast_without_retry(monkeypatch):
    fake = FakeClient(fail_times=99, status=401)
    monkeypatch.setattr(llm, "_get_client", lambda: fake)
    with pytest.raises(HTTPException) as ei:
        llm._chat_json([{"role": "user", "content": "hi"}])
    assert ei.value.status_code == 502
    assert "authentication" in ei.value.detail.lower()
    assert fake.calls == 1  # did not retry
