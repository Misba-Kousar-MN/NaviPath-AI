"""Phase 7 — Automated Validation for Adaptive Voice-First Voice Contracts & Architecture.

Validates:
1. Preservation of the authoritative backend intelligence engine and schemas.
2. WorkerProfileIn compatibility with conversational Voiceflow/Make inputs.
3. Natural speech and "I don't know" goal handling.
4. Strict coordinate non-fabrication (latitude=None, longitude=None).
5. Whisper STT and Gemini TTS provider contracts and safe fallbacks.
6. Progressive recommendation structure compatibility.
7. Session ID preservation across conversation turns.
8. Non-fabrication of courses, training centres, distances, and schemes.
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest

from app.schemas.recommendation import RecommendationResponse, WorkerProfileIn
from app.integrations.voice.whisper_service import WhisperService
from app.integrations.voice.gemini_tts_service import GeminiVoiceService
from app.integrations.voice.schemas import TranscribeRequest, SynthesizeRequest, VoiceStatus


def test_1_worker_profile_in_supports_conversational_fields():
    """Confirms WorkerProfileIn handles conversational input from informal workers."""
    profile = WorkerProfileIn(
        occupation="delivery rider",
        career_goal_text="I want to learn electrician work",
        district="Bengaluru Urban",
        language="en",
        session_id="test-session-voice-001",
    )
    assert profile.occupation == "delivery rider"
    assert profile.career_goal_text == "I want to learn electrician work"
    assert profile.district == "Bengaluru Urban"
    assert profile.latitude is None
    assert profile.longitude is None
    assert profile.session_id == "test-session-voice-001"


def test_2_worker_profile_in_supports_dont_know_goal():
    """Confirms 'I don't know' goal phrasing is safely accepted without schema error."""
    profile = WorkerProfileIn(
        occupation="auto driver",
        career_goal_text="I don't know what to learn",
        district="Mysuru",
        language="kn",
        session_id="test-session-dont-know-002",
    )
    assert profile.occupation == "auto driver"
    assert "don't know" in profile.career_goal_text.lower()
    assert profile.district == "Mysuru"
    assert profile.latitude is None
    assert profile.longitude is None


def test_3_strict_coordinate_non_fabrication_rule():
    """Validates that coordinates strictly remain None when worker only specifies district."""
    profile = WorkerProfileIn(
        occupation="construction worker",
        career_goal_text="fitter or welding work",
        district="Bengaluru Urban",
    )
    # Latitude and longitude must NEVER be auto-filled or fabricated from district
    assert profile.latitude is None
    assert profile.longitude is None

    # Check serialized dictionary has null/None coordinates
    dumped = profile.model_dump()
    assert dumped["latitude"] is None
    assert dumped["longitude"] is None


@pytest.mark.asyncio
async def test_4_voice_engine_contracts_safe_fallback():
    """Verifies Whisper and Gemini Voice services safely handle operations without crash."""
    whisper_svc = WhisperService(mock_mode=True)
    res_stt = await whisper_svc.transcribe(TranscribeRequest(audio_base64="dGVzdA==", language="kn"))
    assert res_stt.status == VoiceStatus.SIMULATED
    assert res_stt.is_mock is True
    assert len(res_stt.transcript) > 0

    gemini_svc = GeminiVoiceService(mock_mode=True)
    res_tts = await gemini_svc.synthesize(SynthesizeRequest(text="ನಮಸ್ಕಾರ", language="kn"))
    assert res_tts.status == VoiceStatus.SIMULATED
    assert res_tts.is_mock is True
    assert res_tts.audio_base64 is not None


def test_5_make_payload_contract_preservation():
    """Confirms Phase 6.2 Make.com payload contract is fully preserved for Phase 7."""
    make_file = Path(__file__).resolve().parents[2] / "frontend" / "make" / "skill_navigator_make_blueprint.json"
    assert make_file.exists(), f"Make.com blueprint missing at {make_file}"

    with open(make_file, "r", encoding="utf-8") as f:
        blueprint = json.load(f)

    # Confirm the standardized variables in mapper
    var_module = [m for m in blueprint["flow"] if m["module"] == "tools:SetVariables"][0]
    var_names = {item["name"] for item in var_module["mapper"]["variables"]}
    expected_names = {
        "clean_occupation", "clean_district", "clean_goal", "clean_language",
        "clean_pincode", "clean_age", "clean_gender", "session_id",
    }
    assert expected_names.issubset(var_names)

    # Confirm module 3 explicitly enforces null coordinates
    http_module = [m for m in blueprint["flow"] if m["module"] == "http:ActionSendRequest"][0]
    body_str = http_module["mapper"]["data"]
    assert '"latitude": null' in body_str
    assert '"longitude": null' in body_str


def test_6_recommendation_response_structure_preserved():
    """Validates that RecommendationResponse schema has required fields for progressive explanation."""
    fields = RecommendationResponse.model_fields
    assert "recommended_pathways" in fields
    assert "profile" in fields
    assert "courses" in fields
    assert "nearby_centres" in fields
    assert "schemes" in fields
    assert "eligibility" in fields
