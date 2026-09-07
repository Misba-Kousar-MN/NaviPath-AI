from __future__ import annotations

from pydantic import BaseModel

from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.training_centre import NearbyTrainingCentreOut


class SkillGapOut(BaseModel):
    skill_id: str
    skill_name: str
    skill_category: str | None = None
    gap_type: str  # target | bridge
    rationale: str | None = None
    has_it: bool = False
    courses: list[CourseOut] = []


class SkillTransitionOut(BaseModel):
    target_skill: SkillOut
    bridge_skills: list[SkillOut] = []
    rationale: str
    confidence: str | None = None
    courses: list[CourseOut] = []
    centres: list[NearbyTrainingCentreOut] = []


class PathwayResponse(BaseModel):
    occupation: OccupationOut | None
    current_skills: list[SkillOut] = []
    transitions: list[SkillTransitionOut] = []
    skill_gaps: list[SkillGapOut] = []
    warnings: list[str] = []

