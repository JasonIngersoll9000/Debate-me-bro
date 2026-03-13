import pytest
import uuid
import asgi_lifespan
import re
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.main import app


@pytest.mark.asyncio
async def test_user_registration_and_login():
    test_email = f"testuser_{uuid.uuid4()}@example.com"
    test_password = "secure_password_123"

    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # 1. Register user
            reg_response = await ac.post(
                "/api/auth/register",
                json={"email": test_email, "password": test_password}
            )
            assert reg_response.status_code == 201
            data = reg_response.json()
            assert data["email"] == test_email
            assert "id" in data

            # 2. Prevent duplicate registration
            dup_response = await ac.post(
                "/api/auth/register",
                json={"email": test_email, "password": test_password}
            )
            assert dup_response.status_code == 400

            # 3. Login with correct credentials (form-encoded)
            login_response = await ac.post(
                "/api/auth/login",
                data={"username": test_email, "password": test_password}
            )
            assert login_response.status_code == 200
            token_data = login_response.json()
            assert "access_token" in token_data
            assert token_data["token_type"] == "bearer"

            # 4. Login with incorrect credentials
            bad_login = await ac.post(
                "/api/auth/login",
                data={"username": test_email, "password": "wrong_password"}
            )
            assert bad_login.status_code == 401
