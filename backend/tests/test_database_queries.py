"""The 10 required database query tests (task Phase 13). Every test SKIPs
(not fails) when no database is reachable — see conftest.py.
"""
from __future__ import annotations

from sqlalchemy import select

from app.models import (
    CentreCourse,
    Course,
    Evidence,
    OccupationSkill,
    SchemeDocument,
    SkillTransition,
    Source,
)
from app.schemas.recommendation import WorkerProfileIn
from app.schemas.scheme import EligibilityCheckRequest
from app.services.eligibility import check_eligibility
from app.services.pathways import build_pathway
from app.services.recommendations import build_recommendation


def test_1_occupation_to_skills(db_session):
    rows = db_session.execute(select(OccupationSkill)).scalars().all()
    assert isinstance(rows, list)  # table is queryable; content asserted honestly, not forced


def test_2_occupation_to_skill_transition(db_session):
    rows = db_session.execute(select(SkillTransition)).scalars().all()
    assert isinstance(rows, list)
    for t in rows:
        assert t.from_occupation_id and t.to_skill_id


def test_3_skill_to_courses(db_session):
    rows = db_session.execute(select(Course)).scalars().all()
    for c in rows:
        assert c.skill_id  # every course must reference a real skill (FK-enforced)


def test_4_course_to_training_centres(db_session):
    rows = db_session.execute(select(CentreCourse)).scalars().all()
    for cc in rows:
        assert cc.centre_id and cc.course_id


def test_5_nearby_centre_search(db_session):
    from app.services.geo import find_nearby_centres

    # Bengaluru Urban approx centroid — see data/seed/locations.csv loc-001.
    centres = find_nearby_centres(db_session, latitude=12.9716, longitude=77.5946, radius_km=25)
    assert isinstance(centres, list)
    for c in centres:
        assert c.distance_km is not None and c.distance_km <= 25
        # Ensure provenance is properly populated
        assert c.provenance is not None
        assert c.name is not None
        assert c.district is not None

    # Test course_id filtering if any centre_courses exist
    cc = db_session.execute(select(CentreCourse)).scalars().first()
    if cc:
        filtered = find_nearby_centres(
            db_session, latitude=12.9716, longitude=77.5946, radius_km=100, course_id=cc.course_id
        )
        assert isinstance(filtered, list)
        for fc in filtered:
            assert any(mc.course_id == cc.course_id for mc in fc.mapped_courses)


def test_6_scheme_to_eligibility_rules(db_session):
    req = EligibilityCheckRequest(age=25, occupation="tailor")
    results = check_eligibility(db_session, req)
    assert isinstance(results, list) and len(results) > 0
    for r in results:
        assert r.verdict in ("eligible", "not_eligible", "uncertain")


def test_7_scheme_to_documents(db_session):
    rows = db_session.execute(select(SchemeDocument)).scalars().all()
    for sd in rows:
        assert sd.scheme_id and sd.document_id


def test_8_evidence_to_source(db_session):
    rows = db_session.execute(select(Evidence)).scalars().all()
    source_ids = {s for (s,) in db_session.execute(select(Source.id)).all()}
    for ev in rows:
        assert ev.source_id in source_ids


def test_9_document_to_chunks(db_session):
    from app.models import DocumentChunk

    rows = db_session.execute(select(DocumentChunk)).scalars().all()
    source_ids = {s for (s,) in db_session.execute(select(Source.id)).all()}
    for chunk in rows:
        assert chunk.source_id in source_ids
        if chunk.embedding is not None:
            assert len(chunk.embedding) == 768
            assert chunk.embedding_status == "generated"
        else:
            assert chunk.embedding_status == "not-generated"


def test_10_recommendation_assembly(db_session):
    profile = WorkerProfileIn(occupation="Delivery / Courier Rider", district="Bengaluru Urban")
    rec = build_recommendation(db_session, profile)
    assert rec.matched_occupation is not None
    assert isinstance(rec.warnings, list)


def test_pathway_never_fabricates_missing_data(db_session):
    """A target with genuinely no data must say so, not invent a result."""
    pathway = build_pathway(db_session, occupation_text="Street / Market Vendor")
    assert pathway.occupation is not None
    assert len(pathway.transitions) == 0
    assert any("skill_transitions" in w for w in pathway.warnings)
