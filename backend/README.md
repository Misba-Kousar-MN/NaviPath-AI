# /backend

**Implemented.** PostgreSQL (PostGIS + pgvector) + SQLAlchemy 2.0 + Alembic + FastAPI, built against [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and [`../docs/DATABASE_IMPLEMENTATION_PLAN.md`](../docs/DATABASE_IMPLEMENTATION_PLAN.md). See [`../docs/DATABASE_IMPLEMENTATION_REPORT.md`](../docs/DATABASE_IMPLEMENTATION_REPORT.md) for what was actually built, run, and validated, and [`../docs/SUPABASE_SETUP.md`](../docs/SUPABASE_SETUP.md) for how to stand up a database and run this locally.

## Layout

```
backend/
├── requirements.txt
├── alembic.ini
├── .env.example              # copy to .env, fill in real values (never commit .env)
├── migrations/                # Alembic — 0001_initial_schema.py is the single source of DB truth
├── app/
│   ├── core/config.py         # Settings (env vars)
│   ├── db/                    # SQLAlchemy engine/session + declarative Base
│   ├── models/                # ORM models — one file per CSV table group, 1:1 with data/seed/*.csv
│   ├── schemas/                # Pydantic request/response contracts (separate from ORM models)
│   ├── services/               # Deterministic business logic: eligibility engine, pathway builder,
│   │                            # PostGIS nearby-centre search, recommendation assembly. No LLM here.
│   ├── api/routes/             # Thin FastAPI routers — parse request, call a service, return a schema
│   └── main.py                 # FastAPI app assembly
└── tests/                      # pytest — DB-dependent tests SKIP (not fail) with no live database
```

## Quickstart

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then edit .env with a real DATABASE_URL
python -m alembic upgrade head
python ../scripts/seed_database.py
python ../scripts/validate_database.py
uvicorn app.main:app --reload
```

`contracts/response_contract.example.json` (pre-existing) is the original illustrative shape for a future combined `/api/v1/advice` endpoint; the actual implemented endpoints are the more granular set under `/api/*` documented in the implementation report and at `/docs` once the app is running.
