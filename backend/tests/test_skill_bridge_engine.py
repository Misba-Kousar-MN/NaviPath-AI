"""Unit and contract tests for Skill-Bridge Engine (Innovation 3).

Verifies:
1. Deterministic skill overlap calculation (no LLM, exact set intersection).
2. Transparent pathway score formula (weights, components, labels).
3. Deterministic comparison of two pathways.
4. Schema validation and API endpoint availability.
"""
from __future__ import annotations

import pytest

from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import SkillGapOut
from app.schemas.skill_bridge import (
    PathwayScoreOut,
    SkillBridgeCompareRequest,
    SkillBridgePathway,
    SkillOverlapOut,
    WageLiftOut,
)
from app.services.skill_bridge import (
    calculate_pathway_score,
    calculate_skill_overlap,
    compare_pathways,
)


def _make_skill(skill_id: str, name: str) -> SkillOut:
    return SkillOut(
        id=skill_id,
        name_en=name,
        category="core",
        skill_level="Level 3",
        is_certifiable=True,
    )


def _make_dummy_pathway(transition_id: str, target_name: str, score: float, label: str) -> SkillBridgePathway:
    target_sk = _make_skill(f"skl-{transition_id}", target_name)
    overlap = SkillOverlapOut(
        overlap_skill_ids=["skl-1"],
        overlap_skills=[_make_skill("skl-1", "Basic Mechanical")],
        target_skill_ids=["skl-1", target_sk.id],
        target_skills=[_make_skill("skl-1", "Basic Mechanical"), target_sk],
        overlap_count=1,
        total_target_skills=2,
        overlap_percentage=50.0,
    )
    score_out = PathwayScoreOut(
        total_score=score,
        label=label,
        overlap_component=20.0,
        gap_component=16.0,
        transition_component=15.0,
        training_component=15.0,
        centre_component=10.0,
        explanation="Deterministic test pathway.",
    )
    return SkillBridgePathway(
        transition_id=transition_id,
        pathway_type="direct",
        confidence="heuristic",
        confidence_note="Heuristic note",
        target_skill=target_sk,
        current_skills=[_make_skill("skl-1", "Basic Mechanical")],
        skill_overlap=overlap,
        skill_gaps=[SkillGapOut(skill_id=target_sk.id, skill_name=target_sk.name_en, gap_type="target", has_it=False)],
        bridge_skills=[],
        courses=[],
        nearby_centres=[],
        wage_lift=WageLiftOut(disclaimer="Test disclaimer"),
        pathway_score=score_out,
        rationale="Clear progression path.",
    )


class TestSkillOverlapCalculation:
    """Deterministic overlap tests — mathematical set intersection."""

    def test_zero_overlap(self):
        current = [_make_skill("skl-1", "Cooking"), _make_skill("skl-2", "Cleaning")]
        target = [_make_skill("skl-3", "Wiring"), _make_skill("skl-4", "Soldering")]

        result = calculate_skill_overlap(current, target)
        assert result.overlap_count == 0
        assert result.total_target_skills == 2
        assert result.overlap_percentage == 0.0
        assert len(result.overlap_skills) == 0

    def test_complete_overlap(self):
        skills = [_make_skill("skl-1", "Driving"), _make_skill("skl-2", "Navigation")]
        result = calculate_skill_overlap(skills, skills)
        assert result.overlap_count == 2
        assert result.total_target_skills == 2
        assert result.overlap_percentage == 100.0
        assert len(result.overlap_skills) == 2

    def test_partial_overlap_percentage(self):
        current = [
            _make_skill("skl-1", "Safety"),
            _make_skill("skl-2", "Maintenance"),
            _make_skill("skl-99", "Unrelated"),
        ]
        target = [
            _make_skill("skl-1", "Safety"),
            _make_skill("skl-2", "Maintenance"),
            _make_skill("skl-3", "High Voltage"),
            _make_skill("skl-4", "Blueprint Reading"),
        ]

        result = calculate_skill_overlap(current, target)
        assert result.overlap_count == 2
        assert result.total_target_skills == 4
        assert result.overlap_percentage == 50.0
        assert {s.id for s in result.overlap_skills} == {"skl-1", "skl-2"}

    def test_empty_target_skills(self):
        current = [_make_skill("skl-1", "Driving")]
        result = calculate_skill_overlap(current, [])
        assert result.overlap_percentage == 0.0
        assert result.total_target_skills == 0


class TestPathwayScoringFormula:
    """Documented scoring formula verification (0–100 scale)."""

    def test_max_score_all_components(self):
        # overlap=100% -> 40 pts; 0 gaps -> 20 pts; transition=15; courses=15; centres=10 -> total 100
        score = calculate_pathway_score(
            overlap_percentage=100.0,
            gap_count=0,
            has_transition=True,
            has_courses=True,
            has_centres=True,
        )
        assert score.total_score == 100.0
        assert score.label == "Strong"
        assert score.overlap_component == 40.0
        assert score.gap_component == 20.0
        assert score.transition_component == 15.0
        assert score.training_component == 15.0
        assert score.centre_component == 10.0

    def test_minimal_score_no_infrastructure(self):
        score = calculate_pathway_score(
            overlap_percentage=0.0,
            gap_count=6,
            has_transition=False,
            has_courses=False,
            has_centres=False,
        )
        assert score.total_score == 0.0
        assert score.label == "Low"

    def test_moderate_score_categorization(self):
        # 50% overlap -> 20 pts; 2 gaps -> 12 pts; transition -> 15 pts; courses -> 15; no centres -> 0 => 62 (Moderate)
        score = calculate_pathway_score(
            overlap_percentage=50.0,
            gap_count=2,
            has_transition=True,
            has_courses=True,
            has_centres=False,
        )
        assert score.total_score == 62.0
        assert score.label == "Moderate"

    def test_good_score_categorization(self):
        # 75% overlap -> 30 pts; 1 gap -> 16 pts; transition -> 15 pts; courses -> 15 => 76 (Good)
        score = calculate_pathway_score(
            overlap_percentage=75.0,
            gap_count=1,
            has_transition=True,
            has_courses=True,
            has_centres=False,
        )
        assert score.total_score == 76.0
        assert score.label == "Good"


class TestPathwayComparison:
    """Side-by-side deterministic comparison tests."""

    def test_comparison_winner_recommendation(self):
        pw_a = _make_dummy_pathway("tr-1", "Electrician", 82.0, "Good")
        pw_b = _make_dummy_pathway("tr-2", "Fitter", 55.0, "Moderate")

        comparison = compare_pathways(pw_a, pw_b)
        assert "Electrician" in comparison.recommendation
        assert "82" in comparison.recommendation
        assert len(comparison.comparison_fields) > 5

    def test_comparison_tie_recommendation(self):
        pw_a = _make_dummy_pathway("tr-1", "Electrician", 70.0, "Good")
        pw_b = _make_dummy_pathway("tr-2", "Solar Technician", 70.0, "Good")

        comparison = compare_pathways(pw_a, pw_b)
        assert "equal scores" in comparison.recommendation.lower()


class TestSkillBridgeApiEndpoints:
    """FastAPI routes smoke and contract tests."""

    def test_get_pathways_route_contract(self, client):
        resp = client.get("/api/skill-bridge/pathways?occupation=Delivery%20Rider")
        assert resp.status_code == 200
        data = resp.json()
        assert "pathways" in data
        assert "current_skills" in data
        assert isinstance(data["pathways"], list)

    def test_get_benchmarks_route_contract(self, client):
        resp = client.get("/api/skill-bridge/benchmarks")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_wage_lift_route_contract(self, client):
        resp = client.post(
            "/api/skill-bridge/wage-lift",
            params={"current_occupation_id": "occ-005", "target_occupation_id": "occ-003"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "disclaimer" in data
