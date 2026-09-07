"""Gemini Text-to-Speech & Voice Processing Service.

Converts grounded recommendation text into speech audio.
Features:
- Native integration with Gemini TTS (models/gemini-3.1-flash-tts-preview) via Google GenAI SDK.
- Automatic conversion of L16 PCM audio into standard 24kHz mono WAV with RIFF header for browser playback.
- Multilingual voice synthesis (English, Kannada, Hindi).
- Factual text translation via Gemini without generating unauthorized recommendations.
- Resilient rate-limit backoff and mock fallback.
"""
from __future__ import annotations

import asyncio
import base64
import io
import logging
import os
import wave
from typing import Any

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover
    genai = None
    types = None

from app.core.config import get_settings
from app.integrations.voice.schemas import (
    SynthesizeRequest,
    SynthesizeResponse,
    VoiceStatus,
    VoiceTranslateRequest,
    VoiceTranslateResponse,
)

logger = logging.getLogger(__name__)


def pcm_to_wav_bytes(
    pcm_data: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """Wraps raw PCM audio bytes in a standard RIFF/WAV header."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()


class GeminiVoiceService:
    """Gemini TTS and voice translation engine."""

    _instance: GeminiVoiceService | None = None

    def __init__(
        self,
        api_key: str | None = None,
        tts_model: str = "gemini-3.1-flash-tts-preview",
        translation_model: str = "gemini-3.6-flash",
        client: Any = None,
        mock_mode: bool = False,
    ) -> None:
        settings = get_settings()
        self.tts_model = tts_model
        self.translation_model = translation_model

        raw_key = api_key or os.getenv("SKILL") or settings.skill
        self._api_key = raw_key.strip() if raw_key else None

        if client is not None:
            self._client = client
        elif genai is not None and self._api_key:
            self._client = genai.Client(api_key=self._api_key)
        else:
            self._client = None

        self.mock_mode = (
            mock_mode
            or self._client is None
            or os.getenv("VOICE_MOCK_MODE", "").lower() in ("true", "1")
        )

    def is_available(self) -> bool:
        """Checks if Gemini API client is configured and ready."""
        return self._client is not None and not self.mock_mode

    async def synthesize(self, request: SynthesizeRequest) -> SynthesizeResponse:
        """Synthesizes text into WAV speech audio via Gemini TTS."""
        target_lang = request.language.lower().strip()

        if self.mock_mode or not self.is_available():
            logger.info("Gemini TTS operating in mock mode for session %s", request.session_id)
            # Create a 0.5-second silent WAV as mock audio
            mock_wav = pcm_to_wav_bytes(b"\x00" * 24000, sample_rate=24000)
            return SynthesizeResponse(
                status=VoiceStatus.SIMULATED,
                audio_base64=base64.b64encode(mock_wav).decode("utf-8"),
                audio_format="wav",
                language=target_lang,
                is_mock=True,
            )

        voice_name = request.voice_name or "Puck"
        max_retries = 2
        delay = 1.0

        for attempt in range(max_retries + 1):
            try:
                config = types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                        )
                    ),
                )

                # Run in thread pool to avoid blocking async event loop
                response = await asyncio.to_thread(
                    self._client.models.generate_content,
                    model=self.tts_model,
                    contents=request.text,
                    config=config,
                )

                if (
                    response.candidates
                    and response.candidates[0].content
                    and response.candidates[0].content.parts
                ):
                    part = response.candidates[0].content.parts[0]
                    if hasattr(part, "inline_data") and part.inline_data:
                        raw_pcm = part.inline_data.data
                        wav_bytes = pcm_to_wav_bytes(raw_pcm, sample_rate=24000)
                        return SynthesizeResponse(
                            status=VoiceStatus.SUCCESS,
                            audio_base64=base64.b64encode(wav_bytes).decode("utf-8"),
                            audio_format="wav",
                            language=target_lang,
                            is_mock=False,
                        )

                return SynthesizeResponse(
                    status=VoiceStatus.ERROR,
                    audio_base64=None,
                    language=target_lang,
                    error="Gemini TTS returned no audio data.",
                    is_mock=False,
                )
            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    logger.warning("Gemini TTS 429 rate limit hit on attempt %d: %s", attempt + 1, exc)
                    if attempt < max_retries:
                        await asyncio.sleep(delay)
                        delay *= 2
                        continue
                logger.error("Gemini TTS synthesis failed: %s", exc, exc_info=True)
                return SynthesizeResponse(
                    status=VoiceStatus.ERROR,
                    audio_base64=None,
                    language=target_lang,
                    error=f"Gemini TTS failed: {err_str}",
                    is_mock=False,
                )

        return SynthesizeResponse(
            status=VoiceStatus.ERROR,
            audio_base64=None,
            language=target_lang,
            error="Gemini TTS exhausted rate limit retries.",
            is_mock=False,
        )

    async def translate(self, request: VoiceTranslateRequest) -> VoiceTranslateResponse:
        """Translates grounded text into the target language using Gemini."""
        if request.source_language.lower() == request.target_language.lower():
            return VoiceTranslateResponse(
                status=VoiceStatus.SUCCESS,
                raw_text=request.text,
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                is_mock=False,
            )

        if self.mock_mode or not self.is_available():
            return VoiceTranslateResponse(
                status=VoiceStatus.SIMULATED,
                raw_text=request.text,
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                is_mock=True,
            )

        prompt = (
            f"Translate the following spoken assistant message from {request.source_language} to {request.target_language}.\n"
            f"Maintain strict fidelity to facts, courses, centres, distances, and schemes.\n"
            f"Do not add commentary or change meaning.\n\n"
            f"Text: {request.text}"
        )

        try:
            res = await asyncio.to_thread(
                self._client.models.generate_content,
                model=self.translation_model,
                contents=prompt,
            )
            translated = res.text.strip() if res.text else request.text
            return VoiceTranslateResponse(
                status=VoiceStatus.SUCCESS,
                raw_text=request.text,
                translated_text=translated,
                source_language=request.source_language,
                target_language=request.target_language,
                is_mock=False,
            )
        except Exception as exc:
            logger.warning("Gemini voice translation failed: %s. Returning raw text.", exc)
            return VoiceTranslateResponse(
                status=VoiceStatus.ERROR,
                raw_text=request.text,
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                error=str(exc),
                is_mock=False,
            )


def get_gemini_voice_service() -> GeminiVoiceService:
    """Singleton getter for Gemini Voice service."""
    if GeminiVoiceService._instance is None:
        GeminiVoiceService._instance = GeminiVoiceService()
    return GeminiVoiceService._instance
