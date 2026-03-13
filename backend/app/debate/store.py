"""
Debate persistence store — Issue #16.
JSON file-based storage for development; interface designed for easy Postgres migration.

Stores completed debates at backend/data/debates/{debate_id}.json
so they can be replayed without re-running AI calls.
"""
import json
import os
import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Allowlist: only lowercase letters, digits, hyphens, and underscores
_VALID_ID_RE = re.compile(r"^[a-z0-9_-]+$")

DATA_DIR = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(__file__))),
    "data",
    "debates")


def _validate_debate_id(debate_id: str) -> None:
    """Raise ValueError if debate_id is not a safe identifier."""
    if not _VALID_ID_RE.match(debate_id):
        raise ValueError(f"Invalid debate_id: {debate_id!r}")


def _safe_path(debate_id: str) -> str:
    """Return the resolved filepath and verify it stays within DATA_DIR."""
    _validate_debate_id(debate_id)
    resolved = os.path.realpath(os.path.join(DATA_DIR, f"{debate_id}.json"))
    real_data_dir = os.path.realpath(DATA_DIR)
    if not resolved.startswith(real_data_dir + os.sep):
        raise ValueError(
            f"Path traversal detected for debate_id: {debate_id!r}"
        )
    return resolved


def _ensure_dir():
    """Create the data directory if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)


def save_debate(debate_id: str, data: Dict[str, Any]) -> None:
    """
    Save a completed debate to the JSON file store.

    Args:
        debate_id: Unique debate identifier (e.g. "healthcare", or a UUID for custom)
        data: Complete debate data including turns, personas, judging results
    """
    _ensure_dir()

    # Ensure metadata
    data.setdefault("id", debate_id)
    data.setdefault("status", "completed")
    data.setdefault("created_at", datetime.now(timezone.utc).isoformat())

    filepath = _safe_path(debate_id)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

    logger.info("Saved debate '%s' to %s", debate_id, filepath)


def load_debate(debate_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a completed debate from the store.

    Returns:
        Full debate data dict, or None if not found.
    """
    filepath = _safe_path(debate_id)
    if not os.path.isfile(filepath):
        return None

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info("Loaded cached debate '%s'", debate_id)
        return data
    except (json.JSONDecodeError, IOError) as e:
        logger.warning("Failed to load debate '%s': %s", debate_id, e)
        return None


def debate_exists(debate_id: str) -> bool:
    """Check if a completed debate exists in the store."""
    try:
        filepath = _safe_path(debate_id)
    except ValueError:
        return False
    return os.path.isfile(filepath)


def list_debates() -> List[Dict[str, Any]]:
    """
    List all saved debates with summary info.

    Returns:
        List of dicts with: id, topic, resolution, status, created_at, winner
    """
    _ensure_dir()
    debates = []

    for filename in sorted(os.listdir(DATA_DIR), reverse=True):
        if not filename.endswith(".json"):
            continue

        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Extract summary fields
            judging = data.get("judging_results") or {}
            scores = judging.get("scores", {})

            debates.append({
                "id": data.get("id", filename.replace(".json", "")),
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
        except (json.JSONDecodeError, IOError) as e:
            logger.warning("Could not read %s: %s", filename, e)

    return debates


def delete_debate(debate_id: str) -> bool:
    """Delete a debate from the store. Returns True if deleted."""
    try:
        filepath = _safe_path(debate_id)
    except ValueError:
        return False
    if os.path.isfile(filepath):
        os.remove(filepath)
        logger.info("Deleted debate '%s'", debate_id)
        return True
    return False
