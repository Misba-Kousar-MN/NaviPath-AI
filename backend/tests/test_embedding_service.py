"""Unit tests for Phase 3C Gemini Embedding Service.
Validates SDK initialization, secret safeguarding, response validation, dimension checking,
bounded retries, and database idempotency using mocks (no real API calls during test suite).
"""
from __future__ import annotations

import os
from unittest.mock import MagicMock, patch
import pytest

from app.rag.embedding import (
    EXPECTED_EMBEDDING_DIMENSION,
    EmbeddingError,
    GeminiEmbeddingService,
    InvalidDimensionError,
    MissingApiKeyError,
)


class DummyEmbedding:
    def __init__(self, values: list[float]):
        self.values = values


class DummyResponse:
    def __init__(self, embeddings: list[DummyEmbedding]):
        self.embeddings = embeddings


def test_missing_api_key_raises_safe_error():
    """Verify service raises MissingApiKeyError if SKILL is unset, without leaking details."""
    with patch.dict(os.environ, {}, clear=True):
        with patch("app.rag.embedding.get_settings") as mock_settings:
            mock_settings.return_value.skill = None
            mock_settings.return_value.embedding_model = "gemini-embedding-001"
            with pytest.raises(MissingApiKeyError) as exc_info:
                GeminiEmbeddingService(api_key=None)

            msg = str(exc_info.value)
            assert "SKILL" in msg
            assert "not configured" in msg


def test_api_key_present_without_exposing_value():
    """Verify service initializes with key and never prints/leaks it in repr or str."""
    secret = "AQ.SuperSecretGeminiKey123456789"
    mock_client = MagicMock()
    service = GeminiEmbeddingService(api_key=secret, client=mock_client)
    rep = repr(service)
    st = str(service)
    assert secret not in rep
    assert secret not in st


def test_successful_embedding_response_768_dimensions():
    """Verify valid 768-dim embedding returns exact float vector."""
    mock_client = MagicMock()
    mock_vector = [0.01234] * EXPECTED_EMBEDDING_DIMENSION
    mock_client.models.embed_content.return_value = DummyResponse(
        [DummyEmbedding(mock_vector)]
    )

    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)
    res = service.embed_text("Sample valid chunk text")

    assert len(res) == 768
    assert res[0] == pytest.approx(0.01234)
    assert isinstance(res, list)


def test_incorrect_vector_dimension_rejected():
    """Verify vector with != 768 dimensions raises InvalidDimensionError and is not accepted."""
    mock_client = MagicMock()
    short_vector = [0.1] * 512  # Incorrect 512 dimensions
    mock_client.models.embed_content.return_value = DummyResponse(
        [DummyEmbedding(short_vector)]
    )

    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)
    with pytest.raises(InvalidDimensionError) as exc_info:
        service.embed_text("Sample chunk text")

    assert "Expected vector dimension 768, got 512" in str(exc_info.value)


def test_transient_failure_retries_and_succeeds():
    """Verify transient error triggers retry and returns result upon subsequent success."""
    mock_client = MagicMock()
    valid_vector = [0.5] * EXPECTED_EMBEDDING_DIMENSION

    # First attempt raises Exception, second attempt succeeds
    mock_client.models.embed_content.side_effect = [
        Exception("Temporary 503 Service Unavailable"),
        DummyResponse([DummyEmbedding(valid_vector)]),
    ]

    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)
    res = service.embed_text("Retry test", max_retries=2, base_backoff=0.01)

    assert len(res) == 768
    assert mock_client.models.embed_content.call_count == 2


def test_permanent_failure_handled_safely():
    """Verify permanent failure exhausts retries and raises safe EmbeddingError."""
    mock_client = MagicMock()
    mock_client.models.embed_content.side_effect = Exception("Persistent API quota failure")

    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)
    with pytest.raises(EmbeddingError) as exc_info:
        service.embed_text("Fail test", max_retries=2, base_backoff=0.01)

    assert "Failed to generate embeddings after 2 attempts" in str(exc_info.value)
    assert "Persistent API quota failure" in str(exc_info.value)


def test_empty_text_raises_value_error():
    """Verify attempting to embed empty text fails fast."""
    mock_client = MagicMock()
    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)

    with pytest.raises(ValueError):
        service.embed_text("")

    with pytest.raises(ValueError):
        service.embed_text("   ")


def test_batch_embedding_multiple_items():
    """Verify batch embedding preserves order and dimension for multiple chunks."""
    mock_client = MagicMock()
    vec1 = [0.1] * EXPECTED_EMBEDDING_DIMENSION
    vec2 = [0.2] * EXPECTED_EMBEDDING_DIMENSION
    mock_client.models.embed_content.return_value = DummyResponse(
        [DummyEmbedding(vec1), DummyEmbedding(vec2)]
    )

    service = GeminiEmbeddingService(api_key="mock-key", client=mock_client)
    results = service.embed_batch(["Chunk 1", "Chunk 2"])

    assert len(results) == 2
    assert len(results[0]) == 768
    assert len(results[1]) == 768
    assert results[0][0] == pytest.approx(0.1)
    assert results[1][0] == pytest.approx(0.2)
