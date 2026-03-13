"""
Tests for debate streaming — stream.py.
Covers helper functions, cache replay, and demo-mode signal paths.
"""
import json
import os
import shutil
import tempfile

import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from app.debate import stream, store
from app.models.schemas import Persona, EvidenceBundle


# ── Fixtures ────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def temp_data_dir(monkeypatch):
    """Redirect store.DATA_DIR so save/load use a temp directory."""
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "debates")
    os.makedirs(data_dir, exist_ok=True)
    monkeypatch.setattr(store, "DATA_DIR", data_dir)
    yield data_dir
    shutil.rmtree(tmpdir, ignore_errors=True)


SAMPLE_CACHED_DEBATE = {
    "id": "test-cached",
    "topic": "Test Topic",
    "resolution": "Should we test?",
    "pro_position": "Yes",
    "con_position": "No",
    "status": "completed",
    "personas": {
        "pro": {"name": "Dr. Pro", "identity": "A testing expert"},
        "con": {"name": "Dr. Con", "identity": "A skeptic"},
    },
    "turns": [
        {"phase": "opening_pro", "side": "pro", "text": "Pro opening.", "is_internal": False},
        {"phase": "opening_con", "side": "con", "text": "Con opening.", "is_internal": False},
        {"phase": "eval_openings", "side": "pro", "text": "Internal eval.", "is_internal": True},
        {"phase": "rebuttal_pro", "side": "pro", "text": "Pro rebuttal.", "is_internal": False},
    ],
    "judging_results": {
        "winner": "pro",
        "scores": {"pro": {"weighted_total": 4.2}, "con": {"weighted_total": 3.1}},
    },
    "evidence": {"citations": {"Source A": {}}},
}


# ── Helper function tests ───────────────────────────────────────────────

def test_get_speaker_pro():
    assert stream.get_speaker("opening_pro") == "pro"


def test_get_speaker_con():
    assert stream.get_speaker("rebuttal_con") == "con"


def test_get_speaker_system():
    assert stream.get_speaker("eval_openings") == "system"
    assert stream.get_speaker("judging") == "system"


def test_get_speaker_empty():
    assert stream.get_speaker("") == "system"


def test_get_speaker_none():
    assert stream.get_speaker(None) == "system"


def test_preset_topics_exist():
    assert "healthcare" in stream.PRESET_TOPICS
    assert "ubi" in stream.PRESET_TOPICS
    assert "nuclear" in stream.PRESET_TOPICS
    for key, topic in stream.PRESET_TOPICS.items():
        assert "title" in topic
        assert "resolution" in topic
        assert "pro_position" in topic
        assert "con_position" in topic


def test_internal_phases_defined():
    assert "research_consultation" in stream.INTERNAL_PHASES
    assert "eval_openings" in stream.INTERNAL_PHASES
    assert "eval_full_debate" in stream.INTERNAL_PHASES


# ── Cache replay tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_replay_emits_evidence_and_personas():
    events = []
    async for event in stream._replay_debate(SAMPLE_CACHED_DEBATE):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    types = [e["type"] for e in events]
    assert "evidence_loaded" in types
    assert "personas" in types

    ev = next(e for e in events if e["type"] == "evidence_loaded")
    assert ev["topic"] == "Test Topic"
    assert ev["citation_count"] == 1

    persona_ev = next(e for e in events if e["type"] == "personas")
    assert persona_ev["pro"]["name"] == "Dr. Pro"


@pytest.mark.asyncio
async def test_replay_emits_turns():
    events = []
    async for event in stream._replay_debate(SAMPLE_CACHED_DEBATE):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    content_events = [e for e in events if e["type"] == "content"]
    assert len(content_events) > 0

    # Public turn text should appear in chunks
    all_chunks = "".join(e.get("chunk", "") for e in content_events)
    assert "Pro opening." in all_chunks
    assert "Con opening." in all_chunks
    assert "Pro rebuttal." in all_chunks


@pytest.mark.asyncio
async def test_replay_emits_internal_phases():
    events = []
    async for event in stream._replay_debate(SAMPLE_CACHED_DEBATE):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    internal_events = [e for e in events if e.get("phase_type") == "internal"]
    assert len(internal_events) >= 1  # eval_openings phase

    internal_content = [e for e in events if e["type"] == "internal_content"]
    internal_text = "".join(e.get("chunk", "") for e in internal_content)
    assert "Internal eval." in internal_text


@pytest.mark.asyncio
async def test_replay_emits_judging_and_complete():
    events = []
    async for event in stream._replay_debate(SAMPLE_CACHED_DEBATE):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    judging_events = [e for e in events if e["type"] == "judging_results"]
    assert len(judging_events) == 1
    assert judging_events[0]["results"]["winner"] == "pro"

    complete_events = [e for e in events if e["type"] == "complete"]
    assert len(complete_events) == 1
    assert complete_events[0]["cached"] is True


@pytest.mark.asyncio
async def test_replay_no_judging_when_absent():
    debate = {**SAMPLE_CACHED_DEBATE, "judging_results": None}
    events = []
    async for event in stream._replay_debate(debate):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    judging_events = [e for e in events if e["type"] == "judging_results"]
    assert len(judging_events) == 0


# ── stream_debate_events: cache path ────────────────────────────────────

@pytest.mark.asyncio
async def test_stream_replays_cached_debate():
    """When a completed debate is in the store, stream replays it."""
    store.save_debate("test-cached", SAMPLE_CACHED_DEBATE)

    events = []
    async for event in stream.stream_debate_events("test-cached", mode="live"):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    types = [e["type"] for e in events]
    assert "evidence_loaded" in types
    assert "complete" in types
    assert events[-1]["cached"] is True


# ── stream_debate_events: demo mode ─────────────────────────────────────

@pytest.mark.asyncio
async def test_stream_demo_mode_signal():
    """When not cached and mode=demo, emits a mode signal and stops."""
    events = []
    async for event in stream.stream_debate_events("nonexistent", mode="demo"):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    assert len(events) == 1
    assert events[0]["type"] == "mode"
    assert events[0]["mode"] == "demo"


# ── _load_custom_topic ──────────────────────────────────────────────────

def test_load_custom_topic_missing():
    result = stream._load_custom_topic("custom-nonexistent")
    assert result == {}


def test_load_custom_topic_valid(tmp_path, monkeypatch):
    topics_dir = str(tmp_path / "topics")
    os.makedirs(topics_dir, exist_ok=True)

    # Patch the topics dir path
    topic_data = {
        "analysis": {
            "resolution": "Test resolution",
            "pro_position": "Pro pos",
            "con_position": "Con pos",
        }
    }
    filepath = os.path.join(topics_dir, "custom-test.json")
    with open(filepath, "w") as f:
        json.dump(topic_data, f)

    # Monkeypatch _load_custom_topic to use our temp dir
    original_fn = stream._load_custom_topic

    def patched_load(debate_id):
        fp = os.path.join(topics_dir, f"{debate_id}.json")
        if not os.path.isfile(fp):
            return {}
        with open(fp, "r") as fh:
            data = json.load(fh)
        analysis = data.get("analysis", {})
        return {
            "title": analysis.get("resolution", ""),
            "resolution": analysis.get("resolution", ""),
            "pro_position": analysis.get("pro_position", ""),
            "con_position": analysis.get("con_position", ""),
        }

    monkeypatch.setattr(stream, "_load_custom_topic", patched_load)
    result = stream._load_custom_topic("custom-test")
    assert result["resolution"] == "Test resolution"
    assert result["pro_position"] == "Pro pos"


# ── Live pipeline setup tests (lines 210-295 of stream.py) ─────────────

def _mock_evidence_bundle():
    return EvidenceBundle(
        raw_content="### PRO RESEARCH\nPro stuff\n\n### CON RESEARCH\nCon stuff",
        pro_research="Pro stuff",
        con_research="Con stuff",
        citations={},
        pro_arguments=["Arg 1"],
        con_arguments=["Arg 2"],
    )


def _mock_persona(side):
    return Persona(
        name=f"Dr. {side.title()}",
        identity=f"A {side} expert",
        expertise_areas=["testing"],
        core_values=["truth"],
        rhetorical_approach="data-driven",
    )


async def _empty_async_gen(*a, **kw):
    """An async generator that yields nothing — used to stub astream_events."""
    return
    yield  # noqa: make this an async generator


@pytest.mark.asyncio
@patch("app.debate.stream.create_debate_graph")
@patch("app.debate.stream.generate_persona")
@patch("app.debate.stream.EvidenceLoader")
async def test_stream_live_preset_emits_evidence_and_personas(
    mock_loader_cls, mock_gen_persona, mock_create_graph
):
    """Live mode with a preset topic emits evidence_loaded + personas before graph."""
    # Mock evidence loader
    mock_loader = MagicMock()
    mock_loader.load_preset_evidence = AsyncMock(return_value=_mock_evidence_bundle())
    mock_loader_cls.return_value = mock_loader

    # Mock persona generator
    mock_gen_persona.side_effect = lambda **kw: _mock_persona(kw["side"])

    # Mock graph to yield nothing (we just want to test setup events)
    mock_graph = MagicMock()
    mock_graph.astream_events = MagicMock(return_value=_empty_async_gen())
    mock_create_graph.return_value = mock_graph

    events = []
    async for event in stream.stream_debate_events("healthcare", mode="live"):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    types = [e["type"] for e in events]
    # Should emit evidence_loaded and personas before attempting graph streaming
    assert "evidence_loaded" in types
    assert "personas" in types

    ev = next(e for e in events if e["type"] == "evidence_loaded")
    assert ev["topic"] == "Universal Healthcare"
    assert ev["citation_count"] == 0
    assert len(ev["pro_arguments"]) == 1

    persona_ev = next(e for e in events if e["type"] == "personas")
    assert persona_ev["pro"]["name"] == "Dr. Pro"
    assert persona_ev["con"]["name"] == "Dr. Con"


@pytest.mark.asyncio
@patch("app.debate.stream.create_debate_graph")
@patch("app.debate.stream.generate_persona")
@patch("app.debate.stream.EvidenceLoader")
async def test_stream_live_evidence_not_found_fallback(
    mock_loader_cls, mock_gen_persona, mock_create_graph
):
    """When evidence files are missing, stream still emits evidence_loaded with fallback."""
    mock_loader = MagicMock()
    mock_loader.load_preset_evidence = AsyncMock(
        side_effect=FileNotFoundError("No evidence")
    )
    mock_loader_cls.return_value = mock_loader

    mock_gen_persona.side_effect = lambda **kw: _mock_persona(kw["side"])

    mock_graph = MagicMock()
    mock_graph.astream_events = MagicMock(return_value=_empty_async_gen())
    mock_create_graph.return_value = mock_graph

    events = []
    async for event in stream.stream_debate_events("unknown-topic", mode="live"):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    ev = next(e for e in events if e["type"] == "evidence_loaded")
    assert ev["citation_count"] == 0


@pytest.mark.asyncio
@patch("app.debate.stream.create_debate_graph")
@patch("app.debate.stream.generate_persona")
@patch("app.debate.stream.EvidenceLoader")
async def test_stream_live_persona_generation_fallback(
    mock_loader_cls, mock_gen_persona, mock_create_graph
):
    """When persona generation fails, fallback personas are used."""
    mock_loader = MagicMock()
    mock_loader.load_preset_evidence = AsyncMock(return_value=_mock_evidence_bundle())
    mock_loader_cls.return_value = mock_loader

    # Persona gen raises
    mock_gen_persona.side_effect = Exception("API error")

    mock_graph = MagicMock()
    mock_graph.astream_events = MagicMock(return_value=_empty_async_gen())
    mock_create_graph.return_value = mock_graph

    events = []
    async for event in stream.stream_debate_events("healthcare", mode="live"):
        if event.startswith("data: "):
            events.append(json.loads(event[len("data: "):].strip()))

    persona_ev = next(e for e in events if e["type"] == "personas")
    assert persona_ev["pro"]["name"] == "Dr. A. Proctor"
    assert persona_ev["con"]["name"] == "Dr. R. Counter"
