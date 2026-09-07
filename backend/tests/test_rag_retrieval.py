"""Unit tests for Phase 3D: Semantic Retrieval Service and Endpoint.
Tests query vector generation, dimension checking, pgvector cosine distance ranking,
top-k limits, SQL safety, secret protection, and error handling with mocked embeddings.

Phase 5.1 additions: entity-scoped retrieval tests verifying SQL-level entity filters,
cross-entity non-leakage, blank ID rejection, and pipeline entity ID propagation.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest
from sqlalchemy import text

from app.rag.embedding import (
    EXPECTED_EMBEDDING_DIMENSION,
    InvalidDimensionError,
)
from app.rag.retriever import (
    DEFAULT_TOP_K,
    MAX_TOP_K,
    RAGRetriever,
    RetrievedChunk,
    RetrievalResponse,
)


def test_empty_and_whitespace_query_rejected(db_session):
    """Verify empty or blank queries raise ValueError immediately."""
    retriever = RAGRetriever(embedding_service=MagicMock())
    with pytest.raises(ValueError) as exc:
        retriever.retrieve("", db=db_session)
    assert "cannot be empty" in str(exc.value)

    with pytest.raises(ValueError) as exc2:
        retriever.retrieve("    ", db=db_session)
    assert "cannot be empty" in str(exc2.value)


def test_top_k_bounds_validation(db_session):
    """Verify top_k must be between 1 and MAX_TOP_K."""
    mock_service = MagicMock()
    mock_service.embed_text.return_value = [0.0] * EXPECTED_EMBEDDING_DIMENSION
    retriever = RAGRetriever(embedding_service=mock_service)

    with pytest.raises(ValueError) as exc_zero:
        retriever.retrieve("test", db=db_session, top_k=0)
    assert "positive integer" in str(exc_zero.value)

    with pytest.raises(ValueError) as exc_neg:
        retriever.retrieve("test", db=db_session, top_k=-5)
    assert "positive integer" in str(exc_neg.value)

    with pytest.raises(ValueError) as exc_max:
        retriever.retrieve("test", db=db_session, top_k=MAX_TOP_K + 1)
    assert f"cannot exceed maximum limit of {MAX_TOP_K}" in str(exc_max.value)


def test_invalid_query_vector_dimension_rejected(db_session):
    """Verify query vector with != 768 dimensions raises InvalidDimensionError before executing query."""
    mock_service = MagicMock()
    mock_service.embed_text.return_value = [0.1] * 512  # Incorrect 512 dimensions
    retriever = RAGRetriever(embedding_service=mock_service)

    with pytest.raises(InvalidDimensionError) as exc:
        retriever.retrieve("test query", db=db_session)
    assert "Query vector dimension mismatch" in str(exc.value)


def test_valid_query_returns_ordered_results_with_provenance(db_session):
    """Verify query executes pgvector cosine search and returns top-k chunks in ascending distance order."""
    # Fetch an actual vector from the database to act as mock query
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    assert row is not None, "Database must have embeddings from Phase 3C"

    # Convert pgvector string/array to float list
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    assert len(mock_vec) == 768

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve("PM Vishwakarma query", db=db_session, top_k=5)
    assert isinstance(resp, RetrievalResponse)
    assert resp.top_k == 5
    assert len(resp.results) == 5

    # Check ascending order of cosine distance
    distances = [r.cosine_distance for r in resp.results]
    assert distances == sorted(distances)

    # Check top result has distance close to 0.0 (since it matches an exact stored vector)
    assert distances[0] < 0.01
    assert resp.results[0].similarity_score > 0.99

    # Verify provenance fields are preserved
    top_chunk = resp.results[0]
    assert top_chunk.chunk_id.startswith("chk-")
    assert top_chunk.source_id.startswith("src-")
    assert top_chunk.authority
    assert top_chunk.source_url
    assert top_chunk.chunk_text


def test_optional_filtering_by_source_id(db_session):
    """Verify filtering by source_id returns only chunks matching that source."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE source_id = 'src-001' LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve("test", db=db_session, top_k=5, source_id="src-001")
    for r in resp.results:
        assert r.source_id == "src-001"


def test_api_endpoint_rag_retrieve(client):
    """Verify POST /api/rag/retrieve returns HTTP 200 with structured results."""
    # Test valid request (will use app's configured embedding service with mocked API call)
    from unittest.mock import patch
    mock_vec = [0.01] * EXPECTED_EMBEDDING_DIMENSION

    with patch("app.rag.retriever.GeminiEmbeddingService.embed_text", return_value=mock_vec):
        res = client.post(
            "/api/rag/retrieve",
            json={"query": "What is PM Vishwakarma?", "top_k": 3},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["query"] == "What is PM Vishwakarma?"
        assert data["top_k"] == 3
        assert len(data["results"]) == 3
        assert "chunk_id" in data["results"][0]
        assert "cosine_distance" in data["results"][0]
        assert "similarity_score" in data["results"][0]
        assert "authority" in data["results"][0]

        # Test validation errors
        res_empty = client.post("/api/rag/retrieve", json={"query": "", "top_k": 3})
        assert res_empty.status_code == 422  # pydantic min_length error

        res_invalid_k = client.post("/api/rag/retrieve", json={"query": "valid", "top_k": 50})
        assert res_invalid_k.status_code == 422  # pydantic le=20 error


# ═══════════════════════════════════════════════════════════════════════════
# Phase 5.1 — Entity-Scoped Retrieval Tests
# ═══════════════════════════════════════════════════════════════════════════


def test_course_filter_returns_only_matching_course_chunks(db_session):
    """Test 1: course_id filter restricts SQL candidate set to crs-002 chunks only."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve(
        "What does the Electrician course cover?",
        db=db_session,
        top_k=10,
        course_id="crs-002",
    )

    # Every returned chunk must belong to crs-002
    assert resp.total_matched > 0, "Expected crs-002 chunks in DB"
    for chunk in resp.results:
        assert chunk.course_id == "crs-002", (
            f"Chunk {chunk.chunk_id} has course_id={chunk.course_id!r}, expected 'crs-002'"
        )
    # crs-002 has exactly 4 chunks in corpus
    assert resp.total_matched <= 4


def test_cross_entity_course_leakage_prevented(db_session):
    """Test 2: Tailor (crs-001) chunks must not appear in Electrician (crs-002) filtered results."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve(
        "Electrician trade syllabus",
        db=db_session,
        top_k=10,
        course_id="crs-002",
    )

    crs_001_chunks = [c for c in resp.results if c.course_id == "crs-001"]
    assert len(crs_001_chunks) == 0, (
        f"Tailor (crs-001) chunks leaked into Electrician (crs-002) filtered result: "
        f"{[c.chunk_id for c in crs_001_chunks]}"
    )


def test_scheme_filter_isolates_scheme_evidence(db_session):
    """Test 3: scheme_id filter restricts results to sch-001 chunks only; sch-002 must not appear."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve(
        "What are the benefits of PM Vishwakarma?",
        db=db_session,
        top_k=15,
        scheme_id="sch-001",
    )

    assert resp.total_matched > 0, "Expected sch-001 chunks in DB"
    for chunk in resp.results:
        assert chunk.scheme_id == "sch-001", (
            f"Chunk {chunk.chunk_id} has scheme_id={chunk.scheme_id!r}, expected 'sch-001'"
        )
    sch_002_chunks = [c for c in resp.results if c.scheme_id == "sch-002"]
    assert len(sch_002_chunks) == 0, (
        f"e-Shram (sch-002) chunks leaked into PM Vishwakarma (sch-001) result: "
        f"{[c.chunk_id for c in sch_002_chunks]}"
    )


def test_unfiltered_retrieval_unchanged(db_session):
    """Test 4: retrieve() with no entity filter returns from full corpus (existing behaviour preserved)."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve("PM Vishwakarma scheme benefits", db=db_session, top_k=5)
    assert isinstance(resp, RetrievalResponse)
    assert len(resp.results) == 5
    for chunk in resp.results:
        assert chunk.chunk_id.startswith("chk-")
        assert chunk.source_id
        assert chunk.chunk_text


def test_source_id_and_entity_filter_combine(db_session):
    """Test 5: source_id filter and course_id entity filter can be applied simultaneously."""
    row = db_session.execute(
        text("SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    ).scalar()
    if isinstance(row, str):
        mock_vec = [float(x) for x in row.strip("[]").split(",")]
    else:
        mock_vec = [float(x) for x in row]

    mock_service = MagicMock()
    mock_service.embed_text.return_value = mock_vec
    retriever = RAGRetriever(embedding_service=mock_service)

    # crs-002 (Electrician) chunks belong to src-008
    resp = retriever.retrieve(
        "Electrician curriculum",
        db=db_session,
        top_k=10,
        course_id="crs-002",
        source_id="src-008",
    )

    for chunk in resp.results:
        assert chunk.course_id == "crs-002"
        assert chunk.source_id == "src-008"


def test_blank_entity_ids_rejected_safely(db_session):
    """Test 6: Blank/whitespace-only entity IDs raise ValueError before any embed call."""
    mock_service = MagicMock()
    retriever = RAGRetriever(embedding_service=mock_service)

    with pytest.raises(ValueError) as exc:
        retriever.retrieve("test", db=db_session, course_id="")
    assert "course_id" in str(exc.value)
    assert "non-empty" in str(exc.value)

    with pytest.raises(ValueError) as exc2:
        retriever.retrieve("test", db=db_session, scheme_id="   ")
    assert "scheme_id" in str(exc2.value)

    with pytest.raises(ValueError) as exc3:
        retriever.retrieve("test", db=db_session, skill_id="\t")
    assert "skill_id" in str(exc3.value)

    # Embedding must not have been called — short-circuits at validation step
    mock_service.embed_text.assert_not_called()


def test_unknown_entity_id_returns_empty_without_embed_call(db_session):
    """Test 6b: An entity ID with no catalog matches returns empty, no embedding call made."""
    mock_service = MagicMock()
    retriever = RAGRetriever(embedding_service=mock_service)

    resp = retriever.retrieve(
        "test query",
        db=db_session,
        course_id="crs-nonexistent-9999",
    )

    assert isinstance(resp, RetrievalResponse)
    assert resp.total_matched == 0
    assert resp.results == []
    # embed_text must NOT have been called (entity filter short-circuits first)
    mock_service.embed_text.assert_not_called()


def test_validator_still_rejects_invalid_evidence_after_entity_filter(db_session):
    """Test 7: EvidenceValidator gates remain fully active after entity-filtered retrieval."""
    from app.rag.validator import EvidenceValidator

    validator = EvidenceValidator(min_similarity_threshold=0.70)

    # chk-032 belongs to crs-002/src-008. Feed it with wrong source_id to trigger Gate E.
    bad_chunk = RetrievedChunk(
        chunk_id="chk-032",
        document_id="doc-corp-006",
        source_id="src-002",  # Wrong source — provenance mismatch
        authority="Wrong Authority",
        source_url="https://wrong.gov.in/",
        section="Section",
        chunk_text="CTS Electrician curriculum content",
        cosine_distance=0.12,
        similarity_score=0.94,
        entity_type="course",
        entity_id="crs-002",
        course_id="crs-002",
    )

    results = validator.validate_chunks([bad_chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert any("Inconsistent source linkage" in r for r in results[0].validation_reasons)


def test_entity_filter_metadata_loaded_from_catalog():
    """Test 8a: _get_eligible_chunk_ids correctly filters the in-memory cache (pure unit, no DB)."""
    mock_service = MagicMock()
    retriever = RAGRetriever(embedding_service=mock_service)

    # Verify the real chunks.json was loaded
    assert len(retriever._chunk_metadata_cache) == 55, (
        f"Expected 55 chunks in cache, found {len(retriever._chunk_metadata_cache)}"
    )

    # crs-002 → 4 chunk IDs
    crs_002_ids = retriever._get_eligible_chunk_ids(course_id="crs-002")
    assert crs_002_ids is not None
    assert len(crs_002_ids) == 4
    assert all(cid.startswith("chk-") for cid in crs_002_ids)

    # sch-001 → 12 chunk IDs
    sch_001_ids = retriever._get_eligible_chunk_ids(scheme_id="sch-001")
    assert sch_001_ids is not None
    assert len(sch_001_ids) == 12

    # No filter → None (full corpus eligible)
    assert retriever._get_eligible_chunk_ids() is None

    # Unknown entity → empty set
    unknown = retriever._get_eligible_chunk_ids(course_id="crs-nonexistent")
    assert unknown is not None
    assert len(unknown) == 0


def test_grounded_pipeline_passes_entity_ids_to_retriever(db_session):
    """Test 8b: grounded recommendation pipeline passes course_id/scheme_id kwargs to retrieve()."""
    from app.schemas.recommendation import WorkerProfileIn
    from app.services.grounded_recommendations import build_grounded_recommendation
    from app.llm.service import RecommendationExplanation

    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
    )

    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = MagicMock(results=[])

    mock_llm = MagicMock()
    mock_llm.generate_explanation.return_value = RecommendationExplanation(
        summary="Test",
        skill_gap_explanation="Test gap",
        pathway_explanation="Test pathway",
    )

    build_grounded_recommendation(
        db=db_session,
        profile=profile,
        retriever=mock_retriever,
        llm_service=mock_llm,
    )

    assert mock_retriever.retrieve.called, "Retriever must have been called"
    for call_args in mock_retriever.retrieve.call_args_list:
        kwargs = call_args.kwargs
        # Every retrieve() call must carry course_id and scheme_id kwargs
        assert "course_id" in kwargs, (
            f"retrieve() call missing course_id kwarg: {call_args}"
        )
        assert "scheme_id" in kwargs, (
            f"retrieve() call missing scheme_id kwarg: {call_args}"
        )
