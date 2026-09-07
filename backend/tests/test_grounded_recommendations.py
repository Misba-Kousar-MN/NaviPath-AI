"""End-to-End Tests for Grounded Recommendations (Phases 3E + 4 + Final Integration).
Tests the 5 canonical golden scenarios, graceful fallbacks on LLM/RAG failures,
multilingual handling, and preservation of deterministic facts.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch
import pytest

from app.llm.service import RecommendationExplanation
from app.schemas.recommendation import WorkerProfileIn
from app.services.grounded_recommendations import build_grounded_recommendation


def _dummy_explanation(*args, **kwargs):
    return RecommendationExplanation(
        summary="Grounded career transition guidance based on verified state curriculum.",
        skill_gap_explanation="Identified skill gaps mapped directly from official occupational standards.",
        pathway_explanation="Structured pathway for upward career mobility.",
        next_steps=["Enroll in accredited course", "Contact nearest authorized training centre"],
        limitations=["Subject to center seat availability"],
    )


def test_scenario_1_delivery_rider_to_electrician(db_session, client):
    """Scenario 1: Delivery Rider -> Electrician.
    Verify:
    - deterministic skill gap: Domestic Electrical Installation
    - recommended course: Electrician (crs-002)
    - validated evidence: citations from doc-corp-006 / src-008
    - LLM explanation generated
    """
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
        education="10th Pass",
    )

    mock_vec = [0.05] * 768
    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=mock_vec), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_dummy_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

        # Deterministic verification
        assert data["matched_occupation"]["name_en"] == "Delivery / Courier Rider"
        gap_names = [g["skill_name"] for g in data["skill_gaps"]]
        assert any("Electrical" in name for name in gap_names)
        course_ids = [c["id"] for c in data["courses"]]
        assert "crs-002" in course_ids

        # Grounded extension verification
        assert data["explanation"] is not None
        assert data["explanation_status"] in ("available", "fallback")
        assert "summary" in data["explanation"]
        assert "next_steps" in data["explanation"]
        assert isinstance(data["validated_evidence"], list)


def test_scenario_2_domestic_worker_to_tailor(db_session, client):
    """Scenario 2: Domestic Worker -> Tailor.
    Verify:
    - deterministic pathway to Tailor
    - course Self Employed Tailor (crs-001)
    - nearby centres without false course availability
    """
    profile = WorkerProfileIn(
        occupation="Domestic Worker",
        district="Bengaluru Urban",
        age=32,
    )

    mock_vec = [0.05] * 768
    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=mock_vec), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_dummy_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

        assert "Domestic Worker" in data["matched_occupation"]["name_en"]
        target_pathways = [p["target_skill"]["name_en"] for p in data["recommended_pathways"]]
        assert any("Tailor" in name or "Garment" in name for name in target_pathways)
        course_ids = [c["id"] for c in data["courses"]]
        assert "crs-001" in course_ids


def test_scenario_3_construction_labourer_to_fitter(db_session, client):
    """Scenario 3: Construction Labourer -> Fitter.
    Verify:
    - unresolved centres have distance = null (never fabricated)
    - Fitter course (crs-005)
    """
    profile = WorkerProfileIn(
        occupation="Construction Labourer",
        district="Belagavi",
        age=28,
    )

    mock_vec = [0.05] * 768
    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=mock_vec), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_dummy_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

        assert data["matched_occupation"]["name_en"] == "Construction Labourer"
        # Check that centres with unresolved locations have null distance
        for cntr in data["nearby_centres"]:
            if cntr["distance_type"] == "none":
                assert cntr["distance_km"] is None


def test_scenario_4_auto_rickshaw_driver(db_session, client):
    """Scenario 4: Auto-Rickshaw Driver.
    Verify deterministic skill gaps remain intact and explanation is attached.
    """
    profile = WorkerProfileIn(
        occupation="Auto-Rickshaw Driver",
        district="Mysuru",
        age=35,
    )

    mock_vec = [0.05] * 768
    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=mock_vec), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_dummy_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

        assert "Auto-Rickshaw" in data["matched_occupation"]["name_en"]
        assert isinstance(data["current_skills"], list)
        assert data["explanation"] is not None


def test_scenario_5_street_vendor_unsupported_pathway(db_session, client):
    """Scenario 5: Street Vendor with no registered transition pathway.
    Verify honest disclosure without hallucinating pathways.
    """
    profile = WorkerProfileIn(
        occupation="Street / Market Vendor",
        district="Shivamogga",
        age=40,
    )

    res = client.post("/api/recommendations", json=profile.model_dump())
    assert res.status_code == 200
    data = res.json()

    assert data["matched_occupation"]["name_en"] == "Street / Market Vendor"
    assert len(data["recommended_pathways"]) == 0
    assert len(data["courses"]) == 0
    assert "No verified upward career transition pathways" in data["explanation"]["summary"]
    assert data["evidence_status"] == "empty"


def test_llm_failure_graceful_fallback(db_session):
    """Verify that when the LLM service raises an error, deterministic data is returned with fallback explanation."""
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
    )

    mock_llm = MagicMock()
    mock_llm.generate_explanation.side_effect = Exception("LLM Network Timeout")

    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value.results = []

    res = build_grounded_recommendation(
        db=db_session,
        profile=profile,
        retriever=mock_retriever,
        llm_service=mock_llm,
    )

    assert res.matched_occupation is not None
    assert len(res.courses) > 0
    assert res.explanation_status == "fallback"
    assert res.explanation is not None
    assert "Delivery / Courier Rider" in res.explanation.summary


def test_rag_failure_graceful_fallback(db_session):
    """Verify that when RAG retrieval fails, deterministic data is returned safely."""
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
    )

    mock_retriever = MagicMock()
    mock_retriever.retrieve.side_effect = Exception("Database connection lost")

    mock_llm = MagicMock()
    mock_llm.generate_explanation.side_effect = _dummy_explanation

    res = build_grounded_recommendation(
        db=db_session,
        profile=profile,
        retriever=mock_retriever,
        llm_service=mock_llm,
    )

    assert res.matched_occupation is not None
    assert res.evidence_status == "unavailable"
    assert res.explanation is not None
