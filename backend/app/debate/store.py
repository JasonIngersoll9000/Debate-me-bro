"""
Debate persistence store — Issue #16 / #33.
PostgreSQL-backed storage using CachedDebate and DebateLike models.
Stores complete debate JSON blobs in a JSONB column for persistence
across Render deploys.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from sqlalchemy import select, delete as sa_delete, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.database import _get_session_factory
from app.db.models import CachedDebate, DebateLike

logger = logging.getLogger(__name__)

# Allowlist: only lowercase letters, digits, hyphens, and underscores
_VALID_ID_RE = re.compile(r"^[a-z0-9_-]+$")


def _validate_debate_id(debate_id: str) -> None:
    """Raise ValueError if debate_id is not a safe identifier."""
    if not _VALID_ID_RE.match(debate_id):
        raise ValueError(f"Invalid debate_id: {debate_id!r}")


async def save_debate(debate_id: str, data: Dict[str, Any]) -> None:
    """
    Save a completed debate to PostgreSQL.

    Args:
        debate_id: Unique debate identifier (e.g. "healthcare", or a UUID for custom)
        data: Complete debate data including turns, personas, judging results
    """
    _validate_debate_id(debate_id)

    # Ensure metadata
    data.setdefault("id", debate_id)
    data.setdefault("status", "completed")
    data.setdefault("created_at", datetime.now(timezone.utc).isoformat())

    try:
        factory = _get_session_factory()
        async with factory() as session:
            # Upsert: insert or update on conflict
            stmt = pg_insert(CachedDebate).values(
                debate_id=debate_id,
                data=data,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["debate_id"],
                set_={"data": data, "updated_at": datetime.utcnow()},
            )
            await session.execute(stmt)
            await session.commit()

        logger.info("Saved debate '%s' to database", debate_id)
    except Exception as exc:
        logger.warning("DB unavailable, could not save debate '%s': %s", debate_id, exc)


async def load_debate(debate_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a completed debate from the store.

    Returns:
        Full debate data dict, or None if not found.
    """
    _validate_debate_id(debate_id)

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(CachedDebate.data).where(CachedDebate.debate_id == debate_id)
            )
            row = result.scalar_one_or_none()

        if row is None:
            return None

        logger.info("Loaded cached debate '%s'", debate_id)
        return row
    except Exception as exc:
        logger.warning("DB unavailable, could not load debate '%s': %s", debate_id, exc)
        return None


async def debate_exists(debate_id: str) -> bool:
    """Check if a completed debate exists in the store."""
    try:
        _validate_debate_id(debate_id)
    except ValueError:
        return False

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(func.count()).select_from(CachedDebate).where(
                    CachedDebate.debate_id == debate_id
                )
            )
            return result.scalar_one() > 0
    except Exception as exc:
        logger.warning("DB unavailable, debate_exists('%s'): %s", debate_id, exc)
        return False


async def list_debates() -> List[Dict[str, Any]]:
    """
    List all saved debates with summary info.

    Returns:
        List of dicts with: id, topic, resolution, status, created_at, winner
    """
    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(CachedDebate.debate_id, CachedDebate.data)
                .order_by(CachedDebate.created_at.desc())
            )
            rows = result.all()
    except Exception as exc:
        logger.warning("DB unavailable, list_debates returning []: %s", exc)
        return []

    debates = []
    for debate_id, data in rows:
        judging = data.get("judging_results") or {}
        scores = judging.get("scores", {})

        debates.append({
            "id": data.get("id", debate_id),
            "topic": data.get("topic", "Unknown"),
            "resolution": data.get("resolution", ""),
            "pro_position": data.get("pro_position", ""),
            "con_position": data.get("con_position", ""),
            "status": data.get("status", "unknown"),
            "created_at": data.get("created_at", ""),
            "created_by": data.get("created_by", ""),
            "winner": judging.get("winner", ""),
            "pro_score": scores.get("pro", {}).get("weighted_total", 0),
            "con_score": scores.get("con", {}).get("weighted_total", 0),
            "turn_count": len([
                t for t in data.get("turns", [])
                if not t.get("is_internal", False)
            ]),
        })

    return debates


async def get_likes(debate_id: str) -> List[str]:
    """Get all user emails who liked a debate."""
    _validate_debate_id(debate_id)

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(DebateLike.user_email).where(
                    DebateLike.debate_id == debate_id
                )
            )
            return [row[0] for row in result.all()]
    except Exception as exc:
        logger.warning("DB unavailable, get_likes('%s'): %s", debate_id, exc)
        return []


async def get_like_count(debate_id: str) -> int:
    """Get the number of likes for a debate."""
    _validate_debate_id(debate_id)

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(func.count()).select_from(DebateLike).where(
                    DebateLike.debate_id == debate_id
                )
            )
            return result.scalar_one()
    except Exception as exc:
        logger.warning("DB unavailable, get_like_count('%s'): %s", debate_id, exc)
        return 0


async def like_debate(debate_id: str, user_email: str) -> bool:
    """Toggle like for a debate. Returns True if now liked, False if unliked."""
    _validate_debate_id(debate_id)

    try:
        factory = _get_session_factory()
        async with factory() as session:
            # Check if already liked
            result = await session.execute(
                select(DebateLike.id).where(
                    DebateLike.debate_id == debate_id,
                    DebateLike.user_email == user_email,
                )
            )
            existing = result.scalar_one_or_none()

            if existing is not None:
                # Unlike
                await session.execute(
                    sa_delete(DebateLike).where(DebateLike.id == existing)
                )
                await session.commit()
                return False
            else:
                # Like
                session.add(DebateLike(
                    debate_id=debate_id,
                    user_email=user_email,
                ))
                await session.commit()
                return True
    except Exception as exc:
        logger.warning("DB unavailable, like_debate('%s', '%s'): %s", debate_id, user_email, exc)
        return False


async def delete_debate(debate_id: str) -> bool:
    """Delete a debate from the store. Returns True if deleted."""
    try:
        _validate_debate_id(debate_id)
    except ValueError:
        return False

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                sa_delete(CachedDebate).where(
                    CachedDebate.debate_id == debate_id
                )
            )
            await session.commit()
            return result.rowcount > 0
    except Exception as exc:
        logger.warning("DB unavailable, delete_debate('%s'): %s", debate_id, exc)
        return False
