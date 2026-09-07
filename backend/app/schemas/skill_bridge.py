"""Skill-Bridge & Wage-Lift Engine — Pydantic output schemas (Innovation 3).

All numeric fields are calculated deterministically in Python — never by the LLM.
The LLM receives these structured objects and may only explain them conversationally.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import SkillGapOut
from app.schemas.scheme import SchemeEligibilityResult, SchemeOut
from app.schemas.training_centre import NearbyTrainingCentreOut


# ---------------------------------------------------------------------------
# Skill Overlap
# ---------------------------------------------------------------------------

class SkillOverlapOut(BaseModel):
    """Deterministic intersection of worker's current skills and target occupation skills."""

    overlap_skill_ids: list[str] = []
    overlap_skills: list[SkillOut] = []
    # All skills the target occupation requires
    target_skill_ids: list[str] = []
    target_skills: list[SkillOut] = []
    overlap_count: int = 0
    total_target_skills: int = 0
    # Percentage calculated in Python: overlap_count / total_target_skills * 100
    overlap_percentage: float = 0.0


# ---------------------------------------------------------------------------
# Wage Benchmark & Wage Lift
# ---------------------------------------------------------------------------

_WAGE_DISCLAIMER = (
    "Indicative earning benchmark based on available source data. "
    "Actual income may vary by location, experience, employer, certification "
    "and employment type. For self-employed workers this is not guaranteed income."
)


class WageBenchmarkOut(BaseModel):
    """Structured wage benchmark with mandatory provenance.

    All numeric fields are nullable — missing data returns wage_status='not_available'
    in WageLiftOut rather than a fabricated figure.
    """

    benchmark_id: str
    occupation_id: str | None = None
    occupation_name: str
    employment_type: str
    wage_type: str  # 'salary' | 'earning'
    monthly_min_inr: float | None = None
    monthly_median_inr: float | None = None
    monthly_max_inr: float | None = None
    currency: str = "INR"
    data_period: str | None = None
    geography_level: str
    district: str | None = None
    state: str | None = None
    source_id: str
    source_title: str
    source_url: str | None = None
    confidence: str
    disclaimer: str = Field(default=_WAGE_DISCLAIMER)
    notes: str | None = None
    data_status: str = "mock"
    source_label: str = "Hackathon illustrative data"
    verified: bool = False


class WageOccupationSummary(BaseModel):
    """Summary of occupation wage for lift payload."""
    occupation: str
    monthly_wage_inr: float | None = None
    status: str = "mock"


class WageLiftOut(BaseModel):
    """Deterministic wage-lift calculation.

    absolute_lift_inr and percentage_lift are calculated in Python —
    the LLM is explicitly forbidden from computing or modifying these values.
    """

    current_benchmark: WageBenchmarkOut | None = None
    target_benchmark: WageBenchmarkOut | None = None
    # Backend-computed — never LLM
    absolute_lift_inr: float | None = None
    percentage_lift: float | None = None
    # 'available' | 'partial' | 'not_available'
    status: str = "not_available"
    disclaimer: str = Field(default=_WAGE_DISCLAIMER)

    # Innovation 3 Extended Structure
    available: bool = False
    current: WageOccupationSummary | None = None
    target: WageOccupationSummary | None = None
    absolute_difference_inr: float | None = None
    percentage_difference: float | None = None
    unit: str = "monthly"
    data_status: str = "mock"
    source_label: str = "Hackathon illustrative data"


# ---------------------------------------------------------------------------
# Pathway Score
# ---------------------------------------------------------------------------

class PathwayScoreOut(BaseModel):
    """Transparent, documented pathway score (0–100).

    Formula (see docs/SKILL_BRIDGE_ARCHITECTURE.md):
      overlap_component  = min(overlap_pct * 0.40, 40)   — max 40 pts
      gap_component      = max(20 - gap_count * 4, 0)    — max 20 pts
      transition_cpt     = 15 if transition exists else 0
      training_component = 15 if ≥1 course else 0
      centre_component   = 10 if ≥1 centre else 0
      total              = sum of above (0–100)
    """

    total_score: float = 0.0
    label: str = "Low"  # 'Low' | 'Moderate' | 'Good' | 'Strong'
    overlap_component: float = 0.0
    gap_component: float = 0.0
    transition_component: float = 0.0
    training_component: float = 0.0
    centre_component: float = 0.0
    # Deterministic explanation — not LLM generated
    explanation: str = ""


# ---------------------------------------------------------------------------
# Skill-Bridge Pathway
# ---------------------------------------------------------------------------

_HEURISTIC_NOTE = (
    "This pathway is based on expert judgment (heuristic). "
    "It has NOT been officially certified or approved by a government body. "
    "It reflects a reasonable career transition based on skill adjacency."
)

_EXPERT_CURATED_NOTE = (
    "This pathway is based on expert curation from official qualification documents."
)

_DATA_DRIVEN_NOTE = (
    "This pathway is supported by official labour market data."
)

CONFIDENCE_NOTES: dict[str, str] = {
    "heuristic": _HEURISTIC_NOTE,
    "expert-curated": _EXPERT_CURATED_NOTE,
    "data-driven": _DATA_DRIVEN_NOTE,
}


class SkillBridgePathway(BaseModel):
    """One complete skill-bridge pathway from current to target occupation."""

    transition_id: str
    # 'direct' = target skill ≈ target occupation primary skill
    # 'bridge' = intermediate skills required first
    pathway_type: str = "direct"

    # Confidence of the underlying transition record
    confidence: str | None = None
    # Mandatory honest disclaimer about confidence source
    confidence_note: str = ""

    # Occupation context
    current_occupation: OccupationOut | None = None
    target_occupation: OccupationOut | None = None
    target_skill: SkillOut

    # Skills data
    current_skills: list[SkillOut] = []
    skill_overlap: SkillOverlapOut
    skill_gaps: list[SkillGapOut] = []
    bridge_skills: list[SkillOut] = []

    # Training pathway
    courses: list[CourseOut] = []
    nearby_centres: list[NearbyTrainingCentreOut] = []

    # Scheme & Eligibility (Innovation 3 Pipeline)
    scheme: SchemeOut | None = None
    eligibility: SchemeEligibilityResult | None = None
    certification_status: str = "Certification information not verified"

    # Economic opportunity
    wage_lift: WageLiftOut

    # Deterministic pathway score
    pathway_score: PathwayScoreOut

    # Rationale & Next Action
    rationale: str
    market_demand_note: str | None = None
    next_action: str | None = None


# ---------------------------------------------------------------------------
# Skill-Bridge Result (top-level per worker request)
# ---------------------------------------------------------------------------

class SkillBridgeResult(BaseModel):
    """Aggregated skill-bridge result for a worker's current occupation."""

    current_occupation: OccupationOut | None = None
    current_skills: list[SkillOut] = []
    pathways: list[SkillBridgePathway] = []
    warnings: list[str] = []


# ---------------------------------------------------------------------------
# Pathway Comparison
# ---------------------------------------------------------------------------

class PathwayComparisonField(BaseModel):
    label: str
    pathway_a_value: str | float | None
    pathway_b_value: str | float | None


class SkillBridgeComparison(BaseModel):
    """Deterministic side-by-side comparison of two skill-bridge pathways."""

    pathway_a: SkillBridgePathway
    pathway_b: SkillBridgePathway
    # Deterministic recommendation based on pathway scores
    recommendation: str = ""
    comparison_fields: list[PathwayComparisonField] = []


# ---------------------------------------------------------------------------
# API Request Schema for Compare Endpoint
# ---------------------------------------------------------------------------

class SkillBridgeCompareRequest(BaseModel):
    occupation: str
    target_skill_a: str
    target_skill_b: str
    district: str
    latitude: float | None = None
    longitude: float | None = None
