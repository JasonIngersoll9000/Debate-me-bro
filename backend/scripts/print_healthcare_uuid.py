import asyncio

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.db.models import Topic


async def main() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Topic).where(Topic.title == "Universal Healthcare")
        )
        topic = result.scalar_one_or_none()

        if topic is None:
            print("No topic found for 'Universal Healthcare' (id='healthcare').")
            return

        print(f"Healthcare topic UUID: {topic.id}")


if __name__ == "__main__":
    asyncio.run(main())

