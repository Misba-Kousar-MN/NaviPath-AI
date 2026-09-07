"""Comprehensive tests for Innovation 3: Skill Uplift / Skill-Bridge + Wage-Lift Engine.

Pipeline covered:
Current Occupation -> Current Skills -> Skill Gaps -> Bridge Skills ->
Target Occupation -> Course -> Training Centre -> Government Scheme ->
Eligibility -> Certification -> Mock Wage Benchmark -> Wage Lift ->
Evidence -> Next Action
"""
from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from app.data.mock_wages import (
    DATA_STATUS_MOCK,
    MOCK_DISCLAIMER,
    MOCK_WAGES,
    SOURCE_LABEL,
    find_mock_wage,
)
from app.llm.service import LLMExplanationService
from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import SkillGapOut
from app.schemas.scheme import (
    EligibilityCheckRequest,
    RuleResult,
    SchemeEligibilityResult,
    SchemeOut,
)
from app.schemas.skill_bridge import (
    CONFIDENCE_NOTES,
    PathwayScoreOut,
    SkillBridgeComparison,
    SkillBridgePathway,
    SkillOverlapOut,
    WageBenchmarkOut,
    WageLiftOut,
    WageOccupationSummary,
)
from app.schemas.training_centre import NearbyTrainingCentreOut
from app.services.skill_bridge import (
    calculate_pathway_score,
    calculate_skill_overlap,
    compare_pathways,
)
from app.services.wage_lift import calculate_wage_lift, get_wage_benchmark


def _make_skill(skill_id: str, name: str, category: str = "technical") -> SkillOut:
    return SkillOut(
        id=skill_id,
        name_en=name,
        category=category,
        skill_level="intermediate",
        is_certifiable=True,
    )


def _make_benchmark(
    benchmark_id: str,
    occupation_name: str,
    median_inr: float | None,
    data_status: str = DATA_STATUS_MOCK,
    verified: bool = False,
) -> WageBenchmarkOut:
    return WageBenchmarkOut(
        benchmark_id=benchmark_id,
        occupation_name=occupation_name,
        employment_type="informal",
        wage_type="monthly",
        monthly_median_inr=median_inr,
        currency="INR",
        geography_level="state",
        state="Karnataka",
        source_id="mock-hackathon-data",
        source_title=SOURCE_LABEL,
        confidence="illustrative",
        data_status=data_status,
        source_label=SOURCE_LABEL,
        verified=verified,
        disclaimer=MOCK_DISCLAIMER,
    )


class TestMockWageDataset:
    """Verifies integrity and safety constraints of the mock wage layer."""

    def test_mock_wage_records_present(self):
        delivery = find_mock_wage(occupation_name="Delivery Rider")
        assert delivery is not None
        assert delivery["monthly_wage_inr"] == 18000.0
        assert delivery["data_status"] == DATA_STATUS_MOCK
        assert delivery["source_label"] == SOURCE_LABEL
        assert delivery["verified"] is False

        electrician = find_mock_wage(occupation_name="Electrician")
        assert electrician is not None
        assert electrician["monthly_wage_inr"] == 30000.0

        mechanic = find_mock_wage(occupation_name="Motor Vehicle Mechanic")
        assert mechanic is not None
        assert mechanic["monthly_wage_inr"] == 28000.0

        fitter = find_mock_wage(occupation_name="Fitter")
        assert fitter is not None
        assert fitter["monthly_wage_inr"] == 29000.0

    def test_candidate_skill_stamping(self):
        ev_tech = find_mock_wage(occupation_name="EV Service Technician")
        assert ev_tech is not None
        assert ev_tech["monthly_wage_inr"] == 32000.0
        assert ev_tech["is_candidate"] is True
        assert ev_tech["candidate_label"] == "CANDIDATE — NEEDS REVIEW"

    def test_unknown_occupation_returns_none(self):
        unknown = find_mock_wage(occupation_name="Astronaut Pilot")
        assert unknown is None

    def test_mock_disclaimer_content(self):
        assert "not guaranteed" in MOCK_DISCLAIMER.lower()
        assert "hackathon" in MOCK_DISCLAIMER.lower()


class TestSkillOverlapAndGapMath:
    """Verifies deterministic set logic for skills and gaps."""

    def test_overlap_and_gap_computation(self):
        current = [
            _make_skill("sk-1", "Two Wheeler Driving"),
            _make_skill("sk-2", "Route Navigation"),
            _make_skill("sk-3", "Basic Vehicle Inspection"),
        ]
        target = [
            _make_skill("sk-3", "Basic Vehicle Inspection"),
            _make_skill("sk-4", "Engine Diagnostics"),
            _make_skill("sk-5", "Brake System Repair"),
        ]

        overlap = calculate_skill_overlap(current, target)
        assert overlap.overlap_count == 1
        assert overlap.total_target_skills == 3
        # 1 / 3 * 100 = 33.33%
        assert overlap.overlap_percentage == 33.33
        assert overlap.overlap_skill_ids == ["sk-3"]

        current_ids = {s.id for s in current}
        gaps = [s for s in target if s.id not in current_ids]
        assert len(gaps) == 2
        assert {g.id for g in gaps} == {"sk-4", "sk-5"}


class TestWageLiftCalculationPipeline:
    """Verifies deterministic math, honest missing data, and Section 19 schema."""

    def test_positive_wage_lift_delivery_to_electrician(self):
        curr = _make_benchmark("wb-del", "Delivery Rider", 18000.0)
        tgt = _make_benchmark("wb-elec", "Electrician", 30000.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "available"
        assert lift.available is True
        assert lift.absolute_lift_inr == 12000.0
        assert lift.absolute_difference_inr == 12000.0
        # (12000 / 18000) * 100 = 66.67%
        assert lift.percentage_lift == 66.67
        assert lift.percentage_difference == 66.67
        assert lift.unit == "monthly"
        assert lift.data_status == DATA_STATUS_MOCK
        assert lift.source_label == SOURCE_LABEL
        assert lift.current is not None
        assert lift.current.monthly_wage_inr == 18000.0
        assert lift.target is not None
        assert lift.target.monthly_wage_inr == 30000.0

    def test_positive_wage_lift_delivery_to_mechanic(self):
        curr = _make_benchmark("wb-del", "Delivery Rider", 18000.0)
        tgt = _make_benchmark("wb-mech", "Motor Vehicle Mechanic", 28000.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "available"
        assert lift.absolute_lift_inr == 10000.0
        # (10000 / 18000) * 100 = 55.56%
        assert lift.percentage_lift == 55.56

    def test_negative_wage_lift_preserved(self):
        curr = _make_benchmark("wb-elec", "Electrician", 30000.0)
        tgt = _make_benchmark("wb-del", "Delivery Rider", 18000.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "available"
        assert lift.absolute_lift_inr == -12000.0
        assert lift.percentage_lift == -40.0

    def test_missing_wage_data_never_fabricates(self):
        curr = _make_benchmark("wb-del", "Delivery Rider", 18000.0)
        lift_no_target = calculate_wage_lift(curr, None)
        assert lift_no_target.status == "partial"
        assert lift_no_target.available is False
        assert lift_no_target.absolute_lift_inr is None

        lift_none = calculate_wage_lift(None, None)
        assert lift_none.status == "not_available"
        assert lift_none.available is False


class TestPathwayScoringAndComparison:
    """Verifies pathway scoring weights and deterministic side-by-side comparison."""

    def test_score_calculation(self):
        # 50% overlap, 1 gap, transition=True, course=True, centre=True
        # overlap_cpt = 50 * 0.40 = 20.0
        # gap_cpt = 20 - (1 * 4) = 16.0
        # transition_cpt = 15.0
        # training_cpt = 15.0
        # centre_cpt = 10.0
        # total = 76.0 -> "Good"
        score = calculate_pathway_score(
            overlap_percentage=50.0,
            gap_count=1,
            has_transition=True,
            has_courses=True,
            has_centres=True,
        )
        assert score.total_score == 76.0
        assert score.label == "Good"
        assert score.overlap_component == 20.0
        assert score.gap_component == 16.0
        assert score.transition_component == 15.0

    def test_pathway_comparison(self):
        def _build_test_pathway(tid: str, tgt_name: str, score_val: float) -> SkillBridgePathway:
            target_sk = _make_skill(f"sk-{tid}", tgt_name)
            score_out = PathwayScoreOut(
                total_score=score_val,
                label="Good",
                overlap_component=20.0,
                gap_component=16.0,
                transition_component=15.0,
                training_component=15.0,
                centre_component=10.0,
                explanation="Test pathway",
            )
            return SkillBridgePathway(
                transition_id=tid,
                pathway_type="direct",
                confidence="heuristic",
                confidence_note=CONFIDENCE_NOTES["heuristic"],
                target_skill=target_sk,
                target_occupation=OccupationOut(
                    id=f"occ-{tid}",
                    name_en=tgt_name,
                    sector="Automotive",
                ),
                current_skills=[_make_skill("sk-cur", "Driving")],
                skill_overlap=SkillOverlapOut(
                    overlap_percentage=40.0,
                    overlap_count=1,
                    total_target_skills=2,
                ),
                skill_gaps=[],
                bridge_skills=[],
                courses=[
                    CourseOut(
                        id=f"c-{tid}",
                        title=f"{tgt_name} Training",
                        skill_id=target_sk.id,
                        is_government_recognized=True,
                        certifying_body="NSDC",
                        source_id="src-001",
                    )
                ],
                nearby_centres=[
                    NearbyTrainingCentreOut(
                        id=f"tc-{tid}",
                        name=f"Govt ITI {tgt_name}",
                        district="Bengaluru Urban",
                        provenance="OFFICIAL_VERIFIED",
                    )
                ],
                scheme=SchemeOut(
                    id="sch-003",
                    name_en="Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
                    issuing_authority="KSDC",
                ),
                eligibility=SchemeEligibilityResult(
                    scheme_id="sch-003",
                    scheme_name="CMKKY",
                    verdict="eligible",
                    reasons=[],
                ),
                certification_status="Government recognized by NSDC",
                wage_lift=WageLiftOut(
                    available=True,
                    absolute_difference_inr=12000.0,
                    percentage_difference=66.7,
                ),
                pathway_score=score_out,
                rationale="Natural career transition.",
                next_action=f"Visit Govt ITI {tgt_name} or apply for CMKKY fee support.",
            )

        pw_a = _build_test_pathway("t1", "Electrician", 82.0)
        pw_b = _build_test_pathway("t2", "Motor Vehicle Mechanic", 74.0)

        comparison = compare_pathways(pw_a, pw_b)
        assert comparison.recommendation != ""
        assert "Electrician" in comparison.recommendation
        assert len(comparison.comparison_fields) > 0


class TestLLMFormattingIntegrity:
    """Verifies that the LLM receives structured, uncomputed numbers with disclaimer."""

    def test_llm_prompt_contains_disclaimer_and_deterministic_numbers(self):
        skill_bridge = {
            "pathways": [
                {
                    "target_occupation": {"name_en": "Electrician"},
                    "overlap_percentage": 50.0,
                    "skill_gaps": [{"id": "sk-1"}],
                    "feasibility": "High",
                    "certification_status": "Government recognized by NSDC",
                    "next_action": "Visit Govt ITI Bengaluru",
                    "wage_lift": {
                        "absolute_difference_inr": 12000.0,
                        "percentage_difference": 66.7,
                        "data_status": "mock",
                    },
                }
            ]
        }

        prompt = LLMExplanationService._build_context_prompt(
            worker_profile={"occupation": "Delivery Rider", "district": "Bengaluru Urban"},
            matched_occupation={"name_en": "Delivery Rider"},
            current_skills=[],
            skill_gaps=[],
            recommended_pathways=[],
            courses=[],
            nearby_centres=[],
            schemes=[],
            eligibility=[],
            validated_evidence=[],
            language="English",
            career_goal_text="Become an Electrician",
            skill_bridge=skill_bridge,
        )

        assert "DO NOT ALTER NUMBERS" in prompt
        assert "Hackathon illustrative data" in prompt
        assert "+12000.0 INR/mo (+66.7%)" in prompt
        assert "Electrician" in prompt


class TestAPIEndpointsContract:
    """Tests the FastAPI routes for Innovation 3."""

    def test_benchmarks_route(self, client: TestClient):
        response = client.get("/api/skill-bridge/benchmarks?occupation_id=occ-005")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert data[0]["occupation_name"] == "Delivery Rider"
            assert data[0]["data_status"] == DATA_STATUS_MOCK

    def test_wage_lift_route(self, client: TestClient):
        response = client.post(
            "/api/skill-bridge/wage-lift",
            params={
                "current_occupation_id": "occ-005",
                "target_occupation_id": "occ-003",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "available"
        assert data["absolute_lift_inr"] == 4000.0
        assert round(data["percentage_lift"], 1) == 22.2
        assert "not guaranteed" in data["disclaimer"].lower()
