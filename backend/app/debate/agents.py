import json
from typing import Dict, Any, List
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.schemas import DebateState

# Core identity and debate constraints injected into every call
SYSTEM_PROMPT_TEMPLATE = """You are participating in a formal, highly structured debate.
Topic: {topic}
Your Position: {position}

Your Assigned Persona: 
{persona}

CRITICAL RULES:
1. Embody your persona fully. Speak persuasively, assertively, and intelligently.
2. Appeal to core values and structural logics. DO NOT produce dry academic output.
3. You must steelman your opponent's arguments before attacking them (if applicable).
4. Evidence Integration: You must cite the evidence provided referencing its title.
"""

RESEARCH_EVAL_PROMPT = """Review the provided Evidence Bundle containing both Pro and Con research.
Identify the strongest arguments for your side, the vulnerabilities of your side, and the likely strategy of your opponent.
Note any conflicting sources or methodologies.

Evidence Bundle:
{evidence}

Output a short strategic assessment. Do not draft your opening statement yet.
"""

EVAL_OPENINGS_PROMPT = """Review the opponent's opening statement along with the debate evidence.
Outline a strategy for your upcoming rebuttal. Identify the weaknesses in their argument or sources.

Opponent's Statement:
{opponent_turn}

Output a short strategic assessment. Do not draft your rebuttal yet.
"""

EVAL_FULL_DEBATE_PROMPT = """Review the entire debate transcript so far.
Identify the core crux of the disagreement. Plan your closing statement to synthesize the debate and leave the strongest impact.

Output a short strategic assessment. Do not draft your closing statement yet.
"""

OPENING_PROMPT = """Draft your opening statement for the {position} side.
Present your affirmative case. You have not seen the opponent's opening yet.
Mandatory: Use exactly the title names of the provided evidence like [Source Title] when citing facts.

Evidence:
{evidence}
"""

REBUTTAL_PROMPT = """Draft your rebuttal for the {position} side.
Mandatory Checklist:
1. Steelman the opponent's best point from their opening/rebuttal.
2. Respond to their claims by challenging their evidence or interpretation.
3. Introduce new citations from your evidence bundle to support your counter-attack.

Opponent's Previous Turn:
{opponent_turn}

Evidence:
{evidence}
"""

CLOSING_PROMPT = """Draft your closing statement for the {position} side.
Acknowledge the opponent, clearly name the core disagreement between the two sides, synthesize your strongest points, and close with an appeal to values.

Debate History (Your previous turns + Opponent's previous turns):
{debate_history}
"""

def format_evidence(evidence_bundle: Dict[str, Any]) -> str:
    """Extract citations from the evidence bundle ensuring agents see the titles."""
    if not evidence_bundle or "raw_content" not in evidence_bundle:
        return "No evidence provided."
    return evidence_bundle["raw_content"]

def get_last_opponent_turn(state: DebateState, opponent_side: str) -> str:
    turns = state.get("debate_turns", [])
    opponent_turns = [t["text"] for t in turns if t["side"] == opponent_side]
    return opponent_turns[-1] if opponent_turns else "None"

def format_history(state: DebateState) -> str:
    history = []
    for turn in state.get("debate_turns", []):
        history.append(f"{turn['side'].upper()} ({turn['phase']}):\n{turn['text']}\n")
    return "\n".join(history)

async def call_agent(state: DebateState, phase: str, role: str) -> str:
    """
    Main invocation entrypoint connecting nodes to Claude 3.5 Sonnet.
    role: "pro" or "con"
    """
    llm = ChatAnthropic(model_name="claude-3-5-sonnet-20241022", temperature=0.7)
    
    topic = state.get("topic", "Unknown Topic")
    persona = state.get("personas", {}).get(role, "An assertive and persuasive debater.")
    evidence_text = format_evidence(state.get("evidence_bundle", {}))
    opponent_side = "con" if role == "pro" else "pro"
    
    # 1. Format the System Message
    sys_msg = SYSTEM_PROMPT_TEMPLATE.format(
        topic=topic,
        position=role.upper(),
        persona=persona
    )
    
    # 2. Select the correct Phase Prompt
    human_msg_content = ""
    if phase == "research_consultation":
        human_msg_content = RESEARCH_EVAL_PROMPT.format(evidence=evidence_text)
    elif phase.startswith("opening"):
        human_msg_content = OPENING_PROMPT.format(position=role.upper(), evidence=evidence_text)
    elif phase == "eval_openings":
        human_msg_content = EVAL_OPENINGS_PROMPT.format(opponent_turn=get_last_opponent_turn(state, opponent_side))
    elif phase.startswith("rebuttal"):
        human_msg_content = REBUTTAL_PROMPT.format(
            position=role.upper(), 
            evidence=evidence_text,
            opponent_turn=get_last_opponent_turn(state, opponent_side)
        )
    elif phase == "eval_full_debate":
        human_msg_content = EVAL_FULL_DEBATE_PROMPT
    elif phase.startswith("closing"):
        human_msg_content = CLOSING_PROMPT.format(
            position=role.upper(), 
            debate_history=format_history(state)
        )
    else:
        human_msg_content = "Please provide your input for this phase."

    messages = [
        SystemMessage(content=sys_msg),
        HumanMessage(content=human_msg_content)
    ]
    
    response = await llm.ainvoke(messages)
    return response.content
