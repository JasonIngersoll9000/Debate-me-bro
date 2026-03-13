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
    evidence = format_evidence(mock_debate_state["evidence_bundle"])
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
    # Setup mock
    mock_instance = mock_chat_class.return_value
    mock_chain = AsyncMock()
    mock_response = AsyncMock()
    mock_response.content = " A synthesized test persona description. "
    mock_chain.ainvoke.return_value = mock_response

    # We patch PromptTemplate | LLM chain behavior
    with patch('app.debate.persona_generator.PromptTemplate.from_template') as mock_prompt:
        mock_prompt.return_value.__or__.return_value = mock_chain
        result = await generate_persona("Topic", "pro")
        assert result == "A synthesized test persona description."


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
    sys_msg = call_args[0].content
    assert "Universal Healthcare" in sys_msg
    assert "A confident public health expert." in sys_msg

    human_msg = call_args[1].content
    assert "Study 1" in human_msg  # evidence should be injected
    assert "Con opening argument." in human_msg  # opponent turn should be injected
