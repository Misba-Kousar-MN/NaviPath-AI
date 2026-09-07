# Database Implementation Report

Generated 2026-09-05. Companion to [`DATABASE_IMPLEMENTATION_PLAN.md`](DATABASE_IMPLEMENTATION_PLAN.md) (written first, per the inspect-before-modifying requirement) and [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) (how to run this). This report documents what was actually built and what was actually run — every claim below is a command output reproduced verbatim, run against the user's real Supabase project (via the Session Pooler, ap-south-1). **The full pipeline — connect → migrate → seed → validate → test — has now been executed end to end against the live database; see §10–12 for real results.**

## 1. Final architecture

```
data/seed/*.csv  →  scripts/seed_database.py  →  PostgreSQL (PostGIS + pgvector)  ←  backend/app (SQLAlchemy models)
                                                          ↑
                                          backend/migrations/ (Alembic, single revision 0001)
                                                          ↑
                              backend/app/services/ (eligibility, pathways, geo, recommendations)
                                                          ↑
                                    backend/app/api/routes/ (FastAPI, thin routers)
                                                          ↑
                                              backend/app/main.py (app assembly)
```

Layered per the task's explicit split: `models/` = DB truth, `schemas/` = API contract (Pydantic, independent of the ORM), `services/` = deterministic business logic (no LLM anywhere in this repo, per Architecture Section G/H), `api/routes/` = thin HTTP glue.

## 2. Database tables

15 tables, one per `data/seed/*.csv`, `TEXT` primary keys equal to the existing CSV IDs (not regenerated as UUIDs — this keeps the CSV-ID → DB-ID mapping deterministic, per the task's explicit requirement): `sources`, `locations`, `document_chunks`, `occupations`, `skills`, `occupation_skills`, `skill_transitions`, `courses`, `training_centres`, `centre_courses`, `schemes`, `eligibility_rules`, `documents`, `scheme_documents`, `evidence`. Full column-by-column DDL: `backend/migrations/versions/0001_initial_schema.py`. Design rationale for every non-obvious choice (which enums got `CHECK` constraints vs. free `TEXT`, why `IDs` weren't converted to UUIDs, etc.): `docs/DATABASE_IMPLEMENTATION_PLAN.md` §1–2.

**Two real data bugs were found and fixed in `data/seed/` while inspecting the CSVs for this pass** (not schema work — see plan §1 for detail): `centre_courses.csv` row `cc-001` had a full sentence sitting in the `freshness_flag` column instead of `CURRENT`; `document_chunks.csv` rows `chk-007`–`chk-009` had the string `not-promoted` in the boolean `promoted_to_evidence` column instead of `false`. Both fixed; `python scripts/validate_dataset.py` still reports `RESULT: PASS` afterward.

## 3. Relationships

Mirrors `docs/ARCHITECTURE.md` Section C exactly (see plan §3 for the full diagram). All "hard" foreign keys are enforced with real `REFERENCES ... ON DELETE RESTRICT` constraints. One relationship is deliberately **not** a DB foreign key: `evidence.related_entity_id` is polymorphic (its target table depends on `evidence.related_entity_type`, and Postgres has no native polymorphic FK) — it's validated in application code instead, in both `scripts/seed_database.py` (before insert) and `scripts/validate_database.py` (after seed).

## 4. Indexes

Every FK column has a B-tree index (Postgres doesn't auto-index these). `UNIQUE (occupation_id, skill_id)` on `occupation_skills` and `UNIQUE (centre_id, course_id)` on `centre_courses` enforce at the DB level that no cartesian-product duplication can ever be inserted. `training_centres.district` is indexed for the district-filter list endpoint. `training_centres.location` has a GIST index (§5). `document_chunks.embedding` has an IVFFlat index (§6).

## 5. PostGIS implementation

`training_centres.location geography(Point, 4326)` is a **generated column** (`GENERATED ALWAYS AS (...) STORED`), computed from `latitude`/`longitude` using `ST_MakePoint`/`ST_SetSRID`. Because PostGIS's `ST_MakePoint` is a `STRICT` function, the generated expression automatically evaluates to `NULL` whenever either coordinate is `NULL` — **no coordinate is ever fabricated**, and no `CASE`/trigger logic can drift out of sync with `latitude`/`longitude` (it's derived at write time by Postgres itself, not by application code). A GIST index (`ix_training_centres_location`) supports the nearby-search query.

`GET /api/training-centres/nearby` (`backend/app/services/geo.py::find_nearby_centres`) implements exactly the required query: `WHERE location IS NOT NULL AND ST_DWithin(location, <point>, radius_km*1000)`, ordered by `ST_Distance(...)`, optionally joined through `centre_courses`/`courses` to filter by a specific course or skill. Every returned centre includes distance_km, district, address, `recognition_status`, a normalized `provenance` label (§9), and its mapped courses (if any) with their own freshness/provenance. Centres with `NULL` coordinates are structurally excluded from this query (via the generated-column NULL propagation) — never included with a fabricated distance.

## 6. pgvector implementation

`document_chunks.embedding vector(N)` where `N` is read from `EMBEDDING_DIMENSION` (`.env`, default **768**, documented as provisional pending final embedding-model selection — see `.env.example` and plan §8). No embedding model is wired up anywhere in this repository yet, and **no embeddings were generated or fabricated** in this pass — `embedding` is `NULL` for all 9 seeded chunks, `embedding_status` stays `not-generated` (unchanged from the CSV). An IVFFlat (`vector_cosine_ops`) index exists on the column but is honestly low-value until real embeddings populate it — documented as a placeholder, not claimed as tuned.

## 7. Seed process

`scripts/seed_database.py`: loads all 15 tables in strict dependency order, validates every row's required fields and FK references (including the polymorphic `evidence` check) **before** attempting any insert, then `INSERT ... ON CONFLICT (id) DO UPDATE` (upsert) — safe to re-run. Reports `inserted / updated / skipped / errors` per table and in aggregate; exits non-zero if anything was skipped or errored.

**Run against the live database — first run (empty tables):**

| Table | Inserted | Updated | Skipped | Errors |
|---|---|---|---|---|
| sources | 26 | 0 | 0 | 0 |
| locations | 6 | 0 | 0 | 0 |
| document_chunks | 9 | 0 | 0 | 0 |
| occupations | 13 | 0 | 0 | 0 |
| skills | 14 | 0 | 0 | 0 |
| documents | 4 | 0 | 0 | 0 |
| schemes | 5 | 0 | 0 | 0 |
| occupation_skills | 10 | 0 | 0 | 0 |
| skill_transitions | 7 | 0 | 0 | 0 |
| courses | 12 | 0 | 0 | 0 |
| training_centres | 140 | 0 | 0 | 0 |
| centre_courses | 21 | 0 | 0 | 0 |
| eligibility_rules | 15 | 0 | 0 | 0 |
| scheme_documents | 5 | 0 | 0 | 0 |
| evidence | 33 | 0 | 0 | 0 |
| **Total** | **320** | **0** | **0** | **0** |

`RESULT: PASS`. **Re-run immediately after (idempotency check)**: `Total inserted: 0  updated: 320  skipped: 0  errors: 0` — `RESULT: PASS`. Every CSV row landed; nothing was skipped for a validation failure or errored on insert.

## 8. API endpoints

All implemented in `backend/app/api/routes/`, verified via `TestClient` against the live OpenAPI schema (§13):

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | DB connectivity check; never crashes even with no database |
| GET | `/api/occupations` | list, filter by `search`/`sector` |
| GET | `/api/skills` | list, filter by `search`/`category` |
| GET | `/api/courses` | list, filter by `skill_id`/`occupation_id`/`course_type` |
| GET | `/api/training-centres` | list, filter by `district`/`search`/`status` (recognition_status) |
| GET | `/api/training-centres/nearby` | PostGIS distance query — `latitude`, `longitude`, `radius_km`, optional `course_id`/`skill_id` |
| GET | `/api/pathways` | deterministic occupation → skill → course → centre traversal |
| GET | `/api/schemes` | list all schemes |
| POST | `/api/schemes/check-eligibility` | deterministic eligibility engine — returns `eligible`/`not_eligible`/`uncertain` per scheme, with per-rule reasons and evidence |
| POST | `/api/recommendations` | full structured recommendation assembly (profile → pathway → courses → nearby centres → schemes → eligibility → evidence count → warnings) |

`GET /docs` (Swagger UI) and `/openapi.json` are auto-generated by FastAPI.

## 9. Provenance handling

No new provenance column was added to any table (the existing `verification_status`/`curation_status`/`rule_status`/`recognition_status`/`freshness_flag` columns already carry this per-row, and duplicating it would let the two copies drift). Instead, `backend/app/schemas/common.py` derives one normalized, API-facing label from whichever status field a given row already has:

- `sources.verification_status='verified'` → **OFFICIAL_VERIFIED**; `pending-review`/`broken-link`/`superseded` → **NEEDS_REVALIDATION**; anything else → **UNVERIFIED**.
- `training_centres.recognition_status='govt-recognized'`/`'empanelled'` → **OFFICIAL_VERIFIED**; `'private-recognized'` → **CURATED** (existence/address verified via an official portal, but current operating status not confirmed — see `docs/KARNATAKA_COVERAGE_REPORT.md`); `'unverified'`/unset → **UNVERIFIED**.
- `centre_courses.freshness_flag='CURRENT'` → **OFFICIAL_VERIFIED**; `'HISTORICAL'`/`'NEEDS_REVALIDATION'` → **NEEDS_REVALIDATION**.

**DEMO** exists in the enum for future use (e.g. a hackathon-day illustrative fixture) but no current row in `data/seed/` maps to it — nothing in this dataset is presented as a demo fact.

## 10. Validation results

`scripts/validate_database.py` checks table existence, row counts, duplicate IDs, orphan records (including the polymorphic evidence check), relationship counts (occupation-skill, skill-transition, centre-course, scheme-document), spatial data validity (lat/lng ↔ `location` consistency, out-of-Karnataka-bounding-box warning), and provenance/status value distributions. **Run against the live, seeded database:**

```
--- Row counts ---
sources 26  locations 6  document_chunks 9  occupations 13  skills 14
occupation_skills 10  skill_transitions 7  courses 12  training_centres 140
centre_courses 21  schemes 5  eligibility_rules 15  documents 4
scheme_documents 5  evidence 33

--- Duplicate ID checks --- None (primary keys enforce this at the DB level).
--- Orphan checks --- evidence.related_entity_id: all resolve correctly.

--- Relationship counts ---
occupation_skills: 10   skill_transitions: 7   centre_courses: 21   scheme_documents: 5
training_centres with >=1 mapped course: 10 / 140
courses with >=1 mapped centre: 9 / 12

--- Spatial data validity ---
centres with lat/lng -> location populated: 0/0 (consistent)
centres with NULL coordinates (excluded from nearby search, by design): 140

--- Provenance / status value distributions ---
sources.verification_status: broken-link=1, pending-review=13, verified=12
training_centres.recognition_status: govt-recognized=14, private-recognized=126
centre_courses.freshness_flag: CURRENT=21
eligibility_rules.rule_status: needs-review=5, verified=10
evidence.verification_status: candidate-unverified=1, verified=32

FAILURES: 0   WARNINGS: 0   STATUS: PASS
```

**Notable, honest finding**: all 140 training centres currently have `NULL` coordinates — none were fabricated to make the PostGIS query "work." `GET /api/training-centres/nearby` therefore returns no results today; §11 explains a real bug this surfaced and how it was fixed without inventing any coordinate.

## 11. Test results (actually run, against the live database)

```
cd backend && python -m pytest tests/ -v
======================= 28 passed, 1 warning in 10.70s ========================
```

**28 passed, 0 skipped, 0 failed** — every test now runs for real against the live Supabase database: all 10 required database-query tests, all 5 golden scenarios, the fabrication-guard test, plus the 9 eligibility-engine unit tests and 3 API smoke tests. Getting there required fixing three real bugs the live run surfaced (fixed, not worked around):

1. **`last_verified` / `publication_date` / `retrieved_date` type mismatch (9 columns across `provenance.py`, `training.py`, `schemes.py`).** Every one of these was declared `Mapped[str | None] = mapped_column(Date)` — a real `Date` column with a Python type hint that lied about it being `str`. Postgres correctly returns a `datetime.date` object on read, which the matching Pydantic schemas (`CourseOut`, `SchemeOut`, `TrainingCentreOut`) rejected because *they* were also typed `str | None`. Fixed by correcting both the SQLAlchemy `Mapped[date | None]` annotations and the three Pydantic schema fields to `date | None`. This only surfaced against real data because CSV-only inspection never exercises the ORM's read path.
2. **Free-text occupation matching failed on compound seed names.** The golden scenarios ask for "Delivery Rider" and "Auto-Rickshaw Driver," but the verified seed data names these occupations "Delivery / Courier Rider" (`occ-005`) and "Auto-Rickshaw / Taxi Driver" (`occ-007`) — plain substring `ILIKE` matching doesn't span the `/`. Fixed in `app/services/pathways.py` by adding a deterministic whole-word-token fallback (`_find_by_text`): every significant word in the query must appear as a whole word in a candidate's `name_en`; picks the most specific match on ties. This does not invent, rename, or guess any record — it only makes matching a real, existing record more robust to plain-language phrasing.
3. **Nearby-centre search silently hid verified centre-course mappings.** `build_pathway` originally used `find_nearby_centres` exclusively whenever a worker's location was known (via district centroid), and that query correctly excludes every centre with a `NULL` coordinate — which, per §10, is *all 140 centres right now*. That meant real, source-verified `centre_courses` links (e.g. Construction Labourer → Fitter → 6 real ITIs) were being hidden the moment a district was supplied, even though the exact same query with no location returned them correctly. Fixed by having `build_pathway` always union in every verified `centre_courses` linkage for a course (keeping `distance_km=None` for any centre a geo search didn't independently place), so a real mapping is never hidden for lack of a coordinate — and no distance is ever fabricated for it either.

## 12. Supabase setup — what actually happened

The user's first `backend/.env` used Supabase's **direct-connect** hostname (`db.<project-ref>.supabase.co`), which this sandbox could not resolve:

```
psycopg.OperationalError: failed to resolve host 'db.<project-ref>.supabase.co':
[Errno 11001] getaddrinfo failed
```

Diagnosed (not assumed) as Supabase's direct-connect hostname being IPv6-only against this IPv4-only sandbox — `supabase.co`, `app.supabase.com`, and the pooler subdomains all resolved fine independently. The user was asked for, and provided, the **Session Pooler** connection string instead (`aws-0-ap-south-1.pooler.supabase.com:5432`, username `postgres.<project-ref>`), which is IPv4-compatible. With that in `backend/.env`, the connection succeeded immediately:

```
scheme: postgresql+psycopg
connected OK
PostgreSQL 17.6 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
```

`postgis` (3.3.7) and `vector` (0.8.2) were both confirmed **available** (`pg_available_extensions`) before the migration ran, and confirmed **installed** (`pg_extension`) immediately after — `CREATE EXTENSION IF NOT EXISTS` in the migration succeeded with no permission issues on this project.

## 13. Known limitations

1. **All 140 training centres have `NULL` coordinates.** No lat/lng data was ever sourced with enough confidence to enter it (see `docs/KARNATAKA_COVERAGE_REPORT.md`), so `location` is `NULL` for every row and `GET /api/training-centres/nearby` returns no results against real data today. This is surfaced honestly (§10, §11.3), never worked around by fabricating a coordinate.
2. **`EMBEDDING_DIMENSION=768` is provisional.** No embedding model is configured anywhere in this project yet. `embedding` is `NULL` for all 9 seeded `document_chunks`. Changing the dimension after real embeddings exist requires a new Alembic migration (`ALTER COLUMN embedding TYPE vector(new_dim)`), not just an `.env` edit — documented in `.env.example` and plan §8.
3. **`eligibility_rules.value` is stored as raw `TEXT`, not `JSONB`** (a deliberate simplification — see plan §1): real seed values include plain scalars, `;`-delimited lists, and the `REQUIRES OFFICIAL SOURCE VERIFICATION` sentinel, none of which is valid JSON without extra handling. `app/services/eligibility.py` parses it directly.
4. **The PM Vishwakarma trade list (`in`/`not_in` eligibility rules) is matched against the request's free-text `occupation` field, normalized to a slug** (e.g. "Tailor" → `tailor`), not against the `occupations.id` primary key — the CSV's rule values are trade-name slugs (`carpenter`, `mason`, ...) from an entirely different vocabulary than the 13-row `occupations` table's IDs (`occ-001`, ...). This is documented in code comments in `app/services/eligibility.py`, not silently papered over.
5. **`fee_type`, `training_centres.type`, and a few other columns are intentionally `TEXT` with no `CHECK` constraint**, because real seed data legitimately contains the `REQUIRES OFFICIAL SOURCE VERIFICATION` sentinel or an organically-grown value set that doesn't match the original architecture doc's enum — constraining them would reject real, correctly-populated rows (see plan §1–2).
6. **Only 10 of 140 training centres (7.1%) and 9 of 12 courses have any verified `centre_courses` mapping** — this is the real, source-limited state of the dataset (see `docs/PATHWAY_MAPPING_REPORT.md`), not a database-layer gap. A worker whose occupation/skill doesn't hit one of the mapped courses gets an honest "no verified training centre yet" warning rather than a fabricated result.
7. **Nothing from the LLM/RAG-consumption layer is built** — this pass's scope was explicitly the database + deterministic API layer; `POST /api/recommendations` returns structured facts only, with no natural-language generation, per the task's explicit instruction not to build that yet.
8. **No authentication, no admin dashboard, no separate vector DB, no message queue** — deliberately, per the task's explicit "do not overengineer" instruction.

## 14. Next steps for frontend integration

1. **Get real coordinates for at least the 10 currently-mapped training centres** (from an authoritative source — never estimated) so `GET /api/training-centres/nearby` has something to return; this is the highest-value next step given §13.1.
2. **Frontend/Voiceflow integration boundary**: `POST /api/recommendations` (schema: `backend/app/schemas/recommendation.py`) is the single richest endpoint and the closest match to the original `backend/contracts/response_contract.example.json` shape from the pre-hackathon architecture — start there. `GET /docs` (once the app is running) gives an interactive, always-current contract for every endpoint.
3. **LLM phrasing layer** (not built): per `docs/ARCHITECTURE.md` Section F/G, it should sit strictly downstream of `/api/recommendations`'s structured JSON, translating/phrasing the already-computed `warnings`, `eligibility.reasons`, and `recommended_pathways.rationale` fields into Kannada/Hindi/English — never re-deciding eligibility or inventing a centre/course itself.
4. **Once embeddings exist**, `EMBEDDING_DIMENSION` must be finalized against the real chosen model before generating any — changing it later is a schema migration, not a config edit (see §13.2).
