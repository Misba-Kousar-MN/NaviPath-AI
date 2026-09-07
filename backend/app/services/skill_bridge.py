"""Skill-Bridge Engine — deterministic pathway calculation for Innovation 3.

Computes:
1. Skill overlap: intersection(current_skills, target_occupation_skills)
2. Skill gaps: target_skills - current_skills
3. Bridge skills: from SkillTransition.bridge_skill_ids
4. Pathway score: transparent documented formula (see PathwayScoreOut docstring)
5. Wage lift: via WageLiftEngine

THE LLM MUST NOT:
- Compute or override overlap_percentage
- Compute or override pathway_score.total_score
- Invent target occupations, skills, courses, or centres
- Invent wage figures

All deterministic output is assembled here and passed to the LLM as read-only context.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    CentreCourse,
    Course,
    Occupation,
    OccupationSkill,
    Scheme,
    Skill,
    SkillTransition,
    TrainingCentre,
)
from app.schemas.scheme import EligibilityCheckRequest, SchemeEligibilityResult, SchemeOut
from app.services.eligibility import evaluate_scheme
from app.schemas.course import CourseOut
from app.schemas.occupation import OccupationOut, SkillOut
from app.schemas.pathway import SkillGapOut
from app.schemas.skill_bridge import (
    CONFIDENCE_NOTES,
    PathwayScoreOut,
    SkillBridgeComparison,
    SkillBridgePathway,
    SkillBridgeResult,
    SkillOverlapOut,
    PathwayComparisonField,
    WageLiftOut,
)
from app.schemas.training_centre import NearbyTrainingCentreOut
from app.services.geo import find_nearby_centres, to_nearby_out
from app.services.pathways import (
    _courses_for_skill,
    _current_skills,
    resolve_bridge_skills,
)
from app.services.wage_lift import calculate_wage_lift, get_wage_benchmark

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Core deterministic calculations
# ---------------------------------------------------------------------------

def calculate_skill_overlap(
    current_skills: list[SkillOut],
    target_skills: list[SkillOut],
) -> SkillOverlapOut:
    """Pure deterministic set intersection — never calls LLM.

    current_skills: skills already mapped to the worker's current occupation.
    target_skills: skills mapped to the target occupation (OccupationSkill rows).

    Returns SkillOverlapOut with overlap_percentage computed in Python.
    """
    current_ids: set[str] = {s.id for s in current_skills}
    target_ids: set[str] = {s.id for s in target_skills}
    target_id_list = list(target_ids)

    overlap_ids = sorted(current_ids & target_ids)
    overlap_skill_map = {s.id: s for s in current_skills}
    target_skill_map = {s.id: s for s in target_skills}

    overlap_skills = [overlap_skill_map[sid] for sid in overlap_ids if sid in overlap_skill_map]
    overlap_count = len(overlap_ids)
    total_target = len(target_ids)
    pct = round((overlap_count / total_target * 100), 2) if total_target > 0 else 0.0

    return SkillOverlapOut(
        overlap_skill_ids=overlap_ids,
        overlap_skills=overlap_skills,
        target_skill_ids=target_id_list,
        target_skills=[target_skill_map[sid] for sid in target_id_list],
        overlap_count=overlap_count,
        total_target_skills=total_target,
        overlap_percentage=pct,
    )


def calculate_pathway_score(
    overlap_percentage: float,
    gap_count: int,
    has_transition: bool,
    has_courses: bool,
    has_centres: bool,
) -> PathwayScoreOut:
    """Transparent pathway score — documented formula, no black-box LLM scoring.

    Formula (max 100 pts):
      overlap_component  = min(overlap_pct * 0.40, 40)   — proportional skill overlap
      gap_component      = max(20 - gap_count * 4, 0)    — fewer gaps = better
      transition_cpt     = 15 if transition in DB else 0
      training_component = 15 if ≥1 course available else 0
      centre_component   = 10 if ≥1 centre available else 0

    Rationale for weights:
      - Overlap is the strongest feasibility signal (40% weight)
      - Fewer skill gaps means shorter time-to-employment (20% weight)
      - Existence of a validated transition record shows real pathways exist (15%)
      - Course availability is critical — no course = no pathway (15%)
      - Centre availability affects practical access (10%)
    """
    overlap_cpt = min(overlap_percentage * 0.40, 40.0)
    gap_cpt = max(20.0 - gap_count * 4.0, 0.0)
    transition_cpt = 15.0 if has_transition else 0.0
    training_cpt = 15.0 if has_courses else 0.0
    centre_cpt = 10.0 if has_centres else 0.0

    total = round(overlap_cpt + gap_cpt + transition_cpt + training_cpt + centre_cpt, 1)

    if total >= 85:
        label = "Strong"
    elif total >= 65:
        label = "Good"
    elif total >= 40:
        label = "Moderate"
    else:
        label = "Low"

    # Deterministic explanation (not LLM)
    parts: list[str] = []
    if overlap_percentage >= 50:
        parts.append(f"{overlap_percentage:.0f}% of required skills already overlap with your current work")
    elif overlap_percentage > 0:
        parts.append(f"Some existing skills overlap ({overlap_percentage:.0f}%)")
    else:
        parts.append("No direct skill overlap — this is a significant career change")

    if gap_count == 0:
        parts.append("no additional skills needed")
    elif gap_count <= 2:
        parts.append(f"only {gap_count} skill gap{'s' if gap_count > 1 else ''} to close")
    else:
        parts.append(f"{gap_count} skills to learn")

    if has_courses:
        parts.append("a verified training course is available")
    else:
        parts.append("no matching course found in current data")

    if has_centres:
        parts.append("training centres are available in the dataset")

    explanation = ". ".join(p.capitalize() for p in parts) + "."

    return PathwayScoreOut(
        total_score=total,
        label=label,
        overlap_component=round(overlap_cpt, 1),
        gap_component=round(gap_cpt, 1),
        transition_component=transition_cpt,
        training_component=training_cpt,
        centre_component=centre_cpt,
        explanation=explanation,
    )


# ---------------------------------------------------------------------------
# Target occupation skills lookup
# ---------------------------------------------------------------------------

def _target_occupation_skills(db: Session, occupation_id: str) -> list[SkillOut]:
    """Return all skills mapped to the target occupation."""
    stmt = (
        select(Skill)
        .join(OccupationSkill, OccupationSkill.skill_id == Skill.id)
        .where(OccupationSkill.occupation_id == occupation_id)
    )
    return [SkillOut.model_validate(s) for s in db.execute(stmt).scalars().all()]


def _centres_for_courses(
    db: Session,
    courses: list[Course],
    latitude: float | None,
    longitude: float | None,
    radius_km: float = 50.0,
) -> list[NearbyTrainingCentreOut]:
    """Collect training centres for a list of courses, using PostGIS where coords available."""
    centres: list[NearbyTrainingCentreOut] = []
    seen_ids: set[str] = set()

    for course in courses:
        by_centre: dict[str, NearbyTrainingCentreOut] = {}

        if latitude is not None and longitude is not None:
            for c in find_nearby_centres(db, latitude, longitude, radius_km, course_id=course.id):
                by_centre[c.id] = c

        rows = db.execute(
            select(TrainingCentre)
            .join(CentreCourse, CentreCourse.centre_id == TrainingCentre.id)
            .where(CentreCourse.course_id == course.id)
        ).scalars().all()
        for c in rows:
            if c.id not in by_centre:
                dist_type = "district_only" if (c.latitude is None or c.longitude is None) else None
                by_centre[c.id] = to_nearby_out(db, c, distance_km=None, distance_type=dist_type)

        for cntr in by_centre.values():
            if cntr.id not in seen_ids:
                seen_ids.add(cntr.id)
                centres.append(cntr)

    return centres


# ---------------------------------------------------------------------------
# Build skill-bridge pathway for one transition
# ---------------------------------------------------------------------------

def _build_pathway_for_transition(
    db: Session,
    transition: SkillTransition,
    current_skills: list[SkillOut],
    current_occupation: Occupation,
    latitude: float | None,
    longitude: float | None,
    current_occ_id_for_wage: str,
    radius_km: float = 50.0,
    district: str | None = None,
) -> SkillBridgePathway:
    """Construct one SkillBridgePathway from a single SkillTransition row."""
    warnings: list[str] = []

    # Target skill
    target_skill_row = db.get(Skill, transition.to_skill_id)
    if target_skill_row is None:
        target_skill_row = Skill(id=transition.to_skill_id, name_en="Unknown", category="technical", skill_level="intermediate")
    target_skill_out = SkillOut.model_validate(target_skill_row)

    # Target occupation (nullable — may be None for unregistered targets)
    target_occ: OccupationOut | None = None
    target_occ_id: str | None = transition.to_occupation_id
    if target_occ_id:
        target_occ_row = db.get(Occupation, target_occ_id)
        if target_occ_row:
            target_occ = OccupationOut.model_validate(target_occ_row)

    # Target occupation skills (for overlap calculation)
    target_skills: list[SkillOut] = []
    if target_occ_id:
        target_skills = _target_occupation_skills(db, target_occ_id)

    # Skill overlap (deterministic set math)
    skill_overlap = calculate_skill_overlap(current_skills, target_skills)

    # Bridge skills (from DB — no LLM invention)
    bridge_skills_raw, bridge_warnings = resolve_bridge_skills(db, transition.bridge_skill_ids)
    bridge_skills = [SkillOut.model_validate(s) for s in bridge_skills_raw]
    warnings.extend(bridge_warnings)

    # Courses for target skill + bridge skills
    raw_courses = _courses_for_skill(db, transition.to_skill_id)
    for bs in bridge_skills:
        raw_courses.extend(_courses_for_skill(db, bs.id))
    # Deduplicate
    seen_cids: set[str] = set()
    unique_courses: list[Course] = []
    for c in raw_courses:
        if c.id not in seen_cids:
            seen_cids.add(c.id)
            unique_courses.append(c)

    courses_out = [CourseOut.model_validate(c) for c in unique_courses]

    # Training centres (PostGIS + district fallback)
    centres_out = _centres_for_courses(db, unique_courses, latitude, longitude, radius_km=radius_km)

    # Skill gaps: target_skills - current_skills
    current_ids = {s.id for s in current_skills}
    target_and_bridge = list(target_skills)
    # Also include the target skill itself if not in target_occ skills list
    if target_skill_out.id not in {s.id for s in target_and_bridge}:
        target_and_bridge.insert(0, target_skill_out)

    skill_gaps: list[SkillGapOut] = []
    seen_gap_ids: set[str] = set()
    for ts in target_and_bridge:
        if ts.id not in current_ids and ts.id not in seen_gap_ids:
            matching = [c for c in courses_out if c.skill_id == ts.id]
            skill_gaps.append(SkillGapOut(
                skill_id=ts.id,
                skill_name=ts.name_en,
                skill_category=ts.category,
                gap_type="target",
                rationale=transition.rationale,
                has_it=False,
                courses=matching,
            ))
            seen_gap_ids.add(ts.id)
    for bs in bridge_skills:
        if bs.id not in current_ids and bs.id not in seen_gap_ids:
            matching = [c for c in courses_out if c.skill_id == bs.id]
            skill_gaps.append(SkillGapOut(
                skill_id=bs.id,
                skill_name=bs.name_en,
                skill_category=bs.category,
                gap_type="bridge",
                rationale=f"Bridge skill for transitioning to {target_skill_out.name_en}",
                has_it=False,
                courses=matching,
            ))
            seen_gap_ids.add(bs.id)

    # Wage benchmarks (deterministic)
    current_wb = get_wage_benchmark(db, current_occ_id_for_wage, district=district)
    target_wb = get_wage_benchmark(db, target_occ_id, district=district)
    wage_lift = calculate_wage_lift(current_wb, target_wb)

    # Pathway score (documented formula — no LLM)
    pathway_score = calculate_pathway_score(
        overlap_percentage=skill_overlap.overlap_percentage,
        gap_count=len(skill_gaps),
        has_transition=True,  # We are inside a valid transition
        has_courses=len(courses_out) > 0,
        has_centres=len(centres_out) > 0,
    )

    # pathway_type: 'bridge' if bridge_skills exist, else 'direct'
    pathway_type = "bridge" if bridge_skills else "direct"

    # Confidence note (mandatory honest disclaimer)
    conf = transition.confidence or "heuristic"
    conf_note = CONFIDENCE_NOTES.get(conf, CONFIDENCE_NOTES["heuristic"])

    # Scheme & Eligibility (Innovation 3 Pipeline)
    stmt_schemes = select(Scheme)
    all_schemes = list(db.execute(stmt_schemes).scalars().all())

    chosen_scheme = None
    target_occ_name = (target_occ.name_en if target_occ else "").lower()
    is_artisan = any(k in target_occ_name for k in ["carpenter", "blacksmith", "potter", "mason", "sculptor", "artisan"])

    for sch in all_schemes:
        if is_artisan and "vishwakarma" in sch.name_en.lower():
            chosen_scheme = sch
            break
        elif not is_artisan and ("kaushalya" in sch.name_en.lower() or "cmkky" in sch.name_en.lower()):
            chosen_scheme = sch
            break

    if not chosen_scheme:
        for sch in all_schemes:
            if sch.scheme_type == "skilling":
                chosen_scheme = sch
                break
    if not chosen_scheme and all_schemes:
        chosen_scheme = all_schemes[0]

    scheme_out = None
    eligibility_res = None
    if chosen_scheme:
        scheme_out = SchemeOut.model_validate(chosen_scheme)
        prof_req = EligibilityCheckRequest(
            occupation=current_occupation.id if current_occupation else None,
            district=district,
        )
        eligibility_res = evaluate_scheme(db, chosen_scheme, prof_req)

    # Certification status
    cert_status = "Certification information not verified"
    for c in unique_courses:
        if c.is_government_recognized and c.certifying_body:
            cert_status = f"Government recognized by {c.certifying_body}"
            break
        elif c.certifying_body:
            cert_status = f"Certified by {c.certifying_body}"
            break
        elif c.is_government_recognized:
            cert_status = "Government recognized certification"
            break

    # Candidate skill labelling (e.g. EV Service Technician, Beauty Therapy)
    is_candidate = False
    if target_occ and any(w in target_occ.name_en.lower() for w in ["ev", "electric vehicle", "beauty"]):
        is_candidate = True
    if any(w in target_skill_out.name_en.lower() for w in ["ev", "electric vehicle", "beauty"]):
        is_candidate = True
    if wage_lift.target and wage_lift.target.status == "candidate":
        is_candidate = True
    if transition.confidence == "candidate":
        is_candidate = True

    if is_candidate:
        candidate_tag = " [CANDIDATE — NEEDS REVIEW]"
        if candidate_tag not in conf_note:
            conf_note = f"{conf_note}{candidate_tag}"

    # Deterministic Next Action
    next_action_parts = []
    if centres_out and courses_out:
        centre_info = f"{centres_out[0].name}" + (f" in {centres_out[0].district}" if centres_out[0].district else "")
        next_action_parts.append(f"Visit {centre_info} or enroll in {courses_out[0].title}")
    elif courses_out:
        next_action_parts.append(f"Apply for admission in {courses_out[0].title}")
    elif centres_out:
        next_action_parts.append(f"Contact {centres_out[0].name} for course schedules")
    else:
        next_action_parts.append(f"Explore local accredited training providers for {target_skill_out.name_en}")

    if scheme_out:
        next_action_parts.append(f"apply via {scheme_out.name_en} for fee support or stipend")

    next_action = ". ".join(p.capitalize() for p in next_action_parts) + "."

    logger.info(
        "Skill-bridge pathway built: transition=%s score=%.1f type=%s",
        transition.id,
        pathway_score.total_score,
        pathway_type,
        extra={
            "event": "pathway_candidates_generated",
            "transition_id": transition.id,
            "pathway_type": pathway_type,
            "score": pathway_score.total_score,
            "wage_status": wage_lift.status,
        },
    )

    return SkillBridgePathway(
        transition_id=transition.id,
        pathway_type=pathway_type,
        confidence=conf,
        confidence_note=conf_note,
        current_occupation=OccupationOut.model_validate(current_occupation),
        target_occupation=target_occ,
        target_skill=target_skill_out,
        current_skills=current_skills,
        skill_overlap=skill_overlap,
        skill_gaps=skill_gaps,
        bridge_skills=bridge_skills,
        courses=courses_out,
        nearby_centres=centres_out,
        scheme=scheme_out,
        eligibility=eligibility_res,
        certification_status=cert_status,
        wage_lift=wage_lift,
        pathway_score=pathway_score,
        rationale=transition.rationale,
        market_demand_note=transition.market_demand_note,
        next_action=next_action,
    )


# ---------------------------------------------------------------------------
# Top-level orchestration
# ---------------------------------------------------------------------------

def build_skill_bridge_result(
    db: Session,
    occupation_text: str,
    district: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float = 50.0,
    target_occupation_id: str | None = None,
) -> SkillBridgeResult:
    """Build the complete skill-bridge result for a worker's occupation.

    Reuses existing `_current_skills()` from pathways.py.
    Never calls the LLM — all output is deterministic SQL-based calculation.
    """
    from app.services.pathways import find_occupation_by_text

    warnings: list[str] = []

    logger.info(
        "Skill-bridge requested for occupation='%s'",
        occupation_text,
        extra={"event": "skill_bridge_requested", "occupation": occupation_text},
    )

    occupation = find_occupation_by_text(db, occupation_text)
    if occupation is None:
        warnings.append(
            f"No matching occupation found for '{occupation_text}' in verified data."
        )
        return SkillBridgeResult(warnings=warnings)

    current_skills = _current_skills(db, occupation.id)
    if not current_skills:
        warnings.append(
            f"No verified skill mapping found for '{occupation.name_en}' in occupation_skills data. "
            "Skill overlap will be 0% until occupation_skills rows are added."
        )

    # All transitions from this occupation
    stmt = select(SkillTransition).where(SkillTransition.from_occupation_id == occupation.id)
    if target_occupation_id:
        stmt = stmt.where(SkillTransition.to_occupation_id == target_occupation_id)

    transitions = list(db.execute(stmt).scalars().all())

    if not transitions:
        warnings.append(
            f"No verified skill transitions found for '{occupation.name_en}'. "
            "Pathways will be empty until skill_transitions data is added."
        )

    pathways: list[SkillBridgePathway] = []
    for transition in transitions:
        try:
            pathway = _build_pathway_for_transition(
                db=db,
                transition=transition,
                current_skills=current_skills,
                current_occupation=occupation,
                latitude=latitude,
                longitude=longitude,
                current_occ_id_for_wage=occupation.id,
                radius_km=radius_km,
                district=district,
            )
            pathways.append(pathway)
        except Exception as exc:
            logger.warning(
                "Failed to build pathway for transition %s: %s",
                transition.id, str(exc)[:120],
                extra={"event": "pathway_build_error", "transition_id": transition.id},
            )
            warnings.append(
                f"Could not build pathway for transition {transition.id}: {str(exc)[:80]}"
            )

    # Sort pathways by score descending
    pathways.sort(key=lambda p: p.pathway_score.total_score, reverse=True)

    return SkillBridgeResult(
        current_occupation=OccupationOut.model_validate(occupation),
        current_skills=current_skills,
        pathways=pathways,
        warnings=warnings,
    )


# ---------------------------------------------------------------------------
# Pathway Comparison
# ---------------------------------------------------------------------------

def compare_pathways(
    pathway_a: SkillBridgePathway,
    pathway_b: SkillBridgePathway,
) -> SkillBridgeComparison:
    """Deterministic side-by-side comparison of two pathways.

    The recommendation is based purely on pathway_score.total_score.
    Gemini may explain the comparison conversationally but must not override it.
    """
    score_a = pathway_a.pathway_score.total_score
    score_b = pathway_b.pathway_score.total_score

    if score_a > score_b:
        recommendation = (
            f"Pathway A ({pathway_a.target_skill.name_en}) has a higher pathway score "
            f"({score_a:.0f} vs {score_b:.0f}), indicating it is a closer match to your "
            "current skills and training availability."
        )
    elif score_b > score_a:
        recommendation = (
            f"Pathway B ({pathway_b.target_skill.name_en}) has a higher pathway score "
            f"({score_b:.0f} vs {score_a:.0f}), indicating it is a closer match to your "
            "current skills and training availability."
        )
    else:
        recommendation = (
            f"Both pathways have equal scores ({score_a:.0f}). "
            "Consider which target occupation best suits your personal goals."
        )

    logger.info(
        "Pathway comparison: A=%s(%.0f) vs B=%s(%.0f)",
        pathway_a.target_skill.name_en, score_a,
        pathway_b.target_skill.name_en, score_b,
        extra={"event": "pathway_comparison_requested"},
    )

    fields: list[PathwayComparisonField] = [
        PathwayComparisonField(
            label="Target",
            pathway_a_value=pathway_a.target_skill.name_en,
            pathway_b_value=pathway_b.target_skill.name_en,
        ),
        PathwayComparisonField(
            label="Skill overlap",
            pathway_a_value=f"{pathway_a.skill_overlap.overlap_percentage:.0f}%",
            pathway_b_value=f"{pathway_b.skill_overlap.overlap_percentage:.0f}%",
        ),
        PathwayComparisonField(
            label="Skills to learn",
            pathway_a_value=len(pathway_a.skill_gaps),
            pathway_b_value=len(pathway_b.skill_gaps),
        ),
        PathwayComparisonField(
            label="Bridge skills",
            pathway_a_value=len(pathway_a.bridge_skills),
            pathway_b_value=len(pathway_b.bridge_skills),
        ),
        PathwayComparisonField(
            label="Courses available",
            pathway_a_value=len(pathway_a.courses),
            pathway_b_value=len(pathway_b.courses),
        ),
        PathwayComparisonField(
            label="Training centres",
            pathway_a_value=len(pathway_a.nearby_centres),
            pathway_b_value=len(pathway_b.nearby_centres),
        ),
        PathwayComparisonField(
            label="Pathway score",
            pathway_a_value=score_a,
            pathway_b_value=score_b,
        ),
        PathwayComparisonField(
            label="Pathway strength",
            pathway_a_value=pathway_a.pathway_score.label,
            pathway_b_value=pathway_b.pathway_score.label,
        ),
        PathwayComparisonField(
            label="Wage benchmark status",
            pathway_a_value=pathway_a.wage_lift.status,
            pathway_b_value=pathway_b.wage_lift.status,
        ),
        PathwayComparisonField(
            label="Target median wage (INR/month)",
            pathway_a_value=pathway_a.wage_lift.target_benchmark.monthly_median_inr if pathway_a.wage_lift.target_benchmark else None,
            pathway_b_value=pathway_b.wage_lift.target_benchmark.monthly_median_inr if pathway_b.wage_lift.target_benchmark else None,
        ),
        PathwayComparisonField(
            label="Confidence",
            pathway_a_value=pathway_a.confidence,
            pathway_b_value=pathway_b.confidence,
        ),
    ]

    return SkillBridgeComparison(
        pathway_a=pathway_a,
        pathway_b=pathway_b,
        recommendation=recommendation,
        comparison_fields=fields,
    )
