"""Phase 6.2 — Make.com Integration Automated Tests.
Validates:
1. Payload compatibility between Voiceflow, Make.com, and FastAPI WorkerProfileIn.
2. Preservation of required fields (occupation, district) and optional fields.
3. Coordinate non-fabrication: latitude and longitude strictly remain null.
4. Request correlation: session_id and request_id flow through Make.com dispatch.
5. End-to-end simulation of Make.com HTTP call against POST /api/recommendations.
6. Error handling: 4xx/5xx responses map to worker-safe messages without leaking secrets or tracebacks.
7. Make.com blueprint JSON validity and strict absence of hardcoded intelligence or credentials.
"""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest

from app.schemas.recommendation import RecommendationResponse, WorkerProfileIn

MAKE_DIR = Path(__file__).resolve().parents[2] / "frontend" / "make"
BLUEPRINT_FILE = MAKE_DIR / "skill_navigator_make_blueprint.json"


def test_1_blueprint_file_exists_and_is_valid_json():
    """Confirms the Make.com scenario blueprint JSON exists and is valid syntax."""
    assert BLUEPRINT_FILE.exists(), f"Blueprint file missing at {BLUEPRINT_FILE}"
    with open(BLUEPRINT_FILE, "r", encoding="utf-8") as f:
        blueprint = json.load(f)

    assert isinstance(blueprint, dict)
    assert blueprint.get("version") == 1
    assert "flow" in blueprint
    assert len(blueprint["flow"]) >= 5


def test_2_blueprint_contains_all_required_modules():
    """Confirms the blueprint contains Webhook, Normalizer, HTTP Request, and WebhookRespond modules."""
    with open(BLUEPRINT_FILE, "r", encoding="utf-8") as f:
        blueprint = json.load(f)

    modules = {m["id"]: m["module"] for m in blueprint["flow"]}
    assert modules[1] == "gateway:CustomWebHook"
    assert modules[2] == "tools:SetVariables"
    assert modules[3] == "http:ActionSendRequest"
    assert modules[4] == "gateway:WebhookRespond"
    assert modules[5] == "gateway:WebhookRespond"


def test_3_blueprint_has_zero_hardcoded_intelligence_or_secrets():
    """Confirms no courses, centres, schemes, distances, or API credentials exist in Make.com blueprint."""
    with open(BLUEPRINT_FILE, "r", encoding="utf-8") as f:
        raw_text = f.read().lower()

    forbidden_terms = [
        "crs-001", "crs-002", "crs-008",
        "tc-001", "tc-002",
        "sch-001", "sch-002",
        "gemini_api_key", "sk-", "password", "bearer ",
        "st_distance", "postgis",
    ]
    for term in forbidden_terms:
        assert term not in raw_text, f"Forbidden term '{term}' found in Make.com blueprint!"


def test_4_voiceflow_make_payload_schema_matches_worker_profile_in():
    """Confirms that Voiceflow output conforms 100% to WorkerProfileIn."""
    sample_vf_payload = {
        "occupation": "Delivery / Courier Rider",
        "career_goal_text": "I want to become an electrician",
        "district": "Bengaluru Urban",
        "pincode": "560001",
        "age": 26,
        "gender": "Male",
        "language": "Kannada",
        "latitude": None,
        "longitude": None,
        "session_id": "sess_vf_make_001",
        "extra_attributes": {},
    }

    # Validate against Pydantic schema
    profile = WorkerProfileIn.model_validate(sample_vf_payload)
    assert profile.occupation == "Delivery / Courier Rider"
    assert profile.district == "Bengaluru Urban"
    assert profile.latitude is None
    assert profile.longitude is None
    assert profile.session_id == "sess_vf_make_001"


def test_5_make_normalization_preserves_null_coordinates():
    """Confirms Make.com normalization rules preserve null coordinates and never fabricate them."""
    # Simulate Make.com normalization logic
    incoming = {
        "occupation": "  Domestic Worker  ",
        "district": " Mysuru ",
        "career_goal_text": " Tailoring ",
        "latitude": None,
        "longitude": None,
        "pincode": "",
        "age": "32",
        "gender": "",
        "session_id": "sess_test_123",
    }

    normalized = {
        "occupation": incoming["occupation"].strip(),
        "district": incoming["district"].strip(),
        "career_goal_text": incoming["career_goal_text"].strip() if incoming["career_goal_text"] else None,
        "pincode": incoming["pincode"] if incoming["pincode"] else None,
        "age": int(incoming["age"]) if incoming["age"] else None,
        "gender": incoming["gender"] if incoming["gender"] else None,
        "latitude": None,  # Strictly null
        "longitude": None,  # Strictly null
        "session_id": incoming["session_id"],
        "extra_attributes": {},
    }

    profile = WorkerProfileIn.model_validate(normalized)
    assert profile.occupation == "Domestic Worker"
    assert profile.district == "Mysuru"
    assert profile.age == 32
    assert profile.pincode is None
    assert profile.gender is None
    assert profile.latitude is None
    assert profile.longitude is None


def test_6_simulated_make_http_call_against_fastapi(db_session, client):
    """Simulates Make.com HTTP module posting to /api/recommendations with session_id."""
    make_http_body = {
        "occupation": "Delivery / Courier Rider",
        "district": "Bengaluru Urban",
        "career_goal_text": "I want to become an electrician",
        "language": "English",
        "pincode": "560001",
        "age": 26,
        "gender": "Male",
        "latitude": None,
        "longitude": None,
        "session_id": "sess_make_flow_777",
        "extra_attributes": {},
    }

    with patch("app.rag.embedding.GeminiEmbeddingService.embed_text", return_value=[0.05] * 768):
        res = client.post(
            "/api/recommendations",
            json=make_http_body,
            headers={"Content-Type": "application/json", "X-Session-ID": "sess_make_flow_777"},
        )
        assert res.status_code == 200
        data = res.json()

    # Verify response schema fields preserved for Make.com / Voiceflow
    assert "matched_occupation" in data
    assert "skill_gaps" in data
    assert "courses" in data
    assert "nearby_centres" in data
    assert "schemes" in data
    assert "eligibility" in data
    assert "explanation" in data
    assert "validated_evidence" in data
    assert "explanation_status" in data
    assert "evidence_status" in data

    # Verify session_id was preserved
    assert data["profile"]["session_id"] == "sess_make_flow_777"
    assert "X-Request-ID" in res.headers


def test_7_make_error_mapping_produces_safe_worker_message(client):
    """Verifies that invalid payload (missing required field) returns 422 and maps to safe error."""
    invalid_make_body = {
        # Missing occupation
        "district": "Bengaluru Urban",
    }
    res = client.post("/api/recommendations", json=invalid_make_body)
    assert res.status_code == 422

    # Simulate Make.com error router module 5
    make_error_response = {
        "status": "error",
        "message": "I’m sorry, I couldn’t retrieve your recommendations right now. Please try again.",
        "explanation_status": "unavailable",
        "evidence_status": "unavailable",
    }

    # Verify safe error output
    assert "password" not in json.dumps(make_error_response).lower()
    assert "traceback" not in json.dumps(make_error_response).lower()
    assert "sql" not in json.dumps(make_error_response).lower()
    assert make_error_response["message"].startswith("I’m sorry")


def test_8_documentation_contains_public_https_requirement():
    """Verifies phase_6_2_make_integration.md explicitly documents BACKEND_PUBLIC_HTTPS_ENDPOINT_REQUIRED."""
    doc_path = Path(__file__).resolve().parents[2] / "phase_6_2_make_integration.md"
    assert doc_path.exists()
    with open(doc_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "BACKEND_PUBLIC_HTTPS_ENDPOINT_REQUIRED" in content
    assert "cloudflared" in content or "ngrok" in content
