from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse, JSONResponse

from app.config import settings
from app.debate.stream import stream_debate_events
from app.debate.store import load_debate, list_debates

router = APIRouter(prefix="/api/debates", tags=["debates"])


@router.get("/mode")
async def get_debate_mode():
    """
    Returns the current debate mode (demo or live) from server config.
    Frontend uses this to decide whether to run mock or real debates.
    """
    return {"mode": settings.debate_mode}


@router.get("/")
async def get_all_debates():
    """
    List all completed debates. Public — no auth required.
    Returns summary info for each debate (topic, scores, winner, etc.)
    """
    debates = list_debates()
    return debates


@router.get("/{debate_id}")
async def get_debate(debate_id: str):
    """
    Get full debate data by ID. Returns cached data if available,
    or 404 if the debate hasn't been generated yet.
    """
    data = load_debate(debate_id)
    if data is None:
        return JSONResponse(
            status_code=404,
            content={
                "detail": (
                    f"Debate '{debate_id}' not found. "
                    "Start it via the streaming endpoint."
                )
            },
        )
    return data


@router.get("/{debate_id}/stream")
async def stream_debate(
    debate_id: str,
    mode: Optional[str] = Query(None, description="Override debate mode: 'demo' or 'live'"),
):
    """
    Server-Sent Events endpoint that streams debate content.
    If the debate is already cached, replays from storage (no LLM calls).
    If not cached, runs the full AI debate pipeline and saves the result.
    The ?mode= query param overrides the server-wide DEBATE_MODE setting.
    """
    effective_mode = mode if mode in ("demo", "live") else settings.debate_mode
    return StreamingResponse(
        stream_debate_events(debate_id, mode=effective_mode),
        media_type="text/event-stream",
    )
