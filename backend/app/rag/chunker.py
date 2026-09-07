"""Deterministic section-aware chunker for RAG corpus documents.
Splits text on natural headings and paragraph groups targeting ~400-600 tokens.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

try:
    import tiktoken

    _ENCODER = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text: str) -> int:
        return len(_ENCODER.encode(text))

except Exception:

    def count_tokens(text: str) -> int:
        # Fallback estimation: ~0.75 words per token
        return int(len(text.split()) * 1.3)


@dataclass
class ChunkPayload:
    chunk_id: str
    source_id: str
    chunk_text: str
    section: str
    chunk_index: int
    token_count: int
    entity_type: str | None = None
    entity_id: str | None = None
    scheme_id: str | None = None
    course_id: str | None = None
    skill_id: str | None = None
    document_id: str | None = None
    title: str | None = None
    issuing_authority: str | None = None
    source_url: str | None = None
    page_number: int | None = None
    retrieved_date: str | None = None
    promoted_to_evidence: bool = False
    embedding_status: str = "not-generated"
    chunking_version: str = "1.0"
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return asdict(self)


class DocumentChunker:
    """Chunks documents along semantic section headers and paragraphs."""

    TARGET_MIN_TOKENS: int = 150
    TARGET_MAX_TOKENS: int = 550
    OVERLAP_TOKENS: int = 40

    # Heading patterns: Markdown #, numbered sections (1., 1.1, Section 1), or uppercase lines
    SECTION_HEADER_PATTERN = re.compile(
        r"^(?:#{1,4}\s+|(?:\d+\.){1,3}\s+|Section\s+\d+[:\-\s]|Chapter\s+\d+[:\-\s])",
        re.MULTILINE,
    )

    @classmethod
    def chunk_document(
        cls,
        text: str,
        source_id: str,
        base_chunk_id_prefix: str,
        title: str = "",
        entity_type: str | None = None,
        entity_id: str | None = None,
        scheme_id: str | None = None,
        course_id: str | None = None,
        skill_id: str | None = None,
        issuing_authority: str | None = None,
        source_url: str | None = None,
        retrieved_date: str | None = None,
        start_index: int = 1,
    ) -> list[ChunkPayload]:
        if not text.strip():
            return []

        # 1. Break text into logical sections based on headings
        sections = cls._split_into_sections(text)

        # 2. Convert each meaningful section into a targeted semantic chunk
        chunk_units: list[tuple[str, str]] = []  # list of (section_title, chunk_text)

        for sec_name, sec_text in sections:
            sec_clean = sec_text.strip()
            if not sec_clean:
                continue

            sec_tokens = count_tokens(sec_clean)

            # If section is within comfortable bounds (100 to 550 tokens), keep intact
            if sec_tokens <= cls.TARGET_MAX_TOKENS:
                chunk_units.append((sec_name, sec_clean))
            else:
                # If section is larger than 550 tokens, split by sub-sections or paragraphs
                sub_chunks = cls._split_large_section(sec_name, sec_clean)
                chunk_units.extend(sub_chunks)

        # 3. Create ChunkPayload objects
        results: list[ChunkPayload] = []
        idx = start_index

        for sec_name, c_text in chunk_units:
            clean_chunk = c_text.strip()
            if not clean_chunk:
                continue

            cid = f"{base_chunk_id_prefix}-{idx:03d}"
            payload = ChunkPayload(
                chunk_id=cid,
                source_id=source_id,
                chunk_text=clean_chunk,
                section=sec_name[:120],
                chunk_index=idx,
                token_count=count_tokens(clean_chunk),
                entity_type=entity_type,
                entity_id=entity_id,
                scheme_id=scheme_id,
                course_id=course_id,
                skill_id=skill_id,
                title=title,
                issuing_authority=issuing_authority,
                source_url=source_url,
                retrieved_date=retrieved_date,
                promoted_to_evidence=False,
                embedding_status="not-generated",
            )
            results.append(payload)
            idx += 1

        return results

    @classmethod
    def _split_into_sections(cls, text: str) -> list[tuple[str, str]]:
        """Splits document text by recognized section headers."""
        paragraphs = text.split("\n\n")
        sections: list[tuple[str, str]] = []
        current_title = "Overview"
        current_body: list[str] = []

        for p in paragraphs:
            p_strip = p.strip()
            if not p_strip:
                continue

            # Check if paragraph starts with a heading pattern or is a short title line
            lines = p_strip.split("\n")
            first_line = lines[0].strip()

            if (
                cls.SECTION_HEADER_PATTERN.match(first_line)
                or (len(first_line) < 80 and first_line.endswith(":") and not first_line.startswith("-"))
                or (len(lines) == 1 and len(first_line) < 60 and first_line.isupper())
            ):
                if current_body:
                    sections.append((current_title, "\n\n".join(current_body)))
                    current_body = []
                current_title = re.sub(r"^#{1,4}\s*", "", first_line).strip()
                if len(lines) > 1:
                    current_body.append("\n".join(lines[1:]))
            else:
                current_body.append(p_strip)

        if current_body:
            sections.append((current_title, "\n\n".join(current_body)))

        return sections if sections else [("General", text)]

    @classmethod
    def _split_large_section(cls, sec_name: str, sec_text: str) -> list[tuple[str, str]]:
        """Breaks a large section into paragraph chunks with overlap."""
        paragraphs = sec_text.split("\n\n")
        chunks: list[tuple[str, str]] = []
        buffer: list[str] = []
        curr_tokens = 0
        part_idx = 1

        for p in paragraphs:
            p_tok = count_tokens(p)
            if curr_tokens + p_tok > cls.TARGET_MAX_TOKENS and curr_tokens >= cls.TARGET_MIN_TOKENS:
                chunk_title = f"{sec_name} (Part {part_idx})"
                chunks.append((chunk_title, "\n\n".join(buffer)))
                # Maintain overlap of 1 paragraph if feasible
                buffer = [buffer[-1], p] if buffer else [p]
                curr_tokens = count_tokens("\n\n".join(buffer))
                part_idx += 1
            else:
                buffer.append(p)
                curr_tokens += p_tok

        if buffer:
            chunk_title = f"{sec_name} (Part {part_idx})" if part_idx > 1 else sec_name
            chunks.append((chunk_title, "\n\n".join(buffer)))

        return chunks
