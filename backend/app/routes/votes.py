from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.database import get_db
from app.db.models import Vote, Debate
from app.models.schemas import VoteCast, VoteTallyOut
from app.auth.dependencies import get_current_user, get_optional_current_user
from app.db.models import User
import uuid

router = APIRouter(prefix="/api/votes", tags=["votes"])

@router.post("/", response_model=VoteTallyOut)
async def cast_vote(
    vote_data: VoteCast,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a vote for a debate (pro or con).
    Requires authentication. Users can only vote once per debate.
    """
    # No need to cast debate_id, Pydantic handles UUID conversion natively now in VoteCast
    search_id = vote_data.debate_id
    
    if vote_data.side not in ["pro", "con"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Side must be 'pro' or 'con'"
        )

    # Convert string ID to UUID format for querying assuming Debates store UUID ID.
    # Note: Issue #16 mentions files. If we are tracking via `Vote` table, 
    # we need `vote_data.debate_id` to be string, or we adapt DB model.
    # Given model has UUID for Debate.id, we'll assume debate string maps over safely if custom, 
    # or handle the UUID parsing strictly.

    # Check if vote exists
    stmt = select(Vote).where(
        Vote.debate_id == search_id,
        Vote.user_id == current_user.id
    )
    result = await db.execute(stmt)
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already voted on this debate."
        )

    new_vote = Vote(
        debate_id=search_id,
        user_id=current_user.id,
        side=vote_data.side
    )
    db.add(new_vote)
    await db.commit()

    return await get_vote_tally(vote_data.debate_id, current_user, db)


@router.get("/{debate_id}", response_model=VoteTallyOut)
async def get_vote_tally(
    debate_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the tally of votes for a specific debate.
    If authenticated, returns whether the current user voted.
    """
    stmt = select(Vote).where(Vote.debate_id == debate_id)
    result = await db.execute(stmt)
    votes = result.scalars().all()

    pro_votes = sum(1 for v in votes if v.side == "pro")
    con_votes = sum(1 for v in votes if v.side == "con")
    total_votes = len(votes)

    user_vote = None
    if current_user:
        for v in votes:
            if v.user_id == current_user.id:
                user_vote = v.side
                break

    return VoteTallyOut(
        pro_votes=pro_votes,
        con_votes=con_votes,
        total_votes=total_votes,
        user_vote=user_vote
    )
