"""Unit tests for Phase 3E: Evidence Validator Service.
Tests source trust verification, chunk presence, provenance consistency,
relevance threshold enforcement, and zero database mutations.
"""
from __future__ import annotations

import pytest
from sqlalchemy import text

from app.rag.retriever import RetrievedChunk
from app.rag.validator import EvidenceValidator, ValidatedEvidence


def test_valid_official_chunk_validation(db_session):
    """Verify that an approved chunk with verified source passes validation cleanly."""
    validator = EvidenceValidator(min_similarity_threshold=0.70)

    chunk = RetrievedChunk(
        chunk_id="chk-002",
        document_id="doc-corp-001",
        source_id="src-001",
        authority="Ministry of Micro, Small and Medium Enterprises (MSME)",
        source_url="https://pmvishwakarma.gov.in/",
        section="1. Scheme Overview and Objectives",
        chunk_text="PM Vishwakarma is a Central Sector Scheme...",
        cosine_distance=0.18,
        similarity_score=0.91,
        entity_type="scheme",
        entity_id="sch-001",
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    val = results[0]
    assert val.is_valid is True
    assert val.validation_status == "valid"
    assert "Passed all trust" in val.validation_reasons[0]


def test_missing_or_unverified_source_rejected(db_session):
    """Verify chunks referencing non-existent sources are rejected."""
    validator = EvidenceValidator()

    chunk = RetrievedChunk(
        chunk_id="chk-002",
        document_id="doc-corp-001",
        source_id="src-9999-invalid",
        authority="Fake Authority",
        source_url="https://fake.gov.in/",
        section="Fake Section",
        chunk_text="Some text",
        cosine_distance=0.10,
        similarity_score=0.95,
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert results[0].validation_status == "rejected"
    assert any("not found in sources table" in r for r in results[0].validation_reasons)


def test_orphan_chunk_not_in_database_rejected(db_session):
    """Verify chunks that do not exist in document_chunks table are flagged as orphans and rejected."""
    validator = EvidenceValidator()

    chunk = RetrievedChunk(
        chunk_id="chk-9999-orphan",
        document_id="doc-corp-001",
        source_id="src-001",
        authority="Ministry of MSME",
        source_url="https://pmvishwakarma.gov.in/",
        section="Section",
        chunk_text="Valid text but fake chunk ID",
        cosine_distance=0.10,
        similarity_score=0.95,
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert any("Orphan chunk" in r for r in results[0].validation_reasons)


def test_empty_chunk_text_rejected(db_session):
    """Verify empty text chunk is rejected."""
    validator = EvidenceValidator()

    chunk = RetrievedChunk(
        chunk_id="chk-001",
        document_id="doc-corp-001",
        source_id="src-001",
        authority="MSME",
        source_url="https://pmvishwakarma.gov.in/",
        section="Section",
        chunk_text="",
        cosine_distance=0.10,
        similarity_score=0.95,
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert any("Empty chunk text" in r for r in results[0].validation_reasons)


def test_inconsistent_source_linkage_rejected(db_session):
    """Verify mismatch between chunk source_id and stored database source_id is rejected."""
    validator = EvidenceValidator()

    # chk-002 is stored with src-001 in DB. We feed it with src-002.
    chunk = RetrievedChunk(
        chunk_id="chk-002",
        document_id="doc-corp-001",
        source_id="src-002",
        authority="Ministry of Labour",
        source_url="https://eshram.gov.in/",
        section="Section",
        chunk_text="Some text",
        cosine_distance=0.10,
        similarity_score=0.95,
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert any("Inconsistent source linkage" in r for r in results[0].validation_reasons)


def test_low_relevance_rejected(db_session):
    """Verify chunk below similarity threshold is rejected with diagnostic reason."""
    validator = EvidenceValidator(min_similarity_threshold=0.85)

    chunk = RetrievedChunk(
        chunk_id="chk-002",
        document_id="doc-corp-001",
        source_id="src-001",
        authority="Ministry of MSME",
        source_url="https://pmvishwakarma.gov.in/",
        section="Section",
        chunk_text="Valid chunk text",
        cosine_distance=0.50,
        similarity_score=0.75,  # Below 0.85 threshold
    )

    results = validator.validate_chunks([chunk], db=db_session)
    assert len(results) == 1
    assert results[0].is_valid is False
    assert any("below threshold" in r for r in results[0].validation_reasons)


def test_validator_does_not_mutate_database(db_session):
    """Verify validator is strictly read-only and causes 0 mutations."""
    before_count = db_session.execute(text("SELECT count(*) FROM document_chunks")).scalar()
    validator = EvidenceValidator()

    chunk = RetrievedChunk(
        chunk_id="chk-002",
        document_id="doc-corp-001",
        source_id="src-001",
        authority="Ministry of MSME",
        source_url="https://pmvishwakarma.gov.in/",
        section="Section",
        chunk_text="Valid chunk text",
        cosine_distance=0.10,
        similarity_score=0.95,
    )
    validator.validate_chunks([chunk], db=db_session)

    after_count = db_session.execute(text("SELECT count(*) FROM document_chunks")).scalar()
    assert before_count == after_count == 55
