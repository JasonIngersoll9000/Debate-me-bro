import json
import logging
from typing import AsyncGenerator

from app.debate.graph import create_debate_graph
from app.models.schemas import DebateState

logger = logging.getLogger(__name__)

# The phase names we consider internal
INTERNAL_PHASES = {
    "research_consultation",
    "eval_openings",
    "eval_full_debate",
}


def get_speaker(phase: str) -> str:
    if not phase:
        return "system"
    if phase.endswith("_pro"):
        return "pro"
    if phase.endswith("_con"):
        return "con"
    return "system"


async def stream_debate_events(
    debate_id: str,
) -> AsyncGenerator[str, None]:
    """
    Invokes the LangGraph state machine and yields SSE payloads
    token-by-token.
    """
    graph = create_debate_graph()

    # Placeholder initial state for the stream
    # In a real scenario, fetch the debate config/state from DB or presets
    initial_state: DebateState = {
        "debate_id": debate_id,
        "topic": "Universal Healthcare",  # Placeholder until DB integration
        "status": "in_progress",
        "current_phase": "initial",
        "debate_turns": [],
        "evidence_bundle": None,  # Will be set if DB integration added
        "personas": {},  # Will be set by persona generator
    }

    current_node = None
    streamed_phases = set()

    try:
        async for event in graph.astream_events(
            initial_state, version="v2"
        ):
            kind = event["event"]

            # Track which LangGraph node we're currently executing
            if kind == "on_chain_start":
                node_name = (
                    event.get("metadata", {}).get("langgraph_node")
                )
                if node_name:
                    current_node = node_name
                    if current_node in INTERNAL_PHASES:
                        payload = {
                            "type": "phase_transition",
                            "phase": current_node,
                            "phase_type": "internal",
                            "speaker": get_speaker(current_node),
                            "message": (
                                f"Agents evaluating ({current_node})..."
                            ),
                        }
                        yield f"data: {json.dumps(payload)}\n\n"

            # Stream tokens for chat models if we are in a public phase
            elif kind == "on_chat_model_stream":
                if (
                    current_node
                    and current_node not in INTERNAL_PHASES
                    and current_node != "judging"
                ):
                    chunk = event["data"]["chunk"].content
                    if chunk:
                        streamed_phases.add(current_node)
                        payload = {
                            "type": "content",
                            "phase": current_node,
                            "phase_type": "streamed",
                            "speaker": get_speaker(current_node),
                            "chunk": chunk,
                        }
                        yield f"data: {json.dumps(payload)}\n\n"

            # Fallback for non-streaming: emit content from debate_turns
            elif kind == "on_chain_end":
                node_name = (
                    event.get("metadata", {}).get("langgraph_node")
                )
                phase_name = node_name or current_node
                if (
                    phase_name
                    and phase_name not in INTERNAL_PHASES
                    and phase_name != "judging"
                    and phase_name not in streamed_phases
                ):
                    data = event.get("data", {}) or {}
                    output = data.get("output", "")
                    text = None

                    # Node outputs are state-update dicts; extract the
                    # most recent non-internal turn for this phase.
                    if isinstance(output, dict):
                        turns = output.get("debate_turns", [])
                        for turn in reversed(turns):
                            if not isinstance(turn, dict):
                                continue
                            if (
                                turn.get("phase") == phase_name
                                and not turn.get(
                                    "is_internal", False
                                )
                            ):
                                text = turn.get("text", "")
                                break
                    else:
                        try:
                            content = getattr(
                                output, "content", None
                            )
                            if isinstance(content, str):
                                text = content
                            elif content is not None:
                                # Non-string 'content' attribute; ignore.
                                logger.warning(
                                    "Unexpected non-string "
                                    "content attr type: %r",
                                    type(content),
                                )
                                text = ""
                            elif isinstance(output, str):
                                # Allow direct string output.
                                text = output
                            else:
                                # Don't stringify arbitrary objects.
                                logger.warning(
                                    "Unexpected output "
                                    "type %r; ignoring",
                                    type(output),
                                )
                                text = ""
                        except Exception:
                            logger.exception(
                                "Error extracting text "
                                "from output: %r",
                                type(output),
                            )
                            text = ""

                    # Normalize non-string text values to avoid runtime
                    # errors when calling .strip() or slicing for chunks.
                    if text is not None and not isinstance(text, str):
                        if isinstance(text, (list, tuple)):
                            # Join only string-like parts, ignoring others.
                            parts = []
                            for part in text:
                                if isinstance(part, str):
                                    parts.append(part)
                                else:
                                    logger.debug(
                                        "Ignoring non-string segment in "
                                        "text list: type=%r",
                                        type(part),
                                    )
                            text = "".join(parts)
                        else:
                            logger.warning(
                                "Non-string text value of type %r; ignoring",
                                type(text),
                            )
                            text = ""

                    if isinstance(text, str) and text.strip():
                        chunk_size = 200
                        for i in range(0, len(text), chunk_size):
                            chunk = text[i:i + chunk_size]
                            payload = {
                                "type": "content",
                                "phase": phase_name,
                                "phase_type": "streamed",
                                "speaker": get_speaker(phase_name),
                                "chunk": chunk,
                            }
                            yield f"data: {json.dumps(payload)}\n\n"

        # End of stream sentinel
        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    except Exception:
        logger.exception("Error streaming debate %s", debate_id)
        error_payload = {
            "type": "error",
            "code": "INTERNAL_ERROR",
            "message": (
                "An unexpected error occurred while streaming the debate."
            ),
        }
        yield f"data: {json.dumps(error_payload)}\n\n"
