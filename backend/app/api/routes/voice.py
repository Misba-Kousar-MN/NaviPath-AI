"""FastAPI routes for Whisper STT and Gemini TTS voice services.

Endpoints:
  - GET  /api/voice/status     — operational status & supported models
  - POST /api/voice/transcribe — speech-to-text (Whisper)
  - POST /api/voice/synthesize — text-to-speech (Gemini TTS)
  - POST /api/voice/translate  — text translation (Gemini)

ARCHITECTURE RULE:
None of these endpoints determine career transitions, skill gaps, course recommendations,
centre distances, or scheme eligibility. All recommendation intelligence remains strictly
in /api/recommendations.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.integrations.voice.gemini_tts_service import get_gemini_voice_service
from app.integrations.voice.schemas import (
    SynthesizeRequest,
    SynthesizeResponse,
    TranscribeRequest,
    TranscribeResponse,
    VoiceServiceStatus,
    VoiceStatus,
    VoiceTranslateRequest,
    VoiceTranslateResponse,
)
from app.integrations.voice.whisper_service import get_whisper_service

router = APIRouter(prefix="/api/voice", tags=["Voice Engine"])


@router.get("/status", response_model=VoiceServiceStatus)
def get_voice_status() -> VoiceServiceStatus:
    """Returns current operational status of Whisper and Gemini voice engines."""
    whisper_svc = get_whisper_service()
    gemini_svc = get_gemini_voice_service()

    return VoiceServiceStatus(
        stt_provider="whisper",
        stt_model=whisper_svc.model_name,
        tts_provider="gemini",
        tts_model=gemini_svc.tts_model,
        whisper_available=whisper_svc.is_available(),
        gemini_tts_available=gemini_svc.is_available(),
        supported_languages=["en", "kn", "hi"],
    )


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest) -> TranscribeResponse:
    """Converts worker voice audio into text using Whisper."""
    whisper_svc = get_whisper_service()
    response = await whisper_svc.transcribe(request)
    if response.status == VoiceStatus.ERROR:
        # Graceful handling without breaking flow
        return response
    return response


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(request: SynthesizeRequest) -> SynthesizeResponse:
    """Synthesizes text into speech audio using Gemini TTS."""
    gemini_svc = get_gemini_voice_service()
    response = await gemini_svc.synthesize(request)
    return response


@router.post("/translate", response_model=VoiceTranslateResponse)
async def translate_text(request: VoiceTranslateRequest) -> VoiceTranslateResponse:
    """Translates text between supported languages using Gemini."""
    gemini_svc = get_gemini_voice_service()
    return await gemini_svc.translate(request)
