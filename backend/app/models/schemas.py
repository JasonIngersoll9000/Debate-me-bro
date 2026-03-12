from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any, TypedDict
from uuid import UUID
from datetime import datetime

class DebateState(TypedDict):
    debate_id: str
    topic: str
    status: str
    current_phase: str
    debate_turns: List[Dict[str, Any]]
    evidence_bundle: Optional[Dict[str, Any]]
    personas: Dict[str, str]

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_preset: bool = False

class TopicResponse(TopicBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DebateCreate(BaseModel):
    topic_id: UUID

class DebateResponse(BaseModel):
    id: UUID
    topic_id: UUID
    user_id: Optional[UUID] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TurnResponse(BaseModel):
    id: UUID
    debate_id: UUID
    phase: str
    side: str
    text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JWTTokenResponse(BaseModel):
    access_token: str
    token_type: str

class CitationDetail(BaseModel):
    title: str
    url: str
    source_context: str = ""

class EvidenceBundle(BaseModel):
    raw_content: str
    citations: Dict[str, CitationDetail]

class PresetTopicResponse(BaseModel):
    id: str
    title: str
    description: str
    pro_position: str
    con_position: str
