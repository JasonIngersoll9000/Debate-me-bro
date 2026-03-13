"""
Unit tests for judge output schema — Issue #26.
Validates that judge results with per-criterion breakdown are handled correctly.
"""
import pytest
from app.judging.panel import run_judging_panel
from unittest.mock import AsyncMock, patch, MagicMock


def _make_logic_result():
    return {
        "judge_name": "Logic Judge",
        "reasoning": "Pro had stronger logical structure overall.",
        "criteria": [
            {"name": "Logical Validity", "weight": 0.35, "pro_score": 4, "con_score": 3,
             "pro_justification": "Pro's conclusions followed from premises consistently.",
             "con_justification": "Con had one unsupported leap in rebuttal."},
            {"name": "Soundness of Premises", "weight": 0.25, "pro_score": 4, "con_score": 4,
             "pro_justification": "Pro's premises were well-grounded in evidence.",
             "con_justification": "Con's premises were equally defensible."},
            {"name": "Fallacy Avoidance", "weight": 0.25, "pro_score": 3, "con_score": 3,
             "pro_justification": "Pro used one mild appeal to authority.",
             "con_justification": "Con used one hasty generalization."},
            {"name": "Argumentative Structure", "weight": 0.15, "pro_score": 4, "con_score": 3,
             "pro_justification": "Pro maintained consistent structure across rounds.",
             "con_justification": "Con's closing contradicted an earlier point."},
        ],
        "pro_score": 3.8,
        "con_score": 3.25,
        "winner": "pro",
        "winner_explanation": "Pro demonstrated stronger logical rigor throughout.",
        "pro_strongest_move": "Pro's opening syllogism was airtight.",
        "pro_weakest_move": "Pro's appeal to WHO authority in rebuttal.",
        "con_strongest_move": "Con's market efficiency argument was well-structured.",
        "con_weakest_move": "Con's hasty generalization about all government programs.",
    }


def _make_evidence_result():
    return {
        "judge_name": "Evidence Judge",
        "reasoning": "Both sides cited sources well.",
        "criteria": [
            {"name": "Citation Quality", "weight": 0.35, "pro_score": 4, "con_score": 3,
             "pro_justification": "Pro cited 5 primary sources with specific data.",
             "con_justification": "Con relied more on secondary reporting."},
            {"name": "Evidence Accuracy", "weight": 0.30, "pro_score": 3, "con_score": 4,
             "pro_justification": "Pro slightly misrepresented one statistic.",
             "con_justification": "Con used all evidence accurately in context."},
            {"name": "Source Diversity", "weight": 0.20, "pro_score": 4, "con_score": 3,
             "pro_justification": "Pro drew from academic, journalistic, and government sources.",
             "con_justification": "Con's sources were mostly from one think tank."},
            {"name": "Counter-Evidence Deployment", "weight": 0.15, "pro_score": 3, "con_score": 4,
             "pro_justification": "Pro dismissed one source without counter-evidence.",
             "con_justification": "Con effectively deployed counter-data against Pro's claims."},
        ],
        "pro_score": 3.6,
        "con_score": 3.4,
        "winner": "pro",
        "winner_explanation": "Pro had slightly better citation quality and diversity.",
        "pro_strongest_move": "Pro's OECD data deployment in opening.",
        "pro_weakest_move": "Pro's dismissal of Con's Brookings study.",
        "con_strongest_move": "Con's counter-evidence on innovation metrics.",
        "con_weakest_move": "Con's narrow source base.",
    }


def _make_engagement_result():
    return {
        "judge_name": "Engagement Judge",
        "reasoning": "Con engaged more directly with Pro's arguments.",
        "criteria": [
            {"name": "Refutation Precision", "weight": 0.35, "pro_score": 3, "con_score": 4,
             "pro_justification": "Pro addressed Con's points but sometimes generically.",
             "con_justification": "Con specifically targeted Pro's strongest claims."},
            {"name": "Counter-Evidence Usage", "weight": 0.20, "pro_score": 3, "con_score": 4,
             "pro_justification": "Pro used assertions more than counter-evidence.",
             "con_justification": "Con deployed specific counter-data effectively."},
            {"name": "Steelmanning Quality", "weight": 0.30, "pro_score": 4, "con_score": 3,
             "pro_justification": "Pro gave a genuine steelman of Con's position.",
             "con_justification": "Con's steelman was somewhat of a disguised strawman."},
            {"name": "Concession Handling", "weight": 0.15, "pro_score": 4, "con_score": 2,
             "pro_justification": "Pro conceded narrow points gracefully.",
             "con_justification": "Con ignored dropped arguments entirely."},
        ],
        "pro_refutation_score": 3,
        "con_refutation_score": 4,
        "pro_steelman_score": 4,
        "con_steelman_score": 3,
        "overall_winner": "con",
        "winner_explanation": "Con's direct engagement with Pro's specific claims was stronger.",
        "pro_strongest_move": "Pro's genuine steelman of market efficiency argument.",
        "pro_weakest_move": "Pro's generic rebuttal of innovation concerns.",
        "con_strongest_move": "Con's targeted dismantling of Pro's cost argument.",
        "con_weakest_move": "Con's failure to acknowledge Pro's equity point.",
    }


def test_judge_result_contains_criteria():
    """Each judge result should contain a criteria array with the expected structure."""
    for result in [_make_logic_result(), _make_evidence_result(), _make_engagement_result()]:
        assert "criteria" in result
        assert len(result["criteria"]) == 4
        for c in result["criteria"]:
            assert "name" in c
            assert "weight" in c
            assert "pro_score" in c
            assert "con_score" in c
            assert "pro_justification" in c
            assert "con_justification" in c
            assert 0 < c["weight"] <= 1
            assert 1 <= c["pro_score"] <= 5
            assert 1 <= c["con_score"] <= 5


def test_criteria_weights_sum_to_one():
    """Criteria weights within each judge should sum to approximately 1.0."""
    for result in [_make_logic_result(), _make_evidence_result(), _make_engagement_result()]:
        total_weight = sum(c["weight"] for c in result["criteria"])
        assert abs(total_weight - 1.0) < 0.01, f"Weights sum to {total_weight}, expected ~1.0"


def test_aggregate_scores_present():
    """Each judge result should have aggregate pro_score and con_score."""
    for result in [_make_logic_result(), _make_evidence_result(), _make_engagement_result()]:
        assert "pro_score" in result
        assert "con_score" in result
        assert isinstance(result["pro_score"], (int, float))
        assert isinstance(result["con_score"], (int, float))


@pytest.mark.asyncio
async def test_panel_handles_criteria_output():
    """run_judging_panel should pass through criteria in judge results."""
    logic = _make_logic_result()
    evidence = _make_evidence_result()
    engagement = _make_engagement_result()

    with patch("app.judging.panel._run_judge") as mock_run:
        mock_run.side_effect = [logic, evidence, engagement]
        result = await run_judging_panel("fake transcript")

    assert "judges" in result
    assert len(result["judges"]) == 3
    for judge in result["judges"]:
        assert "criteria" in judge
        assert len(judge["criteria"]) == 4

    assert "scores" in result
    assert "winner" in result
    assert result["winner"] in ("pro", "con", "tie")
