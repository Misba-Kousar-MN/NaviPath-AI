"""Grounded Recommendation Orchestration Service.
Orchestrates:
1. Deterministic Intelligence (occupations, skills, gaps, courses, PostGIS centres, eligibility)
2. Skill-Bridge & Wage-Lift Engine (Innovation 3 — deterministic, no LLM)
3. Targeted RAG Query Construction
4. Semantic Evidence Retrieval (pgvector cosine similarity)
5. Evidence Validation (Phase 3E)
6. LLM Grounded Explanation / Personalization (Phase 4)
With full graceful fallback: deterministic data is 100% preserved even if LLM/RAG fails.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.context import (
    generate_request_id,
    get_request_id,
    get_session_id,
    set_request_context,
    set_session_id,
)
from app.llm.service import (
    LLMExplanationService,
    RecommendationExplanation,
    SchemeExplanation,
)
from app.rag.retriever import RAGRetriever, RetrievedChunk
from app.rag.validator import EvidenceValidator, ValidatedEvidence
from app.schemas.recommendation import RecommendationResponse, WorkerProfileIn
from app.services.recommendations import build_recommendation
from app.services.skill_bridge import build_skill_bridge_result  # Innovation 3

logger = logging.getLogger(__name__)


def build_grounded_recommendation(
    db: Session,
    profile: WorkerProfileIn,
    retriever: RAGRetriever | None = None,
    validator: EvidenceValidator | None = None,
    llm_service: LLMExplanationService | None = None,
) -> RecommendationResponse:
    """Orchestrates deterministic intelligence with validated RAG evidence and grounded LLM explanation."""
    # Ensure correlation context is initialized (handles direct service invocations)
    req_id = get_request_id()
    if not req_id:
        req_id = generate_request_id()
        set_request_context(req_id, profile.session_id)
    elif profile.session_id and not get_session_id():
        set_session_id(profile.session_id)

    logger.info(
        "Recommendation process started for occupation '%s'",
        profile.occupation,
        extra={
            "event": "recommendation_started",
            "operation": "build_grounded_recommendation",
        },
    )

    # 1. Authoritative Deterministic Intelligence (Strictly Unaltered)
    base_response = build_recommendation(db, profile)

    # 2. Innovation 3 — Skill-Bridge & Wage-Lift Engine (deterministic, no LLM)
    # Attached here so the LLM receives structured facts as read-only context.
    try:
        skill_bridge = build_skill_bridge_result(
            db=db,
            occupation_text=profile.occupation,
            district=profile.district,
            latitude=profile.latitude,
            longitude=profile.longitude,
        )
        base_response.skill_bridge = skill_bridge
        logger.info(
            "Skill-Bridge Engine completed: %d pathway(s) built",
            len(skill_bridge.pathways),
            extra={
                "event": "skill_bridge_completed",
                "pathway_count": len(skill_bridge.pathways),
            },
        )
    except Exception as exc:
        logger.warning(
            "Skill-Bridge Engine failed gracefully; recommendation unaffected: %s",
            str(exc)[:120],
            extra={"event": "skill_bridge_failed", "error": str(exc)[:120]},
        )
        base_response.skill_bridge = None

    # 3. Build focused queries from deterministic recommendations
    target_queries = _construct_evidence_queries(base_response)

    # If no pathways or courses identified, return deterministic response directly with clear explanation
    if not target_queries:
        logger.info(
            "No transition pathways or courses found for profile; skipping RAG retrieval.",
            extra={
                "event": "rag_retrieval_skipped",
                "operation": "build_grounded_recommendation",
            },
        )
        base_response.explanation_status = "available"
        base_response.evidence_status = "empty"
        base_response.validated_evidence = []
        base_response.explanation = RecommendationExplanation(
            summary=(
                f"No verified upward career transition pathways are currently registered for "
                f"'{profile.occupation}' in the state database."
            ),
            skill_gap_explanation="No transition skill gaps can be computed without an active pathway.",
            pathway_explanation="We only recommend career transitions backed by official government curriculum standards.",
            course_explanations=[],
            centre_explanations=[],
            scheme_explanations=[
                SchemeExplanation(
                    scheme_id=el.scheme_id,
                    name=el.scheme_name,
                    eligibility_summary=f"Eligibility verdict: {el.verdict}",
                )
                for el in base_response.eligibility
            ],
            next_steps=[
                "Check back as additional sector skill councils publish transition qualification packs.",
                "Explore active government welfare schemes shown in your eligibility summary.",
            ],
            limitations=[
                "Database records for informal trade transitions are updated periodically from NCVET gazettes."
            ],
            evidence_references=[],
        )
        return base_response

    # 3. Retrieve Evidence Chunks via Semantic Search
    retrieved_chunks: list[RetrievedChunk] = []
    seen_chunk_ids: set[str] = set()

    try:
        active_retriever = retriever or RAGRetriever()
        for q, q_course_id, q_scheme_id in target_queries:
            sub_res = active_retriever.retrieve(
                query=q,
                db=db,
                top_k=3,
                # Phase 5.1: pass deterministic entity IDs as SQL-level filters
                course_id=q_course_id,
                scheme_id=q_scheme_id,
            )
            for c in sub_res.results:
                if c.chunk_id not in seen_chunk_ids:
                    seen_chunk_ids.add(c.chunk_id)
                    retrieved_chunks.append(c)
        evidence_status = "retrieved" if retrieved_chunks else "empty"
    except Exception as exc:
        logger.warning(
            "RAG retrieval failed safely; continuing with deterministic facts: %s",
            str(exc)[:120],
            extra={
                "event": "rag_retrieval_failed",
                "operation": "build_grounded_recommendation",
                "error": str(exc)[:120],
            },
        )
        retrieved_chunks = []
        evidence_status = "unavailable"

    # 4. Phase 3E: Validate Retrieved Evidence
    validated_evidence: list[ValidatedEvidence] = []
    if retrieved_chunks:
        try:
            active_validator = validator or EvidenceValidator()
            validated_evidence = active_validator.validate_chunks(retrieved_chunks, db=db)
        except Exception as exc:
            logger.warning(
                "Evidence validation encountered error: %s",
                str(exc)[:120],
                extra={
                    "event": "evidence_validation_failed",
                    "operation": "build_grounded_recommendation",
                    "error": str(exc)[:120],
                },
            )
            validated_evidence = []

    valid_chunks_only = [ev for ev in validated_evidence if ev.is_valid]

    # 5. Phase 4: Grounded LLM Explanation
    explanation_status = "available"
    explanation_obj: RecommendationExplanation | None = None

    try:
        active_llm = llm_service or LLMExplanationService()
        worker_dict = profile.model_dump()
        matched_occ_dict = base_response.matched_occupation.model_dump() if base_response.matched_occupation else None
        skills_dicts = [s.model_dump() for s in base_response.current_skills]
        gaps_dicts = [g.model_dump() for g in base_response.skill_gaps]
        pathways_dicts = [p.model_dump() for p in base_response.recommended_pathways]
        courses_dicts = [c.model_dump() for c in base_response.courses]
        centres_dicts = [cntr.model_dump() for cntr in base_response.nearby_centres]
        schemes_dicts = [s.model_dump() for s in base_response.schemes]
        elig_dicts = [e.model_dump() for e in base_response.eligibility]

        logger.info(
            "LLM explanation generation started",
            extra={
                "event": "llm_generation_started",
                "operation": "build_grounded_recommendation",
            },
        )

        explanation_obj = active_llm.generate_explanation(
            worker_profile=worker_dict,
            matched_occupation=matched_occ_dict,
            current_skills=skills_dicts,
            skill_gaps=gaps_dicts,
            recommended_pathways=pathways_dicts,
            courses=courses_dicts,
            nearby_centres=centres_dicts,
            schemes=schemes_dicts,
            eligibility=elig_dicts,
            validated_evidence=valid_chunks_only,
            language=profile.language or "English",
            career_goal_text=profile.career_goal_text,
            skill_bridge=base_response.skill_bridge.model_dump() if base_response.skill_bridge else None,
        )

        logger.info(
            "LLM explanation generation completed",
            extra={
                "event": "llm_generation_completed",
                "operation": "build_grounded_recommendation",
            },
        )

    except Exception as exc:
        logger.warning(
            "LLM explanation generation failed; applying deterministic fallback: %s",
            str(exc)[:120],
            extra={
                "event": "llm_fallback_used",
                "operation": "build_grounded_recommendation",
                "error": str(exc)[:120],
            },
        )
        explanation_status = "fallback"
        explanation_obj = LLMExplanationService._build_fallback_explanation(
            matched_occupation=base_response.matched_occupation.model_dump() if base_response.matched_occupation else None,
            skill_gaps=[g.model_dump() for g in base_response.skill_gaps],
            courses=[c.model_dump() for c in base_response.courses],
            nearby_centres=[cntr.model_dump() for cntr in base_response.nearby_centres],
            schemes=[s.model_dump() for s in base_response.schemes],
            eligibility=[e.model_dump() for e in base_response.eligibility],
            validated_evidence=valid_chunks_only,
        )

    # 6. Assemble Final Grounded Response
    base_response.explanation = explanation_obj
    base_response.validated_evidence = [ev.to_dict() for ev in validated_evidence]
    base_response.explanation_status = explanation_status
    base_response.evidence_status = evidence_status

    logger.info(
        "Recommendation process completed: explanation_status=%s evidence_status=%s",
        explanation_status,
        evidence_status,
        extra={
            "event": "recommendation_completed",
            "operation": "build_grounded_recommendation",
            "explanation_status": explanation_status,
            "evidence_status": evidence_status,
            "evidence_count": len(validated_evidence),
        },
    )

    return base_response


def _construct_evidence_queries(
    resp: RecommendationResponse,
) -> list[tuple[str, str | None, str | None]]:
    """Generates focused semantic queries from actual deterministic recommendations.

    Returns a list of (query_text, course_id, scheme_id) tuples.  The entity IDs
    are sourced directly from the deterministic recommendation engine — never
    inferred from text or supplied by the LLM — and are passed as SQL-level
    filters to the retriever (Phase 5.1 entity-scoped retrieval).

    course_id  → set when query targets course curriculum evidence
    scheme_id  → set when query targets scheme benefit/eligibility evidence
    Both None  → general retrieval (pathway skill queries)
    """
    queries: list[tuple[str, str | None, str | None]] = []

    # A. Recommended courses — scope retrieval to the exact course
    for c in resp.courses:
        queries.append((
            f"What does the course {c.title} cover in terms of syllabus and competencies?",
            c.id,    # course_id filter
            None,    # no scheme filter
        ))

    # B. Target skill pathways — no entity ID available in current corpus
    for p in resp.recommended_pathways:
        target_name = (
            p.target_skill.name_en
            if hasattr(p, "target_skill") and hasattr(p.target_skill, "name_en")
            else ""
        )
        if target_name:
            queries.append((
                f"What qualifications and standards apply to {target_name}?",
                None,  # no course_id — skill-general query
                None,  # no scheme_id
            ))

    # C. Eligible schemes — scope retrieval to the exact scheme
    for el in resp.eligibility:
        if el.verdict == "eligible":
            queries.append((
                f"What benefits and assistance are provided under {el.scheme_name}?",
                None,          # no course_id
                el.scheme_id,  # scheme_id filter
            ))

    # Deduplicate by query text while preserving order
    unique_queries: list[tuple[str, str | None, str | None]] = []
    seen: set[str] = set()
    for q_tuple in queries:
        q_text = q_tuple[0]
        if q_text not in seen:
            seen.add(q_text)
            unique_queries.append(q_tuple)

    # Bound total queries to top 4 to avoid excessive API calls
    return unique_queries[:4]
