from uuid import uuid4
from datetime import datetime
import pytest
from pydantic import ValidationError

from app.models.schemas import (
    UserCreate,
    UserResponse,
    TopicBase,
    TopicResponse,
    DebateCreate,
    DebateResponse,
    TurnResponse,
    JWTTokenResponse
)


def test_user_create_valid():
    user = UserCreate(email="test@example.com", password="securepassword123")
    assert user.email == "test@example.com"
    assert user.password == "securepassword123"


def test_user_create_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(email="not-an-email", password="pw")


def test_user_response():
    now = datetime.utcnow()
    user_id = uuid4()
    user_res = UserResponse(
        id=user_id,
        email="test@example.com",
        created_at=now)
    assert user_res.id == user_id
    assert user_res.email == "test@example.com"
    assert user_res.created_at == now


def test_topic_base():
    topic = TopicBase(title="Should AI replace developers?")
    assert topic.title == "Should AI replace developers?"
    assert topic.is_preset is False
    assert topic.description is None


def test_debate_create():
    topic_id = uuid4()
    debate_req = DebateCreate(topic_id=topic_id)
    assert debate_req.topic_id == topic_id


def test_debate_response():
    d_id = uuid4()
    t_id = uuid4()
    now = datetime.utcnow()
    debate_res = DebateResponse(
        id=d_id,
        topic_id=t_id,
        status="pending",
        created_at=now)
    assert debate_res.id == d_id
    assert debate_res.status == "pending"
    assert debate_res.user_id is None


def test_turn_response():
    t_id = uuid4()
    d_id = uuid4()
    now = datetime.utcnow()
    turn = TurnResponse(
        id=t_id,
        debate_id=d_id,
        phase="opening",
        side="pro",
        text="AI increases productivity.",
        created_at=now
    )
    assert turn.debate_id == d_id
    assert turn.side == "pro"


def test_jwt_response():
    token = JWTTokenResponse(access_token="abc123token", token_type="bearer")
    assert token.access_token == "abc123token"
    assert token.token_type == "bearer"
