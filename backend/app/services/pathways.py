"""Deterministic, data-driven occupation -> skill -> course -> centre pathway
construction. No LLM involvement — mirrors docs/ARCHITECTURE.md Section H.
"""
from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CentreCourse, Course, Occupation, OccupationSkill, Skill, SkillTransition, TrainingCentre
from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import PathwayResponse, SkillGapOut, SkillTransitionOut
from app.schemas.training_centre import NearbyTrainingCentreOut
from app.services.geo import find_nearby_centres, to_nearby_out

_WORD_RE = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> set[str]:
    return {t for t in _WORD_RE.findall(text.lower()) if len(t) > 2}


def _find_by_text(db: Session, model, text: str):
    """Direct ID match, then substring match, then whole-word token match.

    The token fallback handles compound seed names like "Delivery / Courier
    Rider" matching a worker's plain-language "Delivery Rider" — every
    significant word in the query must appear as a whole word in the
    candidate's name_en. Deterministic set matching, not fuzzy/LLM guessing;
    never invents or renames a record.
    """
    if not text:
        return None
    direct = db.get(model, text)
    if direct:
        return direct
    needle = text.strip().lower()
    stmt = select(model).where(model.name_en.ilike(f"%{needle}%"))
    match = db.execute(stmt).scalars().first()
    if match:
        return match

    query_tokens = _tokens(needle)
    if not query_tokens:
        return None
    best = None
    for candidate in db.execute(select(model)).scalars().all():
        name_tokens = _tokens(candidate.name_en)
        if query_tokens <= name_tokens:
            # Prefer the most specific match (fewest extra words) among ties.
            if best is None or len(name_tokens) < len(_tokens(best.name_en)):
                best = candidate
    return best


def find_occupation_by_text(db: Session, text: str) -> Occupation | None:
    return _find_by_text(db, Occupation, text)


def find_skill_by_text(db: Session, text: str) -> Skill | None:
    return _find_by_text(db, Skill, text)


def _current_skills(db: Session, occupation_id: str) -> list[SkillOut]:
    stmt = (
        select(Skill)
        .join(OccupationSkill, OccupationSkill.skill_id == Skill.id)
        .where(OccupationSkill.occupation_id == occupation_id)
    )
    return [SkillOut.model_validate(s) for s in db.execute(stmt).scalars().all()]


def _courses_for_skill(db: Session, skill_id: str) -> list[Course]:
    stmt = select(Course).where(Course.skill_id == skill_id)
    return list(db.execute(stmt).scalars().all())


def parse_bridge_skill_ids(bridge_skill_ids_str: str | None) -> list[str]:
    """Safely parse bridge_skill_ids string stored in database."""
    if not bridge_skill_ids_str or not bridge_skill_ids_str.strip():
        return []
    cleaned = bridge_skill_ids_str.strip().strip("[]'\"")
    raw_tokens = re.split(r"[,;|\s]+", cleaned)
    return [t.strip().strip("'\"") for t in raw_tokens if t.strip().strip("'\"")]


def resolve_bridge_skills(db: Session, bridge_skill_ids_str: str | None) -> tuple[list[SkillOut], list[str]]:
    """Resolve bridge skill IDs against verified Skill table.

    Never invents skills. Unresolved IDs produce an honest warning.
    """
    tokens = parse_bridge_skill_ids(bridge_skill_ids_str)
    resolved: list[SkillOut] = []
    warnings: list[str] = []
    for token in tokens:
        skill = db.get(Skill, token)
        if skill is not None:
            resolved.append(SkillOut.model_validate(skill))
        else:
            warnings.append(
                f"Bridge skill ID '{token}' in skill_transitions does not exist in verified skills data."
            )
    return resolved, warnings


def calculate_skill_gaps(
    current_skills: list[SkillOut],
    transitions: list[SkillTransitionOut],
) -> list[SkillGapOut]:
    """Deterministically compute skill gaps: required transition skills MINUS current skills.

    Comparison uses canonical skill IDs. No false gaps when the worker possesses the skill.
    """
    worker_skill_ids = {s.id for s in current_skills}
    gaps: list[SkillGapOut] = []
    seen_gap_skill_ids: set[str] = set()

    for t in transitions:
        # 1. Target skill gap
        target = t.target_skill
        if target.id not in worker_skill_ids and target.id not in seen_gap_skill_ids:
            matching_courses = [c for c in t.courses if c.skill_id == target.id]
            gaps.append(
                SkillGapOut(
                    skill_id=target.id,
                    skill_name=target.name_en,
                    skill_category=target.category,
                    gap_type="target",
                    rationale=t.rationale,
                    has_it=False,
                    courses=matching_courses,
                )
            )
            seen_gap_skill_ids.add(target.id)

        # 2. Bridge skills gap
        for bs in t.bridge_skills:
            if bs.id not in worker_skill_ids and bs.id not in seen_gap_skill_ids:
                matching_courses = [c for c in t.courses if c.skill_id == bs.id]
                gaps.append(
                    SkillGapOut(
                        skill_id=bs.id,
                        skill_name=bs.name_en,
                        skill_category=bs.category,
                        gap_type="bridge",
                        rationale=f"Bridge/prerequisite skill for transitioning to {target.name_en}",
                        has_it=False,
                        courses=matching_courses,
                    )
                )
                seen_gap_skill_ids.add(bs.id)

    return gaps


def build_pathway(
    db: Session,
    occupation_text: str,
    target_skill_text: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float = 50.0,
    distance_type: str = "exact",
) -> PathwayResponse:
    warnings: list[str] = []

    occupation = find_occupation_by_text(db, occupation_text)
    if occupation is None:
        return PathwayResponse(
            occupation=None,
            warnings=[f"No matching occupation found for '{occupation_text}' in verified data."],
        )

    current_skills = _current_skills(db, occupation.id)
    if not current_skills:
        warnings.append(
            "No verified current-skill mapping exists for this occupation "
            "(occupation_skills.csv has no row for it)."
        )

    target_skill = find_skill_by_text(db, target_skill_text) if target_skill_text else None

    stmt = select(SkillTransition).where(SkillTransition.from_occupation_id == occupation.id)
    if target_skill is not None:
        stmt = stmt.where(SkillTransition.to_skill_id == target_skill.id)
    transitions = list(db.execute(stmt).scalars().all())

    if not transitions:
        warnings.append(
            "No verified skill_transitions row exists for this occupation"
            + (f" -> target skill '{target_skill_text}'." if target_skill_text else ".")
        )

    transition_outs: list[SkillTransitionOut] = []
    for t in transitions:
        skill = db.get(Skill, t.to_skill_id)
        bridge_skills, bridge_warnings = resolve_bridge_skills(db, t.bridge_skill_ids)
        warnings.extend(bridge_warnings)

        # Retrieve courses for target skill AND bridge skills
        target_courses = _courses_for_skill(db, t.to_skill_id)
        bridge_courses: list[Course] = []
        for bs in bridge_skills:
            bridge_courses.extend(_courses_for_skill(db, bs.id))

        # Deduplicate courses by id
        all_courses: list[Course] = []
        seen_course_ids: set[str] = set()
        for c in target_courses + bridge_courses:
            if c.id not in seen_course_ids:
                seen_course_ids.add(c.id)
                all_courses.append(c)

        centres: list[NearbyTrainingCentreOut] = []
        for course in all_courses:
            by_centre_id: dict[str, NearbyTrainingCentreOut] = {}

            if latitude is not None and longitude is not None:
                for c in find_nearby_centres(
                    db, latitude, longitude, radius_km, course_id=course.id, distance_type=distance_type
                ):
                    by_centre_id[c.id] = c

            # Surface every verified centre_courses linkage
            rows = db.execute(
                select(TrainingCentre)
                .join(CentreCourse, CentreCourse.centre_id == TrainingCentre.id)
                .where(CentreCourse.course_id == course.id)
            ).scalars().all()
            for c in rows:
                if c.id not in by_centre_id:
                    c_dist_type = "district_only" if (c.latitude is None or c.longitude is None) else None
                    by_centre_id[c.id] = to_nearby_out(db, c, distance_km=None, distance_type=c_dist_type)

            centres.extend(by_centre_id.values())

        # Deduplicate centres by id within transition
        unique_centres: list[NearbyTrainingCentreOut] = []
        seen_centre_ids: set[str] = set()
        for cntr in centres:
            if cntr.id not in seen_centre_ids:
                seen_centre_ids.add(cntr.id)
                unique_centres.append(cntr)

        if not unique_centres:
            warnings.append(
                f"No verified training centre offers '{skill.name_en if skill else t.to_skill_id}' yet "
                "(centre_courses.csv has no linkage for its course(s))."
            )

        transition_outs.append(
            SkillTransitionOut(
                target_skill=SkillOut.model_validate(skill),
                bridge_skills=bridge_skills,
                rationale=t.rationale,
                confidence=t.confidence,
                courses=[CourseOut.model_validate(c) for c in all_courses],
                centres=unique_centres,
            )
        )

    skill_gaps = calculate_skill_gaps(current_skills, transition_outs)

    return PathwayResponse(
        occupation=OccupationOut.model_validate(occupation),
        current_skills=current_skills,
        transitions=transition_outs,
        skill_gaps=skill_gaps,
        warnings=warnings,
    )

