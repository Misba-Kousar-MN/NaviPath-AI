"""RAG corpus ingestion, extraction, cleaning, and chunking pipeline.
See docs/ARCHITECTURE.md Section F.
"""
from app.rag.extractor import DocumentExtractor, ExtractionResult
from app.rag.cleaner import TextCleaner
from app.rag.chunker import DocumentChunker, ChunkPayload

__all__ = [
    "DocumentExtractor",
    "ExtractionResult",
    "TextCleaner",
    "DocumentChunker",
    "ChunkPayload",
]
