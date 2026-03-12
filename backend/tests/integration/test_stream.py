import pytest
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('app.debate.graph.call_agent') # Mock LLM layer so we don't connect to Anthropic
async def test_sse_streaming_endpoint(mock_call_agent):
    """
    Test the /api/debates/{id}/stream endpoint verifying phase messages and content yields.
    """
    # Simply make the LLM return an instant short string so stream tokenises it.
    # In LangGraph context with Claude, streaming tokens come natively. For this test, 
    # since we are faking call_agent, we'll assert the phase transitions primarily, 
    # but let's test the endpoint natively handles the SSE format correctly.
    
    # We will test using httpx async stream
    mock_call_agent.return_value = "Mocked Response"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Request stream endpoint
        async with client.stream("GET", "/api/debates/test-id-123/stream") as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line.replace("data: ", "")))

            # Verify that we got the completion event
            assert len(events) > 0
            assert events[-1]["type"] == "complete"

            # Check for the research consultation phase transition (internal)
            internal_phases = [e for e in events if e["type"] == "phase_transition"]
            assert len(internal_phases) >= 3 # research, eval_openings, eval_full_debate
            assert internal_phases[0]["phase"] == "research_consultation"
            
            # Note: Because call_agent is mocked and returning immediately without simulating 
            # Langchain LLM token streaming (on_chat_model_stream), we won't see "content" events.
            # But we verify that the graph executes fully and yields SSE format transitions correctly.
