"""sources, evidence, locations, document_chunks — the provenance root and
the RAG vector store. See docs/ARCHITECTURE.md Section D #13-16.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pgvector.sqlalchemy import Vector

from app.core.config import get_settings
from app.db.base import Base, TimestampMixin

_EMBEDDING_DIM = get_settings().embedding_dimension


class Source(TimestampMixin, Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    authority: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    official_url: Mapped[str | None] = mapped_column(Text)
    source_type: Mapped[str | None] = mapped_column(Text)
    publication_date: Mapped[date | None] = mapped_column(Date)
    retrieved_date: Mapped[date | None] = mapped_column(Date)
    last_verified_date: Mapped[date | None] = mapped_column(Date)
    verification_status: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    evidence: Mapped[list["Evidence"]] = relationship(back_populates="source")
    document_chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="source")

    __table_args__ = (
        CheckConstraint(
            "source_type IS NULL OR source_type IN "
            "('act','notification','gazette','portal-page','pdf-guideline','helpline-confirmed','other')",
            name="ck_sources_source_type",
        ),
        CheckConstraint(
            "verification_status IN ('verified','pending-review','broken-link','superseded')",
            name="ck_sources_verification_status",
        ),
    )


class Evidence(TimestampMixin, Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    related_entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    # Soft polymorphic reference (see docs/DATABASE_IMPLEMENTATION_PLAN.md §3) —
    # deliberately NOT a foreign key, validated by scripts/validate_database.py instead.
    related_entity_id: Mapped[str] = mapped_column(Text, nullable=False)
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt_text: Mapped[str] = mapped_column(Text, nullable=False)
    page_or_section: Mapped[str | None] = mapped_column(Text)
    verification_status: Mapped[str] = mapped_column(Text, nullable=False)

    source: Mapped["Source"] = relationship(back_populates="evidence")

    __table_args__ = (
        CheckConstraint(
            "related_entity_type IN "
            "('occupation','skill','course','training_centre','scheme','eligibility_rule','document')",
            name="ck_evidence_related_entity_type",
        ),
        CheckConstraint(
            "verification_status IN ('verified','candidate-unverified')",
            name="ck_evidence_verification_status",
        ),
    )


class Location(TimestampMixin, Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    district: Mapped[str] = mapped_column(Text, nullable=False)
    taluk: Mapped[str | None] = mapped_column(Text)
    centroid_lat: Mapped[float | None] = mapped_column(Numeric)
    centroid_lng: Mapped[float | None] = mapped_column(Numeric)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )


class DocumentChunk(TimestampMixin, Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    section: Mapped[str | None] = mapped_column(Text)
    retrieved_date: Mapped[date | None] = mapped_column(Date)
    promoted_to_evidence: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    embedding_status: Mapped[str] = mapped_column(Text, nullable=False, default="not-generated")
    # NULL until an embedding pipeline actually runs — see docs/DATABASE_IMPLEMENTATION_PLAN.md §8.
    # Dimension is read from EMBEDDING_DIMENSION (.env), never hard-coded.
    embedding = mapped_column(Vector(_EMBEDDING_DIM), nullable=True) if Vector else None

    source: Mapped["Source"] = relationship(back_populates="document_chunks")

    __table_args__ = (
        CheckConstraint(
            "embedding_status IN ('not-generated','generated','stale')",
            name="ck_document_chunks_embedding_status",
        ),
    )
