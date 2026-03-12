"""
Debate agent orchestration — prompts-doc.md §1-2.

This module connects LangGraph nodes to Claude, using the structured prompts
from debate/prompts/ and the dynamic Persona system. All inline prompt stubs
have been replaced with imports from the prompt template modules.
"""
from typing import Dict, Any

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import DebateState, Persona
from app.debate.prompts.system_prompt import build_agent_system_prompt
from app.debate.prompts.research_consultation import RESEARCH_CONSULTATION_PROMPT
from app.debate.prompts.opening import OPENING_PROMPT
from app.debate.prompts.eval_openings import EVAL_OPENINGS_PROMPT
from app.debate.prompts.rebuttal import REBUTTAL_PROMPT
from app.debate.prompts.eval_full_debate import EVAL_FULL_DEBATE_PROMPT
from app.debate.prompts.closing import CLOSING_PROMPT


# ─── Helper Functions ───────────────────────────────────────────────────────

def format_evidence(state: DebateState) -> str:
    """Build the complete evidence text that both agents see."""
    bundle = state.get("evidence_bundle") or {}
    # Prefer the combined raw_content (includes both pro + con research)
    raw = bundle.get("raw_content", "")
    if raw:
        return raw
    # Fallback: concatenate pro + con if available
    pro = bundle.get("pro_research", "")
    con = bundle.get("con_research", "")
    if pro or con:
        result = ""
        if pro:
            result += "### PRO RESEARCH\n\n" + pro + "\n\n"
        if con:
            result += "### CON RESEARCH\n\n" + con + "\n\n"
        return result
    return "No evidence provided."


def get_last_opponent_turn(state: DebateState, opponent_side: str) -> str:
    """Retrieve the last visible (non-internal) turn from the opponent."""
    turns = state.get("debate_turns", [])
    opponent_turns = [
        t["text"]
        for t in turns
        if t["side"] == opponent_side and not t.get("is_internal")
    ]
    return opponent_turns[-1] if opponent_turns else "None"


def format_history(state: DebateState) -> str:
    """Format the full debate transcript (public turns only)."""
    history = []
    for turn in state.get("debate_turns", []):
        if turn.get("is_internal"):
            continue
        history.append(f"{turn['side'].upper()} ({turn['phase']}):\n{turn['text']}\n")
    return "\n".join(history)


def get_persona(state: DebateState, role: str) -> Persona:
    """Extract the Persona for a given side from debate state."""
    personas = state.get("personas", {})
    persona_data = personas.get(role.lower())
    if persona_data and isinstance(persona_data, dict):
        return Persona(**persona_data)
    # Fallback persona
    return Persona(
        name=f"{'Dr. A. Proctor' if role == 'pro' else 'Dr. R. Counter'}",
        identity=f"An expert debater arguing the {role.upper()} position.",
        expertise_areas=[],
        core_values=[],
        rhetorical_approach="Data-driven argumentation grounded in evidence.",
    )


# ─── Main Agent Invocation ──────────────────────────────────────────────────

async def call_agent(state: DebateState, phase: str, role: str) -> str:
    """
    Main entrypoint connecting LangGraph nodes to Claude 3.5 Sonnet.

    Uses the structured system prompt from prompts-doc.md §1 and
    the phase-specific prompts from prompts-doc.md §2.

    Args:
        state: Current debate state from LangGraph
        phase: Current phase name (e.g. "opening_pro", "rebuttal_con")
        role: "pro" or "con"
    """
    llm = ChatAnthropic(model_name="claude-sonnet-4-20250514", temperature=0.7)

    # Build system prompt from structured Persona
    persona = get_persona(state, role)
    resolution = state.get("resolution", state.get("topic", "Unknown Topic"))
    position = state.get(
        "pro_position" if role == "pro" else "con_position",
        f"Arguing the {role.upper()} position"
    )
    sys_msg = build_agent_system_prompt(persona, role, resolution, position)

    # Get context data
    evidence_text = format_evidence(state)
    opponent_side = "con" if role == "pro" else "pro"

    # Select the correct phase prompt
    human_msg_content = ""
    if phase == "research_consultation":
        human_msg_content = (
            RESEARCH_CONSULTATION_PROMPT
            + "\n\n## Evidence Bundle\n\n" + evidence_text
        )
    elif phase.startswith("opening"):
        human_msg_content = (
            OPENING_PROMPT
            + "\n\n## Evidence Available\n\n" + evidence_text
        )
    elif phase == "eval_openings":
        opponent_opening = get_last_opponent_turn(state, opponent_side)
        human_msg_content = (
            EVAL_OPENINGS_PROMPT
            + "\n\n## Opponent's Opening Statement\n\n" + opponent_opening
            + "\n\n## Full Evidence Bundle\n\n" + evidence_text
        )
    elif phase.startswith("rebuttal"):
        opponent_turn = get_last_opponent_turn(state, opponent_side)
        human_msg_content = (
            REBUTTAL_PROMPT
            + "\n\n## Opponent's Previous Turn\n\n" + opponent_turn
            + "\n\n## Evidence Available\n\n" + evidence_text
        )
    elif phase == "eval_full_debate":
        human_msg_content = (
            EVAL_FULL_DEBATE_PROMPT
            + "\n\n## Full Debate Transcript\n\n" + format_history(state)
        )
    elif phase.startswith("closing"):
        human_msg_content = (
            CLOSING_PROMPT
            + "\n\n## Full Debate Transcript\n\n" + format_history(state)
        )
    else:
        human_msg_content = "Please provide your input for this phase."

    messages = [
        SystemMessage(content=sys_msg),
        HumanMessage(content=human_msg_content),
    ]

    response = await llm.ainvoke(messages)
    return response.content
