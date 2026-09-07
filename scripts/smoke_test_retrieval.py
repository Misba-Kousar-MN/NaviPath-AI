#!/usr/bin/env python3
"""
Retrieval Quality Smoke Tests for Phase 3D.
Executes 5 canonical queries against the live Gemini embedding API and PostgreSQL pgvector store
to verify real semantic retrieval relevance.
Requires SKILL in .env.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.rag.retriever import RAGRetriever


CANONICAL_QUERIES = [
    {
        "id": 1,
        "query": "What is PM Vishwakarma?",
        "expected_entity": "sch-001",
        "keywords": ["vishwakarma", "artisan", "traditional trades"],
    },
    {
        "id": 2,
        "query": "What benefits are available under e-Shram?",
        "expected_entity": "sch-002",
        "keywords": ["eshram", "e-shram", "unorganised", "uan"],
    },
    {
        "id": 3,
        "query": "What is the Self Employed Tailor qualification?",
        "expected_entity": "crs-001",
        "keywords": ["tailor", "garment", "amh"],
    },
    {
        "id": 4,
        "query": "What does the Electrician curriculum cover?",
        "expected_entity": "crs-002",
        "keywords": ["electrician", "trade", "wiring", "electrical"],
    },
    {
        "id": 5,
        "query": "What support is available from KBOCWWB?",
        "expected_entity": "sch-004",
        "keywords": ["kbocwwb", "construction", "welfare", "board"],
    },
]


def run_smoke_tests():
    print("=== Phase 3D: Semantic Retrieval Quality Smoke Tests ===")
    retriever = RAGRetriever()
    db = SessionLocal()

    passed = 0
    total = len(CANONICAL_QUERIES)

    try:
        for item in CANONICAL_QUERIES:
            q_id = item["id"]
            query = item["query"]
            exp_entity = item["expected_entity"]
            keywords = item["keywords"]

            print(f"\n--- Query {q_id}: '{query}' ---")
            resp = retriever.retrieve(query=query, db=db, top_k=5)

            top_matches = resp.results
            assert len(top_matches) > 0, f"Query {q_id} returned 0 results!"

            matched_relevant = False
            for rank, chunk in enumerate(top_matches, start=1):
                entity_match = (
                    chunk.scheme_id == exp_entity
                    or chunk.course_id == exp_entity
                    or chunk.entity_id == exp_entity
                )
                text_lower = chunk.chunk_text.lower()
                kw_match = any(kw in text_lower for kw in keywords)

                marker = "[* RELEVANT *]" if (entity_match or kw_match) else "  "
                print(
                    f"  Rank {rank}: {marker} ID={chunk.chunk_id}, Dist={chunk.cosine_distance:.4f}, "
                    f"Sim={chunk.similarity_score:.4f}, Entity={chunk.scheme_id or chunk.course_id}, "
                    f"Sec='{chunk.section[:40]}'"
                )

                if rank <= 3 and (entity_match or kw_match):
                    matched_relevant = True

            if matched_relevant:
                print(f"Result for Query {q_id}: PASS (High-relevance evidence in top 3)")
                passed += 1
            else:
                print(f"Result for Query {q_id}: WARN (Relevant evidence was not in top 3)")

        print(f"\n=== SMOKE TEST SUMMARY: {passed}/{total} Passed ===")
        return passed == total

    finally:
        db.close()


if __name__ == "__main__":
    success = run_smoke_tests()
    sys.exit(0 if success else 1)
