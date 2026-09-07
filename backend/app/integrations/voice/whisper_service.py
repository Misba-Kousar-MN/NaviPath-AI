"""Whisper Speech-to-Text Integration Service.

Converts worker voice audio into text.
Features:
- Native in-memory WAV decoding (16kHz float32 mono) without external ffmpeg dependencies.
- Multilingual transcription supporting English (en), Kannada (kn), and Hindi (hi).
- Graceful mock/fallback mode for environments where audio hardware is unavailable.
- Zero intelligence: strictly returns transcribed text.
"""
from __future__ import annotations

import base64
import io
import logging
import os
import wave
from typing import Any

import numpy as np

try:
    import whisper
except ImportError:  # pragma: no cover
    whisper = None

try:
    import scipy.signal
except ImportError:  # pragma: no cover
    scipy = None

from app.integrations.voice.schemas import TranscribeRequest, TranscribeResponse, VoiceStatus

logger = logging.getLogger(__name__)

# Map UI language codes to Whisper language names
LANGUAGE_CODE_MAP: dict[str, str] = {
    "en": "en",
    "english": "en",
    "kn": "kn",
    "kannada": "kn",
    "hi": "hi",
    "hindi": "hi",
}


def decode_wav_to_float32_16k(audio_bytes: bytes) -> np.ndarray:
    """Decodes a WAV byte stream to a 16000Hz mono float32 numpy array for Whisper."""
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            raw_data = wf.readframes(n_frames)

        if sampwidth == 2:
            audio = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 4:
            audio = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 2147483648.0
        elif sampwidth == 1:
            audio = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
        else:
            raise ValueError(f"Unsupported sample width: {sampwidth}")

        if n_channels > 1:
            audio = audio.reshape(-1, n_channels).mean(axis=1)

        # Resample to 16000 Hz if necessary
        if framerate != 16000 and scipy is not None:
            num_samples = int(len(audio) * 16000 / framerate)
            audio = scipy.signal.resample(audio, num_samples).astype(np.float32)

        return audio
    except Exception as exc:
        logger.warning("Failed to decode WAV with standard wave library: %s. Trying raw int16.", exc)
        # Fallback for headerless raw PCM
        raw_audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        return raw_audio


class WhisperService:
    """In-process Whisper STT engine."""

    _instance: WhisperService | None = None
    _model: Any = None

    def __init__(self, model_name: str = "tiny", mock_mode: bool = False) -> None:
        self.model_name = model_name
        self.mock_mode = mock_mode or (os.getenv("VOICE_MOCK_MODE", "").lower() in ("true", "1"))

    def is_available(self) -> bool:
        """Checks if Whisper is installed and ready."""
        return whisper is not None

    def _get_model(self) -> Any:
        """Lazy-loads the Whisper model singleton."""
        if self._model is None:
            if whisper is None:
                raise RuntimeError("openai-whisper package is not installed.")
            logger.info("Loading Whisper model '%s' for CPU inference...", self.model_name)
            self._model = whisper.load_model(self.model_name)
        return self._model

    async def transcribe(self, request: TranscribeRequest) -> TranscribeResponse:
        """Transcribes audio data using Whisper."""
        clean_lang = LANGUAGE_CODE_MAP.get(request.language.lower().strip(), "en")

        if self.mock_mode or not self.is_available():
            logger.info("Whisper operating in mock mode for session %s", request.session_id)
            return TranscribeResponse(
                status=VoiceStatus.SIMULATED,
                transcript="I work as a delivery rider",
                language=clean_lang,
                is_mock=True,
            )

        try:
            audio_bytes = base64.b64decode(request.audio_base64)
            if len(audio_bytes) < 32:
                # Return empty transcript for negligible noise/silence
                return TranscribeResponse(
                    status=VoiceStatus.SUCCESS,
                    transcript="",
                    language=clean_lang,
                    is_mock=False,
                )

            audio_data = decode_wav_to_float32_16k(audio_bytes)
            model = self._get_model()

            result = model.transcribe(
                audio_data,
                language=clean_lang,
                fp16=False,
                temperature=0.0,
            )

            transcript = result.get("text", "").strip()
            detected_lang = result.get("language", clean_lang)

            return TranscribeResponse(
                status=VoiceStatus.SUCCESS,
                transcript=transcript,
                language=clean_lang,
                detected_language=detected_lang,
                is_mock=False,
            )
        except Exception as exc:
            logger.error("Whisper transcription error: %s", exc, exc_info=True)
            return TranscribeResponse(
                status=VoiceStatus.ERROR,
                transcript="",
                language=clean_lang,
                error=f"Transcription failed: {str(exc)}",
                is_mock=False,
            )


def get_whisper_service() -> WhisperService:
    """Singleton getter for Whisper service."""
    if WhisperService._instance is None:
        WhisperService._instance = WhisperService()
    return WhisperService._instance
