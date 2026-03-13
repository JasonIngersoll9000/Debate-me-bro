from fastapi import APIRouter
from typing import List
from app.models.schemas import PresetTopicResponse

router = APIRouter(prefix="/api/topics", tags=["topics"])

# Hardcoded preset topics per PRD requirements
PRESET_TOPICS = [
    {
        "id": "healthcare",
        "title": "Universal Healthcare",
        "description": "Should the United States adopt a single-payer universal healthcare system?",
        "pro_position": "Adopt a Medicare-for-All style single-payer system to ensure universal coverage, eliminate administrative waste, and decouple healthcare from employment.",
        "con_position": "Maintain a multi-payer system combining private insurance and public safety nets to preserve innovation, choice, and avoid excessive tax burdens."
    },
]


@router.get("/presets", response_model=List[PresetTopicResponse])
async def get_preset_topics():
    """
    Returns the list of hardcoded preset topics.
    """
    return PRESET_TOPICS
