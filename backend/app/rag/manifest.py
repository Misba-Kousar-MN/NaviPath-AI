"""Document manifest definitions and integrity validators for RAG corpus.
Ensures strict provenance traceability: chunk -> source -> document -> official URL.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass
class ManifestEntry:
    document_id: str
    source_id: str
    title: str
    issuing_authority: str
    document_type: str
    source_url: str | None
    entity_type: str  # 'scheme', 'course', 'training_centre', 'system'
    entity_id: str | None
    acquisition_status: str  # 'acquired', 'pending_acquisition', 'requires_ocr', 'unavailable'
    local_file_path: str | None
    publication_date: str | None = None
    retrieved_date: str | None = None
    verification_status: str = "verified"  # 'verified', 'pending-review', 'unverified'
    notes: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class CorpusManifest:
    """Manages the document manifest and validates provenance linkages."""

    def __init__(self, manifest_path: str | Path):
        self.manifest_path = Path(manifest_path)
        self.entries: dict[str, ManifestEntry] = {}
        if self.manifest_path.exists():
            self.load()

    def load(self) -> None:
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.entries = {
                item["document_id"]: ManifestEntry(**item) for item in data.get("documents", [])
            }

    def save(self) -> None:
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": "1.0",
            "total_documents": len(self.entries),
            "documents": [entry.to_dict() for entry in self.entries.values()],
        }
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

    def add_entry(self, entry: ManifestEntry) -> None:
        self.entries[entry.document_id] = entry

    def get_entry(self, document_id: str) -> ManifestEntry | None:
        return self.entries.get(document_id)

    def validate_chunk_provenance(self, chunk: dict, valid_source_ids: set[str]) -> tuple[bool, str | None]:
        """Fails closed if chunk lacks source_id or refers to an unverified/unknown source."""
        source_id = chunk.get("source_id")
        if not source_id:
            return False, "Missing source_id on chunk"
        if source_id not in valid_source_ids:
            return False, f"Chunk references unknown source_id '{source_id}' not in sources table"
        return True, None
