"""RAG retrieval API router.
Provides dedicated endpoint for semantic search over official document chunks.
Does NOT modify recommendation endpoints or perform decision logic.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.rag.retriever import DEFAULT_TOP_K, MAX_TOP_K, RAGRetriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["RAG Retrieval"])


class RetrievalQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Natural-language search query")
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=MAX_TOP_K, description="Number of chunks to return")
    source_id: str | None = Field(default=None, description="Optional filter by authoritative source_id")
    document_id: str | None = Field(default=None, description="Optional filter by corpus document_id")
    min_similarity: float | None = Field(default=None, ge=0.0, le=1.0, description="Optional minimum similarity threshold")


class RetrievedChunkOut(BaseModel):
    chunk_id: str
    document_id: str | None
    source_id: str
    authority: str | None
    source_url: str | None
    section: str | None
    chunk_text: str
    cosine_distance: float
    similarity_score: float
    entity_type: str | None
    entity_id: str | None
    scheme_id: str | None
    course_id: str | None
    skill_id: str | None


class RetrievalQueryResponse(BaseModel):
    query: str
    top_k: int
    total_matched: int
    results: list[RetrievedChunkOut]


@router.post(
    "/retrieve",
    response_model=RetrievalQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve relevant official corpus chunks via semantic similarity",
)
def retrieve_rag_evidence(
    req: RetrievalQueryRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieves top-k relevant document chunks with full provenance tracking.
    Never exposes internal secrets or generates natural language answers.
    """
    try:
        retriever = RAGRetriever()
        response = retriever.retrieve(
            query=req.query,
            db=db,
            top_k=req.top_k,
            source_id=req.source_id,
            document_id=req.document_id,
            min_similarity=req.min_similarity,
        )
        return response.to_dict()
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err
    except Exception as exc:
        logger.error(
            "RAG retrieval failed safely: %s",
            str(exc)[:120],
            extra={
                "event": "rag_route_failed",
                "operation": "retrieve_rag_evidence",
                "error": str(exc)[:120],
            },
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve semantic evidence.",
        ) from exc
