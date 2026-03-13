"""
Judging panel orchestrator — prompts-doc.md §3.
Runs 3 specialized judges concurrently and aggregates results.
"""
import asyncio
import json
import logging
from typing import Dict, Any

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings
from app.judging.prompts.logic_judge import LOGIC_JUDGE_PROMPT
from app.judging.prompts.evidence_judge import EVIDENCE_JUDGE_PROMPT
from app.judging.prompts.engagement_judge import ENGAGEMENT_JUDGE_PROMPT

logger = logging.getLogger(__name__)


async def _run_judge(judge_name: str, prompt: str, transcript: str) -> Dict[str, Any]:
    """Run a single judge and parse their JSON output."""
    llm = ChatAnthropic(
        model_name=settings.debate_model,
        temperature=0.3,
        anthropic_api_key=settings.anthropic_api_key,
    )

    # Prompt caching: the transcript is identical across all 3 judges,
    # so cache it to avoid counting those tokens toward ITPM 3 times.
    messages = [
        SystemMessage(content=[
            {"type": "text", "text": prompt, "cache_control": {"type": "ephemeral"}},
        ]),
        HumanMessage(content=[
            {"type": "text", "text": f"## Complete Debate Transcript\n\n{transcript}", "cache_control": {"type": "ephemeral"}},
        ]),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    # Parse JSON from response
    try:
        if "```" in raw:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]
        data = json.loads(raw)
        data["judge_name"] = judge_name
        return data
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Failed to parse %s judge JSON: %s", judge_name, e)
        return {
            "judge_name": judge_name,
            "error": "Failed to parse judge output",
            "raw_output": response.content[:500],
            "pro_score": 3,
            "con_score": 3,
        }


async def run_judging_panel(transcript: str) -> Dict[str, Any]:
    """
    Run all 3 judges concurrently and aggregate results.

    Returns a dict with:
    - judges: list of individual judge results
    - scores: {pro: weighted_total, con: weighted_total}
    - winner: "pro" or "con"
    """
    # Run all 3 judges in parallel
    logic_result, evidence_result, engagement_result = await asyncio.gather(
        _run_judge("Logic Judge", LOGIC_JUDGE_PROMPT, transcript),
        _run_judge("Evidence Judge", EVIDENCE_JUDGE_PROMPT, transcript),
        _run_judge("Engagement Judge", ENGAGEMENT_JUDGE_PROMPT, transcript),
    )

    # Compute weighted scores
    # Logic: 30%, Evidence: 25%, Engagement: Refutation 25% + Steelman 20%
    pro_logic = logic_result.get("pro_score", 3)
    con_logic = logic_result.get("con_score", 3)

    pro_evidence = evidence_result.get("pro_score", 3)
    con_evidence = evidence_result.get("con_score", 3)

    pro_refutation = engagement_result.get("pro_refutation_score", 3)
    con_refutation = engagement_result.get("con_refutation_score", 3)
    pro_steelman = engagement_result.get("pro_steelman_score", 3)
    con_steelman = engagement_result.get("con_steelman_score", 3)

    # Weighted totals (out of 5.0)
    pro_total = (
        pro_logic * 0.30 +
        pro_evidence * 0.25 +
        pro_refutation * 0.25 +
        pro_steelman * 0.20
    )
    con_total = (
        con_logic * 0.30 +
        con_evidence * 0.25 +
        con_refutation * 0.25 +
        con_steelman * 0.20
    )

    winner = "pro" if pro_total > con_total else "con" if con_total > pro_total else "tie"

    # Synthesize a summary from the 3 judges' individual reasoning
    summary = _synthesize_summary(
        winner, pro_total, con_total,
        logic_result, evidence_result, engagement_result,
    )

    return {
        "judges": [logic_result, evidence_result, engagement_result],
        "scores": {
            "pro": {
                "logic": pro_logic,
                "evidence": pro_evidence,
                "refutation": pro_refutation,
                "steelman": pro_steelman,
                "weighted_total": round(pro_total, 2),
            },
            "con": {
                "logic": con_logic,
                "evidence": con_evidence,
                "refutation": con_refutation,
                "steelman": con_steelman,
                "weighted_total": round(con_total, 2),
            },
        },
        "winner": winner,
        "summary": summary,
    }


def _synthesize_summary(
    winner: str,
    pro_total: float,
    con_total: float,
    logic_result: Dict[str, Any],
    evidence_result: Dict[str, Any],
    engagement_result: Dict[str, Any],
) -> str:
    """Build a coherent verdict summary from the 3 judges' individual results."""
    w = "Pro" if winner == "pro" else "Con" if winner == "con" else "Neither side"
    margin = abs(pro_total - con_total)
    closeness = (
        "by a razor-thin margin"
        if margin < 0.3
        else "by a moderate margin"
        if margin < 0.8
        else "decisively"
    )

    # Gather per-judge winners
    logic_winner = logic_result.get("winner", "")
    evidence_winner = evidence_result.get("winner", "")
    engagement_winner = engagement_result.get("overall_winner", "")
    judge_wins = {"pro": 0, "con": 0}
    for jw in [logic_winner, evidence_winner, engagement_winner]:
        if jw in judge_wins:
            judge_wins[jw] += 1
    consistency = judge_wins.get(winner, 0)
    consistency_note = (
        f"All 3 judges agreed."
        if consistency == 3
        else f"{consistency}/3 judges favored {w}."
    )

    # Per-criterion highlights
    parts = [f"{w} wins {closeness} ({pro_total:.2f} vs {con_total:.2f}). {consistency_note}"]

    logic_expl = logic_result.get("winner_explanation", "")
    if logic_expl:
        parts.append(f"Logic (30%): {logic_expl}")

    evidence_expl = evidence_result.get("winner_explanation", "")
    if evidence_expl:
        parts.append(f"Evidence (25%): {evidence_expl}")

    engagement_expl = engagement_result.get("winner_explanation", "")
    if engagement_expl:
        parts.append(f"Engagement (45%): {engagement_expl}")

    return " ".join(parts)
