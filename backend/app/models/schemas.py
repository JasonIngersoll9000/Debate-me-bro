from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import List, Optional, Dict, Any, TypedDict
from uuid import UUID
from datetime import datetime

# ─── Persona (structured per prompts-doc.md §1) ───


class Persona(BaseModel):
    """Dynamic persona generated for each debate side."""
    name: str = ""                              # e.g. "Dr. Amara Osei"
    identity: str = ""                          # 1-sentence professional description
    expertise_areas: List[str] = Field(default_factory=list)
    core_values: List[str] = Field(default_factory=list)
    rhetorical_approach: str = ""               # How this advocate builds arguments
    why_this_persona: str = ""                  # Why ideal for this side


# ─── Topic Analysis (prompts-doc.md §5) ───

class TopicAnalysis(BaseModel):
    """Structured output from topic analysis prompt."""
    resolution: str
    pro_position: str = ""
    con_position: str = ""
    pro_dimensions: List[str] = Field(default_factory=list)
    con_dimensions: List[str] = Field(default_factory=list)
    pro_values: List[str] = Field(default_factory=list)
    con_values: List[str] = Field(default_factory=list)
    key_contested_facts: List[str] = Field(default_factory=list)
    pro_persona_suggestion: str = ""
    con_persona_suggestion: str = ""


# ─── Debate State (LangGraph TypedDict) ───

class DebateState(TypedDict):
    debate_id: str
    topic: str
    resolution: str
    pro_position: str
    con_position: str
    status: str
    current_phase: str
    debate_turns: List[Dict[str, Any]]
    evidence_bundle: Optional[Dict[str, Any]]
    personas: Dict[str, Any]                    # side -> Persona.model_dump()
    judging_results: Optional[Dict[str, Any]]


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
    """A single source with all metadata (prompts-doc.md §6)."""
    title: str
    url: str
    author: str = ""
    year: str = ""
    finding: str = ""
    source_context: str = ""                   # Legacy: surrounding text chunk


class EvidenceBundle(BaseModel):
    """All research for a debate — both sides see everything (prompts-doc.md §6)."""
    raw_content: str                            # Combined text for backward compat
    pro_research: str = ""                      # Full Pro research document
    con_research: str = ""                      # Full Con research document
    citations: Dict[str, CitationDetail] = Field(default_factory=dict)
    pro_arguments: List[str] = Field(default_factory=list)
    con_arguments: List[str] = Field(default_factory=list)


class PresetTopicResponse(BaseModel):
    id: str
    title: str
    description: str
    pro_position: str
    con_position: str


class VoteCast(BaseModel):
    """Payload for submitting a vote."""
    debate_id: str
    side: str


class VoteTallyOut(BaseModel):
    """Response format for vote counts on a debate."""
    pro_votes: int
    con_votes: int
    total_votes: int
    user_vote: Optional[str] = None
