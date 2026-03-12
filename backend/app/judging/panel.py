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

from app.judging.prompts.logic_judge import LOGIC_JUDGE_PROMPT
from app.judging.prompts.evidence_judge import EVIDENCE_JUDGE_PROMPT
from app.judging.prompts.engagement_judge import ENGAGEMENT_JUDGE_PROMPT

logger = logging.getLogger(__name__)


async def _run_judge(judge_name: str, prompt: str, transcript: str) -> Dict[str, Any]:
    """Run a single judge and parse their JSON output."""
    llm = ChatAnthropic(model_name="claude-sonnet-4-20250514", temperature=0.3)

    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=f"## Complete Debate Transcript\n\n{transcript}"),
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
    }
