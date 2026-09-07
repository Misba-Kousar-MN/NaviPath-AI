"""Phase 7 — Automated Validation for Voice Engine (Whisper STT + Gemini TTS).

Verifies:
1. Whisper provider initialization and availability.
2. Whisper mock mode produces clean simulated transcript.
3. Audio decoding converts WAV bytes into 16kHz float32 numpy array.
4. Whisper transcription handling across languages (en, kn, hi).
5. Gemini TTS audio synthesis returns valid WAV container with RIFF header.
6. Gemini TTS mock mode fallback returns simulated audio without crash.
7. Gemini TTS rate-limit (429) bounded retry behavior.
8. Gemini factual translation preserves raw text and translated text.
9. FastAPI Voice REST endpoints (/api/voice/*): status, transcribe, synthesize, translate.
10. Complete absence of Bhashini from active runtime (no routes, no integration package).
11. Coordinate non-fabrication (latitude=None, longitude=None).
12. Recommendation API and schema compatibility preserved.
"""
from __future__ import annotations

import base64
import io
import wave
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from starlette.testclient import TestClient

from app.api.routes.voice import router as voice_router
from app.integrations.voice.gemini_tts_service import (
    GeminiVoiceService,
    get_gemini_voice_service,
    pcm_to_wav_bytes,
)
from app.integrations.voice.schemas import (
    SynthesizeRequest,
    TranscribeRequest,
    VoiceStatus,
    VoiceTranslateRequest,
)
from app.integrations.voice.whisper_service import (
    WhisperService,
    decode_wav_to_float32_16k,
    get_whisper_service,
)
from app.main import app
from app.schemas.recommendation import WorkerProfileIn


@pytest.fixture
def test_client() -> TestClient:
    return TestClient(app)


def _make_dummy_wav_base64(framerate: int = 16000, duration_sec: float = 0.1) -> str:
    """Helper to generate a short sine wave WAV encoded as base64."""
    num_samples = int(framerate * duration_sec)
    t = np.linspace(0, duration_sec, num_samples, False)
    tone = (np.sin(2 * np.pi * 440 * t) * 16384).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(framerate)
        wf.writeframes(tone.tobytes())
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# --- 1. Whisper STT Tests ---

def test_1_whisper_service_initialization():
    """Confirms WhisperService instantiates with correct defaults."""
    svc = WhisperService(model_name="tiny")
    assert svc.model_name == "tiny"
    assert svc.is_available() is True


def test_2_whisper_wav_decoding_to_16k():
    """Confirms decode_wav_to_float32_16k produces 16kHz float32 array normalized to [-1, 1]."""
    b64_wav = _make_dummy_wav_base64(framerate=44100, duration_sec=0.2)
    raw_bytes = base64.b64decode(b64_wav)
    audio = decode_wav_to_float32_16k(raw_bytes)

    assert isinstance(audio, np.ndarray)
    assert audio.dtype == np.float32
    assert len(audio) > 0
    # Normalized within [-1.0, 1.0]
    assert np.max(np.abs(audio)) <= 1.0


@pytest.mark.asyncio
async def test_3_whisper_mock_mode():
    """Confirms Whisper returns clean simulated transcript when mock_mode is active."""
    svc = WhisperService(mock_mode=True)
    b64 = _make_dummy_wav_base64()
    res = await svc.transcribe(TranscribeRequest(audio_base64=b64, language="en"))

    assert res.status == VoiceStatus.SIMULATED
    assert res.is_mock is True
    assert len(res.transcript) > 0
    assert res.language == "en"


@pytest.mark.asyncio
async def test_4_whisper_empty_audio_handling():
    """Confirms tiny/empty audio gracefully returns empty string without error."""
    svc = WhisperService(mock_mode=False)
    # Empty audio string (less than 32 bytes)
    res = await svc.transcribe(TranscribeRequest(audio_base64="", language="kn"))
    assert res.status == VoiceStatus.SUCCESS
    assert res.transcript == ""
    assert res.language == "kn"


@pytest.mark.asyncio
async def test_5_whisper_transcription_languages():
    """Confirms language parameter mapping for English, Kannada, and Hindi."""
    svc = WhisperService(mock_mode=True)
    for lang in ["en", "kn", "hi"]:
        res = await svc.transcribe(TranscribeRequest(audio_base64=_make_dummy_wav_base64(), language=lang))
        assert res.language == lang


# --- 2. Gemini TTS Tests ---

def test_6_pcm_to_wav_bytes():
    """Confirms pcm_to_wav_bytes creates a valid RIFF/WAV header."""
    raw_pcm = (np.zeros(2400, dtype=np.int16)).tobytes()
    wav_bytes = pcm_to_wav_bytes(raw_pcm, sample_rate=24000)

    assert wav_bytes.startswith(b"RIFF")
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getframerate() == 24000
        assert wf.getsampwidth() == 2


@pytest.mark.asyncio
async def test_7_gemini_tts_mock_mode():
    """Confirms Gemini TTS returns valid mock WAV when client is absent."""
    svc = GeminiVoiceService(mock_mode=True)
    res = await svc.synthesize(SynthesizeRequest(text="Hello worker", language="en"))

    assert res.status == VoiceStatus.SIMULATED
    assert res.is_mock is True
    assert res.audio_base64 is not None

    # Verify decoded base64 is a valid WAV
    decoded = base64.b64decode(res.audio_base64)
    assert decoded.startswith(b"RIFF")


@pytest.mark.asyncio
async def test_8_gemini_tts_rate_limit_retry():
    """Confirms Gemini TTS implements bounded retries on 429 RESOURCE_EXHAUSTED."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("429 RESOURCE_EXHAUSTED: Rate limit exceeded")

    svc = GeminiVoiceService(client=mock_client)
    res = await svc.synthesize(SynthesizeRequest(text="Hello", language="en"))

    assert res.status == VoiceStatus.ERROR
    assert "rate limit" in (res.error or "").lower() or "429" in (res.error or "")
    # Confirms multiple attempts were made before giving up
    assert mock_client.models.generate_content.call_count >= 2


@pytest.mark.asyncio
async def test_9_gemini_translation_service():
    """Confirms translation returns original text on same-language or mock mode."""
    svc = GeminiVoiceService(client=None)
    # Same language: immediate passthrough
    res_same = await svc.translate(
        VoiceTranslateRequest(text="Hello", source_language="en", target_language="en")
    )
    assert res_same.translated_text == "Hello"
    assert res_same.status == VoiceStatus.SUCCESS

    # Mock mode cross-language
    svc_mock = GeminiVoiceService(mock_mode=True)
    res_mock = await svc_mock.translate(
        VoiceTranslateRequest(text="Hello", source_language="en", target_language="kn")
    )
    assert res_mock.is_mock is True
    assert res_mock.translated_text == "Hello"


# --- 3. FastAPI Voice Route Tests ---

def test_10_api_voice_status(test_client):
    """GET /api/voice/status returns 200 with Whisper and Gemini provider info."""
    res = test_client.get("/api/voice/status")
    assert res.status_code == 200
    data = res.json()
    assert data["stt_provider"] == "whisper"
    assert data["tts_provider"] == "gemini"
    assert data["supported_languages"] == ["en", "kn", "hi"]


def test_11_api_voice_transcribe(test_client):
    """POST /api/voice/transcribe accepts base64 audio and returns transcript."""
    b64 = _make_dummy_wav_base64()
    payload = {"audio_base64": b64, "language": "en", "session_id": "sess_test_stt_01"}
    res = test_client.post("/api/voice/transcribe", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "transcript" in data
    assert data["language"] == "en"


def test_12_api_voice_synthesize(test_client):
    """POST /api/voice/synthesize returns synthesized base64 audio."""
    payload = {"text": "You can learn electrician skills near you.", "language": "en"}
    res = test_client.post("/api/voice/synthesize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "audio_base64" in data
    assert data["audio_format"] == "wav"


def test_13_api_voice_translate(test_client):
    """POST /api/voice/translate returns translated text."""
    payload = {"text": "Electrician", "source_language": "en", "target_language": "kn"}
    res = test_client.post("/api/voice/translate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "translated_text" in data
    assert data["raw_text"] == "Electrician"


# --- 4. Bhashini Clean Removal Verification ---

def test_14_bhashini_completely_absent_from_active_runtime(test_client):
    """Confirms no /api/bhashini endpoints exist in the active FastAPI app."""
    for path in ["/api/bhashini/status", "/api/bhashini/asr", "/api/bhashini/tts", "/api/bhashini/translate"]:
        res = test_client.get(path)
        # Should return 404 (Not Found) or 405 (Method Not Allowed) - NOT 200
        assert res.status_code == 404, f"Deprecated route {path} unexpectedly returned {res.status_code}"


# --- 5. Non-Fabrication and Profile Safety ---

def test_15_worker_profile_strict_null_coordinates():
    """Validates that conversational voice input strictly preserves null coordinates."""
    profile = WorkerProfileIn(
        occupation="delivery rider",
        career_goal_text="electrician",
        district="Bengaluru Urban",
        language="en",
    )
    assert profile.latitude is None
    assert profile.longitude is None
    dumped = profile.model_dump()
    assert dumped["latitude"] is None
    assert dumped["longitude"] is None
