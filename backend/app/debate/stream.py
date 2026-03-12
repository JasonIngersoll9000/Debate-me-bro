"""
SSE streaming handler for debates — with persistence and replay.

Flow:
1. Check if debate already exists in store → if yes, replay from cache
2. If not cached: look up topic → load evidence → generate personas → run LangGraph → save result
"""
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, List

from app.debate.graph import create_debate_graph
from app.debate.evidence import EvidenceLoader
from app.debate.persona_generator import generate_persona
from app.debate.store import save_debate, load_debate
from app.models.schemas import DebateState

logger = logging.getLogger(__name__)

INTERNAL_PHASES = {"research_consultation", "eval_openings", "eval_full_debate"}

PRESET_TOPICS: Dict[str, Dict[str, str]] = {
    "healthcare": {
        "title": "Universal Healthcare",
        "resolution": "Should the United States adopt a single-payer universal healthcare system?",
        "pro_position": "Adopt a Medicare-for-All style single-payer system to ensure universal coverage, eliminate administrative waste, and decouple healthcare from employment.",
        "con_position": "Maintain a multi-payer system combining private insurance and public safety nets to preserve innovation, choice, and avoid excessive tax burdens.",
    },
    "ubi": {
        "title": "Universal Basic Income",
        "resolution": "Should the federal government implement a Universal Basic Income for all adult citizens?",
        "pro_position": "Provide a no-strings-attached monthly stipend to eliminate absolute poverty, buffer against AI job displacement, and empower workers.",
        "con_position": "Rely on targeted welfare programs; UBI creates disincentives to work, triggers inflation, and is fiscally unsustainable.",
    },
    "nuclear": {
        "title": "Nuclear Energy Expansion",
        "resolution": "Should nuclear energy be massively expanded as the primary baseload power for the clean energy transition?",
        "pro_position": "Nuclear is the only reliable, scalable, carbon-free baseload power source capable of replacing fossil fuels without massive battery storage infrastructure.",
        "con_position": "Nuclear is too expensive, takes too long to build, and carries unacceptable risks regarding waste storage and potential catastrophic accidents.",
    },
}


def get_speaker(phase: str) -> str:
    if not phase:
        return "system"
    if phase.endswith("_pro"):
        return "pro"
    if phase.endswith("_con"):
        return "con"
    return "system"


# ═══════════════════════════════════════════════════════════════════════
# REPLAY: Stream a cached debate from the store
# ═══════════════════════════════════════════════════════════════════════

async def _replay_debate(cached: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """Replay a cached debate as SSE events without calling any LLMs."""
    logger.info("Replaying cached debate '%s'", cached.get("id"))

    # Emit evidence metadata
    yield f"data: {json.dumps({'type': 'evidence_loaded', 'topic': cached.get('topic', ''), 'resolution': cached.get('resolution', ''), 'pro_position': cached.get('pro_position', ''), 'con_position': cached.get('con_position', ''), 'citation_count': len(cached.get('evidence', {}).get('citations', {}))})}\n\n"

    # Emit personas
    personas = cached.get("personas", {})
    yield f"data: {json.dumps({'type': 'personas', 'pro': personas.get('pro', {}), 'con': personas.get('con', {})})}\n\n"

    # Small delay so frontend can set up
    await asyncio.sleep(0.1)

    # Replay each turn
    for turn in cached.get("turns", []):
        phase = turn.get("phase", "")
        is_internal = turn.get("is_internal", False)
        side = turn.get("side", "system")
        text = turn.get("text", "")

        if is_internal:
            # Emit phase transition for internal phases
            yield f"data: {json.dumps({'type': 'phase_transition', 'phase': phase, 'phase_type': 'internal', 'speaker': side, 'message': f'Agents evaluating ({phase})...'})}\n\n"
        else:
            # Emit phase transition
            yield f"data: {json.dumps({'type': 'phase_transition', 'phase': phase, 'phase_type': 'streamed', 'speaker': get_speaker(phase), 'message': f'Phase: {phase}'})}\n\n"

            # Stream the text in chunks (simulates streaming feel)
            chunk_size = 80
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                payload = {
                    "type": "content",
                    "phase": phase,
                    "phase_type": "streamed",
                    "speaker": get_speaker(phase),
                    "chunk": chunk,
                }
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(0.01)  # Tiny delay for streaming feel

    # Emit judging results if present
    judging = cached.get("judging_results")
    if judging:
        yield f"data: {json.dumps({'type': 'phase_transition', 'phase': 'judging', 'phase_type': 'judging', 'speaker': 'system', 'message': 'The judging panel results...'})}\n\n"
        yield f"data: {json.dumps({'type': 'judging_results', 'results': judging})}\n\n"

    yield f"data: {json.dumps({'type': 'complete', 'cached': True})}\n\n"


# ═══════════════════════════════════════════════════════════════════════
# LIVE: Generate a new debate via LangGraph and save to store
# ═══════════════════════════════════════════════════════════════════════

async def stream_debate_events(debate_id: str) -> AsyncGenerator[str, None]:
    """
    Main entrypoint: checks cache first, replays if available, otherwise runs live.
    """
    # ── Check cache ──
    cached = load_debate(debate_id)
    if cached and cached.get("status") == "completed":
        async for event in _replay_debate(cached):
            yield event
        return

    # ── Not cached — run live debate ──
    topic_info = PRESET_TOPICS.get(debate_id, {})
    topic_title = topic_info.get("title", debate_id.replace("_", " ").title())
    resolution = topic_info.get("resolution", f"Should we support {topic_title}?")
    pro_position = topic_info.get("pro_position", f"Arguing in favor of {topic_title}")
    con_position = topic_info.get("con_position", f"Arguing against {topic_title}")

    # ── Load evidence ──
    evidence_loader = EvidenceLoader()
    evidence_bundle_data: Dict[str, Any] = {}
    evidence_summary = ""
    try:
        evidence_bundle = await evidence_loader.load_preset_evidence(debate_id)
        evidence_bundle_data = evidence_bundle.model_dump()
        evidence_summary = (
            f"Pro research covers {len(evidence_bundle.pro_arguments)} argument dimensions. "
            f"Con research covers {len(evidence_bundle.con_arguments)} argument dimensions. "
            f"Total sources indexed: {len(evidence_bundle.citations)}."
        )
        logger.info("Loaded evidence for '%s': %s", debate_id, evidence_summary)
    except FileNotFoundError:
        logger.warning("No evidence files found for topic '%s'", debate_id)
        evidence_bundle_data = {"raw_content": "No pre-loaded evidence available.", "citations": {}}

    yield f"data: {json.dumps({'type': 'evidence_loaded', 'topic': topic_title, 'resolution': resolution, 'pro_position': pro_position, 'con_position': con_position, 'citation_count': len(evidence_bundle_data.get('citations', {}))})}\n\n"

    # ── Generate personas ──
    try:
        pro_persona = await generate_persona(
            resolution=resolution, side="pro",
            position_statement=pro_position,
            evidence_summary=evidence_summary,
        )
        con_persona = await generate_persona(
            resolution=resolution, side="con",
            position_statement=con_position,
            evidence_summary=evidence_summary,
        )
        personas_data = {"pro": pro_persona.model_dump(), "con": con_persona.model_dump()}
        logger.info("Generated personas: Pro=%s, Con=%s", pro_persona.name, con_persona.name)
    except Exception as e:
        logger.warning("Persona generation failed: %s", e)
        personas_data = {
            "pro": {"name": "Dr. A. Proctor", "identity": "An expert advocate.", "expertise_areas": [], "core_values": [], "rhetorical_approach": "Evidence-driven argumentation."},
            "con": {"name": "Dr. R. Counter", "identity": "An expert advocate.", "expertise_areas": [], "core_values": [], "rhetorical_approach": "Evidence-driven argumentation."},
        }

    yield f"data: {json.dumps({'type': 'personas', 'pro': personas_data['pro'], 'con': personas_data['con']})}\n\n"

    # ── Build initial state ──
    initial_state: DebateState = {
        "debate_id": debate_id,
        "topic": topic_title,
        "resolution": resolution,
        "pro_position": pro_position,
        "con_position": con_position,
        "status": "in_progress",
        "current_phase": "initial",
        "debate_turns": [],
        "evidence_bundle": evidence_bundle_data,
        "personas": personas_data,
        "judging_results": None,
    }

    # ── Collector for saving ──
    collected_turns: List[Dict[str, Any]] = []
    judging_results: Dict[str, Any] = {}

    # ── Stream via LangGraph ──
    graph = create_debate_graph()
    current_node = None
    streamed_phases: Dict[str, str] = {}  # phase -> accumulated text

    try:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]

            if kind == "on_chain_start":
                node_name = event.get("metadata", {}).get("langgraph_node")
                if node_name:
                    current_node = node_name
                    if current_node in INTERNAL_PHASES:
                        yield f"data: {json.dumps({'type': 'phase_transition', 'phase': current_node, 'phase_type': 'internal', 'speaker': get_speaker(current_node), 'message': f'Agents evaluating ({current_node})...'})}\n\n"
                    elif current_node == "judging":
                        yield f"data: {json.dumps({'type': 'phase_transition', 'phase': 'judging', 'phase_type': 'judging', 'speaker': 'system', 'message': 'The judging panel is now evaluating the debate...'})}\n\n"

            elif kind == "on_chat_model_stream":
                if current_node and current_node not in INTERNAL_PHASES and current_node != "judging":
                    chunk = event["data"]["chunk"].content
                    if chunk:
                        # Accumulate text for saving
                        if current_node not in streamed_phases:
                            streamed_phases[current_node] = ""
                        streamed_phases[current_node] += chunk

                        payload = {
                            "type": "content",
                            "phase": current_node,
                            "phase_type": "streamed",
                            "speaker": get_speaker(current_node),
                            "chunk": chunk,
                        }
                        yield f"data: {json.dumps(payload)}\n\n"

            elif kind == "on_chain_end":
                node_name = event.get("metadata", {}).get("langgraph_node")
                phase_name = node_name or current_node

                if phase_name == "judging":
                    data = event.get("data", {}) or {}
                    output = data.get("output", {})
                    if isinstance(output, dict) and output.get("judging_results"):
                        judging_results = output["judging_results"]
                        yield f"data: {json.dumps({'type': 'judging_results', 'results': judging_results})}\n\n"

                elif phase_name and phase_name in INTERNAL_PHASES:
                    # Collect internal phase turns
                    data = event.get("data", {}) or {}
                    output = data.get("output", {})
                    if isinstance(output, dict):
                        for turn in output.get("debate_turns", []):
                            if turn.get("is_internal"):
                                collected_turns.append(turn)

                elif phase_name and phase_name in streamed_phases:
                    # Save the accumulated streamed text as a turn
                    collected_turns.append({
                        "phase": phase_name,
                        "side": get_speaker(phase_name),
                        "text": streamed_phases[phase_name],
                        "is_internal": False,
                    })

        # ── Save completed debate ──
        debate_data = {
            "id": debate_id,
            "topic": topic_title,
            "resolution": resolution,
            "pro_position": pro_position,
            "con_position": con_position,
            "personas": personas_data,
            "turns": collected_turns,
            "judging_results": judging_results,
            "evidence": {
                "citations": evidence_bundle_data.get("citations", {}),
                "pro_arguments": evidence_bundle_data.get("pro_arguments", []),
                "con_arguments": evidence_bundle_data.get("con_arguments", []),
            },
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        save_debate(debate_id, debate_data)

        yield f"data: {json.dumps({'type': 'complete', 'cached': False})}\n\n"

    except Exception as e:
        logger.exception("Error streaming debate %s", debate_id)
        yield f"data: {json.dumps({'type': 'error', 'code': 'INTERNAL_ERROR', 'message': 'An unexpected error occurred while streaming the debate.'})}\n\n"
