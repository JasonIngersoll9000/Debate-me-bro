import asyncio
import uuid

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.db.models import Topic


async def main() -> None:
    async with AsyncSessionLocal() as session:
        # 先看是否已经有这个 preset topic，避免重复插入
        result = await session.execute(
            select(Topic).where(Topic.title == "Universal Healthcare")
        )
        topic = result.scalar_one_or_none()

        if topic is not None:
            print(f"Existing healthcare topic UUID: {topic.id}")
            return

        # 创建一个新的 topic，UUID 让 ORM 默认生成（models.Topic 默认 uuid4）
        new_topic = Topic(
            title="Universal Healthcare",
            description=(
                "Should the United States adopt a single-payer universal healthcare system?"
            ),
            is_preset=True,
        )
        session.add(new_topic)
        await session.commit()
        await session.refresh(new_topic)

        print(f"Inserted healthcare topic UUID: {new_topic.id}")


if __name__ == "__main__":
    asyncio.run(main())

