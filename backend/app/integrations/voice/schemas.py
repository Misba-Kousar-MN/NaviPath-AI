"""Voice request and response schemas for Whisper STT and Gemini TTS.

Strictly adheres to:
1. Whisper performs ONLY Speech -> Text.
2. Gemini TTS performs ONLY Text -> Speech.
3. No recommendation, skill matching, or career transition intelligence embedded in any voice schema.
4. Preserves worker-selected language and raw inputs without fabrication.
"""
from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class VoiceStatus(str, Enum):
    """Status for voice operations."""
    SUCCESS = "success"
    SIMULATED = "simulated"
    ERROR = "error"
    UNAVAILABLE = "unavailable"


class TranscribeRequest(BaseModel):
    """Input payload for Speech-to-Text (Whisper)."""
    audio_base64: str = Field(..., description="Base64-encoded audio data (WAV or PCM)")
    language: str = Field(default="en", description="Worker language code (e.g. 'en', 'kn', 'hi')")
    audio_format: str = Field(default="wav", description="Audio container format, default wav")
    session_id: str | None = Field(default=None, description="Worker session ID for tracing")


class TranscribeResponse(BaseModel):
    """Output payload from Speech-to-Text (Whisper)."""
    status: VoiceStatus
    transcript: str = Field(default="", description="Transcribed text from speech")
    language: str = Field(..., description="Language used or detected")
    detected_language: str | None = Field(default=None, description="Detected language code if available")
    is_mock: bool = Field(default=False, description="True if simulated in mock/dev mode")
    error: str | None = None


class SynthesizeRequest(BaseModel):
    """Input payload for Text-to-Speech (Gemini TTS)."""
    text: str = Field(..., min_length=1, description="Grounded response text to synthesize")
    language: str = Field(default="en", description="Worker language code (e.g. 'en', 'kn', 'hi')")
    voice_name: str | None = Field(default=None, description="Optional prebuilt voice name (e.g. 'Puck', 'Aoede')")
    session_id: str | None = Field(default=None, description="Worker session ID for tracing")


class SynthesizeResponse(BaseModel):
    """Output payload from Text-to-Speech (Gemini TTS)."""
    status: VoiceStatus
    audio_base64: str | None = Field(default=None, description="Base64-encoded synthesized WAV audio")
    audio_format: str = Field(default="wav", description="Audio format, standard wav")
    language: str = Field(..., description="Target language synthesized")
    is_mock: bool = Field(default=False, description="True if simulated in mock/dev mode")
    error: str | None = None


class VoiceTranslateRequest(BaseModel):
    """Input payload for text translation (Gemini)."""
    text: str = Field(..., min_length=1, description="Raw text to translate")
    source_language: str = Field(..., description="Source language code")
    target_language: str = Field(..., description="Target language code")
    session_id: str | None = Field(default=None, description="Worker session ID for tracing")


class VoiceTranslateResponse(BaseModel):
    """Output payload from text translation."""
    status: VoiceStatus
    raw_text: str = Field(..., description="Original unmodified text")
    translated_text: str = Field(default="", description="Translated text")
    source_language: str
    target_language: str
    is_mock: bool = Field(default=False)
    error: str | None = None


class VoiceServiceStatus(BaseModel):
    """Operational status of Whisper STT and Gemini TTS integration."""
    stt_provider: str = "whisper"
    stt_model: str = "tiny"
    tts_provider: str = "gemini"
    tts_model: str = "gemini-3.1-flash-tts-preview"
    whisper_available: bool
    gemini_tts_available: bool
    supported_languages: list[str] = ["en", "kn", "hi"]
