from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.db.models import Debate

async def sync_debate_state_to_db(debate_id: str, new_phase: str, status: str, db: AsyncSession):
    """
    Updates the physical Postgres Debate schema matching our internal LangGraph transitions.
    """
    stmt = (
        update(Debate)
        .where(Debate.id == UUID(debate_id))
        .values(
            status=status,
        )
    )
    await db.execute(stmt)
    await db.commit()
