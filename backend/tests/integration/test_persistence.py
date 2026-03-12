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
import os
import shutil
import tempfile

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.debate import store as debate_store


@pytest.fixture(autouse=True)
def temp_data_dir(monkeypatch):
    """Redirect the debate store to a temporary directory for test isolation."""
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "debates")
    os.makedirs(data_dir, exist_ok=True)
    monkeypatch.setattr(debate_store, "DATA_DIR", data_dir)
    yield data_dir
    shutil.rmtree(tmpdir, ignore_errors=True)


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
        {"phase": "opening_pro", "side": "pro", "text": "Pro opening argument.", "is_internal": False},
        {"phase": "opening_con", "side": "con", "text": "Con opening argument.", "is_internal": False},
        {"phase": "eval_openings", "side": "pro", "text": "Internal analysis.", "is_internal": True},
        {"phase": "rebuttal_pro", "side": "pro", "text": "Pro rebuttal.", "is_internal": False},
        {"phase": "rebuttal_con", "side": "con", "text": "Con rebuttal.", "is_internal": False},
        {"phase": "closing_pro", "side": "pro", "text": "Pro closing.", "is_internal": False},
        {"phase": "closing_con", "side": "con", "text": "Con closing.", "is_internal": False},
    ],
    "judging_results": {
        "winner": "pro",
        "scores": {
            "pro": {"logic": 4, "evidence": 5, "refutation": 4, "steelman": 4, "weighted_total": 4.3},
            "con": {"logic": 4, "evidence": 4, "refutation": 4, "steelman": 3, "weighted_total": 3.85},
        },
    },
    "evidence": {"citations": {}, "pro_arguments": [], "con_arguments": []},
    "status": "completed",
    "created_at": "2026-03-12T00:00:00+00:00",
}


# ── Unit-level store tests ──

def test_save_and_load_round_trip():
    """Save a debate and load it back — data should be identical."""
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    loaded = debate_store.load_debate("test-healthcare")
    assert loaded is not None
    assert loaded["id"] == "test-healthcare"
    assert loaded["topic"] == "Universal Healthcare"
    assert loaded["status"] == "completed"
    assert len(loaded["turns"]) == 7


def test_load_missing_debate():
    """Loading a non-existent debate returns None."""
    result = debate_store.load_debate("nonexistent-id")
    assert result is None


def test_debate_exists():
    """debate_exists returns True after save, False before."""
    assert debate_store.debate_exists("test-healthcare") is False
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    assert debate_store.debate_exists("test-healthcare") is True


def test_list_debates_returns_summaries():
    """list_debates returns summary info for all saved debates."""
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    debates = debate_store.list_debates()
    assert len(debates) == 1
    assert debates[0]["id"] == "test-healthcare"
    assert debates[0]["topic"] == "Universal Healthcare"
    assert debates[0]["winner"] == "pro"


def test_list_debates_excludes_internal_turns_from_count():
    """turn_count in list_debates should exclude internal turns."""
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())
    debates = debate_store.list_debates()
    # 7 total turns, 1 internal → 6 public
    assert debates[0]["turn_count"] == 6


# ── API endpoint tests ──

@pytest.mark.asyncio
async def test_get_debate_returns_cached():
    """GET /api/debates/{id} returns full data when debate is cached."""
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

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
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

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
    debate_store.save_debate("test-healthcare", SAMPLE_DEBATE.copy())

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
            judging_events = [e for e in events if e["type"] == "judging_results"]
            assert len(judging_events) == 1
            assert judging_events[0]["results"]["winner"] == "pro"

            # Last event should be complete with cached=True
            assert events[-1]["type"] == "complete"
            assert events[-1]["cached"] is True
