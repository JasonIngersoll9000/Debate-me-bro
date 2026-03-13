import asyncio
from typing import Optional

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.db.models import Topic, Debate, Vote


async def seed_debate_and_vote() -> None:
    async with AsyncSessionLocal() as session:
        # 1. 找到我们之前插入的 Universal Healthcare topic
        topic_result = await session.execute(
            select(Topic).where(Topic.title == "Universal Healthcare")
        )
        topic: Optional[Topic] = topic_result.scalar_one_or_none()

        if topic is None:
            print("ERROR: healthcare topic not found. Run seed_healthcare_topic first.")
            return

        # 2. 如果已经有这个 topic 下面的 debate，就复用第一条，避免重复插入
        debate_result = await session.execute(
            select(Debate).where(Debate.topic_id == topic.id)
        )
        existing_debate: Optional[Debate] = debate_result.scalar_one_or_none()

        if existing_debate is not None:
            debate = existing_debate
            print(f"Existing healthcare debate UUID: {debate.id}")
        else:
            # 创建一个新的 debate，user_id 先留空
            debate = Debate(
                topic_id=topic.id,
                status="completed",
            )
            session.add(debate)
            await session.commit()
            await session.refresh(debate)
            print(f"Inserted healthcare debate UUID: {debate.id}")

        # 3. 为这个 debate 插入一条匿名投票（user_id=None），方便 Swagger 测试
        vote_result = await session.execute(
            select(Vote).where(Vote.debate_id == debate.id)
        )
        existing_vote: Optional[Vote] = vote_result.scalar_one_or_none()

        if existing_vote is not None:
            print(
                f"Existing vote for healthcare debate found (side={existing_vote.side})."
            )
        else:
            new_vote = Vote(
                debate_id=debate.id,
                user_id=None,
                side="pro",
            )
            session.add(new_vote)
            await session.commit()
            await session.refresh(new_vote)
            print(
                f"Inserted vote for healthcare debate: id={new_vote.id}, "
                f"side={new_vote.side}"
            )

        print(
            f"\nYou can now use this debate UUID in Swagger: {debate.id}\n"
            "Example: GET /api/votes/{debate_id}"
        )


if __name__ == "__main__":
    asyncio.run(seed_debate_and_vote())

