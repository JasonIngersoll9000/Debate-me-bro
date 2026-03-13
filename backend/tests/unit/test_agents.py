import pytest
from unittest.mock import AsyncMock, patch
from app.debate.agents import call_agent, format_evidence, format_history, get_last_opponent_turn
from app.debate.persona_generator import generate_persona


@pytest.fixture
def mock_debate_state():
    return {
        "debate_id": "test-id",
        "topic": "Universal Healthcare",
        "status": "in_progress",
        "current_phase": "rebuttal_pro",
        "debate_turns": [
            {"phase": "opening_pro",
             "side": "pro",
             "text": "Pro opening argument.",
             "is_internal": False},
            {"phase": "opening_con",
             "side": "con",
             "text": "Con opening argument.",
             "is_internal": False}
        ],
        "evidence_bundle": {
            "raw_content": "**[Study 1](url)** claims X.\n**[Study 2](url)** claims Y."
        },
        "personas": {
            "pro": "A confident public health expert.",
            "con": "A pragmatic free-market economist."
        }
    }


def test_format_evidence(mock_debate_state):
    evidence = format_evidence(mock_debate_state)
    assert "Study 1" in evidence


def test_get_last_opponent_turn(mock_debate_state):
    turn = get_last_opponent_turn(mock_debate_state, "con")
    assert turn == "Con opening argument."


def test_format_history(mock_debate_state):
    history = format_history(mock_debate_state)
    assert "PRO (opening_pro)" in history
    assert "Pro opening argument." in history
    assert "CON (opening_con)" in history


@pytest.mark.asyncio
@patch('app.debate.persona_generator.ChatAnthropic')
async def test_generate_persona(mock_chat_class):
    # Setup mock — generate_persona now returns a Persona object parsed from JSON
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = '{"name": "Dr. Test", "identity": "A test persona", "expertise_areas": ["testing"], "core_values": ["truth"], "rhetorical_approach": "data-driven"}'
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)

    result = await generate_persona("Topic", "pro", "Pro position statement")
    assert result.name == "Dr. Test"
    assert result.identity == "A test persona"


@pytest.mark.asyncio
@patch('app.debate.agents.ChatAnthropic')
async def test_call_agent_formatting(mock_chat_class, mock_debate_state):
    mock_instance = mock_chat_class.return_value
    mock_response = AsyncMock()
    mock_response.content = "Rebuttal response."
    mock_instance.ainvoke = AsyncMock(return_value=mock_response)

    result = await call_agent(mock_debate_state, "rebuttal_pro", "pro")

    assert result == "Rebuttal response."
    # Ensure ainvoke was called with Messages
    call_args = mock_instance.ainvoke.call_args[0][0]
    assert len(call_args) == 2  # System and Human
    # System message uses cache_control structure: content is a list of dicts
    sys_content = call_args[0].content
    if isinstance(sys_content, list):
        sys_text = sys_content[0]["text"]
    else:
        sys_text = sys_content
    assert "Universal Healthcare" in sys_text

    # Human message also uses cache_control structure
    human_content = call_args[1].content
    if isinstance(human_content, list):
        human_text = " ".join(block["text"] for block in human_content)
    else:
        human_text = human_content
    assert "Study 1" in human_text  # evidence should be injected
    assert "Con opening argument." in human_text  # opponent turn should be injected
