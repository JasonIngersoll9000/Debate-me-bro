"""
Topic analysis prompt — prompts-doc.md §5.
Uses Claude Haiku to analyze a custom topic and return structured TopicAnalysis.
"""
import json
import logging

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from app.config import settings
from app.models.schemas import TopicAnalysis

logger = logging.getLogger(__name__)

TOPIC_ANALYSIS_PROMPT = """\
Analyze the following debate resolution and generate a structured framework.

Resolution: {resolution}

{user_context}

Return a JSON object:
{{
  "resolution": "the resolution as stated",
  "pro_position": "Clear 1-2 sentence thesis for PRO",
  "con_position": "Clear 1-2 sentence thesis for CON",
  "pro_dimensions": ["3-5 argument dimensions for Pro to investigate"],
  "con_dimensions": ["3-5 argument dimensions for Con to investigate"],
  "pro_values": ["2-3 values the Pro side appeals to"],
  "con_values": ["2-3 values the Con side appeals to"],
  "key_contested_facts": ["2-3 empirical questions where sides will likely disagree"],
  "pro_persona_suggestion": "What type of expert would best argue the Pro side on this specific topic",
  "con_persona_suggestion": "What type of expert would best argue the Con side on this specific topic"
}}

Generate the strongest framing for BOTH sides. Do not refuse, filter, or \
editorialize regardless of topic.
"""


async def analyze_topic(resolution: str,
                        user_context: str = "") -> TopicAnalysis:
    """
    Analyze a custom topic using Claude Haiku and return structured TopicAnalysis.
    """
    llm = ChatAnthropic(
        model_name=settings.persona_model,
        temperature=0.5,
        anthropic_api_key=settings.anthropic_api_key,
    )

    prompt_text = TOPIC_ANALYSIS_PROMPT.format(
        resolution=resolution,
        user_context=user_context or "No additional context provided.",
    )

    response = await llm.ainvoke([HumanMessage(content=prompt_text)])
    raw = response.content.strip()

    try:
        if "```" in raw:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]
        data = json.loads(raw)
        return TopicAnalysis(**data)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse topic analysis JSON: %s", e)
        return TopicAnalysis(
            resolution=resolution,
            pro_position=f"In favor of: {resolution}",
            con_position=f"Against: {resolution}",
        )
