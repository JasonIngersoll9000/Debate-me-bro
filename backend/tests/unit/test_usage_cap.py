"""
Tests for Issue #20: API Usage Cap — count_user_debates, stream gating, /usage endpoint.
"""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.debate import stream, store
from app.config import settings


# ── Fixtures ────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def mock_db_store(monkeypatch):
    """In-memory store that replaces async DB calls for test isolation."""
    _debates = {}

    async def _save(debate_id, data, created_by=None):
        data.setdefault("id", debate_id)
        data.setdefault("status", "completed")
        if created_by:
            data["created_by"] = created_by
        _debates[debate_id] = data

    async def _load(debate_id):
        return _debates.get(debate_id)

    async def _count(user_email):
        return sum(
            1 for d in _debates.values()
            if d.get("created_by") == user_email
        )

    monkeypatch.setattr(store, "save_debate", _save)
    monkeypatch.setattr(store, "load_debate", _load)
    monkeypatch.setattr(store, "count_user_debates", _count)
    monkeypatch.setattr(stream, "save_debate", _save)
    monkeypatch.setattr(stream, "load_debate", _load)
    monkeypatch.setattr(stream, "count_user_debates", _count)
    yield _debates


@pytest.fixture(autouse=True)
def reset_settings(monkeypatch):
    """Reset usage cap settings for each test."""
    monkeypatch.setattr(settings, "max_debates_per_user", 3)
    monkeypatch.setattr(settings, "admin_emails", "")


# ── Helper ──────────────────────────────────────────────────────────────

async def _collect_events(async_gen):
    events = []
    async for event in async_gen:
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))
    return events


# ── count_user_debates (store) ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_count_user_debates_zero(mock_db_store):
    count = await store.count_user_debates("nobody@test.com")
    assert count == 0


@pytest.mark.asyncio
async def test_count_user_debates_with_debates(mock_db_store):
    await store.save_debate("d1", {"topic": "A"}, created_by="user@test.com")
    await store.save_debate("d2", {"topic": "B"}, created_by="user@test.com")
    await store.save_debate("d3", {"topic": "C"}, created_by="other@test.com")

    assert await store.count_user_debates("user@test.com") == 2
    assert await store.count_user_debates("other@test.com") == 1
    assert await store.count_user_debates("nobody@test.com") == 0


# ── stream: AUTH_REQUIRED when no user_email ────────────────────────────

@pytest.mark.asyncio
async def test_stream_live_no_auth_emits_auth_required():
    """Live mode without user_email emits AUTH_REQUIRED error."""
    events = await _collect_events(
        stream.stream_debate_events("nonexistent", mode="live", user_email=None)
    )
    assert len(events) == 1
    assert events[0]["type"] == "error"
    assert events[0]["code"] == "AUTH_REQUIRED"


# ── stream: RATE_LIMITED when cap exceeded ──────────────────────────────

@pytest.mark.asyncio
async def test_stream_live_rate_limited(mock_db_store):
    """When user has reached the cap, emits RATE_LIMITED error."""
    # Pre-fill 3 debates for the user (cap is 3)
    for i in range(3):
        await store.save_debate(f"existing-{i}", {"topic": f"T{i}"}, created_by="user@test.com")

    events = await _collect_events(
        stream.stream_debate_events("new-topic", mode="live", user_email="user@test.com")
    )
    assert len(events) == 1
    assert events[0]["type"] == "error"
    assert events[0]["code"] == "RATE_LIMITED"
    assert "3/3" in events[0]["message"]


# ── stream: under cap proceeds (demo mode unaffected) ──────────────────

@pytest.mark.asyncio
async def test_stream_demo_mode_unaffected_by_cap():
    """Demo mode doesn't check usage cap — emits demo signal."""
    events = await _collect_events(
        stream.stream_debate_events("nonexistent", mode="demo", user_email=None)
    )
    assert len(events) == 1
    assert events[0]["type"] == "mode"
    assert events[0]["mode"] == "demo"


# ── stream: cached replay bypasses cap ──────────────────────────────────

@pytest.mark.asyncio
async def test_cached_replay_bypasses_cap(mock_db_store):
    """Replaying a cached debate works even without auth or over cap."""
    mock_db_store["cached-debate"] = {
        "id": "cached-debate",
        "topic": "Cached",
        "resolution": "Test?",
        "pro_position": "Yes",
        "con_position": "No",
        "status": "completed",
        "personas": {
            "pro": {"name": "P", "identity": "x"},
            "con": {"name": "C", "identity": "y"},
        },
        "turns": [
            {"phase": "opening_pro", "side": "pro", "text": "Hello.", "is_internal": False},
        ],
        "judging_results": None,
        "evidence": {"citations": {}},
    }

    # No auth, no user — should still replay
    events = await _collect_events(
        stream.stream_debate_events("cached-debate", mode="live", user_email=None)
    )
    types = [e["type"] for e in events]
    assert "evidence_loaded" in types
    assert "complete" in types


# ── stream: admin bypasses cap ──────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.debate.stream.create_debate_graph")
@patch("app.debate.stream.generate_persona")
@patch("app.debate.stream.EvidenceLoader")
async def test_admin_bypasses_cap(
    mock_loader_cls, mock_gen_persona, mock_create_graph,
    mock_db_store, monkeypatch,
):
    """Admin users are exempt from the usage cap."""
    monkeypatch.setattr(settings, "admin_emails", "admin@test.com")

    # Fill past the cap
    for i in range(5):
        await store.save_debate(f"admin-{i}", {"topic": f"T{i}"}, created_by="admin@test.com")

    # Mock pipeline to avoid real LLM calls
    from app.models.schemas import Persona, EvidenceBundle

    mock_loader = MagicMock()
    mock_loader.load_preset_evidence = AsyncMock(return_value=EvidenceBundle(
        raw_content="x", pro_research="x", con_research="x",
        citations={}, pro_arguments=[], con_arguments=[],
    ))
    mock_loader_cls.return_value = mock_loader
    mock_gen_persona.side_effect = lambda **kw: Persona(
        name=f"Dr. {kw['side'].title()}", identity="expert",
        expertise_areas=[], core_values=[], rhetorical_approach="logic",
    )

    async def _empty_gen(*a, **kw):
        return
        yield

    mock_graph = MagicMock()
    mock_graph.astream_events = MagicMock(return_value=_empty_gen())
    mock_create_graph.return_value = mock_graph

    events = await _collect_events(
        stream.stream_debate_events("healthcare", mode="live", user_email="admin@test.com")
    )
    types = [e["type"] for e in events]
    # Should NOT get RATE_LIMITED — should proceed to evidence_loaded
    assert "error" not in types or not any(
        e.get("code") == "RATE_LIMITED" for e in events
    )
    assert "evidence_loaded" in types


# ── config: admin_email_set parsing ─────────────────────────────────────

def test_admin_email_set_empty(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "")
    assert settings.admin_email_set == set()


def test_admin_email_set_single(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "admin@test.com")
    assert settings.admin_email_set == {"admin@test.com"}


def test_admin_email_set_multiple(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "a@test.com, B@Test.COM ,c@test.com")
    result = settings.admin_email_set
    assert "a@test.com" in result
    assert "b@test.com" in result  # lowercased
    assert "c@test.com" in result


def test_admin_email_set_with_blanks(monkeypatch):
    monkeypatch.setattr(settings, "admin_emails", "a@test.com,,,b@test.com,")
    result = settings.admin_email_set
    assert len(result) == 2
