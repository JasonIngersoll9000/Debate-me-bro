"""
Tests for auth/security.py — password hashing and JWT creation.
"""
from datetime import timedelta

from jose import jwt

from app.auth.security import verify_password, get_password_hash, create_access_token
from app.config import settings


def test_password_hash_and_verify():
    plain = "MySecretPassword123!"
    hashed = get_password_hash(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True


def test_password_verify_wrong():
    hashed = get_password_hash("correct")
    assert verify_password("wrong", hashed) is False


def test_create_access_token_default_expiry():
    token = create_access_token(data={"sub": "test@example.com"})
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["sub"] == "test@example.com"
    assert "exp" in payload


def test_create_access_token_custom_expiry():
    token = create_access_token(
        data={"sub": "user@test.com"},
        expires_delta=timedelta(minutes=5),
    )
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["sub"] == "user@test.com"
