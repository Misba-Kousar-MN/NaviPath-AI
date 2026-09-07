# Database Implementation Plan

Written before any schema/migration/seed code, per the inspection-first requirement. Covers the 12 required areas. This plan documents *decisions*, not just intent — where the real CSV data forced a specific choice (see §1), that choice and its reasoning are recorded here so it isn't silently re-derived differently later.

## 1. Existing CSV schema (as actually inspected, not assumed)

15 CSVs in `data/seed/`, headers match `data/templates/` exactly (column-for-column). Row counts as of this pass: occupations 13, skills 14, occupation_skills 10, skill_transitions 7, courses 12, training_centres 140, centre_courses 21, schemes 5, eligibility_rules 15, documents 4, scheme_documents 5, sources 26, evidence 33, locations 6, document_chunks 9.

Before modeling, every "enum-like" column across all 15 CSVs was inspected for its **actual** distinct values (not just the architecture doc's original spec), because the population passes introduced values the original `docs/ARCHITECTURE.md` didn't anticipate. Two real bugs were found and fixed in `data/seed/` as part of this inspection (not schema work — data fixes):

- `centre_courses.csv` row `cc-001`: `freshness_flag` contained a full explanatory sentence instead of the status value `CURRENT` (the explanation is already properly captured in `evidence.csv` rows `ev-014`/`ev-015`, so the sentence was redundant and unsafe to keep in a status column). Fixed to `CURRENT`.
- `document_chunks.csv` rows `chk-007`–`chk-009`: `promoted_to_evidence` (a boolean per the architecture) contained the string `not-promoted` instead of `false`. Fixed to `false`.

Both fixes were verified with `python scripts/validate_dataset.py` (still `RESULT: PASS`, same 2 pre-existing informational warnings) before any schema work began.

Key real-data findings that shaped the schema below:
- `courses.fee_type` legitimately contains the literal sentinel string `REQUIRES OFFICIAL SOURCE VERIFICATION` (not one of `free/subsidized/paid`) for every current row — this is the project's standing "don't fabricate" convention, not bad data. A strict CHECK constraint here would reject real, correctly-populated rows.
- `training_centres.type` now has 4 real values (`govt-ITI`, `Private ITI`, `NSTI-central-institute`, `KSDC-centre`) that only partially overlap the architecture doc's original enum — the value set organically grew as new source types were integrated.
- `document_chunks.promoted_to_evidence` and other boolean-typed CSV columns store the literal string `true`/`false` (CSV has no native boolean type).
- Several fields carry semicolon/comma-separated sub-lists inside one quoted CSV cell (e.g. `eligibility_rules.value` for `in`/`not_in` operators, `courses.languages_supported`).

## 2. Proposed PostgreSQL schema

One table per CSV (15 tables), `TEXT` primary keys equal to the existing CSV IDs (see §4), plus `created_at`/`updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` on every table (not present in the CSVs — populated at import time). Column types:

| CSV type | Postgres type |
|---|---|
| id-like string (`occ-001`, `src-007`, ...) | `TEXT` |
| free text | `TEXT` |
| `true`/`false` string | `BOOLEAN` |
| date (`YYYY-MM-DD` or empty) | `DATE NULL` |
| numeric (duration, fee, lat/lng) | `NUMERIC NULL` (lat/lng also feed the PostGIS `geography` column, §7) |
| enum-like column with a small, fully-observed, stable value set | `TEXT` + `CHECK (... IN (...))` |
| enum-like column containing the `REQUIRES OFFICIAL SOURCE VERIFICATION` sentinel, or an organically-grown value set (`courses.fee_type`, `training_centres.type`) | `TEXT`, **no CHECK constraint** (deliberate — see §1) |

Full column-by-column DDL lives in `backend/migrations/versions/0001_initial_schema.py` (the single source of truth); this plan doesn't duplicate every column here.

## 3. Relationships

Mirrors `docs/ARCHITECTURE.md` Section C exactly:

```
occupations 1--* occupation_skills *--1 skills
occupations 1--* skill_transitions (from_occupation_id)
skills      1--* skill_transitions (to_skill_id)
skills      1--* courses
courses     1--* centre_courses *--1 training_centres
schemes     1--* eligibility_rules
schemes     1--* scheme_documents *--1 documents
sources     1--* evidence (evidence.related_entity_id is a *soft* reference — see below)
sources     1--* document_chunks
(occupations|skills|courses|training_centres|schemes|eligibility_rules|documents).source_id -> sources  [optional]
```

`evidence.related_entity_id` is **not** a database foreign key: `related_entity_type` determines which of 7 different tables it points into (architecture Section D #14), and Postgres has no native polymorphic FK. It is validated at the application layer (`scripts/validate_database.py` and a service-layer check), exactly as `scripts/validate_dataset.py` already does for the CSV today.

## 4. Primary keys

Every table's primary key is its existing CSV `id` column, typed `TEXT`, **not** regenerated as a UUID. Rationale: the CSVs already use stable, human-auditable, semantically-prefixed string IDs (`occ-001`, `src-007`); switching to UUIDs would (a) break the deterministic CSV-ID → DB-ID mapping the task explicitly requires, and (b) make every report/evidence-citation in `docs/` (which already reference these exact IDs) instantly stale. A `gen_random_uuid()`-backed surrogate key was considered and rejected for this reason.

## 5. Foreign keys

All FKs listed in §3 (the "hard" ones) are enforced with real `REFERENCES` constraints, `ON DELETE RESTRICT` (never cascade-delete a fact silently — deleting a `sources` row that 40 other rows cite should fail loudly, not quietly orphan them). All FK columns that are optional in the architecture (`source_id` on `occupations`, `skills`, `skill_transitions`) are nullable.

## 6. Indexes

- Every FK column gets a plain B-tree index (Postgres doesn't auto-index FK columns).
- `training_centres.district`, `training_centres.location` (GIST, §7), `courses.skill_id`, `occupation_skills.occupation_id`, `centre_courses.centre_id`/`course_id` — the columns the API's hot paths (`/training-centres`, `/training-centres/nearby`, `/pathways`) actually filter/join on.
- `UNIQUE (occupation_id, skill_id)` on `occupation_skills` and `UNIQUE (centre_id, course_id)` on `centre_courses` — prevents the exact "cartesian product" duplication failure mode the data-population passes were explicitly instructed to avoid; enforced at the DB level now, not just by convention.
- `document_chunks.embedding` gets an IVFFlat vector index — created but practically inert until embeddings exist (§9).

## 7. PostGIS strategy

- Extension: `CREATE EXTENSION IF NOT EXISTS postgis;`
- `training_centres` keeps its existing `latitude`/`longitude NUMERIC NULL` columns (unchanged, preserves the exact source-verified values) **and** gains a generated `location geography(Point, 4326) NULL` column, computed only when both lat/lng are present and non-null: `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`. Implemented as a Postgres `GENERATED ALWAYS AS (...) STORED` column so it can never drift from lat/lng and never needs a sync trigger.
- Centres with no verified coordinates keep `latitude = longitude = location = NULL` and are simply excluded from any `ST_DWithin`/distance query (a `WHERE location IS NOT NULL` guard, never a fabricated coordinate).
- GIST index: `CREATE INDEX ix_training_centres_location ON training_centres USING GIST (location);`
- Nearby-search query (`/api/training-centres/nearby`): `ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, :radius_km * 1000)` ordered by `ST_Distance(...)`, joined through `centre_courses`/`courses` when a skill/course filter is supplied.

## 8. pgvector strategy

- Extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- `document_chunks.embedding vector(N)` — **no embedding model is configured anywhere in this repository yet** (confirmed by inspecting `config/`, `rag/README.md`, and the architecture doc — all say "not implemented"). Per the explicit instruction not to hard-code an incorrect dimension, `N` is read from the `EMBEDDING_DIMENSION` environment variable at migration/config time rather than literal-coded in the schema philosophy — but Postgres `vector(N)` requires a fixed N at column-creation time, so the migration creates the column with whatever `EMBEDDING_DIMENSION` resolves to in `.env` (default **768**, documented in `.env.example` as provisional pending final model selection — 768 matches Gemini's `text-embedding-004`, the embedding provider the architecture doc lists first). **Changing embedding models later requires a follow-up migration** (`ALTER COLUMN embedding TYPE vector(new_dim)`) — this is called out explicitly in `.env.example` and `docs/SUPABASE_SETUP.md` so it isn't a silent trap.
- No embeddings are generated by any script in this pass. `embedding` stays `NULL` for all 9 seeded chunks; `embedding_status` (already `not-generated` in the CSV) is preserved as-is.
- IVFFlat index (`vector_cosine_ops`) is created but genuinely low-value until embeddings exist (IVFFlat needs representative data to build useful lists) — documented as a placeholder, not claimed as tuned.

## 9. CSV → database mapping

One-to-one, column-for-column, table-for-table (`data/seed/<table>.csv` → `<table>` Postgres table, same column names). No renaming, no denormalization. `scripts/seed_database.py` reads each CSV with `csv.DictReader` and inserts using the exact header names as column names — this makes the mapping self-documenting and eliminates an entire class of "which CSV column maps to which DB column" bugs.

## 10. Migration strategy

Alembic, single initial revision (`backend/migrations/versions/0001_initial_schema.py`) containing: both `CREATE EXTENSION` statements, all 15 tables, all constraints, all indexes. Future schema changes get their own revisions (never edit `0001` after it's been applied anywhere). `alembic upgrade head` is idempotent and safe to run against a fresh database; running it twice against an already-migrated database is a no-op (Alembic tracks the applied revision in `alembic_version`).

## 11. Seed strategy

`scripts/seed_database.py`: loads tables in strict dependency order (`sources` → `locations` → `occupations` → `skills` → `documents` → `schemes` → `occupation_skills` → `skill_transitions` → `courses` → `training_centres` → `centre_courses` → `eligibility_rules` → `scheme_documents` → `evidence` → `document_chunks`), one `INSERT ... ON CONFLICT (id) DO UPDATE` (upsert) per row so the script is safe to re-run. Every row is validated against its table's required-fields/FK rules (the same rules `scripts/validate_dataset.py` already encodes) **before** any insert is attempted; a row that fails validation is skipped with a logged reason, never silently dropped or partially inserted. Final summary: inserted / updated / skipped / error counts per table, mirroring the format requested.

## 12. API strategy

FastAPI + SQLAlchemy 2.0 (already installed in this environment) + Pydantic v2 schemas for request/response validation, separate from the ORM models (`app/models` = DB truth, `app/schemas` = API contract) so the wire format can evolve without touching table definitions. Services (`app/services`) contain the deterministic business logic (eligibility evaluation, pathway traversal, nearby-centre geo query, recommendation assembly) as plain Python functions operating on SQLAlchemy query results — no logic lives inside route handlers, and none of it is delegated to an LLM (per Architecture Section G/H and this task's explicit rule #8). Routes are thin: parse request → call service → return schema.
