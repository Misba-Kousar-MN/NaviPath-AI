# AI Skill Navigator for Informal Workers — Karnataka

A GenAI/no-code advisor helping informal workers in Karnataka answer: *what skill should I learn, where can I learn it nearby, and who pays/supports me?*

**Status: verified seed data, live on a real Supabase PostgreSQL/PostGIS/pgvector database, with a passing FastAPI + test suite.** `data/seed/` holds a real, source-traceable dataset (never fabricated); `backend/` implements the full schema, a deterministic eligibility engine, PostGIS-backed nearby-centre search, and a FastAPI layer on top of it — migrated, seeded (320 rows), validated, and covered by 28/28 passing tests against the live database. See [`docs/DATABASE_IMPLEMENTATION_REPORT.md`](docs/DATABASE_IMPLEMENTATION_REPORT.md) for exact results. The frontend/Voiceflow/Bhashini layer is still not built.

## Start here

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the complete data and knowledge architecture specification: entities, data dictionary, provenance rules, RAG design, deterministic eligibility engine, skill-recommendation logic, location matching, the API/JSON contract, golden test cases, failure handling, and the two-person work split.
- [`docs/DATABASE_IMPLEMENTATION_PLAN.md`](docs/DATABASE_IMPLEMENTATION_PLAN.md) / [`docs/DATABASE_IMPLEMENTATION_REPORT.md`](docs/DATABASE_IMPLEMENTATION_REPORT.md) — the Postgres schema design and what was actually built/run/validated.
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — how to stand up the database (Supabase or local Postgres) and run the API.
- [`docs/DATASET_COMPLETION_REPORT.md`](docs/DATASET_COMPLETION_REPORT.md) / [`docs/PATHWAY_MAPPING_REPORT.md`](docs/PATHWAY_MAPPING_REPORT.md) — what's in `data/seed/`: record counts, verification status, golden-test-case coverage, and known gaps.
- [`docs/DATA_SOURCE_REGISTRY.md`](docs/DATA_SOURCE_REGISTRY.md) — every official source used, with URL, what was extracted, and confidence level.

Run `python scripts/validate_dataset.py` and `python scripts/test_dataset.py` to check the seed CSVs; `cd backend && python -m alembic upgrade head && python ../scripts/seed_database.py && python ../scripts/validate_database.py` to stand up and check the live database (see `docs/SUPABASE_SETUP.md`).

## Repository layout

```
docs/        architecture, database plan/report, source registry, dataset/pathway/coverage reports
data/        seed/ (real, verified-first dataset) + templates/ (empty CSV schemas) + population rules
scripts/     validate_dataset.py / test_dataset.py (CSVs) + seed_database.py / validate_database.py (Postgres)
backend/     PostgreSQL+PostGIS+pgvector schema, deterministic eligibility/pathway/geo services, FastAPI API
frontend/    Member 2's territory: Voiceflow/Bhashini/Bubble — not yet implemented
rag/         extraction/chunking/embedding pipeline notes + document_chunks seed data
config/      environment/config placeholders (no secrets committed)
tests/       golden test cases — see backend/tests/ for the automated pytest suite
```

## The one rule that governs everything here

No Karnataka government scheme, training centre, eligibility rule, benefit, or URL is ever invented. If it isn't backed by a verified official source in the `sources`/`evidence` tables, the system reports **"REQUIRES OFFICIAL SOURCE VERIFICATION"** or **"uncertain."** See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) Section E.
