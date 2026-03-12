import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.main import app

@pytest.mark.asyncio
async def test_get_preset_topics():
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/topics/presets")
            assert response.status_code == 200
            
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 3
            
            # Check structure of first item
            first_topic = data[0]
            assert "id" in first_topic
            assert "title" in first_topic
            assert "description" in first_topic
            assert "pro_position" in first_topic
            assert "con_position" in first_topic
