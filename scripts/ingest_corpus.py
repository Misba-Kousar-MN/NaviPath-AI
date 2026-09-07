#!/usr/bin/env python3
"""
Authoritative RAG Corpus Ingestion, Cleaning, Chunking, and Database Synchronization.

Follows project architecture:
- Reads rag/manifest.json
- Extracts documents via DocumentExtractor
- Cleans and normalizes text via TextCleaner
- Chunks text into ~400-600 token section-aware units via DocumentChunker
- Emits structured metadata catalog to rag/extracted/chunks.json
- Populates PostgreSQL document_chunks table and data/seed/document_chunks.csv
- Strictly keeps embedding = NULL and embedding_status = 'not-generated'
"""
from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.rag.cleaner import TextCleaner
from app.rag.chunker import DocumentChunker, ChunkPayload
from app.rag.extractor import DocumentExtractor
from app.rag.manifest import CorpusManifest

MANIFEST_PATH = BASE_DIR / "rag" / "manifest.json"
EXTRACTED_DIR = BASE_DIR / "rag" / "extracted"
CHUNKS_JSON_PATH = EXTRACTED_DIR / "chunks.json"
SEED_CHUNKS_CSV = BASE_DIR / "data" / "seed" / "document_chunks.csv"


def run_ingestion():
    print("=== Phase 3B: Authoritative RAG Corpus Ingestion ===")
    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

    if not MANIFEST_PATH.exists():
        print(f"[ERROR] Manifest not found at {MANIFEST_PATH}")
        sys.exit(1)

    manifest = CorpusManifest(MANIFEST_PATH)
    print(f"Loaded manifest with {len(manifest.entries)} document entries.")

    db = SessionLocal()
    # Fetch verified source IDs from DB
    valid_source_ids = {row[0] for row in db.execute(text("SELECT id FROM sources")).fetchall()}

    all_chunks: list[ChunkPayload] = []
    chunk_counter = 1

    # Track extraction stats
    stats = {
        "acquired": 0,
        "pending": 0,
        "extracted": 0,
        "requires_ocr": 0,
        "chunks_created": 0,
        "chunks_by_scheme": {},
        "chunks_by_course": {},
    }

    for doc_id, entry in manifest.entries.items():
        if entry.acquisition_status != "acquired" or not entry.local_file_path:
            stats["pending"] += 1
            print(f"[PENDING] {doc_id} ({entry.title}): Status={entry.acquisition_status}")
            continue

        stats["acquired"] += 1
        full_path = BASE_DIR / entry.local_file_path
        print(f"\nProcessing {doc_id}: {entry.title} ({full_path.name})")

        # 1. Extraction
        ext_result = DocumentExtractor.extract_file(full_path)
        if not ext_result.success:
            if ext_result.requires_ocr:
                stats["requires_ocr"] += 1
                print(f"  [REQUIRES_OCR] {doc_id} is image-only/scanned.")
            else:
                print(f"  [FAILED] Extraction error: {ext_result.warning}")
            continue

        stats["extracted"] += 1

        # 2. Cleaning / Normalization
        cleaned_text = TextCleaner.clean_text(ext_result.extracted_text)
        clean_file_path = EXTRACTED_DIR / f"{doc_id}_cleaned.txt"
        clean_file_path.write_text(cleaned_text, encoding="utf-8")
        print(f"  [OK] Extracted {len(ext_result.extracted_text)} chars -> Cleaned {len(cleaned_text)} chars")

        # 3. Chunking
        prefix = "chk"
        # Determine course_id, skill_id, scheme_id from entry
        scheme_id = entry.entity_id if entry.entity_type == "scheme" else None
        course_id = entry.entity_id if entry.entity_type == "course" else None
        
        # Skill ID mapping for known courses
        skill_id = None
        if course_id == "crs-001":
            skill_id = "skl-002"
        elif course_id == "crs-002":
            skill_id = "skl-003"
        elif course_id == "crs-004":
            skill_id = "skl-004"
        elif course_id == "crs-005":
            skill_id = "skl-007"
        elif course_id == "crs-008":
            skill_id = "skl-010"

        doc_chunks = DocumentChunker.chunk_document(
            text=cleaned_text,
            source_id=entry.source_id,
            base_chunk_id_prefix=prefix,
            title=entry.title,
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            scheme_id=scheme_id,
            course_id=course_id,
            skill_id=skill_id,
            issuing_authority=entry.issuing_authority,
            source_url=entry.source_url,
            retrieved_date=entry.retrieved_date or "2026-09-05",
            start_index=chunk_counter,
        )

        for c in doc_chunks:
            c.document_id = doc_id
            # Validate provenance
            valid, err = manifest.validate_chunk_provenance(c.to_dict(), valid_source_ids)
            if not valid:
                raise ValueError(f"Provenance validation failed for chunk {c.chunk_id}: {err}")

            if scheme_id:
                stats["chunks_by_scheme"][scheme_id] = stats["chunks_by_scheme"].get(scheme_id, 0) + 1
            if course_id:
                stats["chunks_by_course"][course_id] = stats["chunks_by_course"].get(course_id, 0) + 1

        all_chunks.extend(doc_chunks)
        chunk_counter += len(doc_chunks)
        print(f"  [OK] Generated {len(doc_chunks)} chunks (IDs {doc_chunks[0].chunk_id} to {doc_chunks[-1].chunk_id})")

    stats["chunks_created"] = len(all_chunks)

    # 4. Save structured catalog to rag/extracted/chunks.json
    chunks_data = [c.to_dict() for c in all_chunks]
    with open(CHUNKS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump({"total_chunks": len(chunks_data), "chunks": chunks_data}, f, indent=2, ensure_ascii=False)
    print(f"\nSaved structured chunk metadata catalog to {CHUNKS_JSON_PATH}")

    # 5. Synchronize data/seed/document_chunks.csv
    print(f"\nSynchronizing seed file {SEED_CHUNKS_CSV}...")
    fieldnames = [
        "id",
        "source_id",
        "chunk_text",
        "section",
        "retrieved_date",
        "promoted_to_evidence",
        "embedding_status",
    ]
    with open(SEED_CHUNKS_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for c in all_chunks:
            writer.writerow({
                "id": c.chunk_id,
                "source_id": c.source_id,
                "chunk_text": c.chunk_text,
                "section": c.section,
                "retrieved_date": c.retrieved_date,
                "promoted_to_evidence": "true" if c.promoted_to_evidence else "false",
                "embedding_status": c.embedding_status,
            })
    print(f"Seed CSV synchronized with {len(all_chunks)} rows.")

    # 6. Database Synchronization in committed transaction
    print("\nSynchronizing PostgreSQL table document_chunks...")
    from datetime import date as dt_date
    db.execute(text("DELETE FROM document_chunks"))
    for c in all_chunks:
        r_date = dt_date.fromisoformat(c.retrieved_date) if c.retrieved_date else None
        db.execute(
            text("""
                INSERT INTO document_chunks (
                    id, source_id, chunk_text, section, retrieved_date,
                    promoted_to_evidence, embedding_status, embedding, created_at, updated_at
                ) VALUES (
                    :id, :source_id, :chunk_text, :section, :retrieved_date,
                    :promoted_to_evidence, :embedding_status, NULL, NOW(), NOW()
                )
            """),
            {
                "id": c.chunk_id,
                "source_id": c.source_id,
                "chunk_text": c.chunk_text,
                "section": c.section,
                "retrieved_date": r_date,
                "promoted_to_evidence": c.promoted_to_evidence,
                "embedding_status": c.embedding_status,
            },
        )
    db.commit()
    print("Database committed successfully.")

    # Verification query
    count_db = db.execute(text("SELECT count(*) FROM document_chunks")).scalar()
    non_null_emb = db.execute(text("SELECT count(*) FROM document_chunks WHERE embedding IS NOT NULL")).scalar()
    print(f"Verified PostgreSQL document_chunks: Total={count_db}, Non-null embeddings={non_null_emb}")

    db.close()

    print("\n=== INGESTION SUMMARY ===")
    print(f"Authoritative documents acquired: {stats['acquired']}")
    print(f"Authoritative documents pending: {stats['pending']}")
    print(f"Successfully extracted: {stats['extracted']}")
    print(f"Requires OCR: {stats['requires_ocr']}")
    print(f"Total chunks created: {stats['chunks_created']}")
    print(f"Chunks by scheme: {stats['chunks_by_scheme']}")
    print(f"Chunks by course: {stats['chunks_by_course']}")

    return stats


if __name__ == "__main__":
    run_ingestion()
