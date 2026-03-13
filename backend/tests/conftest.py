"""
Shared test fixtures for DebateMeBro backend tests.

Provides:
- Async test client for FastAPI integration tests
- Mock Anthropic client to prevent real API calls
- Temporary data directory for test isolation
- Sample debate state and data factories
"""
import os
import json
import shutil
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.debate import store as debate_store


# ── Async test client ──


@pytest.fixture
async def async_client():
    """Provide an httpx AsyncClient bound to the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


# ── Temp data directory (isolates file-based debate store) ──


@pytest.fixture
def temp_data_dir(monkeypatch):
    """Redirect debate store to a temporary directory for test isolation."""
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "debates")
    os.makedirs(data_dir, exist_ok=True)
    monkeypatch.setattr(debate_store, "DATA_DIR", data_dir)
    yield data_dir
    shutil.rmtree(tmpdir, ignore_errors=True)


# ── Mock Anthropic / LLM ──


@pytest.fixture
def mock_anthropic():
    """Patch ChatAnthropic globally to prevent real API calls."""
    with patch("app.debate.agents.ChatAnthropic") as mock_cls:
        mock_instance = MagicMock()
        mock_response = AsyncMock()
        mock_response.content = "Mocked LLM response."
        mock_instance.ainvoke = AsyncMock(return_value=mock_response)
        mock_cls.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_call_agent():
    """Patch call_agent to return a static string without LLM calls."""
    with patch("app.debate.graph.call_agent") as mock_fn:
        mock_fn.return_value = "Mocked agent response."
        yield mock_fn


# ── Sample data factories ──


@pytest.fixture
def sample_debate_state():
    """A minimal debate state dict for unit tests."""
    return {
        "debate_id": "test-debate-001",
        "topic": "Universal Healthcare",
        "status": "in_progress",
        "current_phase": "rebuttal_pro",
        "debate_turns": [
            {
                "phase": "opening_pro",
                "side": "pro",
                "text": "Pro opening argument with evidence.",
                "is_internal": False,
            },
            {
                "phase": "opening_con",
                "side": "con",
                "text": "Con opening argument with evidence.",
                "is_internal": False,
            },
        ],
        "evidence_bundle": {
            "raw_content": "**[Study 1](https://example.com)** shows X.\n**[Study 2](https://example.org)** shows Y."
        },
        "personas": {
            "pro": "A confident public health expert advocating universal coverage.",
            "con": "A pragmatic economist favoring market-based solutions.",
        },
    }


@pytest.fixture
def sample_cached_debate():
    """A complete cached debate dict for integration tests."""
    return {
        "id": "test-cached-debate",
        "topic": "Universal Healthcare",
        "resolution": "Should the US adopt universal healthcare?",
        "pro_position": "Yes, adopt single-payer.",
        "con_position": "No, keep multi-payer.",
        "personas": {
            "pro": {"name": "Dr. Pro", "identity": "Public health expert"},
            "con": {"name": "Dr. Con", "identity": "Health economics expert"},
        },
        "turns": [
            {"phase": "opening_pro", "side": "pro", "text": "Pro opening.", "is_internal": False},
            {"phase": "opening_con", "side": "con", "text": "Con opening.", "is_internal": False},
            {"phase": "rebuttal_pro", "side": "pro", "text": "Pro rebuttal.", "is_internal": False},
            {"phase": "rebuttal_con", "side": "con", "text": "Con rebuttal.", "is_internal": False},
            {"phase": "closing_pro", "side": "pro", "text": "Pro closing.", "is_internal": False},
            {"phase": "closing_con", "side": "con", "text": "Con closing.", "is_internal": False},
        ],
        "judging_results": {
            "winner": "pro",
            "scores": {
                "pro": {"logic": 4, "evidence": 5, "refutation": 4, "steelman": 4},
                "con": {"logic": 4, "evidence": 4, "refutation": 4, "steelman": 3},
            },
        },
        "evidence": {"citations": {}, "pro_arguments": [], "con_arguments": []},
        "status": "completed",
        "created_at": "2026-03-12T00:00:00+00:00",
    }
