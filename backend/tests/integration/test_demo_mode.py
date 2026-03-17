"""
Integration tests for demo mode toggle + live API integration — Issue #17.

Tests:
1. GET /api/debates/mode returns the configured debate mode
2. SSE stream with ?mode=demo returns a mode event (no LLM calls)
3. SSE stream with ?mode=live on cached debate replays from cache
4. SSE stream with ?mode=demo on cached debate still replays from cache
5. Default mode from config is used when no query param
"""
import json

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from app.main import app
from app.config import settings
from app.debate import store as debate_store
from app.debate import stream as debate_stream
from app.routes import debates as debates_router


@pytest.fixture(autouse=True)
def mock_db_store(monkeypatch):
    """In-memory store that replaces async DB calls for test isolation."""
    _debates = {}

    async def _save(debate_id, data):
        data.setdefault("id", debate_id)
        data.setdefault("status", "completed")
        _debates[debate_id] = data

    async def _load(debate_id):
        return _debates.get(debate_id)

    async def _get_like_count(debate_id):
        return 0

    async def _get_likes(debate_id):
        return []

    async def _list():
        return []

    # Patch everywhere the functions are imported
    for mod in (debate_store, debate_stream, debates_router):
        for attr, fn in [("save_debate", _save), ("load_debate", _load)]:
            if hasattr(mod, attr):
                monkeypatch.setattr(mod, attr, fn)
    for attr, fn in [("list_debates", _list), ("get_like_count", _get_like_count),
                     ("get_likes", _get_likes)]:
        for mod in (debate_store, debates_router):
            if hasattr(mod, attr):
                monkeypatch.setattr(mod, attr, fn)
    yield _debates


SAMPLE_DEBATE = {
    "id": "test-healthcare",
    "topic": "Universal Healthcare",
    "resolution": "Should the US adopt universal healthcare?",
    "pro_position": "Yes, adopt single-payer.",
    "con_position": "No, keep multi-payer.",
    "personas": {
        "pro": {"name": "Dr. Pro", "identity": "Public health expert"},
        "con": {"name": "Dr. Con", "identity": "Health economics expert"},
    },
    "turns": [
        {"phase": "opening_pro", "side": "pro", "text": "Pro opening.", "is_internal": False},
        {"phase": "opening_con", "side": "con", "text": "Con opening.", "is_internal": False},
    ],
    "judging_results": {
        "winner": "pro",
        "scores": {
            "pro": {"logic": 4, "evidence": 5, "refutation": 4, "steelman": 4},
            "con": {"logic": 4, "evidence": 4, "refutation": 4, "steelman": 3},
        },
    },
    "evidence": {"citations": {}, "pro_arguments": [], "con_arguments": []},
    "status": "completed",
    "created_at": "2026-03-12T00:00:00+00:00",
}


# ── Mode endpoint tests ──

@pytest.mark.asyncio
async def test_get_debate_mode_returns_config_value(monkeypatch):
    """GET /api/debates/mode returns the current DEBATE_MODE from config."""
    monkeypatch.setattr(settings, "debate_mode", "live")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/debates/mode")
        assert response.status_code == 200
        assert response.json()["mode"] == "live"


@pytest.mark.asyncio
async def test_get_debate_mode_defaults_to_demo(monkeypatch):
    """GET /api/debates/mode returns 'demo' by default."""
    monkeypatch.setattr(settings, "debate_mode", "demo")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/debates/mode")
        assert response.status_code == 200
        assert response.json()["mode"] == "demo"


# ── SSE demo mode tests ──

@pytest.mark.asyncio
async def test_sse_demo_mode_returns_mode_event(monkeypatch):
    """
    When ?mode=demo and the debate is not cached, the SSE stream should
    return a single 'mode' event telling the frontend to use demo mode,
    without calling any LLMs.
    """
    monkeypatch.setattr(settings, "debate_mode", "demo")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/healthcare/stream?mode=demo"
        ) as response:
            assert response.status_code == 200

            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            # Should have exactly one event: the mode signal
            assert len(events) == 1
            assert events[0]["type"] == "mode"
            assert events[0]["mode"] == "demo"


@pytest.mark.asyncio
async def test_sse_demo_mode_from_config_no_query_param(monkeypatch):
    """
    When no ?mode= param is given and config is 'demo', the stream
    should still return the demo mode event.
    """
    monkeypatch.setattr(settings, "debate_mode", "demo")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/healthcare/stream"
        ) as response:
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            assert len(events) == 1
            assert events[0]["type"] == "mode"
            assert events[0]["mode"] == "demo"


# ── Cache replay ignores mode ──

@pytest.mark.asyncio
async def test_sse_cached_debate_replays_regardless_of_demo_mode():
    """
    If a debate is cached, it replays from cache even when mode is 'demo'.
    """
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/test-healthcare/stream?mode=demo"
        ) as response:
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            # Should NOT be a demo mode event — should be a full cache replay
            event_types = [e["type"] for e in events]
            assert "mode" not in event_types
            assert "evidence_loaded" in event_types
            assert "personas" in event_types
            assert "complete" in event_types
            assert events[-1]["cached"] is True


@pytest.mark.asyncio
async def test_sse_cached_debate_replays_regardless_of_live_mode():
    """
    If a debate is cached, it replays from cache even when mode is 'live'.
    """
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/test-healthcare/stream?mode=live"
        ) as response:
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            assert events[-1]["type"] == "complete"
            assert events[-1]["cached"] is True


# ── Query param override ──

@pytest.mark.asyncio
async def test_query_param_overrides_config(monkeypatch):
    """
    ?mode=demo overrides config even when config is 'live'.
    """
    monkeypatch.setattr(settings, "debate_mode", "live")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/nonexistent-topic/stream?mode=demo"
        ) as response:
            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            assert len(events) == 1
            assert events[0]["type"] == "mode"
            assert events[0]["mode"] == "demo"
