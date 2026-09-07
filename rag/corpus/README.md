# Authoritative RAG Corpus Directory

This directory stores authoritative primary and institutional source documents backing the AI Skill Navigator RAG pipeline.

## Directory Structure
- `schemes/`: Official guidelines, portal FAQs, and government gazettes for social security and skilling schemes (`sch-001` to `sch-005`).
- `courses/`: Official Qualification Packs (QPs), National Qualification Register (NQR) files, and DGT curricula for active vocational courses.
- `extracted/`: Cleaned text files extracted from raw corpus documents prior to chunking.

## Provenance Rules
1. **Zero Fabrication**: Only verbatim texts from official government or statutory sector bodies are stored.
2. **Immutability**: Source files must match the URLs and checksums cited in `data/seed/sources.csv`.
3. **Status Tracking**: Any document that could not be legally or technically downloaded is recorded in `rag/manifest.json` as `pending_acquisition` rather than placeholder or synthetic text.
