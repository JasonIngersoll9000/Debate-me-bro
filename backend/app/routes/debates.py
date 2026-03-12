from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.debate.stream import stream_debate_events

router = APIRouter(prefix="/api/debates", tags=["debates"])

@router.get("/{debate_id}/stream")
async def stream_debate(debate_id: str):
    """
    Server-Sent Events endpoint that streams debate content as the debate progresses.
    """
    return StreamingResponse(
        stream_debate_events(debate_id),
        media_type="text/event-stream"
    )
