"""
Tests for debate persistence store — store.py.
Uses mock async sessions to test PostgreSQL-backed storage logic
without requiring a live database connection.
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.debate import store


# ── Helpers ─────────────────────────────────────────────────────────────

def _mock_session_factory():
    """Build a mock async session factory for test isolation."""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=False)

    factory = MagicMock()
    factory.return_value = session
    return factory, session


@pytest.fixture(autouse=True)
def patch_session_factory():
    """Patch _get_session_factory globally for all tests."""
    factory, session = _mock_session_factory()
    with patch.object(store, "_get_session_factory", return_value=factory):
        yield session


# ── save_debate ─────────────────────────────────────────────────────────

async def test_save_debate_calls_execute_and_commit(patch_session_factory):
    session = patch_session_factory
    data = {"topic": "Test Topic", "turns": []}
    await store.save_debate("test-debate", data)

    # Should have called execute (for upsert) and commit
    session.execute.assert_called_once()
    session.commit.assert_called_once()
    # Metadata should have been set
    assert data["id"] == "test-debate"
    assert data["status"] == "completed"
    assert "created_at" in data


async def test_save_preserves_existing_metadata(patch_session_factory):
    data = {"topic": "X", "id": "custom-id", "status": "in_progress"}
    await store.save_debate("test-id", data)
    # setdefault should not overwrite existing keys
    assert data["id"] == "custom-id"
    assert data["status"] == "in_progress"


# ── load_debate ─────────────────────────────────────────────────────────

async def test_load_debate_returns_data(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = {"topic": "Healthcare", "id": "healthcare"}
    session.execute.return_value = mock_result

    result = await store.load_debate("healthcare")
    assert result is not None
    assert result["topic"] == "Healthcare"


async def test_load_nonexistent_debate(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_result

    result = await store.load_debate("does-not-exist")
    assert result is None


# ── debate_exists ───────────────────────────────────────────────────────

async def test_debate_exists_true(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 1
    session.execute.return_value = mock_result

    assert await store.debate_exists("exists-test") is True


async def test_debate_exists_false(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 0
    session.execute.return_value = mock_result

    assert await store.debate_exists("nope") is False


async def test_debate_exists_invalid_id():
    assert await store.debate_exists("../../etc/passwd") is False


# ── list_debates ────────────────────────────────────────────────────────

async def test_list_debates_empty(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.all.return_value = []
    session.execute.return_value = mock_result

    debates = await store.list_debates()
    assert debates == []


async def test_list_debates_returns_summaries(patch_session_factory):
    session = patch_session_factory
    debate_data = {
        "id": "debate-a",
        "topic": "Topic A",
        "resolution": "Resolve A",
        "turns": [
            {"phase": "opening_pro", "side": "pro", "text": "...", "is_internal": False},
        ],
        "judging_results": {
            "winner": "pro",
            "scores": {
                "pro": {"weighted_total": 4.5},
                "con": {"weighted_total": 3.2},
            },
        },
    }
    mock_result = MagicMock()
    mock_result.all.return_value = [("debate-a", debate_data)]
    session.execute.return_value = mock_result

    debates = await store.list_debates()
    assert len(debates) == 1
    d = debates[0]
    assert d["id"] == "debate-a"
    assert d["topic"] == "Topic A"
    assert d["winner"] == "pro"
    assert d["pro_score"] == 4.5
    assert d["turn_count"] == 1


# ── delete_debate ───────────────────────────────────────────────────────

async def test_delete_debate_success(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.rowcount = 1
    session.execute.return_value = mock_result

    assert await store.delete_debate("del-me") is True
    session.commit.assert_called_once()


async def test_delete_nonexistent(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.rowcount = 0
    session.execute.return_value = mock_result

    assert await store.delete_debate("nope") is False


async def test_delete_invalid_id():
    assert await store.delete_debate("../../etc/passwd") is False


# ── likes ───────────────────────────────────────────────────────────────

async def test_like_toggle_on(patch_session_factory):
    session = patch_session_factory
    # No existing like → should add one
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_result

    result = await store.like_debate("likeable", "user@test.com")
    assert result is True
    session.add.assert_called_once()
    session.commit.assert_called_once()


async def test_like_toggle_off(patch_session_factory):
    session = patch_session_factory
    # Existing like → should remove it
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = 42  # existing like id
    session.execute.return_value = mock_result

    result = await store.like_debate("likeable", "user@test.com")
    assert result is False
    # execute called twice: once for select, once for delete
    assert session.execute.call_count == 2
    session.commit.assert_called_once()


async def test_get_like_count(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 3
    session.execute.return_value = mock_result

    count = await store.get_like_count("popular")
    assert count == 3


async def test_get_likes(patch_session_factory):
    session = patch_session_factory
    mock_result = MagicMock()
    mock_result.all.return_value = [("a@test.com",), ("b@test.com",)]
    session.execute.return_value = mock_result

    likes = await store.get_likes("popular")
    assert "a@test.com" in likes
    assert "b@test.com" in likes


# ── validation / security ──────────────────────────────────────────────

async def test_invalid_debate_id_rejected():
    with pytest.raises(ValueError, match="Invalid debate_id"):
        await store.save_debate("../../etc/passwd", {"topic": "hack"})


async def test_path_traversal_rejected():
    with pytest.raises(ValueError):
        await store.save_debate("..%2F..%2Fetc%2Fpasswd", {"topic": "hack"})
