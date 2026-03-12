import json

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from app.main import app


@pytest.mark.asyncio
@patch("app.debate.graph.call_agent")
async def test_sse_streaming_endpoint(mock_call_agent):
    """
    Tests the /api/debates/{id}/stream endpoint for correct SSE format
    and phase transition events.
    """
    mock_call_agent.return_value = "Mocked Response"

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
                    events.append(json.loads(line.replace("data: ", "")))

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
