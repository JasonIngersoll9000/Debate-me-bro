"""
Dynamic persona generation — prompts-doc.md §1.
Generates a structured Persona tailored to the topic + evidence.
Uses Claude Haiku for speed/cost (persona gen is a setup step).
"""
import json
import logging

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from app.config import settings
from app.models.schemas import Persona

logger = logging.getLogger(__name__)

PERSONA_GENERATION_PROMPT = """\
You are setting up a structured debate on the following resolution:

**Resolution:** {resolution}
**Your assigned side:** {side} ({position_statement})

You have access to the following research summary:
{evidence_summary}

## Your Task
Design the ideal advocate persona for the {side} side of this specific debate. \
Consider:

1. **Expertise:** What professional background would make someone the most credible \
   and effective advocate for this position on THIS topic? (Not a generic debater — \
   a specific type of expert whose knowledge directly serves this argument.)

2. **Values framework:** What core values does this position appeal to? \
   (e.g., individual liberty, collective welfare, empirical rigor, moral duty, \
   precautionary principle, innovation, tradition, justice, pragmatism)

3. **Rhetorical approach:** Based on the available evidence, what argumentative \
   style will be most effective? (e.g., lead with data, lead with moral framing, \
   lead with historical precedent, lead with comparative analysis, lead with \
   first-principles reasoning)

4. **Name and identity:** Give this advocate a name and a 1-sentence professional \
   identity that establishes credibility for this specific topic.

## Output Format (JSON)
{{
  "name": "Dr./Prof. [Name]",
  "identity": "[1-sentence professional description relevant to this topic]",
  "expertise_areas": ["area1", "area2"],
  "core_values": ["value1", "value2", "value3"],
  "rhetorical_approach": "[How this advocate builds arguments]",
  "why_this_persona": "[1-2 sentences explaining why this persona is the ideal advocate for this side on this topic]"
}}

Choose a persona that gives this side its BEST possible chance of winning — not a \
generic debater, but the specific expert who would be most devastating in this role.
"""


async def generate_persona(
    resolution: str,
    side: str,
    position_statement: str,
    evidence_summary: str = "",
) -> Persona:
    """
    Calls Claude Haiku to generate a dynamic persona tailored to this debate.
    Returns a structured Persona object.
    """
    llm = ChatAnthropic(model_name=settings.persona_model, temperature=0.7, anthropic_api_key=settings.anthropic_api_key)

    prompt_text = PERSONA_GENERATION_PROMPT.format(
        resolution=resolution,
        side=side.upper(),
        position_statement=position_statement,
        evidence_summary=evidence_summary or "No research summary provided yet.",
    )

    response = await llm.ainvoke([HumanMessage(content=prompt_text)])
    raw = response.content.strip()

    # Parse JSON from response (may be wrapped in ```json blocks)
    try:
        # Strip markdown code fences if present
        if "```" in raw:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]
        data = json.loads(raw)
        return Persona(**data)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse persona JSON, using fallback: %s", e)
        # Fallback: create a basic persona from the raw text
        return Persona(
            name=f"{'Dr. A. Proctor' if side == 'pro' else 'Dr. R. Counter'}",
            identity=raw[:
                         200] if raw else f"An expert debater arguing the {side} position.",
            expertise_areas=[],
            core_values=[],
            rhetorical_approach="Data-driven argumentation grounded in evidence.",
            why_this_persona=f"Generated as fallback for {side} side.",
        )
