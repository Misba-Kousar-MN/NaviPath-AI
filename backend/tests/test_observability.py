"""Phase 5.2 — Observability, Structured Logging & Request Tracing Tests.
Verifies:
1. Request correlation ID generation and propagation.
2. WorkerProfileIn.session_id correlation.
3. Matching correlation IDs across request_started, RAG, LLM, fallback, and request_completed.
4. Strict safety: secrets/API keys/credentials and full worker profiles are never logged.
5. Structured JSON formatting validity.
6. API response contract and deterministic behavior immutability.
"""
from __future__ import annotations

import json
import logging
import os
from unittest.mock import MagicMock, patch

import pytest

from app.core.context import (
    generate_request_id,
    get_request_id,
    get_session_id,
    reset_request_context,
    set_request_context,
)
from app.core.logging_config import StructuredJsonFormatter
from app.llm.service import LLMExplanationService, RecommendationExplanation
from app.schemas.recommendation import WorkerProfileIn
from app.services.grounded_recommendations import build_grounded_recommendation


class LogCaptureHandler(logging.Handler):
    """In-memory logging handler capturing structured JSON formatted lines."""

    def __init__(self):
        super().__init__()
        self.setFormatter(StructuredJsonFormatter())
        self.records: list[logging.LogRecord] = []
        self.formatted_entries: list[str] = []
        self.parsed_entries: list[dict] = []

    def emit(self, record: logging.LogRecord):
        self.records.append(record)
        formatted = self.format(record)
        self.formatted_entries.append(formatted)
        try:
            self.parsed_entries.append(json.loads(formatted))
        except Exception:
            pass


@pytest.fixture
def captured_logs():
    """Fixture attaching LogCaptureHandler to root and app loggers."""
    handler = LogCaptureHandler()
    root_logger = logging.getLogger()
    old_handlers = list(root_logger.handlers)
    root_logger.addHandler(handler)
    try:
        yield handler
    finally:
        root_logger.removeHandler(handler)


def _mock_explanation(*args, **kwargs):
    return RecommendationExplanation(
        summary="Verified training guidance.",
        skill_gap_explanation="Identified gaps from standards.",
        pathway_explanation="Accredited pathway.",
        next_steps=["Contact training centre"],
        limitations=[],
    )


# TEST 1: Every API request receives a request correlation ID when session_id is absent.
def test_1_request_receives_correlation_id_when_session_absent(client):
    res = client.get("/api/occupations")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    req_id = res.headers["X-Request-ID"]
    assert req_id.startswith("req_")
    assert len(req_id) >= 8


# TEST 2: Existing WorkerProfileIn.session_id is used for correlation when supplied.
def test_2_worker_profile_session_id_used_for_correlation(db_session, client, captured_logs):
    session_id_val = "sess_audit_worker_99"
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=25,
        session_id=session_id_val,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200

    session_logs = [e for e in captured_logs.parsed_entries if e.get("session_id") == session_id_val]
    assert len(session_logs) > 0, "Expected at least one log entry to carry the session_id"


# TEST 3: request_started and request_completed contain the same correlation ID.
def test_3_request_started_and_completed_have_same_correlation_id(client, captured_logs):
    res = client.get("/api/courses")
    assert res.status_code == 200

    started = [e for e in captured_logs.parsed_entries if e.get("event") == "request_started" and e.get("path") == "/api/courses"]
    completed = [e for e in captured_logs.parsed_entries if e.get("event") == "request_completed" and e.get("path") == "/api/courses"]

    assert len(started) >= 1
    assert len(completed) >= 1
    assert started[-1]["request_id"] == completed[-1]["request_id"]
    assert started[-1]["request_id"] == res.headers["X-Request-ID"]


# TEST 4: RAG logs use the same correlation ID.
def test_4_rag_logs_use_same_correlation_id(db_session, client, captured_logs):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        req_id = res.headers["X-Request-ID"]

    rag_logs = [e for e in captured_logs.parsed_entries if e.get("event") in ("rag_retrieval_started", "rag_retrieval_completed")]
    assert len(rag_logs) >= 1
    for entry in rag_logs:
        assert entry.get("request_id") == req_id


# TEST 5: LLM logs use the same correlation ID.
def test_5_llm_logs_use_same_correlation_id(db_session, client, captured_logs):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        req_id = res.headers["X-Request-ID"]

    llm_logs = [e for e in captured_logs.parsed_entries if "llm" in e.get("event", "")]
    assert len(llm_logs) >= 1
    for entry in llm_logs:
        assert entry.get("request_id") == req_id


# TEST 6: RAG failure and fallback logs preserve correlation.
def test_6_rag_failure_and_fallback_preserve_correlation(db_session, client, captured_logs):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.retriever.RAGRetriever.retrieve", side_effect=RuntimeError("Simulated RAG error")), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        req_id = res.headers["X-Request-ID"]

    rag_failed_logs = [e for e in captured_logs.parsed_entries if e.get("event") == "rag_retrieval_failed"]
    assert len(rag_failed_logs) >= 1
    assert rag_failed_logs[0]["request_id"] == req_id
    assert "Simulated RAG error" in rag_failed_logs[0].get("error", "")


# TEST 7: LLM failure and fallback logs preserve correlation.
def test_7_llm_failure_and_fallback_preserve_correlation(db_session, client, captured_logs):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=RuntimeError("Simulated LLM error")):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        req_id = res.headers["X-Request-ID"]

    fallback_logs = [e for e in captured_logs.parsed_entries if e.get("event") == "llm_fallback_used"]
    assert len(fallback_logs) >= 1
    assert fallback_logs[0]["request_id"] == req_id


# TEST 8: Secrets/API keys never appear in captured logs.
def test_8_secrets_and_api_keys_never_appear_in_captured_logs(db_session, client, captured_logs):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200

    secret_patterns = ["api_key", "db_password", "bearer ", "sk-", "password"]
    for raw_line in captured_logs.formatted_entries:
        lower_line = raw_line.lower()
        for pat in secret_patterns:
            assert pat not in lower_line, f"Found forbidden secret pattern '{pat}' in log entry: {raw_line}"

    # Also confirm real SKILL environment variable value is not present
    real_skill = os.environ.get("SKILL")
    if real_skill and len(real_skill) >= 8:
        for raw_line in captured_logs.formatted_entries:
            assert real_skill not in raw_line, "Real secret value leaked into log output!"


# TEST 9: Full worker profile is not logged.
def test_9_full_worker_profile_not_logged(db_session, client, captured_logs):
    secret_marker = "EXTRA_SECRET_PROFILE_MARKER_XYZ"
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
        extra_attributes={"secret_marker": secret_marker},
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200

    for raw_line in captured_logs.formatted_entries:
        assert secret_marker not in raw_line, "Worker personal extra_attributes leaked into log entry!"


# TEST 10: Structured log output is valid JSON/structured data.
def test_10_structured_log_output_is_valid_json(client, captured_logs):
    res = client.get("/api/occupations")
    assert res.status_code == 200

    assert len(captured_logs.formatted_entries) > 0
    for line in captured_logs.formatted_entries:
        parsed = json.loads(line)
        assert "timestamp" in parsed
        assert "level" in parsed
        assert "logger" in parsed
        assert "message" in parsed


# TEST 11: Existing API response contract is unchanged.
def test_11_api_response_contract_unchanged(db_session, client):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

    # Verify standard top-level fields are intact and no internal logging fields polluted the body
    expected_fields = {
        "profile",
        "matched_occupation",
        "current_skills",
        "recommended_pathways",
        "skill_gaps",
        "courses",
        "nearby_centres",
        "schemes",
        "eligibility",
        "documents",
        "evidence_count",
        "warnings",
        "explanation",
        "validated_evidence",
        "explanation_status",
        "evidence_status",
        "skill_bridge",
    }
    actual_fields = set(data.keys())
    assert actual_fields == expected_fields, f"API contract mismatch. Difference: {actual_fields ^ expected_fields}"
    assert "request_id" not in data
    assert "duration_ms" not in data


# TEST 12: Existing deterministic behavior remains unchanged.
def test_12_existing_deterministic_behavior_unchanged(db_session, client):
    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=26,
        education="10th Pass",
    )

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768), \
         patch("app.llm.service.LLMExplanationService.generate_explanation", side_effect=_mock_explanation):
        res = client.post("/api/recommendations", json=profile.model_dump())
        assert res.status_code == 200
        data = res.json()

    # Deterministic checks
    assert data["matched_occupation"]["id"] == "occ-005"
    assert data["matched_occupation"]["name_en"] == "Delivery / Courier Rider"
    course_ids = [c["id"] for c in data["courses"]]
    assert "crs-002" in course_ids  # Electrician
    gap_names = [g["skill_name"] for g in data["skill_gaps"]]
    assert any("Electrical" in g for g in gap_names)
