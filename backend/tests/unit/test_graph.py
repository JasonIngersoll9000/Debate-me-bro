import pytest
from unittest.mock import patch
from app.debate.graph import create_debate_graph

@pytest.mark.asyncio
@patch('app.debate.graph.call_agent')
async def test_debate_graph_sequential_flow(mock_call_agent):
    """
    Simulates a full pass of the synchronous LangGraph state machine.
    """
    # Mock the LLM calls to return placeholder strings so we only test node sequencing
    mock_call_agent.return_value = "Mocked LLM Response"
    
    app = create_debate_graph()
    
    initial_state = {
        "debate_id": "test-uuid-123",
        "topic": "healthcare",
        "status": "in_progress",
        "current_phase": "initial",
        "debate_turns": [],
        "evidence_bundle": None,
        "personas": {"pro": "Test Persona A", "con": "Test Persona B"}
    }
    
    # Run the graph until END
    final_state = await app.ainvoke(initial_state)
    
    assert final_state["current_phase"] == "judging"
    assert final_state["status"] == "completed"
    
    # We mapped 6 distinct node string responses and 3 internal evaluation rounds
    # Total array objects attached to debate_turns should reflect all Graph Nodes hit
    turns = final_state["debate_turns"]
    
    # internal phases have 2 turns each, public phases have 1 turn each
    # phases: research(2), open_pro(1), open_con(1), eval_openings(2), rebut_pro(1), rebut_con(1), eval_full(2), close_pro(1), close_con(1)
    # Total = 12 turns appended
    assert len(turns) == 12
    
    # Verify the streamed texts hit the mock LLM properly
    assert turns[2]["phase"] == "opening_pro"
    assert turns[2]["text"] == "Mocked LLM Response"
    
    assert turns[3]["phase"] == "opening_con"
    assert turns[4]["phase"] == "eval_openings"
