# /rag — RAG Corpus & Semantic Retrieval Pipeline

This directory manages the acquisition, processing, and vector search of authoritative corpus documents in accordance with [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) Section F.

---

## Architecture

The RAG pipeline operates as an evidence-retrieval and grounding mechanism:

```
Official Source (Gazette / QP / Syllabus)
       ↓
rag/manifest.json & rag/corpus/
       ↓
Document Extraction & Cleaning (backend/app/rag/extractor.py & cleaner.py)
       ↓
Section-Aware Chunking (backend/app/rag/chunker.py)
       ↓
document_chunks (PostgreSQL table, 55 chunks)
       ↓
Embedding Generation (scripts/embed_corpus.py & backend/app/rag/embedding.py)
  - Model: gemini-embedding-001
  - Vector Dimension: 768 (strictly enforced)
       ↓
Semantic Retrieval (backend/app/rag/retriever.py & POST /api/rag/retrieve)
  - Metric: pgvector cosine distance (embedding <=> :query_vec)
  - Output: Ranked document chunks with cosine distance, normalized similarity score, and provenance
       ↓
Phase 3E: Evidence Validation (backend/app/rag/validator.py)
  - Verifies source existence and verification_status == 'verified'
  - Validates chunk presence, text consistency, and entity provenance
  - Filters out unverified or low-similarity chunks (< 0.70 threshold)
       ↓
Phase 4: Grounded Explanation / Personalization (backend/app/llm/service.py)
  - Model: gemini-3.6-flash
  - Strictly grounded prompt with negative constraints
  - Structured output schemas (RecommendationExplanation)
  - Graceful deterministic fallback on failure or rate-limiting
       ↓
Final Grounded Recommendation Endpoint (POST /api/recommendations)
```

---

## Critical Boundary: Retrieval & LLM vs. Deterministic Intelligence

> [!IMPORTANT]
> **RAG and LLM are grounding and explanation aids, NEVER decision engines.**
> - **Occupations & Skill Transitions**: Fully deterministic (backed by SQL tables `occupations`, `skills`, `skill_transitions`).
> - **Skill Gap Computation**: Set-difference algorithm in pure SQL/Python (`calculate_skill_gaps`).
> - **Courses & Training Centres**: Strictly limited to verified SQL records. Unresolved centres retain NULL coordinates.
> - **Geocoding & Proximity**: Calculated exclusively via PostGIS ST_Distance against physical coordinates.
> - **Eligibility Logic**: Evaluated via deterministic rules engines against structured database facts.
> - **RAG Semantic Retrieval**: Used exclusively to retrieve cited, official source evidence for transparency.
> - **Evidence Validation**: Rejects any retrieved chunk lacking verified provenance or exceeding cosine distance threshold.
> - **LLM Explanations**: Phrased with empathy, clarity, and language customization; strictly constrained against inventing facts or contradicting the deterministic baseline.

---

## Grounded Recommendation Integration

### Endpoint: `POST /api/recommendations`

Accepts a worker profile, computes deterministic pathways/courses/centres/eligibility, retrieves and validates relevant official documentary evidence, and attaches a grounded personalized explanation.

#### Request:
```json
{
  "occupation": "Delivery / Courier Rider",
  "district": "Bengaluru Urban",
  "age": 24,
  "education": "12th Pass",
  "language": "English"
}
```

#### Response Extensions:
In addition to all standard deterministic recommendation fields (`matched_occupation`, `current_skills`, `recommended_pathways`, `skill_gaps`, `courses`, `nearby_centres`, `eligibility`, `documents`), the response includes:

```json
{
  "explanation_status": "available",
  "evidence_status": "retrieved",
  "validated_evidence": [
    {
      "chunk_id": "chk-034",
      "source_id": "src-008",
      "authority": "Electronics Sector Skills Council of India (ESSCI)",
      "section": "2. Professional Competencies and Learning Outcomes",
      "similarity_score": 0.875,
      "is_valid": true
    }
  ],
  "explanation": {
    "summary": "Personalized worker-facing career guidance...",
    "skill_gap_explanation": "Identified skill gaps mapped directly from official standards...",
    "pathway_explanation": "Transition feasibility and roadmap...",
    "course_explanations": [...],
    "centre_explanations": [...],
    "scheme_explanations": [...],
    "next_steps": [...],
    "limitations": [...],
    "evidence_references": ["chk-034", "chk-033"]
  }
}
```

---

## Semantic Retrieval API

### Endpoint: `POST /api/rag/retrieve`

Retrieves relevant official evidence chunks ranked by cosine similarity without performing recommendation logic or invoking an LLM.

#### Request:
```json
{
  "query": "What support is available under PM Vishwakarma?",
  "top_k": 5,
  "source_id": null,
  "document_id": null,
  "min_similarity": null
}
```

#### Response:
```json
{
  "query": "What support is available under PM Vishwakarma?",
  "top_k": 5,
  "total_matched": 5,
  "results": [
    {
      "chunk_id": "chk-002",
      "document_id": "doc-corp-001",
      "source_id": "src-001",
      "authority": "Ministry of Micro, Small and Medium Enterprises (MSME), Government of India",
      "source_url": "https://pmvishwakarma.gov.in/",
      "section": "1. Scheme Overview and Objectives",
      "chunk_text": "PM Vishwakarma is a Central Sector Scheme launched to provide end-to-end support...",
      "cosine_distance": 0.1838,
      "similarity_score": 0.9081,
      "entity_type": "scheme",
      "entity_id": "sch-001",
      "scheme_id": "sch-001",
      "course_id": null,
      "skill_id": null
    }
  ]
}
```

### Parameters & Constraints
- **Embedding Model**: `gemini-embedding-001` via official `google-genai` SDK.
- **Dimensionality**: Exactly 768 dimensions (`vector(768)`).
- **Distance Metric**: Cosine distance ($1 - \cos(\theta)$) where lower distance indicates closer similarity. Normalized similarity is computed as $1.0 - (\text{cosine\_distance} / 2.0)$.
- **top_k**: Default is 5. Configurable between 1 and 20.
