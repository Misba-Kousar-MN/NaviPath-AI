"""Import every model module so Base.metadata is fully populated
(needed by Alembic and by scripts/seed_database.py / validate_database.py).
"""
from app.db.base import Base  # noqa: F401
from app.models.provenance import DocumentChunk, Evidence, Location, Source  # noqa: F401
from app.models.schemes import Document, EligibilityRule, Scheme, SchemeDocument  # noqa: F401
from app.models.taxonomy import Occupation, OccupationSkill, Skill, SkillTransition  # noqa: F401
from app.models.training import CentreCourse, Course, TrainingCentre  # noqa: F401
from app.models.wage_benchmark import WageBenchmark  # noqa: F401  (Innovation 3)

__all__ = [
    "Base",
    "Source",
    "Evidence",
    "Location",
    "DocumentChunk",
    "Occupation",
    "Skill",
    "OccupationSkill",
    "SkillTransition",
    "Course",
    "TrainingCentre",
    "CentreCourse",
    "Scheme",
    "EligibilityRule",
    "Document",
    "SchemeDocument",
    "WageBenchmark",
]
