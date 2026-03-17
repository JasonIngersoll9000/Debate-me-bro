"""
Integration tests for debate persistence and caching — Issue #16.

Tests:
1. save_debate + load_debate round-trip
2. list_debates returns saved debates
3. GET /api/debates/{id} returns cached data
4. GET /api/debates/{id} returns 404 for missing debate
5. GET /api/debates/ lists all completed debates
6. SSE stream replays from cache when debate exists
"""
import json

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
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

    async def _exists(debate_id):
        return debate_id in _debates

    async def _list():
        result = []
        for did, data in _debates.items():
            judging = data.get("judging_results") or {}
            scores = judging.get("scores", {})
            result.append({
                "id": data.get("id", did),
                "topic": data.get("topic", "Unknown"),
                "resolution": data.get("resolution", ""),
                "pro_position": data.get("pro_position", ""),
                "con_position": data.get("con_position", ""),
                "status": data.get("status", "unknown"),
                "created_at": data.get("created_at", ""),
                "created_by": data.get("created_by", ""),
                "winner": judging.get("winner", ""),
                "pro_score": scores.get("pro", {}).get("weighted_total", 0),
                "con_score": scores.get("con", {}).get("weighted_total", 0),
                "turn_count": len([
                    t for t in data.get("turns", [])
                    if not t.get("is_internal", False)
                ]),
            })
        return result

    async def _get_like_count(debate_id):
        return 0

    async def _get_likes(debate_id):
        return []

    # Patch everywhere the functions are imported
    for mod in (debate_store, debate_stream, debates_router):
        for attr, fn in [("save_debate", _save), ("load_debate", _load)]:
            if hasattr(mod, attr):
                monkeypatch.setattr(mod, attr, fn)
    for attr, fn in [("list_debates", _list), ("debate_exists", _exists),
                     ("get_like_count", _get_like_count), ("get_likes", _get_likes)]:
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
        {
            "phase": "opening_pro", "side": "pro",
            "text": "Pro opening argument.", "is_internal": False,
        },
        {
            "phase": "opening_con", "side": "con",
            "text": "Con opening argument.", "is_internal": False,
        },
        {
            "phase": "eval_openings", "side": "pro",
            "text": "Internal analysis.", "is_internal": True,
        },
        {
            "phase": "rebuttal_pro", "side": "pro",
            "text": "Pro rebuttal.", "is_internal": False,
        },
        {
            "phase": "rebuttal_con", "side": "con",
            "text": "Con rebuttal.", "is_internal": False,
        },
        {
            "phase": "closing_pro", "side": "pro",
            "text": "Pro closing.", "is_internal": False,
        },
        {
            "phase": "closing_con", "side": "con",
            "text": "Con closing.", "is_internal": False,
        },
    ],
    "judging_results": {
        "winner": "pro",
        "scores": {
            "pro": {
                "logic": 4, "evidence": 5,
                "refutation": 4, "steelman": 4,
                "weighted_total": 4.3,
            },
            "con": {
                "logic": 4, "evidence": 4,
                "refutation": 4, "steelman": 3,
                "weighted_total": 3.85,
            },
        },
    },
    "evidence": {"citations": {}, "pro_arguments": [], "con_arguments": []},
    "status": "completed",
    "created_at": "2026-03-12T00:00:00+00:00",
}


# ── Unit-level store tests ──

async def test_save_and_load_round_trip():
    """Save a debate and load it back — data should be identical."""
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    loaded = await debate_store.load_debate("test-healthcare")
    assert loaded is not None
    assert loaded["id"] == "test-healthcare"
    assert loaded["topic"] == "Universal Healthcare"
    assert loaded["status"] == "completed"
    assert len(loaded["turns"]) == 7


async def test_load_missing_debate():
    """Loading a non-existent debate returns None."""
    result = await debate_store.load_debate("nonexistent-id")
    assert result is None


async def test_debate_exists():
    """debate_exists returns True after save, False before."""
    assert await debate_store.debate_exists("test-healthcare") is False
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    assert await debate_store.debate_exists("test-healthcare") is True


async def test_list_debates_returns_summaries():
    """list_debates returns summary info for all saved debates."""
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    debates = await debate_store.list_debates()
    assert len(debates) == 1
    assert debates[0]["id"] == "test-healthcare"
    assert debates[0]["topic"] == "Universal Healthcare"
    assert debates[0]["winner"] == "pro"


async def test_list_debates_excludes_internal_turns_from_count():
    """turn_count in list_debates should exclude internal turns."""
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    debates = await debate_store.list_debates()
    # 7 total turns, 1 internal → 6 public
    assert debates[0]["turn_count"] == 6


# ── API endpoint tests ──

@pytest.mark.asyncio
async def test_get_debate_returns_cached():
    """GET /api/debates/{id} returns full data when debate is cached."""
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/debates/test-healthcare")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-healthcare"
        assert data["topic"] == "Universal Healthcare"
        assert data["status"] == "completed"
        assert len(data["turns"]) == 7


@pytest.mark.asyncio
async def test_get_debate_returns_404_for_missing():
    """GET /api/debates/{id} returns 404 for non-existent debate."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/debates/nonexistent")
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_debates_endpoint():
    """GET /api/debates/ returns list of completed debates."""
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/debates/")
        assert response.status_code == 200
        debates = response.json()
        assert len(debates) == 1
        assert debates[0]["id"] == "test-healthcare"


@pytest.mark.asyncio
async def test_sse_replays_from_cache():
    """
    When a completed debate exists in the store, the SSE stream endpoint
    should replay it from cache (no LLM calls) and emit the expected events.
    """
    await debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/test-healthcare/stream"
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"].lower().startswith(
                "text/event-stream"
            )

            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            # Should have events
            assert len(events) > 0

            # First event should be evidence_loaded
            assert events[0]["type"] == "evidence_loaded"
            assert events[0]["topic"] == "Universal Healthcare"

            # Second event should be personas
            assert events[1]["type"] == "personas"
            assert events[1]["pro"]["name"] == "Dr. Pro"

            # Should have content events for public turns
            content_events = [e for e in events if e["type"] == "content"]
            assert len(content_events) > 0

            # Should have judging results
            judging_events = [
                e for e in events if e["type"] == "judging_results"
            ]
            assert len(judging_events) == 1
            assert judging_events[0]["results"]["winner"] == "pro"

            # Last event should be complete with cached=True
            assert events[-1]["type"] == "complete"
            assert events[-1]["cached"] is True
