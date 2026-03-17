"""
Integration tests for the POST /api/debates/{id}/rejudge endpoint.

Tests:
1. Rejudge updates judging_results in stored debate
2. Rejudge returns 404 for missing debate
3. Rejudge returns 401 without auth
4. Rejudge returns 400 for debate with no public turns
"""
from copy import deepcopy
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.debate import store as debate_store
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

    # Patch everywhere the functions are imported
    for mod in (debate_store, debates_router):
        for attr, fn in [("save_debate", _save), ("load_debate", _load),
                         ("get_like_count", _get_like_count), ("get_likes", _get_likes)]:
            if hasattr(mod, attr):
                monkeypatch.setattr(mod, attr, fn)
    yield _debates


SAMPLE_DEBATE = {
    "id": "test-rejudge",
    "topic": "Universal Healthcare",
    "resolution": "Should the US adopt universal healthcare?",
    "pro_position": "Yes",
    "con_position": "No",
    "personas": {
        "pro": {"name": "Dr. Pro", "identity": "Expert"},
        "con": {"name": "Dr. Con", "identity": "Expert"},
    },
    "turns": [
        {"phase": "opening_pro", "side": "pro", "text": "Pro opening.", "is_internal": False},
        {"phase": "opening_con", "side": "con", "text": "Con opening.", "is_internal": False},
        {"phase": "eval_openings", "side": "pro", "text": "Internal.", "is_internal": True},
        {"phase": "rebuttal_pro", "side": "pro", "text": "Pro rebuttal.", "is_internal": False},
        {"phase": "rebuttal_con", "side": "con", "text": "Con rebuttal.", "is_internal": False},
    ],
    "judging_results": {
        "winner": "pro",
        "scores": {
            "pro": {"logic": 4, "evidence": 4, "refutation": 4, "steelman": 4, "weighted_total": 4.0},
            "con": {"logic": 3, "evidence": 3, "refutation": 3, "steelman": 3, "weighted_total": 3.0},
        },
    },
    "status": "completed",
    "created_at": "2026-03-12T00:00:00+00:00",
}

MOCK_PANEL_RESULT = {
    "judges": [
        {
            "judge_name": "Logic Judge",
            "pro_score": 4.2,
            "con_score": 3.8,
            "winner": "pro",
            "winner_explanation": "Pro had stronger logic.",
            "criteria": [
                {"name": "Logical Validity", "weight": 0.35, "pro_score": 4, "con_score": 4,
                 "pro_justification": "Valid", "con_justification": "Valid"},
            ],
        },
        {
            "judge_name": "Evidence Judge",
            "pro_score": 4.0,
            "con_score": 3.5,
            "winner": "pro",
            "winner_explanation": "Pro had better evidence.",
            "criteria": [],
        },
        {
            "judge_name": "Engagement Judge",
            "pro_refutation_score": 4,
            "pro_steelman_score": 4,
            "con_refutation_score": 3,
            "con_steelman_score": 3,
            "overall_winner": "pro",
            "winner_explanation": "Pro engaged more effectively.",
            "criteria": [],
        },
    ],
    "scores": {
        "pro": {"logic": 4.2, "evidence": 4.0, "refutation": 4, "steelman": 4, "weighted_total": 4.06},
        "con": {"logic": 3.8, "evidence": 3.5, "refutation": 3, "steelman": 3, "weighted_total": 3.37},
    },
    "winner": "pro",
    "summary": "Pro wins decisively.",
}


def _make_auth_header() -> dict:
    """Create a valid JWT token for testing."""
    from jose import jwt
    from app.config import settings
    token = jwt.encode({"sub": "test@example.com"}, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
@patch("app.routes.debates.run_judging_panel", new_callable=AsyncMock)
async def test_rejudge_updates_results(mock_panel):
    """POST /api/debates/{id}/rejudge re-runs panel and updates stored data."""
    mock_panel.return_value = MOCK_PANEL_RESULT
    await debate_store.save_debate("test-rejudge", deepcopy(SAMPLE_DEBATE))

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/debates/test-rejudge/rejudge",
            headers=_make_auth_header(),
        )
        assert response.status_code == 200
        body = response.json()
        assert body["detail"] == "Rejudging complete"
        assert body["judging_results"]["winner"] == "pro"
        assert body["judging_results"]["scores"]["pro"]["weighted_total"] == 4.06

    # Verify stored data was updated
    loaded = await debate_store.load_debate("test-rejudge")
    assert loaded is not None
    assert loaded["judging_results"]["summary"] == "Pro wins decisively."
    # Turns should be unchanged
    assert len(loaded["turns"]) == 5

    # Verify the panel was called with a transcript (no internal turns)
    mock_panel.assert_called_once()
    transcript = mock_panel.call_args[0][0]
    assert "Internal." not in transcript
    assert "Pro opening." in transcript


@pytest.mark.asyncio
async def test_rejudge_returns_404_for_missing():
    """POST /api/debates/{id}/rejudge returns 404 for non-existent debate."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/debates/nonexistent/rejudge",
            headers=_make_auth_header(),
        )
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_rejudge_returns_401_without_auth():
    """POST /api/debates/{id}/rejudge returns 401 without JWT."""
    await debate_store.save_debate("test-rejudge", deepcopy(SAMPLE_DEBATE))

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/debates/test-rejudge/rejudge")
        assert response.status_code == 401


@pytest.mark.asyncio
@patch("app.routes.debates.run_judging_panel", new_callable=AsyncMock)
async def test_rejudge_returns_400_no_public_turns(mock_panel):
    """POST /api/debates/{id}/rejudge returns 400 if debate has no public turns."""
    debate_only_internal = deepcopy(SAMPLE_DEBATE)
    debate_only_internal["turns"] = [
        {"phase": "eval_openings", "side": "pro", "text": "Internal only.", "is_internal": True},
    ]
    await debate_store.save_debate("test-rejudge", debate_only_internal)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/debates/test-rejudge/rejudge",
            headers=_make_auth_header(),
        )
        assert response.status_code == 400
    mock_panel.assert_not_called()
