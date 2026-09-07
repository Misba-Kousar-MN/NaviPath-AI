"""Evidence Validation Service for RAG retrieval results.
Ensures every retrieved document chunk satisfies strict source trust, active verification,
content integrity, and provenance traceability before reaching the LLM context.
"""
from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.provenance import DocumentChunk, Source
from app.rag.retriever import RetrievedChunk

logger = logging.getLogger(__name__)

DEFAULT_MIN_SIMILARITY_THRESHOLD = 0.70


@dataclass
class ValidatedEvidence:
    chunk_id: str
    document_id: str | None
    source_id: str
    chunk_text: str
    authority: str | None
    source_url: str | None
    section: str | None
    similarity_score: float
    cosine_distance: float
    validation_status: str  # 'valid' | 'rejected'
    validation_reasons: list[str]
    entity_type: str | None = None
    entity_id: str | None = None
    scheme_id: str | None = None
    course_id: str | None = None
    skill_id: str | None = None

    @property
    def is_valid(self) -> bool:
        return self.validation_status == "valid"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class EvidenceValidator:
    """Validates retrieved chunks against live source trust, integrity, and provenance."""

    def __init__(
        self,
        min_similarity_threshold: float = DEFAULT_MIN_SIMILARITY_THRESHOLD,
    ) -> None:
        self.min_similarity_threshold = min_similarity_threshold

    def validate_chunks(
        self,
        chunks: Sequence[RetrievedChunk],
        db: Session,
    ) -> list[ValidatedEvidence]:
        """Validates a list of retrieved chunks in a read-only pass (zero mutations)."""
        if not chunks:
            return []

        # 1. Load active, verified sources from the database
        sources = {
            s.id: s
            for s in db.execute(select(Source)).scalars().all()
        }

        # 2. Query document_chunks table to ensure chunk exists in database
        chunk_ids = [c.chunk_id for c in chunks]
        db_chunks = {
            dc.id: dc
            for dc in db.execute(
                select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids))
            ).scalars().all()
        }

        validated_list: list[ValidatedEvidence] = []

        for chunk in chunks:
            reasons: list[str] = []
            is_valid = True

            # A. Basic content integrity
            if not chunk.chunk_id or not chunk.chunk_id.strip():
                is_valid = False
                reasons.append("Missing chunk_id.")

            if not chunk.chunk_text or not chunk.chunk_text.strip():
                is_valid = False
                reasons.append("Empty chunk text.")

            # B. Database record presence
            db_chunk = db_chunks.get(chunk.chunk_id)
            if not db_chunk:
                is_valid = False
                reasons.append(f"Orphan chunk '{chunk.chunk_id}' not found in document_chunks table.")

            # C. Source presence and verification status
            if not chunk.source_id:
                is_valid = False
                reasons.append("Missing source_id.")
            else:
                source_record = sources.get(chunk.source_id)
                if not source_record:
                    is_valid = False
                    reasons.append(f"Referenced source '{chunk.source_id}' not found in sources table.")
                else:
                    if source_record.verification_status != "verified":
                        is_valid = False
                        reasons.append(
                            f"Source '{chunk.source_id}' status is '{source_record.verification_status}', not 'verified'."
                        )

            # D. Provenance cross-check
            if db_chunk and chunk.source_id:
                if db_chunk.source_id != chunk.source_id:
                    is_valid = False
                    reasons.append(
                        f"Inconsistent source linkage: chunk claims '{chunk.source_id}' but database stores '{db_chunk.source_id}'."
                    )

            # E. Relevance threshold check
            if chunk.similarity_score < self.min_similarity_threshold:
                is_valid = False
                reasons.append(
                    f"Relevance score {chunk.similarity_score:.4f} is below threshold {self.min_similarity_threshold:.2f}."
                )

            status = "valid" if is_valid else "rejected"
            if is_valid:
                reasons.append("Passed all trust, provenance, and relevance checks.")

            validated_list.append(
                ValidatedEvidence(
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    source_id=chunk.source_id,
                    chunk_text=chunk.chunk_text,
                    authority=chunk.authority,
                    source_url=chunk.source_url,
                    section=chunk.section,
                    similarity_score=chunk.similarity_score,
                    cosine_distance=chunk.cosine_distance,
                    validation_status=status,
                    validation_reasons=reasons,
                    entity_type=chunk.entity_type,
                    entity_id=chunk.entity_id,
                    scheme_id=chunk.scheme_id,
                    course_id=chunk.course_id,
                    skill_id=chunk.skill_id,
                )
            )

        total_chunks = len(chunks)
        valid_count = sum(1 for v in validated_list if v.is_valid)
        rejected_count = total_chunks - valid_count
        logger.info(
            "Evidence validation evaluated %d chunks (%d accepted, %d rejected)",
            total_chunks,
            valid_count,
            rejected_count,
            extra={
                "event": "evidence_validation_completed",
                "operation": "validate_chunks",
                "total_chunks": total_chunks,
                "valid_count": valid_count,
                "rejected_count": rejected_count,
            },
        )

        return validated_list
