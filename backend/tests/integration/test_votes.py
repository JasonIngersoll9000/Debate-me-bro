import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.db.database import AsyncSessionLocal
from app.db.models import Topic, Debate
from app.main import app

@pytest.mark.asyncio
async def test_cast_vote_and_get_tally():
    test_email = f"testuser_{uuid.uuid4()}@example.com"
    test_password = "secure_password_123"
    
    # We use a UUID object so SQLAlchemy handles it properly for the Postgres driver
    test_topic_id = uuid.uuid4()
    test_debate_id = uuid.uuid4()

    async with LifespanManager(app):
        # Pre-populate DB with the topic/debate constraints while app runs
        async with AsyncSessionLocal() as session:
            mock_topic = Topic(id=test_topic_id, title="Test Topic")
            mock_debate = Debate(id=test_debate_id, topic_id=test_topic_id, status="pending")
            session.add(mock_topic)
            session.add(mock_debate)
            await session.commit()
            
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            
            # 1. Register a user and login to get token
            await ac.post("/api/auth/register", json={"email": test_email, "password": test_password})
            
            login_response = await ac.post(
                "/api/auth/login",
                data={"username": test_email, "password": test_password}
            )
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # 2. Add a vote
            vote_response = await ac.post(
                "/api/votes/",
                headers=headers,
                json={"debate_id": str(test_debate_id), "side": "pro"}
            )
            assert vote_response.status_code == 200
            data = vote_response.json()
            assert data["pro_votes"] == 1
            assert data["con_votes"] == 0
            assert data["total_votes"] == 1
            assert data["user_vote"] == "pro"
            
            # 3. Duplicate vote fails
            dup_vote_response = await ac.post(
                "/api/votes/",
                headers=headers,
                json={"debate_id": str(test_debate_id), "side": "con"}
            )
            assert dup_vote_response.status_code == 400
            
            # 4. Get Tally Unauthenticated
            tally_response = await ac.get(f"/api/votes/{test_debate_id}")
            assert tally_response.status_code == 200
            tally_data = tally_response.json()
            assert tally_data["pro_votes"] == 1
            assert tally_data["user_vote"] is None
            
            # 5. Get Tally Authenticated
            auth_tally = await ac.get(f"/api/votes/{test_debate_id}", headers=headers)
            assert auth_tally.status_code == 200
            auth_tally_data = auth_tally.json()
            assert auth_tally_data["pro_votes"] == 1
            assert auth_tally_data["user_vote"] == "pro"

            # 6. Unauthenticated POST fails
            unauth_post = await ac.post(
                "/api/votes/",
                json={"debate_id": str(test_debate_id), "side": "pro"}
            )
            assert unauth_post.status_code == 401
