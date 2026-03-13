"""
Tests for debate persistence store — store.py.
Uses a temporary directory to isolate all file operations.
"""
import json
import os
import shutil
import tempfile

import pytest

from app.debate import store


@pytest.fixture(autouse=True)
def temp_data_dir(monkeypatch):
    """Redirect store.DATA_DIR to a temp directory for test isolation."""
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "debates")
    os.makedirs(data_dir, exist_ok=True)
    monkeypatch.setattr(store, "DATA_DIR", data_dir)
    yield data_dir
    shutil.rmtree(tmpdir, ignore_errors=True)


# ── save / load round-trip ──────────────────────────────────────────────

def test_save_and_load_debate():
    data = {"topic": "Test Topic", "turns": []}
    store.save_debate("test-debate", data)

    loaded = store.load_debate("test-debate")
    assert loaded is not None
    assert loaded["topic"] == "Test Topic"
    assert loaded["id"] == "test-debate"
    assert loaded["status"] == "completed"
    assert "created_at" in loaded


def test_load_nonexistent_debate():
    assert store.load_debate("does-not-exist") is None


def test_debate_exists():
    assert store.debate_exists("nope") is False
    store.save_debate("exists-test", {"topic": "X"})
    assert store.debate_exists("exists-test") is True


def test_save_overwrites():
    store.save_debate("overwrite", {"topic": "V1"})
    store.save_debate("overwrite", {"topic": "V2"})
    loaded = store.load_debate("overwrite")
    assert loaded["topic"] == "V2"


# ── list debates ────────────────────────────────────────────────────────

def test_list_debates_empty():
    debates = store.list_debates()
    assert debates == []


def test_list_debates_returns_summaries():
    store.save_debate("debate-a", {
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
    })
    debates = store.list_debates()
    assert len(debates) == 1
    d = debates[0]
    assert d["id"] == "debate-a"
    assert d["topic"] == "Topic A"
    assert d["winner"] == "pro"
    assert d["pro_score"] == 4.5
    assert d["turn_count"] == 1


# ── delete ──────────────────────────────────────────────────────────────

def test_delete_debate():
    store.save_debate("del-me", {"topic": "Gone"})
    assert store.debate_exists("del-me") is True
    assert store.delete_debate("del-me") is True
    assert store.debate_exists("del-me") is False


def test_delete_nonexistent():
    assert store.delete_debate("nope") is False


# ── likes ───────────────────────────────────────────────────────────────

def test_like_toggle():
    store.save_debate("likeable", {"topic": "Nice"})

    # First like → True (liked)
    assert store.like_debate("likeable", "user@test.com") is True
    assert store.get_like_count("likeable") == 1

    # Second call same user → False (unliked / toggled off)
    assert store.like_debate("likeable", "user@test.com") is False
    assert store.get_like_count("likeable") == 0


def test_multiple_likes():
    store.save_debate("popular", {"topic": "Hot"})
    store.like_debate("popular", "a@test.com")
    store.like_debate("popular", "b@test.com")
    assert store.get_like_count("popular") == 2
    likes = store.get_likes("popular")
    assert "a@test.com" in likes
    assert "b@test.com" in likes


def test_get_likes_no_file():
    assert store.get_likes("no-likes-yet") == []
    assert store.get_like_count("no-likes-yet") == 0


# ── validation / security ──────────────────────────────────────────────

def test_invalid_debate_id_rejected():
    with pytest.raises(ValueError, match="Invalid debate_id"):
        store.save_debate("../../etc/passwd", {"topic": "hack"})


def test_path_traversal_rejected():
    with pytest.raises(ValueError):
        store.save_debate("..%2F..%2Fetc%2Fpasswd", {"topic": "hack"})


def test_load_corrupt_json(temp_data_dir):
    filepath = os.path.join(temp_data_dir, "corrupt.json")
    with open(filepath, "w") as f:
        f.write("{not valid json!!!")
    assert store.load_debate("corrupt") is None
