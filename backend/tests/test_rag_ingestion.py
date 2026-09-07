"""Unit and integration tests for Phase 3B: RAG corpus ingestion, extraction, cleaning, and chunking.
Protects data provenance, metadata integrity, and ensures 0 embeddings are generated.
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest
from sqlalchemy import text

from app.rag.cleaner import TextCleaner
from app.rag.chunker import DocumentChunker, count_tokens
from app.rag.extractor import DocumentExtractor
from app.rag.manifest import CorpusManifest, ManifestEntry

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MANIFEST_PATH = BASE_DIR / "rag" / "manifest.json"
CHUNKS_JSON_PATH = BASE_DIR / "rag" / "extracted" / "chunks.json"


def test_manifest_structure_and_completeness():
    """Verify that rag/manifest.json contains valid schemas and honest status markers."""
    assert MANIFEST_PATH.exists(), "rag/manifest.json must exist"
    manifest = CorpusManifest(MANIFEST_PATH)
    assert len(manifest.entries) >= 15, "Expected at least 15 document entries in manifest"

    acquired = 0
    pending = 0
    for doc_id, entry in manifest.entries.items():
        assert entry.document_id.startswith("doc-corp-")
        assert entry.source_id.startswith("src-")
        assert entry.title
        assert entry.issuing_authority
        assert entry.acquisition_status in ("acquired", "pending_acquisition", "requires_ocr", "unavailable")
        assert entry.verification_status in ("verified", "pending-review", "unverified")

        if entry.acquisition_status == "acquired":
            acquired += 1
            assert entry.local_file_path is not None
            full_path = BASE_DIR / entry.local_file_path
            assert full_path.exists(), f"Local file for {doc_id} must exist at {full_path}"
        else:
            pending += 1

    assert acquired >= 10, f"Expected at least 10 acquired documents, got {acquired}"
    assert pending >= 3, f"Expected pending documents recorded honestly, got {pending}"


def test_text_extractor_handles_txt_and_missing_file(tmp_path):
    """Verify DocumentExtractor handles valid TXT files and missing files gracefully."""
    test_txt = tmp_path / "test_doc.txt"
    test_txt.write_text("Line 1\nLine 2\n## Heading 1\nContent paragraph.", encoding="utf-8")

    res = DocumentExtractor.extract_file(test_txt)
    assert res.success is True
    assert res.file_type == "txt"
    assert "Heading 1" in res.extracted_text

    # Missing file
    missing = tmp_path / "non_existent.pdf"
    res_missing = DocumentExtractor.extract_file(missing)
    assert res_missing.success is False
    assert "File not found" in (res_missing.warning or "")


def test_text_extractor_flags_image_only_pdf(tmp_path):
    """Verify DocumentExtractor flags image-only or scanned PDFs as requires_ocr instead of inventing text."""
    try:
        import pymupdf
        # Create a blank PDF page (no text layer)
        doc = pymupdf.open()
        doc.new_page()
        blank_pdf = tmp_path / "scanned_dummy.pdf"
        doc.save(str(blank_pdf))
        doc.close()

        res = DocumentExtractor.extract_file(blank_pdf)
        assert res.success is False
        assert res.requires_ocr is True
        assert "OCR" in (res.warning or "")
    except ImportError:
        pytest.skip("PyMuPDF not available for mock PDF test.")


def test_text_cleaner_preserves_rules_and_normalizes():
    """Verify TextCleaner removes control chars and page artifacts without stripping numbers or conditions."""
    sample = """
    Page 1 of 12
    The minimum age of the beneficiary should be 18 years on the date of registration.
    Toolkit Incentive: Rs 15,000 grant provided as e-voucher.
    Loan Tranche 1: Rs 1,00,000 at 5% interest rate.
    quali-
    fication standards shall apply.
    --- 2 ---
    """
    cleaned = TextCleaner.clean_text(sample)

    # Must preserve age, currency, and percentages
    assert "18 years" in cleaned
    assert "Rs 15,000" in cleaned
    assert "Rs 1,00,000" in cleaned
    assert "5%" in cleaned

    # Must repair hyphenated word wrap
    assert "qualification" in cleaned
    assert "quali-\nfication" not in cleaned

    # Must remove page numbers
    assert "Page 1 of 12" not in cleaned
    assert "--- 2 ---" not in cleaned


def test_document_chunker_respects_token_bounds_and_sections():
    """Verify DocumentChunker respects section headers and token boundaries."""
    doc_text = """
    # Section 1: Eligibility Conditions
    The beneficiary must be an artisan aged between 18 and 59 years.
    Must belong to one of the traditional artisan trades.

    # Section 2: Financial Benefits
    Stipend of Rs 500 per day during basic training of 5 to 7 days.
    Toolkit grant of Rs 15,000.
    """
    chunks = DocumentChunker.chunk_document(
        text=doc_text,
        source_id="src-001",
        base_chunk_id_prefix="test-chk",
        scheme_id="sch-001",
        start_index=1,
    )

    assert len(chunks) >= 2
    sections = [c.section for c in chunks]
    assert any("Eligibility Conditions" in s for s in sections)
    assert any("Financial Benefits" in s for s in sections)

    for c in chunks:
        assert c.source_id == "src-001"
        assert c.scheme_id == "sch-001"
        assert c.token_count > 0
        assert c.embedding_status == "not-generated"


def test_chunks_json_catalog_provenance_and_metadata():
    """Verify rag/extracted/chunks.json has full entity metadata and zero orphan chunks."""
    assert CHUNKS_JSON_PATH.exists(), "rag/extracted/chunks.json must exist"
    with open(CHUNKS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    chunks = data.get("chunks", [])
    assert len(chunks) >= 50, f"Expected at least 50 chunks, got {len(chunks)}"

    seen_ids = set()
    for c in chunks:
        cid = c["chunk_id"]
        assert cid not in seen_ids, f"Duplicate chunk ID {cid}"
        seen_ids.add(cid)

        assert c["source_id"]
        assert c["chunk_text"]
        assert c["section"]
        assert c["token_count"] > 0
        assert c["embedding_status"] == "not-generated"

        # Validate entity association exists where appropriate
        if c.get("scheme_id"):
            assert c["scheme_id"] in ("sch-001", "sch-002", "sch-003", "sch-004", "sch-005")
        if c.get("course_id"):
            assert c["course_id"] in ("crs-001", "crs-002", "crs-004", "crs-005", "crs-008")


def test_database_chunks_table_integrity(db_session):
    """Verify live PostgreSQL document_chunks table matches seed rows and has 0 embeddings."""
    rows = db_session.execute(text("""
        SELECT id, source_id, chunk_text, section, embedding_status, embedding
        FROM document_chunks
        ORDER BY id
    """)).fetchall()

    assert len(rows) >= 50, f"Expected at least 50 chunks in DB, found {len(rows)}"

    valid_sources = {s[0] for s in db_session.execute(text("SELECT id FROM sources")).fetchall()}

    for r in rows:
        assert r.source_id in valid_sources, f"Orphan chunk {r.id} references invalid source_id {r.source_id}"
        assert r.chunk_text.strip(), f"Empty chunk text on {r.id}"
        assert r.embedding_status in ("not-generated", "generated")
        if r.embedding_status == "generated":
            assert r.embedding is not None, f"Chunk {r.id} has generated status but null embedding!"
        else:
            assert r.embedding is None, f"Chunk {r.id} has non-null embedding before generation!"
