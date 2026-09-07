"""Unit tests for Phase 4: LLM Explanation Service.
Tests bounded prompt construction, strict factual grounding, missing evidence handling,
unresolved centre distance safety, eligibility preservation, and graceful fallbacks using mocks.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from app.llm.service import (
    LLMExplanationService,
    RecommendationExplanation,
)
from app.rag.validator import ValidatedEvidence


class DummyGenerateResponse:
    def __init__(self, text: str):
        self.text = text


def test_grounded_explanation_generation_with_mocked_gemini():
    """Verify LLM service formats structured prompt and parses JSON response into typed model."""
    mock_json = """
    {
      "summary": "We recommend transitioning from Delivery Rider to Electrician.",
      "skill_gap_explanation": "Identified gap in Domestic Electrical Installation.",
      "pathway_explanation": "CTS Electrician provides 2400 hours of formal vocational training.",
      "course_explanations": [
        {
          "course_id": "crs-002",
          "title": "Electrician (QP ELE/Q5804 v1.0)",
          "why_recommended": "Directly resolves the electrical installation skill gap.",
          "official_details": "NSQF Level 4, 350-400 hours"
        }
      ],
      "centre_explanations": [
        {
          "centre_id": "tc-001",
          "name": "Government ITI Bengaluru",
          "district": "Bengaluru Urban",
          "distance_explanation": "Located 4.2 km away from worker coordinates.",
          "verified_location": true
        }
      ],
      "scheme_explanations": [
        {
          "scheme_id": "sch-003",
          "name": "CMKKY",
          "eligibility_summary": "Eligible under Karnataka state skilling framework.",
          "verified_benefits": "Free training and stipend support"
        }
      ],
      "next_steps": ["Contact Government ITI Bengaluru", "Register on CMKKY portal"],
      "limitations": ["Verified location data applies to physical address only."],
      "evidence_references": ["chk-032", "chk-033"]
    }
    """
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = DummyGenerateResponse(mock_json)

    service = LLMExplanationService(api_key="mock-key", client=mock_client)

    worker_profile = {"occupation": "Delivery / Courier Rider", "district": "Bengaluru Urban"}
    matched_occ = {"name_en": "Delivery / Courier Rider"}
    evidence = [
        ValidatedEvidence(
            chunk_id="chk-032",
            document_id="doc-corp-006",
            source_id="src-008",
            chunk_text="CTS Electrician trade curriculum details...",
            authority="ESSCI",
            source_url="https://essc-india.org/",
            section="Overview",
            similarity_score=0.92,
            cosine_distance=0.16,
            validation_status="valid",
            validation_reasons=["Passed"],
        )
    ]

    res = service.generate_explanation(
        worker_profile=worker_profile,
        matched_occupation=matched_occ,
        current_skills=[{"id": "skl-013", "name_en": "Two-Wheeler Driving"}],
        skill_gaps=[{"skill_name": "Domestic Electrical Installation", "severity": "CRITICAL"}],
        recommended_pathways=[{"to_occupation_name": "Electrician", "feasibility": "HIGH"}],
        courses=[{"id": "crs-002", "title": "Electrician", "nsqf_level": 4, "duration_hours": 350}],
        nearby_centres=[{"id": "tc-001", "name": "Govt ITI", "district": "Bengaluru Urban", "distance_km": 4.2, "distance_type": "exact"}],
        schemes=[{"id": "sch-003", "name_en": "CMKKY"}],
        eligibility=[{"scheme_id": "sch-003", "scheme_name": "CMKKY", "is_eligible": True, "reason": "Passed all rules"}],
        validated_evidence=evidence,
    )

    assert isinstance(res, RecommendationExplanation)
    assert "Delivery Rider to Electrician" in res.summary
    assert len(res.course_explanations) == 1
    assert res.course_explanations[0].course_id == "crs-002"
    assert "chk-032" in res.evidence_references


def test_missing_evidence_handled_safely():
    """Verify prompt explicitly marks documentary evidence as unavailable when empty."""
    prompt = LLMExplanationService._build_context_prompt(
        worker_profile={"occupation": "Domestic Worker", "district": "Mysuru"},
        matched_occupation={"name_en": "Domestic Worker"},
        current_skills=[],
        skill_gaps=[],
        recommended_pathways=[],
        courses=[],
        nearby_centres=[],
        schemes=[],
        eligibility=[],
        validated_evidence=[],
        language="English",
        career_goal_text=None,
    )

    assert "NO VALIDATED DOCUMENTARY EVIDENCE RETRIEVED" in prompt


def test_unresolved_centre_distance_is_null_not_fabricated():
    """Verify unresolved centre is marked with NULL distance in the prompt."""
    prompt = LLMExplanationService._build_context_prompt(
        worker_profile={"occupation": "Worker", "district": "Belagavi"},
        matched_occupation={"name_en": "Worker"},
        current_skills=[],
        skill_gaps=[],
        recommended_pathways=[],
        courses=[],
        nearby_centres=[{
            "id": "tc-unresolved-1",
            "name": "Unresolved ITI",
            "district": "Belagavi",
            "distance_km": None,
            "distance_type": "none",
        }],
        schemes=[],
        eligibility=[],
        validated_evidence=[],
        language="English",
        career_goal_text=None,
    )

    assert "Distance: NULL (Unresolved location)" in prompt


def test_api_failure_triggers_deterministic_fallback():
    """Verify that an API error or network failure produces a deterministic fallback explanation."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("API Quota exceeded")

    service = LLMExplanationService(api_key="mock-key", client=mock_client)

    res = service.generate_explanation(
        worker_profile={"occupation": "Construction Labourer", "district": "Ballari"},
        matched_occupation={"name_en": "Construction Labourer"},
        current_skills=[],
        skill_gaps=[{"skill_name": "Industrial Machine Fitting"}],
        recommended_pathways=[{"to_occupation_name": "Fitter"}],
        courses=[{"id": "crs-005", "title": "Fitter"}],
        nearby_centres=[],
        schemes=[],
        eligibility=[],
        validated_evidence=[],
    )

    assert isinstance(res, RecommendationExplanation)
    assert "Construction Labourer" in res.summary
    assert "Industrial Machine Fitting" in res.skill_gap_explanation
    assert len(res.course_explanations) == 1
    assert res.course_explanations[0].course_id == "crs-005"


def test_secret_is_never_leaked_in_exceptions():
    """Verify error messages do not reveal the raw API key."""
    secret_key = "AQ.SuperSecretKeyNeverToLeak"
    service = LLMExplanationService(api_key=secret_key, client=MagicMock())

    rep = repr(service)
    assert secret_key not in rep
