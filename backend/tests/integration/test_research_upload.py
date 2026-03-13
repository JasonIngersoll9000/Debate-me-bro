"""
Integration tests for research upload flow — Issue #12.
Tests: analyze → upload pro → upload con → status → EvidenceLoader.
"""
import os
import json
import shutil
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.debate.evidence import EvidenceLoader
from app.routes.research import EVIDENCE_BASE, TOPICS_DIR


MOCK_ANALYSIS_JSON = json.dumps({
    "resolution": "Should AI be regulated?",
    "pro_position": "AI regulation protects society from harm.",
    "con_position": "AI regulation stifles innovation.",
    "pro_dimensions": ["Safety", "Accountability"],
    "con_dimensions": ["Innovation", "Competition"],
    "pro_values": ["safety", "fairness"],
    "con_values": ["freedom", "progress"],
    "key_contested_facts": ["Whether regulation slows AI development"],
    "pro_persona_suggestion": "AI safety researcher",
    "con_persona_suggestion": "Tech industry economist",
})

PRO_RESEARCH_MD = """## Argument 1: Safety First

### Core Claim
AI systems can cause significant harm without proper oversight.

### Supporting Evidence
**[AI Safety Report](https://example.com/safety)** (NIST, 2024): Found that 60% of deployed AI systems had undisclosed failure modes.

## Source Bibliography
[AI Safety Report](https://example.com/safety) — NIST, 2024
"""

CON_RESEARCH_MD = """## Argument 1: Innovation Engine

### Core Claim
Regulation creates barriers that slow beneficial AI development.

### Supporting Evidence
**[Innovation Index](https://example.com/innovation)** (Brookings, 2024): Heavily regulated markets saw 40% less AI startup activity.

## Source Bibliography
[Innovation Index](https://example.com/innovation) — Brookings, 2024
"""


@pytest.fixture
def cleanup_test_data():
    """Clean up test data after each test."""
    created_topic_ids = []
    yield created_topic_ids
    for topic_id in created_topic_ids:
        evidence_dir = os.path.join(EVIDENCE_BASE, topic_id)
        if os.path.isdir(evidence_dir):
            shutil.rmtree(evidence_dir)
        topic_file = os.path.join(TOPICS_DIR, f"{topic_id}.json")
        if os.path.isfile(topic_file):
            os.remove(topic_file)


@pytest.mark.asyncio
async def test_full_research_upload_flow(cleanup_test_data):
    """Test analyze → upload pro → upload con → status check."""
    mock_response = MagicMock()
    mock_response.content = MOCK_ANALYSIS_JSON

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Analyze topic
        with patch("app.topics.analysis.ChatAnthropic") as MockLLM:
            instance = MockLLM.return_value
            instance.ainvoke = AsyncMock(return_value=mock_response)

            res = await client.post("/api/research/analyze", json={
                "resolution": "Should AI be regulated?",
                "context": "Focus on safety vs innovation",
            })

        assert res.status_code == 200
        data = res.json()
        topic_id = data["topic_id"]
        cleanup_test_data.append(topic_id)

        assert topic_id.startswith("custom-")
        assert data["resolution"] == "Should AI be regulated?"
        assert data["pro_position"] != ""
        assert data["con_position"] != ""
        assert len(data["pro_dimensions"]) >= 1
        assert data["pro_prompt"] != ""
        assert data["con_prompt"] != ""

        # Step 2: Upload Pro research
        res = await client.post(
            f"/api/research/upload/{topic_id}",
            data={"side": "pro"},
            files={"file": ("pro_research.md", PRO_RESEARCH_MD.encode(), "text/markdown")},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "uploaded"
        assert res.json()["ready_to_debate"] is False

        # Step 3: Upload Con research
        res = await client.post(
            f"/api/research/upload/{topic_id}",
            data={"side": "con"},
            files={"file": ("con_research.md", CON_RESEARCH_MD.encode(), "text/markdown")},
        )
        assert res.status_code == 200
        assert res.json()["ready_to_debate"] is True

        # Step 4: Check status
        res = await client.get(f"/api/research/status/{topic_id}")
        assert res.status_code == 200
        status = res.json()
        assert status["pro_uploaded"] is True
        assert status["con_uploaded"] is True
        assert status["ready_to_debate"] is True

    # Step 5: Verify EvidenceLoader can load the uploaded research
    loader = EvidenceLoader(evidence_dir=EVIDENCE_BASE)
    bundle = await loader.load_preset_evidence(topic_id)
    assert "AI systems" in bundle.pro_research
    assert "Innovation" in bundle.con_research or "Regulation" in bundle.con_research
    assert len(bundle.citations) >= 2
    assert len(bundle.pro_arguments) >= 1
    assert len(bundle.con_arguments) >= 1


@pytest.mark.asyncio
async def test_upload_rejects_invalid_side(cleanup_test_data):
    """Upload with invalid side should return 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/research/upload/custom-test1234",
            data={"side": "neutral"},
            files={"file": ("research.md", b"test content", "text/markdown")},
        )
        assert res.status_code == 400
