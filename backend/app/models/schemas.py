from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

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
