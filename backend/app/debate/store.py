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
    """
    Toggle like for a debate atomically.

    Uses INSERT ... ON CONFLICT DO NOTHING to avoid a read-then-write race
    condition: if the insert lands (rowcount == 1), the debate is now liked;
    if nothing was inserted (rowcount == 0), the row already existed and we
    delete it (unlike).

    Returns True if now liked, False if unliked.
    """
    _validate_debate_id(debate_id)

    try:
        factory = _get_session_factory()
        async with factory() as session:
            # Attempt atomic insert; no-op on duplicate
            stmt = pg_insert(DebateLike).values(
                debate_id=debate_id,
                user_email=user_email,
                created_at=datetime.now(timezone.utc),
            ).on_conflict_do_nothing(index_elements=["debate_id", "user_email"])
            result = await session.execute(stmt)

            if result.rowcount == 1:
                # Row was inserted → user just liked the debate
                await session.commit()
                return True
            else:
                # Row already existed → user is unliking; delete it
                await session.execute(
                    sa_delete(DebateLike).where(
                        DebateLike.debate_id == debate_id,
                        DebateLike.user_email == user_email,
                    )
                )
                await session.commit()
                return False
    except Exception as exc:
        logger.warning("DB unavailable, like_debate('%s', '%s'): %s", debate_id, user_email, exc)
        return False


async def delete_debate(debate_id: str) -> bool:
    """Delete a debate and its associated likes from the store. Returns True if deleted."""
    try:
        _validate_debate_id(debate_id)
    except ValueError:
        return False

    try:
        factory = _get_session_factory()
        async with factory() as session:
            # Delete associated likes first (in case FK cascade is not yet applied)
            await session.execute(
                sa_delete(DebateLike).where(DebateLike.debate_id == debate_id)
            )
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


async def get_bulk_like_counts(debate_ids: List[str]) -> Dict[str, int]:
    """
    Get like counts for multiple debates in a single query.

    Returns a dict mapping debate_id → like count. Debates with zero
    likes are omitted from the result; callers should default to 0.
    """
    if not debate_ids:
        return {}

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(DebateLike.debate_id, func.count().label("cnt"))
                .where(DebateLike.debate_id.in_(debate_ids))
                .group_by(DebateLike.debate_id)
            )
            return {row[0]: row[1] for row in result.all()}
    except Exception as exc:
        logger.warning("DB unavailable, get_bulk_like_counts: %s", exc)
        return {}


async def get_bulk_user_liked(
    debate_ids: List[str], user_email: str
) -> Dict[str, bool]:
    """
    Check which debates a user has liked in a single query.

    Returns a dict mapping debate_id → bool.
    """
    if not debate_ids:
        return {}

    try:
        factory = _get_session_factory()
        async with factory() as session:
            result = await session.execute(
                select(DebateLike.debate_id).where(
                    DebateLike.debate_id.in_(debate_ids),
                    DebateLike.user_email == user_email,
                )
            )
            liked_ids = {row[0] for row in result.all()}
            return {d: d in liked_ids for d in debate_ids}
    except Exception as exc:
        logger.warning("DB unavailable, get_bulk_user_liked: %s", exc)
        return {}
