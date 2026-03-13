"""
LangGraph orchestration for the debate state machine.
This module defines the debate's structural phases and the StateGraph
that routes agents through Opening, Rebuttal, Closing, and Judging.

Updated to use structured prompts from prompts-doc.md and real judging panel.
"""

import asyncio
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from app.debate.agents import call_agent, format_history
from app.judging.panel import run_judging_panel
from app.models.schemas import DebateState

# --- Graph Nodes ---


async def research_consultation(state: DebateState) -> Dict[str, Any]:
    """Internal phase: Agents review the evidence bundle concurrently."""
    pro_eval, con_eval = await asyncio.gather(
        call_agent(state, "research_consultation", "pro"),
        call_agent(state, "research_consultation", "con")
    )

    turns = state.get("debate_turns", []) + [
        {"phase": "research_consultation", "side": "pro",
            "text": pro_eval, "is_internal": True},
        {"phase": "research_consultation", "side": "con",
            "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "research_consultation", "debate_turns": turns}


async def opening_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "opening_pro", "pro")
    turn = {
        "phase": "opening_pro",
        "side": "pro",
        "text": text,
        "is_internal": False}
    return {"current_phase": "opening_pro",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def opening_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "opening_con", "con")
    turn = {
        "phase": "opening_con",
        "side": "con",
        "text": text,
        "is_internal": False}
    return {"current_phase": "opening_con",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def eval_openings(state: DebateState) -> Dict[str, Any]:
    """Internal phase: Both agents evaluate opponent's opening."""
    pro_eval, con_eval = await asyncio.gather(
        call_agent(state, "eval_openings", "pro"),
        call_agent(state, "eval_openings", "con")
    )
    turns = state.get("debate_turns", []) + [
        {"phase": "eval_openings", "side": "pro",
            "text": pro_eval, "is_internal": True},
        {"phase": "eval_openings", "side": "con",
            "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "eval_openings", "debate_turns": turns}


async def rebuttal_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "rebuttal_pro", "pro")
    turn = {
        "phase": "rebuttal_pro",
        "side": "pro",
        "text": text,
        "is_internal": False}
    return {"current_phase": "rebuttal_pro",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def rebuttal_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "rebuttal_con", "con")
    turn = {
        "phase": "rebuttal_con",
        "side": "con",
        "text": text,
        "is_internal": False}
    return {"current_phase": "rebuttal_con",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def eval_full_debate(state: DebateState) -> Dict[str, Any]:
    """Internal phase: Both agents evaluate the full debate before closing."""
    pro_eval, con_eval = await asyncio.gather(
        call_agent(state, "eval_full_debate", "pro"),
        call_agent(state, "eval_full_debate", "con")
    )
    turns = state.get("debate_turns", []) + [
        {"phase": "eval_full_debate", "side": "pro",
            "text": pro_eval, "is_internal": True},
        {"phase": "eval_full_debate", "side": "con",
            "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "eval_full_debate", "debate_turns": turns}


async def closing_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "closing_pro", "pro")
    turn = {
        "phase": "closing_pro",
        "side": "pro",
        "text": text,
        "is_internal": False}
    return {"current_phase": "closing_pro",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def closing_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "closing_con", "con")
    turn = {
        "phase": "closing_con",
        "side": "con",
        "text": text,
        "is_internal": False}
    return {"current_phase": "closing_con",
            "debate_turns": state.get("debate_turns", []) + [turn]}


async def judging_phase(state: DebateState) -> Dict[str, Any]:
    """Run the 3-judge panel on the full debate transcript."""
    transcript = format_history(state)
    judging_results = await run_judging_panel(transcript)
    return {
        "current_phase": "judging",
        "status": "completed",
        "judging_results": judging_results,
    }

# --- Graph Construction ---


def create_debate_graph() -> CompiledStateGraph:
    """Builds and compiles the synchronous workflow graph."""
    workflow = StateGraph(DebateState)

    # Add all 10 distinct phases
    workflow.add_node("research_consultation", research_consultation)
    workflow.add_node("opening_pro", opening_pro)
    workflow.add_node("opening_con", opening_con)
    workflow.add_node("eval_openings", eval_openings)
    workflow.add_node("rebuttal_pro", rebuttal_pro)
    workflow.add_node("rebuttal_con", rebuttal_con)
    workflow.add_node("eval_full_debate", eval_full_debate)
    workflow.add_node("closing_pro", closing_pro)
    workflow.add_node("closing_con", closing_con)
    workflow.add_node("judging", judging_phase)

    # Define linear execution edge flows
    workflow.set_entry_point("research_consultation")
    workflow.add_edge("research_consultation", "opening_pro")
    workflow.add_edge("opening_pro", "opening_con")
    workflow.add_edge("opening_con", "eval_openings")
    workflow.add_edge("eval_openings", "rebuttal_pro")
    workflow.add_edge("rebuttal_pro", "rebuttal_con")
    workflow.add_edge("rebuttal_con", "eval_full_debate")
    workflow.add_edge("eval_full_debate", "closing_pro")
    workflow.add_edge("closing_pro", "closing_con")
    workflow.add_edge("closing_con", "judging")
    workflow.add_edge("judging", END)

    # Compile the graph
    return workflow.compile()
