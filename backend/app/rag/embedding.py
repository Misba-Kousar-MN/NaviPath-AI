"""Gemini Embedding Service for RAG corpus.
Generates exactly 768-dimensional dense vector embeddings using Google GenAI SDK.
Strictly safeguards secrets and validates vector dimensions prior to persistence.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Sequence

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover
    genai = None
    types = None

from app.core.config import get_settings

logger = logging.getLogger(__name__)

EXPECTED_EMBEDDING_DIMENSION = 768


class EmbeddingError(Exception):
    """Base exception for embedding generation failures."""
    pass


class InvalidDimensionError(EmbeddingError):
    """Raised when the returned vector dimension is not exactly 768."""
    pass


class MissingApiKeyError(EmbeddingError):
    """Raised when the SKILL API key is missing or empty."""
    pass


class GeminiEmbeddingService:
    """Isolated, type-safe service for generating Gemini embeddings."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        output_dimensionality: int = EXPECTED_EMBEDDING_DIMENSION,
        client: genai.Client | None = None,
    ) -> None:
        self.output_dimensionality = output_dimensionality
        settings = get_settings()
        self.model = model or settings.embedding_model or "gemini-embedding-001"

        # Resolve API key from argument, environment, or settings
        # Canonical variable is SKILL
        raw_key = (
            api_key
            or os.getenv("SKILL")
            or settings.skill
        )

        if not raw_key or not raw_key.strip():
            raise MissingApiKeyError(
                "Gemini API key is not configured. Set the 'SKILL' environment variable in .env."
            )

        self._api_key = raw_key.strip()

        if client is not None:
            self._client = client
        else:
            if genai is None:  # pragma: no cover
                raise EmbeddingError("google-genai package is not installed.")
            self._client = genai.Client(api_key=self._api_key)

    def embed_text(
        self,
        text: str,
        max_retries: int = 3,
        base_backoff: float = 1.0,
    ) -> list[float]:
        """Embed a single text string and return a validated 768-dim float vector."""
        if not text or not text.strip():
            raise ValueError("Cannot embed empty or blank text.")

        results = self.embed_batch(
            [text],
            max_retries=max_retries,
            base_backoff=base_backoff,
        )
        return results[0]

    def embed_batch(
        self,
        texts: Sequence[str],
        max_retries: int = 3,
        base_backoff: float = 1.0,
    ) -> list[list[float]]:
        """Embed a sequence of texts with bounded retries and exponential backoff."""
        if not texts:
            return []

        cleaned_texts = [t.strip() for t in texts]
        for i, t in enumerate(cleaned_texts):
            if not t:
                raise ValueError(f"Text at index {i} is empty.")

        config = types.EmbedContentConfig(
            output_dimensionality=self.output_dimensionality
        ) if types else None

        last_err: Exception | None = None
        for attempt in range(1, max_retries + 1):
            try:
                # In google-genai, embed_content supports a single text or list of contents
                response = self._client.models.embed_content(
                    model=self.model,
                    contents=cleaned_texts if len(cleaned_texts) > 1 else cleaned_texts[0],
                    config=config,
                )

                embeddings_list = getattr(response, "embeddings", None)
                if not embeddings_list:
                    raise EmbeddingError("Gemini API returned an empty embedding response.")

                vectors: list[list[float]] = []
                for idx, emb in enumerate(embeddings_list):
                    vals = getattr(emb, "values", None)
                    if vals is None:
                        raise EmbeddingError(f"Embedding at index {idx} has no values.")

                    dim = len(vals)
                    if dim != self.output_dimensionality:
                        raise InvalidDimensionError(
                            f"Expected vector dimension {self.output_dimensionality}, got {dim}."
                        )
                    vectors.append([float(v) for v in vals])

                if len(vectors) != len(cleaned_texts):
                    raise EmbeddingError(
                        f"Expected {len(cleaned_texts)} embeddings, but received {len(vectors)}."
                    )

                return vectors

            except InvalidDimensionError:
                # Do not retry on dimension mismatches - fail immediately
                raise
            except Exception as exc:
                last_err = exc
                # Safe error logging: never expose secret key or authorization details
                err_msg = str(exc)
                if attempt < max_retries:
                    sleep_time = base_backoff * (2 ** (attempt - 1))
                    logger.warning(
                        "Transient embedding API failure on attempt %d/%d. Retrying in %.1fs... (%s)",
                        attempt,
                        max_retries,
                        sleep_time,
                        err_msg[:120],
                    )
                    time.sleep(sleep_time)
                else:
                    logger.error(
                        "Permanent embedding API failure after %d attempts: %s",
                        max_retries,
                        err_msg[:120],
                    )

        raise EmbeddingError(
            f"Failed to generate embeddings after {max_retries} attempts: {str(last_err)[:120]}"
        ) from last_err
