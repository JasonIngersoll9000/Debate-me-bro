import json

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from app.main import app


@pytest.mark.asyncio
@patch("app.debate.graph.run_judging_panel")
@patch("app.debate.graph.call_agent")
async def test_sse_streaming_endpoint(mock_call_agent, mock_judging):
    """
    Tests the /api/debates/{id}/stream endpoint for correct SSE format
    and phase transition events.
    """
    mock_call_agent.return_value = "Mocked Response"
    mock_judging.return_value = {
        "scores": {"pro": {}, "con": {}},
        "winner": "pro",
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/test-id-123/stream"
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"].lower().startswith(
                "text/event-stream"
            )

            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            assert len(events) > 0
            assert events[-1]["type"] == "complete"

            # Verify internal phase transitions are emitted
            internal_phases = [
                e for e in events if e["type"] == "phase_transition"
            ]
            assert len(internal_phases) >= 3  # research + 2 eval phases
            assert internal_phases[0]["phase"] == "research_consultation"

            # on_chain_end fallback emits content from debate_turns for
            # public phases (call_agent is mocked, so no token streaming).
            content_events = [e for e in events if e["type"] == "content"]
            assert len(content_events) > 0


@pytest.mark.asyncio
@patch("app.debate.graph.run_judging_panel")
@patch("app.debate.graph.call_agent")
async def test_sse_on_chain_end_dict_output_public_only(
    mock_call_agent, mock_judging
):
    """
    Verifies that on_chain_end dict output extracts only public-phase turn
    text and never leaks internal-phase text.

    Internal nodes (research_consultation, eval_openings, eval_full_debate)
    return a sentinel string via side_effect; public nodes return distinct
    text.  The test asserts only the public text surfaces and the internal
    sentinel never appears in emitted content events.
    """
    internal_text = "INTERNAL SECRET SHOULD NOT LEAK"
    public_text = "PUBLIC DEBATE CONTENT"
    mock_judging.return_value = {
        "scores": {"pro": {}, "con": {}},
        "winner": "pro",
    }

    internal_phase_names = {
        "research_consultation",
        "eval_openings",
        "eval_full_debate",
    }

    async def agent_side_effect(state, phase, side):
        if phase in internal_phase_names:
            return internal_text
        return public_text

    mock_call_agent.side_effect = agent_side_effect

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        async with client.stream(
            "GET", "/api/debates/test-id-456/stream"
        ) as response:
            assert response.status_code == 200

            events = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    events.append(json.loads(line[len("data: "):]))

            content_events = [e for e in events if e["type"] == "content"]
            assert len(content_events) > 0

            chunks = [e.get("chunk", "") for e in content_events]
            combined = "".join(chunks)

            # Public turn text must appear in the emitted chunks
            assert public_text in combined

            # Internal text must never surface in streamed content
            assert internal_text not in combined
