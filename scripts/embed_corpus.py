#!/usr/bin/env python3
"""
Corpus Batch Embedding Generation Script.

Generates 768-dimensional Gemini embeddings for approved RAG chunks in PostgreSQL document_chunks.
- Idempotent: selects only chunks where embedding IS NULL or embedding_status != 'generated'
- Validates vector length is strictly 768 dimensions
- Preserves all chunk IDs, document associations, metadata, and provenance
- Safe logging: never exposes the SKILL secret key or auth tokens
- Supports --dry-run
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.rag.embedding import (
    EXPECTED_EMBEDDING_DIMENSION,
    GeminiEmbeddingService,
    InvalidDimensionError,
    MissingApiKeyError,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("embed_corpus")


def run_embed_corpus(
    dry_run: bool = False,
    batch_size: int = 10,
    limit: int | None = None,
) -> dict:
    logger.info("=== Phase 3C: RAG Corpus Embedding Generation ===")
    logger.info("Mode: %s", "DRY-RUN (Validation Only)" if dry_run else "LIVE GENERATION")
    logger.info("Target Vector Dimension: %d", EXPECTED_EMBEDDING_DIMENSION)

    db = SessionLocal()
    try:
        # 1. Inspect table state
        total_chunks = db.execute(text("SELECT count(*) FROM document_chunks")).scalar() or 0
        existing_embeddings = db.execute(
            text("SELECT count(*) FROM document_chunks WHERE embedding IS NOT NULL")
        ).scalar() or 0
        logger.info("Total chunks in document_chunks: %d", total_chunks)
        logger.info("Existing non-null embeddings: %d", existing_embeddings)

        # 2. Select pending chunks
        query_str = """
            SELECT id, source_id, section, chunk_text, embedding_status
            FROM document_chunks
            WHERE embedding IS NULL OR embedding_status != 'generated'
            ORDER BY id
        """
        if limit:
            query_str += f" LIMIT {int(limit)}"

        pending_rows = db.execute(text(query_str)).fetchall()
        pending_count = len(pending_rows)
        logger.info("Pending chunks to process: %d", pending_count)

        if pending_count == 0:
            logger.info("All %d chunks already possess valid embeddings. Nothing to do.", total_chunks)
            return {
                "total_chunks": total_chunks,
                "already_embedded": existing_embeddings,
                "processed": 0,
                "failed": 0,
                "skipped": total_chunks,
            }

        if dry_run:
            logger.info("[DRY-RUN] Verified %d chunks are ready for embedding generation.", pending_count)
            for r in pending_rows[:5]:
                logger.info("  [SAMPLE PENDING] ID=%s, section='%s', length=%d chars", r.id, r.section, len(r.chunk_text))
            if pending_count > 5:
                logger.info("  ... and %d more chunks.", pending_count - 5)
            logger.info("[DRY-RUN] Complete. No API calls made, 0 rows written.")
            return {
                "total_chunks": total_chunks,
                "already_embedded": existing_embeddings,
                "pending": pending_count,
                "processed": 0,
                "failed": 0,
                "skipped": existing_embeddings,
            }

        # 3. Initialize Embedding Service
        try:
            embedding_service = GeminiEmbeddingService()
        except MissingApiKeyError as e:
            logger.error("Configuration Error: %s", str(e))
            sys.exit(1)

        # 4. Process in batches
        batches = [
            pending_rows[i : i + batch_size]
            for i in range(0, pending_count, batch_size)
        ]
        logger.info("Processing %d chunks across %d batches...", pending_count, len(batches))

        stats = {
            "total_chunks": total_chunks,
            "processed": 0,
            "failed": 0,
            "batches_processed": 0,
        }

        for b_idx, batch in enumerate(batches, start=1):
            chunk_ids = [r.id for r in batch]
            texts = [r.chunk_text for r in batch]

            logger.info(
                "Batch %d/%d: Generating embeddings for %d chunks (%s to %s)...",
                b_idx,
                len(batches),
                len(batch),
                chunk_ids[0],
                chunk_ids[-1],
            )

            try:
                vectors = embedding_service.embed_batch(texts)
            except Exception as exc:
                logger.error(
                    "Batch %d failed to generate embeddings: %s. Preserving prior commits.",
                    b_idx,
                    str(exc)[:120],
                )
                stats["failed"] += len(batch)
                # Continue with next batch or abort safely
                continue

            # Update database in atomic transaction for this batch
            try:
                for chunk_id, vector in zip(chunk_ids, vectors):
                    if len(vector) != EXPECTED_EMBEDDING_DIMENSION:
                        raise InvalidDimensionError(
                            f"Vector for {chunk_id} has invalid dimension {len(vector)}"
                        )

                    # Format vector as string literal '[v1, v2, ...]' for pgvector
                    vector_str = "[" + ",".join(f"{v:.8f}" for v in vector) + "]"
                    db.execute(
                        text("""
                            UPDATE document_chunks
                            SET embedding = :emb,
                                embedding_status = 'generated',
                                updated_at = NOW()
                            WHERE id = :id
                        """),
                        {"emb": vector_str, "id": chunk_id},
                    )

                db.commit()
                stats["processed"] += len(batch)
                stats["batches_processed"] += 1
                logger.info(
                    "Batch %d/%d: Successfully committed %d chunks with %d-dim vectors.",
                    b_idx,
                    len(batches),
                    len(batch),
                    EXPECTED_EMBEDDING_DIMENSION,
                )

            except Exception as exc:
                db.rollback()
                logger.error(
                    "Database transaction error on batch %d: %s. Rolled back batch.",
                    b_idx,
                    str(exc)[:120],
                )
                stats["failed"] += len(batch)

        # 5. Final verification
        final_total = db.execute(text("SELECT count(*) FROM document_chunks")).scalar()
        final_with_emb = db.execute(
            text("SELECT count(*) FROM document_chunks WHERE embedding IS NOT NULL")
        ).scalar()
        status_dist = db.execute(
            text("SELECT embedding_status, count(*) FROM document_chunks GROUP BY embedding_status")
        ).fetchall()

        logger.info("\n=== EMBEDDING RUN COMPLETE ===")
        logger.info("Total rows in document_chunks: %d (Baseline: 55)", final_total)
        logger.info("Total non-null embeddings: %d", final_with_emb)
        logger.info("Embedding status distribution: %s", status_dist)
        logger.info("Chunks successfully processed in this run: %d", stats["processed"])
        logger.info("Chunks failed in this run: %d", stats["failed"])

        return stats

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Generate Gemini vector embeddings for document_chunks in PostgreSQL."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate configuration and inspect pending chunks without making API calls.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Batch size for embedding calls (default: 10).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of chunks to process.",
    )

    args = parser.parse_args()
    run_embed_corpus(
        dry_run=args.dry_run,
        batch_size=args.batch_size,
        limit=args.limit,
    )


if __name__ == "__main__":
    main()
