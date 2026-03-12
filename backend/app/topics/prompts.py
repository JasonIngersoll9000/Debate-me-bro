"""
Research prompt generator — prompts-doc.md §4.
Generates structured research prompts for custom topics (Tier 2).
"""
from typing import List, Optional, Dict

from app.models.schemas import TopicAnalysis

CUSTOM_RESEARCH_PROMPT_TEMPLATE = """\
# Research Prompt: {side} Position on "{resolution}"

I need deep, well-sourced research to build the strongest possible {side} case \
in a structured debate.

**Resolution:** {resolution}

## What I Need

Research the following argument dimensions in depth:
{argument_dimensions_numbered}

For each dimension:
- The core claim and the strongest evidence supporting it
- Specific, citable sources (studies, data, reporting) with key findings
- Evidence that anticipates and undermines the opposing side's likely counterarguments
- An honest assessment of where this argument is weakest

{user_argumentation_lines}

## Important
If the user has requested specific lines of argumentation above, you MUST include \
them — but do NOT limit your research to only those lines. They are starting points, \
not boundaries. Investigate those AND any other strong arguments, values, frameworks, \
or evidence that would strengthen the {side} case. The goal is the most comprehensive \
and compelling body of advocacy research possible.

## Source Standards
- Prioritize sources with strong methodology, specific data, and verifiable claims
- Include both institutional and independent sources — judge on accuracy and \
  citation quality, not credentials
- For each source, include: title, author/institution, date, and key finding

## Style
This is advocacy research — go deep for the {side} position. Find the most \
compelling evidence available. Be thorough — no artificial limits on length \
or number of sources.

## Values and Frameworks
The {side} position often appeals to:
{values_and_frameworks}

Use these as framing guidance, but let the evidence drive the argument structure.

## Output Format — CRITICAL
Output MUST be in structured Markdown. This will be parsed by AI debate agents.

Use this structure:
- Clear `## Argument N: Title` headers for each dimension
- Under each argument: `### Core Claim`, `### Supporting Evidence`, \
  `### Anticipated Counter-Arguments`, `### Evidence Against Counter`, \
  `### Vulnerability Assessment`
- ALL source citations as Markdown hyperlinks: `**[Source Title](URL)** (Author, Year): Finding`
- End with a `## Source Bibliography` listing all sources as `[Title](URL) — Author, Year`

Every source MUST include a clickable URL so claims can be verified.
"""


def format_dimensions(dimensions: List[str]) -> str:
    """Format argument dimensions as a numbered list."""
    return "\n".join(f"{i+1}. {d}" for i, d in enumerate(dimensions))


def format_values(values: List[str]) -> str:
    """Format values as a comma-separated list."""
    return ", ".join(values) if values else "rational analysis, evidence-based reasoning"


def generate_research_prompts(
    topic_analysis: TopicAnalysis,
    user_pro_lines: Optional[List[str]] = None,
    user_con_lines: Optional[List[str]] = None,
) -> Dict[str, str]:
    """Generate two research prompts (Pro + Con) for a custom topic."""

    pro_args = ""
    if user_pro_lines:
        pro_args = (
            "\n## Specific Arguments to Explore (user-requested)\n"
            + "\n".join(f"- {line}" for line in user_pro_lines)
        )

    con_args = ""
    if user_con_lines:
        con_args = (
            "\n## Specific Arguments to Explore (user-requested)\n"
            + "\n".join(f"- {line}" for line in user_con_lines)
        )

    return {
        "pro_prompt": CUSTOM_RESEARCH_PROMPT_TEMPLATE.format(
            side="PRO",
            resolution=topic_analysis.resolution,
            argument_dimensions_numbered=format_dimensions(topic_analysis.pro_dimensions),
            user_argumentation_lines=pro_args,
            values_and_frameworks=format_values(topic_analysis.pro_values),
        ),
        "con_prompt": CUSTOM_RESEARCH_PROMPT_TEMPLATE.format(
            side="CON",
            resolution=topic_analysis.resolution,
            argument_dimensions_numbered=format_dimensions(topic_analysis.con_dimensions),
            user_argumentation_lines=con_args,
            values_and_frameworks=format_values(topic_analysis.con_values),
        ),
    }
