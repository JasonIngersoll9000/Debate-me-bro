"""
LangGraph orchestration for the debate state machine.
This module defines the debate's structural phases and the StateGraph 
that routes agents through Opening, Rebuttal, Closing, and Judging.
"""

from typing import List, Dict, Any, Optional
from uuid import UUID
from langgraph.graph import StateGraph, END
from app.debate.agents import call_agent
from app.models.schemas import DebateState

# --- Graph Nodes ---

async def research_consultation(state: DebateState) -> Dict[str, Any]:
    # Internal phase: Agents review the evidence bundle
    pro_eval = await call_agent(state, "research_consultation", "pro")
    con_eval = await call_agent(state, "research_consultation", "con")
    
    # We store internal evaluations as turns but they won't be streamed to the UI
    turns = state.get("debate_turns", []) + [
        {"phase": "research_consultation", "side": "pro", "text": pro_eval, "is_internal": True},
        {"phase": "research_consultation", "side": "con", "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "research_consultation", "debate_turns": turns}

async def opening_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "opening_pro", "pro")
    turn = {"phase": "opening_pro", "side": "pro", "text": text, "is_internal": False}
    return {"current_phase": "opening_pro", "debate_turns": state.get("debate_turns", []) + [turn]}

async def opening_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "opening_con", "con")
    turn = {"phase": "opening_con", "side": "con", "text": text, "is_internal": False}
    return {"current_phase": "opening_con", "debate_turns": state.get("debate_turns", []) + [turn]}

async def eval_openings(state: DebateState) -> Dict[str, Any]:
    pro_eval = await call_agent(state, "eval_openings", "pro")
    con_eval = await call_agent(state, "eval_openings", "con")
    turns = state.get("debate_turns", []) + [
        {"phase": "eval_openings", "side": "pro", "text": pro_eval, "is_internal": True},
        {"phase": "eval_openings", "side": "con", "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "eval_openings", "debate_turns": turns}

async def rebuttal_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "rebuttal_pro", "pro")
    turn = {"phase": "rebuttal_pro", "side": "pro", "text": text, "is_internal": False}
    return {"current_phase": "rebuttal_pro", "debate_turns": state.get("debate_turns", []) + [turn]}

async def rebuttal_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "rebuttal_con", "con")
    turn = {"phase": "rebuttal_con", "side": "con", "text": text, "is_internal": False}
    return {"current_phase": "rebuttal_con", "debate_turns": state.get("debate_turns", []) + [turn]}

async def eval_full_debate(state: DebateState) -> Dict[str, Any]:
    pro_eval = await call_agent(state, "eval_full_debate", "pro")
    con_eval = await call_agent(state, "eval_full_debate", "con")
    turns = state.get("debate_turns", []) + [
        {"phase": "eval_full_debate", "side": "pro", "text": pro_eval, "is_internal": True},
        {"phase": "eval_full_debate", "side": "con", "text": con_eval, "is_internal": True}
    ]
    return {"current_phase": "eval_full_debate", "debate_turns": turns}

async def closing_pro(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "closing_pro", "pro")
    turn = {"phase": "closing_pro", "side": "pro", "text": text, "is_internal": False}
    return {"current_phase": "closing_pro", "debate_turns": state.get("debate_turns", []) + [turn]}

async def closing_con(state: DebateState) -> Dict[str, Any]:
    text = await call_agent(state, "closing_con", "con")
    turn = {"phase": "closing_con", "side": "con", "text": text, "is_internal": False}
    return {"current_phase": "closing_con", "debate_turns": state.get("debate_turns", []) + [turn]}

async def judging_phase(state: DebateState) -> Dict[str, Any]:
    # Placeholder for Issue #10
    return {"current_phase": "judging", "status": "completed"}

# --- Graph Construction ---

def create_debate_graph() -> StateGraph:
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
