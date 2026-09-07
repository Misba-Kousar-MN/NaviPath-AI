"""Semantic retrieval service for RAG corpus.
Embeds queries via Gemini (768 dimensions) and performs pgvector cosine similarity searches
over approved document chunks with full provenance tracking.
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Sequence

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.rag.embedding import (
    EXPECTED_EMBEDDING_DIMENSION,
    GeminiEmbeddingService,
    InvalidDimensionError,
)

logger = logging.getLogger(__name__)

DEFAULT_TOP_K = 5
MAX_TOP_K = 20
BASE_DIR = Path(__file__).resolve().parents[3]
CHUNKS_CATALOG_PATH = BASE_DIR / "rag" / "extracted" / "chunks.json"


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str | None
    source_id: str
    authority: str | None
    source_url: str | None
    section: str | None
    chunk_text: str
    cosine_distance: float
    similarity_score: float
    entity_type: str | None = None
    entity_id: str | None = None
    scheme_id: str | None = None
    course_id: str | None = None
    skill_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RetrievalResponse:
    query: str
    top_k: int
    total_matched: int
    results: list[RetrievedChunk]

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "top_k": self.top_k,
            "total_matched": self.total_matched,
            "results": [r.to_dict() for r in self.results],
        }


class RAGRetriever:
    """Isolated, type-safe semantic retrieval over document_chunks.

    Phase 5.1 — Entity-Scoped Retrieval:
    ──────────────────────────────────────
    The document_chunks table does not have course_id / scheme_id / skill_id
    columns — those IDs live only in rag/extracted/chunks.json, which is loaded
    at startup into ``_chunk_metadata_cache``.

    When an entity filter is requested, ``_get_eligible_chunk_ids()`` scans the
    in-memory cache (≤55 entries, negligible) and returns the matching chunk IDs.
    Those IDs are injected as ``AND c.id = ANY(:eligible_ids)`` into the SQL
    WHERE clause, restricting the pgvector cosine-distance search to the correct
    entity's candidate set before ordering by similarity.

    This is additive: all existing filter parameters (source_id, document_id,
    min_similarity) remain unchanged.  No entity filter is applied when none
    is requested.
    """

    def __init__(
        self,
        embedding_service: GeminiEmbeddingService | None = None,
    ) -> None:
        self.embedding_service = embedding_service or GeminiEmbeddingService()
        self._chunk_metadata_cache: dict[str, dict[str, Any]] = self._load_chunk_metadata()

    @staticmethod
    def _load_chunk_metadata() -> dict[str, dict[str, Any]]:
        """Loads cached chunk-to-entity mapping from rag/extracted/chunks.json if present."""
        if CHUNKS_CATALOG_PATH.exists():
            try:
                with open(CHUNKS_CATALOG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return {c["chunk_id"]: c for c in data.get("chunks", [])}
            except Exception as e:
                logger.warning("Could not load chunk catalog metadata: %s", e)
        return {}

    def _get_eligible_chunk_ids(
        self,
        course_id: str | None = None,
        scheme_id: str | None = None,
        skill_id: str | None = None,
    ) -> set[str] | None:
        """Returns the set of chunk IDs belonging to the requested entity.

        Matching is OR across the provided entity dimensions — any chunk that
        satisfies at least one of the supplied filters is included.  In practice
        the corpus uses mutually-exclusive entity types (a chunk belongs to
        exactly one course OR one scheme, never both), so supplying a single
        filter is the normal case.

        Returns None when no entity filter is requested (all chunks eligible).
        Returns an empty set when a filter is requested but no chunks match.
        """
        if not any([course_id, scheme_id, skill_id]):
            return None  # No entity filter — full corpus eligible

        eligible: set[str] = set()
        for chunk_id, meta in self._chunk_metadata_cache.items():
            if course_id and meta.get("course_id") == course_id:
                eligible.add(chunk_id)
            elif scheme_id and meta.get("scheme_id") == scheme_id:
                eligible.add(chunk_id)
            elif skill_id and meta.get("skill_id") == skill_id:
                eligible.add(chunk_id)

        logger.debug(
            "Entity filter (course_id=%s, scheme_id=%s, skill_id=%s) → %d eligible chunks",
            course_id, scheme_id, skill_id, len(eligible),
        )
        return eligible

    def retrieve(
        self,
        query: str,
        db: Session,
        top_k: int = DEFAULT_TOP_K,
        source_id: str | None = None,
        document_id: str | None = None,
        min_similarity: float | None = None,
        # Phase 5.1: optional entity-scoped filters
        course_id: str | None = None,
        scheme_id: str | None = None,
        skill_id: str | None = None,
    ) -> RetrievalResponse:
        """Embeds query and executes parameterized pgvector cosine distance search.

        Optional entity filters (course_id, scheme_id, skill_id) restrict the
        SQL candidate set to chunks belonging to the specified entity before
        cosine-similarity ordering — preventing cross-entity evidence leakage.
        Filters must be non-empty strings when provided.
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty or whitespace.")

        cleaned_query = query.strip()
        if len(cleaned_query) > 2000:
            raise ValueError("Query exceeds maximum allowed length of 2000 characters.")

        if not isinstance(top_k, int) or top_k < 1:
            raise ValueError(f"top_k must be a positive integer >= 1, got {top_k}.")
        if top_k > MAX_TOP_K:
            raise ValueError(f"top_k cannot exceed maximum limit of {MAX_TOP_K}, got {top_k}.")

        # Validate entity filter arguments — reject blank strings
        for param_name, param_val in (
            ("course_id", course_id),
            ("scheme_id", scheme_id),
            ("skill_id", skill_id),
        ):
            if param_val is not None and not param_val.strip():
                raise ValueError(
                    f"Entity filter '{param_name}' must be a non-empty string when provided."
                )

        start_time = time.perf_counter()
        logger.info(
            "RAG retrieval started",
            extra={
                "event": "rag_retrieval_started",
                "operation": "retrieve",
                "top_k": top_k,
                "course_id": course_id,
                "scheme_id": scheme_id,
                "skill_id": skill_id,
                "source_id": source_id,
            },
        )

        # Phase 5.1: resolve entity-scoped candidate set from in-memory catalog.
        # O(n) over ≤55 chunks — done BEFORE the Gemini embedding call so that an
        # unknown entity ID short-circuits without any API round-trip.
        eligible_ids = self._get_eligible_chunk_ids(
            course_id=course_id,
            scheme_id=scheme_id,
            skill_id=skill_id,
        )
        if eligible_ids is not None and len(eligible_ids) == 0:
            # Entity filter requested but no chunks match — skip embedding + DB entirely.
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(
                "Entity filter yielded 0 eligible chunks "
                "(course_id=%s, scheme_id=%s, skill_id=%s); returning empty result.",
                course_id, scheme_id, skill_id,
                extra={
                    "event": "rag_retrieval_empty",
                    "operation": "retrieve",
                    "course_id": course_id,
                    "scheme_id": scheme_id,
                    "skill_id": skill_id,
                    "duration_ms": duration_ms,
                },
            )
            return RetrievalResponse(
                query=cleaned_query,
                top_k=top_k,
                total_matched=0,
                results=[],
            )

        # 1. Generate query embedding
        query_vector = self.embedding_service.embed_text(cleaned_query)
        if len(query_vector) != EXPECTED_EMBEDDING_DIMENSION:
            raise InvalidDimensionError(
                f"Query vector dimension mismatch: expected {EXPECTED_EMBEDDING_DIMENSION}, got {len(query_vector)}"
            )

        # 2. Format query vector for pgvector
        vector_str = "[" + ",".join(f"{v:.8f}" for v in query_vector) + "]"

        # 3. Build parameterized query
        # pgvector <=> operator computes cosine distance: 1 - cos(theta), in range [0, 2]
        # Similarity score is normalized to [0, 1]: 1.0 - (distance / 2.0)
        sql_parts = [
            """
            SELECT
                c.id AS chunk_id,
                c.source_id AS source_id,
                c.section AS section,
                c.chunk_text AS chunk_text,
                s.authority AS authority,
                s.official_url AS source_url,
                (c.embedding <=> :query_vec) AS cosine_distance
            FROM document_chunks c
            JOIN sources s ON c.source_id = s.id
            WHERE c.embedding IS NOT NULL
            """
        ]
        params: dict[str, Any] = {
            "query_vec": vector_str,
            "top_k": top_k,
        }

        # Optional existing source_id filter
        if source_id:
            sql_parts.append("AND c.source_id = :source_id")
            params["source_id"] = source_id

        # Phase 5.1: entity-scoped SQL filter (parameterized — no interpolation)
        if eligible_ids is not None:
            sql_parts.append("AND c.id = ANY(:eligible_ids)")
            params["eligible_ids"] = list(eligible_ids)

        sql_parts.append("ORDER BY cosine_distance ASC")
        sql_parts.append("LIMIT :top_k")

        final_query = "\n".join(sql_parts)

        # 4. Execute query
        try:
            db.execute(text("SET LOCAL ivfflat.probes = 10"))
        except Exception:
            pass
        rows = db.execute(text(final_query), params).fetchall()

        results: list[RetrievedChunk] = []
        for r in rows:
            c_dist = float(r.cosine_distance)
            # Normalize cosine distance to similarity score
            sim_score = max(0.0, min(1.0, 1.0 - (c_dist / 2.0)))

            if min_similarity is not None and sim_score < min_similarity:
                continue

            # Enrich with cached catalog metadata (doc_id, entity_type, entity_id, scheme/course/skill)
            meta = self._chunk_metadata_cache.get(r.chunk_id, {})

            # document_id post-filter (the catalog holds document_id; DB does not)
            if document_id and meta.get("document_id") != document_id:
                continue

            chunk_obj = RetrievedChunk(
                chunk_id=r.chunk_id,
                document_id=meta.get("document_id"),
                source_id=r.source_id,
                authority=r.authority or meta.get("issuing_authority"),
                source_url=r.source_url or meta.get("source_url"),
                section=r.section,
                chunk_text=r.chunk_text,
                cosine_distance=round(c_dist, 6),
                similarity_score=round(sim_score, 6),
                entity_type=meta.get("entity_type"),
                entity_id=meta.get("entity_id"),
                scheme_id=meta.get("scheme_id"),
                course_id=meta.get("course_id"),
                skill_id=meta.get("skill_id"),
            )

            results.append(chunk_obj)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        if len(results) == 0:
            logger.info(
                "RAG retrieval yielded 0 matching chunks in %.2fms",
                duration_ms,
                extra={
                    "event": "rag_retrieval_empty",
                    "operation": "retrieve",
                    "duration_ms": duration_ms,
                    "top_k": top_k,
                },
            )
        else:
            logger.info(
                "RAG retrieval completed: %d chunks matched in %.2fms",
                len(results),
                duration_ms,
                extra={
                    "event": "rag_retrieval_completed",
                    "operation": "retrieve",
                    "matched_count": len(results),
                    "duration_ms": duration_ms,
                    "top_k": top_k,
                },
            )

        return RetrievalResponse(
            query=cleaned_query,
            top_k=top_k,
            total_matched=len(results),
            results=results,
        )
