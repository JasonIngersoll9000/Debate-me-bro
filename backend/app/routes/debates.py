from typing import Optional

from fastapi import APIRouter, Query, Header, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from app.config import settings
from app.debate.stream import stream_debate_events
from app.debate.store import load_debate, list_debates, like_debate, get_like_count, get_likes, save_debate
from app.judging.panel import run_judging_panel

router = APIRouter(prefix="/api/debates", tags=["debates"])


def _get_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract user email from JWT token. Returns None if not authenticated."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    from jose import jwt
    try:
        token = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except Exception:
        return None


@router.get("/mode")
async def get_debate_mode():
    """
    Returns the current debate mode (demo or live) from server config.
    Frontend uses this to decide whether to run mock or real debates.
    """
    return {"mode": settings.debate_mode}


@router.get("/")
async def get_all_debates(authorization: Optional[str] = Header(None)):
    """
    List all completed debates. Public — no auth required.
    Returns summary info for each debate (topic, scores, winner, like_count, etc.)
    """
    user_email = _get_user_email(authorization)
    debates = list_debates()
    for d in debates:
        d["like_count"] = get_like_count(d["id"])
        if user_email:
            d["user_liked"] = user_email in get_likes(d["id"])
        else:
            d["user_liked"] = False
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


@router.post("/{debate_id}/like")
async def toggle_like(debate_id: str, authorization: Optional[str] = Header(None)):
    """
    Toggle like on a debate. Requires authentication.
    Returns current like state and total count.
    """
    user_email = _get_user_email(authorization)
    if not user_email:
        raise HTTPException(status_code=401, detail="Authentication required to like debates")

    data = load_debate(debate_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Debate '{debate_id}' not found")

    liked = like_debate(debate_id, user_email)
    return {
        "liked": liked,
        "like_count": get_like_count(debate_id),
    }


@router.post("/{debate_id}/rejudge")
async def rejudge_debate(debate_id: str, authorization: Optional[str] = Header(None)):
    """
    Re-run the judging panel on a cached debate using the latest judge prompts.
    Keeps all other debate data (turns, personas, evidence) intact.
    Requires authentication.
    """
    user_email = _get_user_email(authorization)
    if not user_email:
        raise HTTPException(status_code=401, detail="Authentication required to rejudge debates")

    data = load_debate(debate_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Debate '{debate_id}' not found")

    # Build transcript from non-internal turns
    turns = data.get("turns", [])
    transcript_parts = []
    for turn in turns:
        if turn.get("is_internal", False):
            continue
        side = turn.get("side", "unknown").upper()
        phase = turn.get("phase", "unknown")
        transcript_parts.append(f"[{side} — {phase}]\n{turn.get('text', '')}")

    if not transcript_parts:
        raise HTTPException(status_code=400, detail="Debate has no public turns to judge")

    transcript = "\n\n---\n\n".join(transcript_parts)

    # Re-run the judging panel
    new_results = await run_judging_panel(transcript)

    # Merge into existing debate data and save
    data["judging_results"] = new_results
    save_debate(debate_id, data)

    return {"detail": "Rejudging complete", "judging_results": new_results}


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
