"""
Research routes — Issues #11 and #12.
Handles topic analysis (generate research prompts) and research upload.
"""
import os
import uuid
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.topics.analysis import analyze_topic
from app.topics.prompts import generate_research_prompts

router = APIRouter(prefix="/api/research", tags=["research"])


class TopicAnalyzeRequest(BaseModel):
    resolution: str
    context: Optional[str] = None


class TopicAnalyzeResponse(BaseModel):
    topic_id: str
    resolution: str
    pro_position: str
    con_position: str
    pro_dimensions: list
    con_dimensions: list
    pro_prompt: str
    con_prompt: str


@router.post("/analyze", response_model=TopicAnalyzeResponse)
async def analyze_custom_topic(request: TopicAnalyzeRequest):
    """
    Analyze a custom resolution and generate research prompts.
    Returns structured topic analysis + two research prompts (Pro + Con)
    that users can copy into Claude or ChatGPT to generate research.
    """
    # Analyze the topic with Claude Haiku
    analysis = await analyze_topic(request.resolution, request.context or "")

    # Generate research prompts
    prompts = generate_research_prompts(analysis)

    # Generate a unique topic ID
    topic_id = f"custom-{uuid.uuid4().hex[:8]}"

    # Save topic analysis for later use when debate starts
    _save_topic_analysis(topic_id, analysis.model_dump(), prompts)

    return TopicAnalyzeResponse(
        topic_id=topic_id,
        resolution=analysis.resolution,
        pro_position=analysis.pro_position,
        con_position=analysis.con_position,
        pro_dimensions=analysis.pro_dimensions,
        con_dimensions=analysis.con_dimensions,
        pro_prompt=prompts["pro_prompt"],
        con_prompt=prompts["con_prompt"],
    )


@router.post("/upload/{topic_id}")
async def upload_research(
    topic_id: str,
    side: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload a research document (Markdown) for a custom topic.
    Side must be 'pro' or 'con'.
    """
    if side not in ("pro", "con"):
        raise HTTPException(status_code=400, detail="Side must be 'pro' or 'con'")

    content = await file.read()
    text = content.decode("utf-8")

    # Save to evidence directory for this custom topic
    evidence_dir = os.path.join("evidence", topic_id)
    os.makedirs(evidence_dir, exist_ok=True)

    filepath = os.path.join(evidence_dir, f"{side}_research.md")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text)

    # Check if both sides are uploaded
    pro_exists = os.path.isfile(os.path.join(evidence_dir, "pro_research.md"))
    con_exists = os.path.isfile(os.path.join(evidence_dir, "con_research.md"))

    return {
        "status": "uploaded",
        "side": side,
        "topic_id": topic_id,
        "filename": file.filename,
        "size": len(text),
        "ready_to_debate": pro_exists and con_exists,
    }


@router.get("/status/{topic_id}")
async def research_status(topic_id: str):
    """Check what research has been uploaded for a topic."""
    evidence_dir = os.path.join("evidence", topic_id)
    pro_exists = os.path.isfile(os.path.join(evidence_dir, "pro_research.md"))
    con_exists = os.path.isfile(os.path.join(evidence_dir, "con_research.md"))

    # Load topic analysis if saved
    analysis = _load_topic_analysis(topic_id)

    return {
        "topic_id": topic_id,
        "pro_uploaded": pro_exists,
        "con_uploaded": con_exists,
        "ready_to_debate": pro_exists and con_exists,
        "analysis": analysis,
    }


# ─── Internal helpers ────────────────────────────────────────────────

TOPICS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "topics")


def _save_topic_analysis(topic_id: str, analysis: dict, prompts: dict) -> None:
    os.makedirs(TOPICS_DIR, exist_ok=True)
    data = {
        "topic_id": topic_id,
        "analysis": analysis,
        "prompts": prompts,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    filepath = os.path.join(TOPICS_DIR, f"{topic_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load_topic_analysis(topic_id: str) -> Optional[dict]:
    filepath = os.path.join(TOPICS_DIR, f"{topic_id}.json")
    if os.path.isfile(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return None
