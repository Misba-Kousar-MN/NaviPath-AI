"""Assembles the structured, factual recommendation context described in
docs/ARCHITECTURE.md Section H/J. Produces structured JSON only — no
natural-language generation happens here (that's a separate, not-yet-built
LLM phrasing layer per the architecture's LLM boundary rule).
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Evidence, Location, Scheme
from app.schemas.course import CourseOut
from app.schemas.recommendation import RecommendationResponse, WorkerProfileIn
from app.schemas.scheme import EligibilityCheckRequest, SchemeDocumentOut, SchemeOut
from app.schemas.training_centre import NearbyTrainingCentreOut
from app.services.eligibility import check_eligibility
from app.services.pathways import build_pathway


def _location_for_district(db: Session, district: str) -> Location | None:
    stmt = select(Location).where(Location.district.ilike(f"%{district.strip()}%"))
    return db.execute(stmt).scalars().first()


def build_recommendation(db: Session, profile: WorkerProfileIn) -> RecommendationResponse:
    warnings: list[str] = []

    # Geographic anchoring:
    # 1. exact: worker provides exact GPS latitude and longitude in profile
    # 2. approximate: worker provides district, using verified district centroid
    if profile.latitude is not None and profile.longitude is not None:
        lat = profile.latitude
        lng = profile.longitude
        distance_type = "exact"
    else:
        location = _location_for_district(db, profile.district)
        lat = float(location.centroid_lat) if location and location.centroid_lat is not None else None
        lng = float(location.centroid_lng) if location and location.centroid_lng is not None else None
        distance_type = "approximate"
        if location is None:
            warnings.append(f"District '{profile.district}' has no verified location row (approximate centroid).")
        elif lat is None or lng is None:
            warnings.append(f"District '{profile.district}' has no verified centroid coordinates.")

    pathway = build_pathway(
        db,
        occupation_text=profile.occupation,
        target_skill_text=profile.target_skill,
        latitude=lat,
        longitude=lng,
        distance_type=distance_type,
    )
    warnings.extend(pathway.warnings)

    all_courses: list[CourseOut] = []
    seen_course_ids: set[str] = set()
    for t in pathway.transitions:
        for c in t.courses:
            if c.id not in seen_course_ids:
                seen_course_ids.add(c.id)
                all_courses.append(c)

    all_centres: list[NearbyTrainingCentreOut] = []
    seen_centre_ids: set[str] = set()
    for t in pathway.transitions:
        for cntr in t.centres:
            if cntr.id not in seen_centre_ids:
                seen_centre_ids.add(cntr.id)
                all_centres.append(cntr)

    # Schemes: every currently-active scheme is surfaced as a *candidate* —
    # the eligibility check (below) is what actually determines fit, per the
    # architecture's rule that eligibility is never guessed from sector alone.
    schemes = list(db.execute(select(Scheme).where(Scheme.status == "active")).scalars())
    if not schemes:
        schemes = list(db.execute(select(Scheme)).scalars())
        warnings.append("No scheme currently has status='active' in verified data; showing all schemes.")

    elig_request = EligibilityCheckRequest(
        occupation=profile.occupation,
        age=profile.age,
        education=profile.education,
        district=profile.district,
        social_security_status=profile.social_security_status,
        extra_attributes=profile.extra_attributes,
    )
    eligibility_results = check_eligibility(db, elig_request)

    # Collect unique scheme documents across evaluated schemes
    all_documents: list[SchemeDocumentOut] = []
    seen_doc_ids: set[str] = set()
    for res in eligibility_results:
        for doc in res.documents:
            if doc.document_id not in seen_doc_ids:
                seen_doc_ids.add(doc.document_id)
                all_documents.append(doc)

    schemes_out: list[SchemeOut] = []
    for s in schemes:
        matching_docs = next((res.documents for res in eligibility_results if res.scheme_id == s.id), [])
        s_out = SchemeOut.model_validate(s)
        s_out.documents = matching_docs
        schemes_out.append(s_out)

    evidence_count = db.execute(
        select(Evidence).where(
            Evidence.related_entity_type == "scheme",
            Evidence.related_entity_id.in_([s.id for s in schemes]) if schemes else False,
        )
    ).scalars().all()

    return RecommendationResponse(
        profile=profile,
        matched_occupation=pathway.occupation,
        current_skills=pathway.current_skills,
        recommended_pathways=pathway.transitions,
        skill_gaps=pathway.skill_gaps,
        courses=all_courses,
        nearby_centres=all_centres,
        schemes=schemes_out,
        eligibility=eligibility_results,
        documents=all_documents,
        evidence_count=len(evidence_count),
        warnings=warnings,
    )

