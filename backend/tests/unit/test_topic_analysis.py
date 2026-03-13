"""
Unit tests for topic analysis — Issue #11.
Verifies analyze_topic returns valid TopicAnalysis with all required fields.
"""
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.topics.analysis import analyze_topic
from app.models.schemas import TopicAnalysis


MOCK_ANALYSIS_JSON = json.dumps({
    "resolution": "Should the US implement universal healthcare?",
    "pro_position": "Universal healthcare is a fundamental right that improves outcomes and reduces costs.",
    "con_position": "Market-based healthcare drives innovation and preserves individual choice.",
    "pro_dimensions": [
        "Moral and ethical arguments for healthcare as a right",
        "Cost efficiency of single-payer systems",
        "Health outcome comparisons with universal systems",
    ],
    "con_dimensions": [
        "Innovation incentives in competitive markets",
        "Individual liberty and freedom of choice",
        "Government inefficiency and bureaucratic waste",
    ],
    "pro_values": ["equity", "compassion", "collective welfare"],
    "con_values": ["liberty", "innovation", "personal responsibility"],
    "key_contested_facts": [
        "Whether single-payer reduces total healthcare spending",
        "Impact on pharmaceutical innovation timelines",
    ],
    "pro_persona_suggestion": "A public health policy researcher with expertise in comparative health systems",
    "con_persona_suggestion": "A health economics professor specializing in market-based healthcare models",
})


@pytest.mark.asyncio
async def test_analyze_topic_returns_valid_topic_analysis():
    """analyze_topic should return a TopicAnalysis with all expected fields."""
    mock_response = MagicMock()
    mock_response.content = MOCK_ANALYSIS_JSON

    with patch("app.topics.analysis.ChatAnthropic") as MockLLM:
        instance = MockLLM.return_value
        instance.ainvoke = AsyncMock(return_value=mock_response)

        result = await analyze_topic("Should the US implement universal healthcare?")

    assert isinstance(result, TopicAnalysis)
    assert result.resolution == "Should the US implement universal healthcare?"
    assert "right" in result.pro_position.lower()
    assert len(result.pro_dimensions) == 3
    assert len(result.con_dimensions) == 3
    assert len(result.pro_values) >= 2
    assert len(result.con_values) >= 2
    assert len(result.key_contested_facts) >= 1
    assert result.pro_persona_suggestion != ""
    assert result.con_persona_suggestion != ""


@pytest.mark.asyncio
async def test_analyze_topic_handles_malformed_json():
    """analyze_topic should return a fallback TopicAnalysis on parse failure."""
    mock_response = MagicMock()
    mock_response.content = "This is not valid JSON at all"

    with patch("app.topics.analysis.ChatAnthropic") as MockLLM:
        instance = MockLLM.return_value
        instance.ainvoke = AsyncMock(return_value=mock_response)

        result = await analyze_topic("Test resolution")

    assert isinstance(result, TopicAnalysis)
    assert result.resolution == "Test resolution"
    assert "In favor of" in result.pro_position
    assert "Against" in result.con_position


@pytest.mark.asyncio
async def test_analyze_topic_handles_json_in_code_block():
    """analyze_topic should extract JSON from markdown code blocks."""
    mock_response = MagicMock()
    mock_response.content = f"```json\n{MOCK_ANALYSIS_JSON}\n```"

    with patch("app.topics.analysis.ChatAnthropic") as MockLLM:
        instance = MockLLM.return_value
        instance.ainvoke = AsyncMock(return_value=mock_response)

        result = await analyze_topic("Should the US implement universal healthcare?")

    assert isinstance(result, TopicAnalysis)
    assert result.resolution == "Should the US implement universal healthcare?"
    assert len(result.pro_dimensions) == 3


@pytest.mark.asyncio
async def test_analyze_topic_passes_user_context():
    """analyze_topic should include user context in the prompt."""
    mock_response = MagicMock()
    mock_response.content = MOCK_ANALYSIS_JSON

    with patch("app.topics.analysis.ChatAnthropic") as MockLLM:
        instance = MockLLM.return_value
        instance.ainvoke = AsyncMock(return_value=mock_response)

        await analyze_topic("Test", user_context="Focus on economic aspects")

        call_args = instance.ainvoke.call_args[0][0]
        prompt_text = call_args[0].content
        assert "Focus on economic aspects" in prompt_text
