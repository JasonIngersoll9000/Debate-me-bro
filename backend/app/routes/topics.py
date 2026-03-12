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
    {
        "id": "ubi",
        "title": "Universal Basic Income",
        "description": "Should the federal government implement a Universal Basic Income for all adult citizens?",
        "pro_position": "Provide a no-strings-attached monthly stipend to eliminate absolute poverty, buffer against AI job displacement, and empower workers.",
        "con_position": "Rely on targeted welfare programs; UBI creates disincentives to work, triggers inflation, and is fiscally unsustainable."
    },
    {
        "id": "nuclear",
        "title": "Nuclear Energy Expansion",
        "description": "Should nuclear energy be massively expanded as the primary baseload power for the clean energy transition?",
        "pro_position": "Nuclear is the only reliable, scalable, carbon-free baseload power source capable of replacing fossil fuels without massive battery storage infrastructure.",
        "con_position": "Nuclear is too expensive, takes too long to build, and carries unacceptable risks regarding waste storage and potential catastrophic accidents."
    }
]

@router.get("/presets", response_model=List[PresetTopicResponse])
async def get_preset_topics():
    """
    Returns the list of hardcoded preset topics.
    """
    return PRESET_TOPICS
