import json
import logging
from typing import AsyncGenerator, Dict, Any

from app.debate.graph import create_debate_graph
from app.models.schemas import DebateState
# You may need to import your db or preset logic here

logger = logging.getLogger(__name__)

# The phase names we consider internal
INTERNAL_PHASES = {"research_consultation", "eval_openings", "eval_full_debate"}

async def stream_debate_events(debate_id: str) -> AsyncGenerator[str, None]:
    """
    Invokes the LangGraph state machine and yields SSE payloads token-by-token.
    """
    graph = create_debate_graph()
    
    # Placeholder initial state for the stream
    # In a real scenario, you'd fetch the debate config/state from DB or presets
    initial_state: DebateState = {
        "debate_id": debate_id,
        "topic": "Universal Healthcare", # Placeholder until DB integration
        "status": "in_progress",
        "current_phase": "initial",
        "debate_turns": [],
        "evidence_bundle": None, # Will be set by logic if DB integration added
        "personas": {} # Will be set by persona generator
    }

    current_node = None

    try:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]
            
            # Track which LangGraph node we're currently executing
            if kind == "on_chain_start":
                node_name = event.get("metadata", {}).get("langgraph_node")
                if node_name:
                    current_node = node_name
                    if current_node in INTERNAL_PHASES:
                        # Yield a phase transition when an internal node starts
                        payload = {
                            "type": "phase_transition",
                            "phase": current_node,
                            "message": f"Agents evaluating ({current_node})..."
                        }
                        yield f"data: {json.dumps(payload)}\n\n"
            
            # Stream tokens for chat models if we are in a public phase
            elif kind == "on_chat_model_stream":
                if current_node and current_node not in INTERNAL_PHASES and current_node != "judging":
                    chunk = event["data"]["chunk"].content
                    if chunk:
                        payload = {
                            "type": "content",
                            "phase": current_node,
                            "chunk": chunk
                        }
                        yield f"data: {json.dumps(payload)}\n\n"

        # End of stream sentinel
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        
    except Exception as e:
        logger.error(f"Error streaming debate {debate_id}: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
