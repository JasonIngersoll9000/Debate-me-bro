"""
Additional tests for agents.py — covers uncovered branches.
"""
import pytest
from unittest.mock import AsyncMock, patch

from app.debate.agents import format_evidence, get_persona, get_last_opponent_turn, call_agent


# ── format_evidence branches ────────────────────────────────────────────

def test_format_evidence_raw_content():
    """When raw_content is present, it's returned directly."""
    state = {"evidence_bundle": {"raw_content": "Full evidence text"}}
    assert format_evidence(state) == "Full evidence text"


def test_format_evidence_pro_con_fallback():
    """When raw_content is empty, falls back to pro + con concatenation."""
    state = {
        "evidence_bundle": {
            "raw_content": "",
            "pro_research": "Pro side research",
            "con_research": "Con side research",
        }
    }
    result = format_evidence(state)
    assert "### PRO RESEARCH" in result
    assert "Pro side research" in result
    assert "### CON RESEARCH" in result
    assert "Con side research" in result


def test_format_evidence_pro_only():
    state = {
        "evidence_bundle": {
            "raw_content": "",
            "pro_research": "Only pro",
            "con_research": "",
        }
    }
    result = format_evidence(state)
    assert "### PRO RESEARCH" in result
    assert "Only pro" in result


def test_format_evidence_no_evidence():
    """When no evidence is available at all."""
    state = {"evidence_bundle": {}}
    assert format_evidence(state) == "No evidence provided."


def test_format_evidence_missing_bundle():
    """When evidence_bundle key is missing entirely."""
    state = {}
    assert format_evidence(state) == "No evidence provided."


# ── get_persona branches ────────────────────────────────────────────────

def test_get_persona_dict():
    """When persona data is a dict, returns a Persona object."""
    state = {
        "personas": {
            "pro": {
                "name": "Dr. Expert",
                "identity": "A healthcare expert",
                "expertise_areas": ["medicine"],
                "core_values": ["truth"],
                "rhetorical_approach": "Data-driven",
            }
        }
    }
    persona = get_persona(state, "pro")
    assert persona.name == "Dr. Expert"
    assert persona.identity == "A healthcare expert"


def test_get_persona_fallback_pro():
    """When persona is a string (legacy format), returns fallback."""
    state = {"personas": {"pro": "Just a string description"}}
    persona = get_persona(state, "pro")
    assert persona.name == "Dr. A. Proctor"


def test_get_persona_fallback_con():
    state = {"personas": {"con": "A string"}}
    persona = get_persona(state, "con")
    assert persona.name == "Dr. R. Counter"


def test_get_persona_missing():
    """When personas dict is empty."""
    state = {"personas": {}}
    persona = get_persona(state, "pro")
    assert persona.name == "Dr. A. Proctor"


# ── get_last_opponent_turn ──────────────────────────────────────────────

def test_get_last_opponent_turn_found():
    state = {
        "debate_turns": [
            {"side": "pro", "text": "Pro 1", "is_internal": False},
            {"side": "con", "text": "Con 1", "is_internal": False},
            {"side": "con", "text": "Con 2", "is_internal": False},
        ]
    }
    assert get_last_opponent_turn(state, "con") == "Con 2"


def test_get_last_opponent_turn_none():
    state = {"debate_turns": []}
    assert get_last_opponent_turn(state, "con") == "None"


def test_get_last_opponent_turn_skips_internal():
    state = {
        "debate_turns": [
            {"side": "con", "text": "Internal", "is_internal": True},
            {"side": "con", "text": "Public", "is_internal": False},
        ]
    }
    assert get_last_opponent_turn(state, "con") == "Public"


# ── call_agent phase branches ───────────────────────────────────────────

_BASE_STATE = {
    "debate_id": "test",
    "topic": "Test Topic",
    "resolution": "Should we test?",
    "pro_position": "Yes",
    "con_position": "No",
    "status": "in_progress",
    "current_phase": "opening_pro",
    "debate_turns": [
        {"phase": "opening_pro", "side": "pro", "text": "Pro opening.", "is_internal": False},
        {"phase": "opening_con", "side": "con", "text": "Con opening.", "is_internal": False},
    ],
    "evidence_bundle": {"raw_content": "Evidence text here."},
    "personas": {
        "pro": {"name": "Dr. Pro", "identity": "Expert", "expertise_areas": [], "core_values": [], "rhetorical_approach": "data"},
        "con": {"name": "Dr. Con", "identity": "Expert", "expertise_areas": [], "core_values": [], "rhetorical_approach": "data"},
    },
}


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_research_consultation(mock_chat_class):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Research analysis."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)
    result = await call_agent(_BASE_STATE, "research_consultation", "pro")
    assert result == "Research analysis."


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_opening(mock_chat_class):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Opening statement."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)
    result = await call_agent(_BASE_STATE, "opening_pro", "pro")
    assert result == "Opening statement."


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_eval_openings(mock_chat_class):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Evaluation of openings."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)
    result = await call_agent(_BASE_STATE, "eval_openings", "pro")
    assert result == "Evaluation of openings."


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_eval_full_debate(mock_chat_class):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Full debate evaluation."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)
    result = await call_agent(_BASE_STATE, "eval_full_debate", "pro")
    assert result == "Full debate evaluation."


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_closing(mock_chat_class):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Closing statement."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)
    result = await call_agent(_BASE_STATE, "closing_pro", "pro")
    assert result == "Closing statement."
