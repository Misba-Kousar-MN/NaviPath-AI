from __future__ import annotations

from pydantic import BaseModel

from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import SkillGapOut, SkillTransitionOut
from app.schemas.scheme import SchemeDocumentOut, SchemeEligibilityResult, SchemeOut
from app.schemas.skill_bridge import SkillBridgeResult
from app.schemas.training_centre import NearbyTrainingCentreOut
from app.llm.service import RecommendationExplanation
from app.rag.validator import ValidatedEvidence


class WorkerProfileIn(BaseModel):
    occupation: str
    district: str
    education: str | None = None
    language: str | None = None
    target_skill: str | None = None
    age: int | None = None
    social_security_status: str | None = None
    session_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    pincode: str | None = None
    gender: str | None = None
    career_goal_text: str | None = None
    extra_attributes: dict[str, str | int | bool | None] = {}


class RecommendationResponse(BaseModel):
    profile: WorkerProfileIn
    matched_occupation: OccupationOut | None = None
    current_skills: list[SkillOut] = []
    recommended_pathways: list[SkillTransitionOut] = []
    skill_gaps: list[SkillGapOut] = []
    courses: list[CourseOut] = []
    nearby_centres: list[NearbyTrainingCentreOut] = []
    schemes: list[SchemeOut] = []
    eligibility: list[SchemeEligibilityResult] = []
    documents: list[SchemeDocumentOut] = []
    evidence_count: int = 0
    warnings: list[str] = []

    # Grounded RAG + LLM Explanation extensions (Phase 3E + Phase 4)
    explanation: RecommendationExplanation | None = None
    validated_evidence: list[dict] = []
    explanation_status: str = "available"  # 'available' | 'unavailable' | 'fallback'
    evidence_status: str = "retrieved"  # 'retrieved' | 'empty' | 'unverified'

    # Innovation 3 — Skill-Bridge & Wage-Lift Engine (additive, nullable)
    skill_bridge: SkillBridgeResult | None = None
