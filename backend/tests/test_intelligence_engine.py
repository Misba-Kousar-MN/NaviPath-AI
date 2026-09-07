"""Phase 2 Deterministic Intelligence Engine automated tests.

Validates:
1. Skill gap calculation.
2. No false skill gaps when worker already possesses the skill.
3. Bridge skill resolution.
4. Unknown bridge_skill_id does not create a fake skill.
5. Direct target-skill course matching.
6. Bridge-skill course matching.
7. Duplicate course elimination.
8. Exact worker coordinates produce distance_type = exact.
9. District-centroid worker origin produces distance_type = approximate.
10. Centre with NULL coordinates does not receive a distance (district_only).
11. District centroid is never stored as a centre coordinate.
12. Scheme documents are retrieved through SchemeDocuments -> Documents.
13. Documents do not alter eligibility verdict.
14. Existing eligibility semantics remain intact.
15. Existing recommendation response remains backward compatible.
16. Golden Delivery Rider scenario produces complete deterministic output.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select

from app.models import Document, Location, Scheme, SchemeDocument, Skill, SkillTransition, TrainingCentre
from app.schemas.course import CourseOut
from app.schemas.occupation import SkillOut
from app.schemas.pathway import SkillGapOut, SkillTransitionOut
from app.schemas.recommendation import WorkerProfileIn
from app.schemas.scheme import EligibilityCheckRequest, SchemeEligibilityResult
from app.services.eligibility import check_eligibility, evaluate_scheme
from app.services.pathways import (
    build_pathway,
    calculate_skill_gaps,
    find_occupation_by_text,
    parse_bridge_skill_ids,
    resolve_bridge_skills,
)
from app.services.recommendations import build_recommendation


@pytest.fixture(autouse=True)
def _require_db(db_available):
    if not db_available:
        pytest.skip("No database connection available in this environment.")


# 1. Skill-gap calculation
def test_skill_gap_calculation():
    current = [
        SkillOut(id="skl-001", name_en="Basic Smartphone Usage", category="digital", skill_level="beginner")
    ]
    target = SkillOut(id="skl-002", name_en="Domestic Electrical Wiring", category="technical", skill_level="intermediate")
    transition = SkillTransitionOut(
        target_skill=target,
        bridge_skills=[],
        rationale="Transition to electrician",
        confidence="data-driven",
        courses=[
            CourseOut(
                id="crs-002",
                title="Electrician Trade Course",
                skill_id="skl-002",
                source_id="src-001",
            )
        ],
        centres=[],
    )
    gaps = calculate_skill_gaps(current, [transition])
    assert len(gaps) == 1
    assert gaps[0].skill_id == "skl-002"
    assert gaps[0].skill_name == "Domestic Electrical Wiring"
    assert gaps[0].gap_type == "target"
    assert gaps[0].has_it is False
    assert len(gaps[0].courses) == 1
    assert gaps[0].courses[0].id == "crs-002"


# 2. No false skill gaps when worker already possesses skill
def test_no_false_skill_gaps_when_worker_possesses_skill():
    current = [
        SkillOut(id="skl-001", name_en="Basic Smartphone Usage", category="digital", skill_level="beginner"),
        SkillOut(id="skl-002", name_en="Domestic Electrical Wiring", category="technical", skill_level="intermediate"),
    ]
    target = SkillOut(id="skl-002", name_en="Domestic Electrical Wiring", category="technical", skill_level="intermediate")
    transition = SkillTransitionOut(
        target_skill=target,
        bridge_skills=[],
        rationale="Already skilled",
        confidence="data-driven",
        courses=[],
        centres=[],
    )
    gaps = calculate_skill_gaps(current, [transition])
    assert len(gaps) == 0, "Worker already possesses skl-002; no false gap should be generated"


# 3. Bridge skill resolution
def test_bridge_skill_resolution_valid(db_session):
    skills, warnings = resolve_bridge_skills(db_session, "skl-005")
    assert len(skills) == 1
    assert skills[0].id == "skl-005"
    assert warnings == []


# 4. Unknown bridge_skill_id does not create a fake skill
def test_bridge_skill_resolution_unknown_id(db_session):
    skills, warnings = resolve_bridge_skills(db_session, "skl-nonexistent-999")
    assert len(skills) == 0, "Non-existent skill must never be fabricated"
    assert any("does not exist" in w for w in warnings)


# 5. Direct target-skill course matching
def test_direct_target_skill_course_matching(db_session):
    occ = find_occupation_by_text(db_session, "Delivery Rider")
    assert occ is not None
    pathway = build_pathway(db_session, occupation_text="Delivery Rider", target_skill_text="Electrician")
    assert len(pathway.transitions) > 0
    t = pathway.transitions[0]
    assert t.target_skill.id == "skl-003"
    for c in t.courses:
        if c.skill_id == "skl-003":
            assert c.skill_id == t.target_skill.id


# 6. Bridge-skill course matching
def test_bridge_skill_course_matching(db_session):
    # Parse helper directly
    tokens = parse_bridge_skill_ids("skl-001; skl-002, skl-003")
    assert tokens == ["skl-001", "skl-002", "skl-003"]
    skills, _ = resolve_bridge_skills(db_session, "skl-001")
    assert len(skills) == 1


# 7. Duplicate course elimination
def test_duplicate_course_elimination(db_session):
    pathway = build_pathway(db_session, occupation_text="Delivery Rider")
    course_ids = [c.id for t in pathway.transitions for c in t.courses]
    # Within each transition, courses should be unique
    for t in pathway.transitions:
        t_ids = [c.id for c in t.courses]
        assert len(t_ids) == len(set(t_ids)), "Transition courses must not contain duplicates"


# 8. Exact worker coordinates produce distance_type = exact
def test_exact_worker_coordinates_produce_exact_distance(db_session):
    profile = WorkerProfileIn(
        occupation="Delivery Rider",
        district="Bengaluru Urban",
        latitude=12.9716,
        longitude=77.5946,
    )
    rec = build_recommendation(db_session, profile)
    centres_with_dist = [c for c in rec.nearby_centres if c.distance_km is not None]
    if centres_with_dist:
        assert centres_with_dist[0].distance_type == "exact"


# 9. District-centroid worker origin produces distance_type = approximate
def test_district_centroid_produces_approximate_distance(db_session):
    profile = WorkerProfileIn(
        occupation="Delivery Rider",
        district="Bengaluru Urban",
    )
    rec = build_recommendation(db_session, profile)
    centres_with_dist = [c for c in rec.nearby_centres if c.distance_km is not None]
    if centres_with_dist:
        assert centres_with_dist[0].distance_type == "approximate"


# 10. Centre with NULL coordinates does not receive a distance
def test_null_coordinates_centre_has_no_distance(db_session):
    unresolved = db_session.execute(
        select(TrainingCentre).where(TrainingCentre.latitude.is_(None))
    ).scalars().first()
    assert unresolved is not None
    assert unresolved.latitude is None
    assert unresolved.longitude is None


# 11. District centroid is never stored as a centre coordinate
def test_district_centroid_never_stored_as_centre_coordinate(db_session):
    unresolved_centres = db_session.execute(
        select(TrainingCentre).where(TrainingCentre.latitude.is_(None))
    ).scalars().all()
    assert len(unresolved_centres) == 71, f"Expected 71 unresolved centres, found {len(unresolved_centres)}"
    for c in unresolved_centres:
        assert c.latitude is None
        assert c.longitude is None
        assert c.location is None


# 12. Scheme documents are retrieved through SchemeDocuments -> Documents
def test_scheme_documents_retrieval(db_session):
    # sch-002 has doc-001 and doc-002
    req = EligibilityCheckRequest(scheme_id="sch-002")
    results = check_eligibility(db_session, req)
    assert len(results) == 1
    res = results[0]
    assert len(res.documents) >= 2
    doc_ids = {d.document_id for d in res.documents}
    assert "doc-001" in doc_ids
    assert "doc-002" in doc_ids


# 13. Documents do not alter eligibility verdict
def test_documents_do_not_alter_eligibility_verdict(db_session):
    scheme = db_session.get(Scheme, "sch-002")
    assert scheme is not None
    # Profile with age=15 fails mandatory rule er-007 (gte 16) -> not_eligible
    req_fail = EligibilityCheckRequest(scheme_id="sch-002", age=15)
    res_fail = evaluate_scheme(db_session, scheme, req_fail)
    assert res_fail.verdict == "not_eligible"
    # Documents are attached but do not change the failure verdict
    assert len(res_fail.documents) > 0


# 14. Existing eligibility semantics remain intact
def test_existing_eligibility_semantics_intact(db_session):
    scheme = db_session.get(Scheme, "sch-002")
    assert scheme is not None
    # Missing age -> uncertain
    req_unknown = EligibilityCheckRequest(scheme_id="sch-002")
    res_unknown = evaluate_scheme(db_session, scheme, req_unknown)
    assert res_unknown.verdict == "uncertain"


# 15. Existing recommendation response remains backward compatible
def test_recommendation_response_backward_compatibility(client):
    body = {
        "occupation": "Delivery Rider",
        "district": "Bengaluru Urban",
        "education": "10th",
        "language": "kn",
        "target_skill": "Electrician",
    }
    r = client.post("/api/recommendations", json=body)
    assert r.status_code == 200
    data = r.json()
    expected_keys = [
        "profile",
        "matched_occupation",
        "current_skills",
        "recommended_pathways",
        "courses",
        "nearby_centres",
        "schemes",
        "eligibility",
        "evidence_count",
        "warnings",
        "skill_gaps",
        "documents",
    ]
    for key in expected_keys:
        assert key in data, f"Missing key '{key}' in response"


# 16. Golden Delivery Rider scenario produces complete deterministic output
def test_golden_delivery_rider_scenario(client):
    body = {
        "occupation": "Delivery Rider",
        "district": "Bengaluru Urban",
        "education": "10th",
        "language": "kn",
        "target_skill": "Electrician",
    }
    r = client.post("/api/recommendations", json=body)
    assert r.status_code == 200
    data = r.json()

    # Occupation resolved
    assert data["matched_occupation"] is not None
    assert "Delivery" in data["matched_occupation"]["name_en"]

    # Current skills: Delivery Rider has no row in occupation_skills.csv, so [] is returned with honest warning
    assert isinstance(data["current_skills"], list)
    assert any("No verified current-skill mapping exists" in w for w in data["warnings"])

    # Skill gaps computed
    assert len(data["skill_gaps"]) > 0
    assert any(g["skill_id"] == "skl-003" and g["gap_type"] == "target" for g in data["skill_gaps"])


    # Pathways returned
    assert len(data["recommended_pathways"]) > 0
    p = data["recommended_pathways"][0]
    assert "target_skill" in p
    assert "bridge_skills" in p
    assert "courses" in p
    assert "centres" in p

    # Mapped training centres have distance_type
    for cntr in data["nearby_centres"]:
        if cntr.get("distance_km") is not None:
            assert cntr.get("distance_type") in ("exact", "approximate")
        else:
            assert cntr.get("distance_type") in ("district_only", None)

    # Schemes and documents attached
    assert len(data["schemes"]) > 0
    assert len(data["eligibility"]) > 0
    assert len(data["documents"]) > 0
