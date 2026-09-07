# Supabase Setup

How to stand up this project's PostgreSQL schema on Supabase (the preferred deployment target) and run it locally against that database. The application is plain PostgreSQL + PostGIS + pgvector underneath — nothing here is Supabase-proprietary, so the same steps work against any Postgres 15+ instance with those two extensions available (see "Local PostgreSQL instead" at the bottom).

## 1. Create the database

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Supabase provisions a Postgres 15+ database automatically — no manual `CREATE DATABASE` step needed.
3. In the dashboard: **Project Settings → Database → Connection String**. You'll use two different connection strings (see step 3 below) — don't just copy the first one you see.

## 2. Required extensions

Both are already available on every Supabase project (no request/approval needed) — this project's Alembic migration enables them itself:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

You don't need to run this manually; `alembic upgrade head` (step 4) does it.

## 3. How to obtain DATABASE_URL

**Important — Supabase gives you three different connection strings; pick the right one for each use:**

| Purpose | Which Supabase connection string | Port | Why |
|---|---|---:|---|
| Running the FastAPI app (`DATABASE_URL`) | **Transaction pooler** (or Session pooler) | 6543 (transaction) / 5432 (session) | Handles many short-lived connections well; what the app uses at runtime. |
| Running Alembic migrations (`DIRECT_DATABASE_URL`) | **Session pooler** or **Direct connection** | 5432 | Migrations need a stable session; the transaction pooler can break mid-migration DDL. |

**A note specific to this project, learned the hard way in this session:** Supabase's plain "Direct connection" hostname (`db.<project-ref>.supabase.co`) is **IPv6-only**. If you're running from an IPv4-only network (many sandboxes, some corporate/CI networks, some home ISPs), that hostname will fail to resolve at all (`getaddrinfo failed` / "could not translate host name"). If you hit that, use the **Session pooler** connection string instead (`aws-0-<region>.pooler.supabase.com:5432`, username `postgres.<project-ref>`) — it's IPv4-compatible and works everywhere. This is exactly what happened during this project's initial implementation pass; see `docs/DATABASE_IMPLEMENTATION_REPORT.md` → "Known limitations."

Copy the chosen string(s) into `backend/.env` (create it from `backend/.env.example` — never commit the real file):

```bash
cp backend/.env.example backend/.env
# then edit backend/.env with your real values
```

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

(The app's config layer, `backend/app/core/config.py`, automatically upgrades a bare `postgresql://` URL to use the `psycopg` v3 driver actually installed by `requirements.txt` — you don't need to add `+psycopg` yourself.)

## 4. How to run migrations

```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
```

This creates all 15 tables, extensions, constraints, and indexes described in `docs/DATABASE_IMPLEMENTATION_PLAN.md`. Safe to re-run (Alembic tracks the applied revision in `alembic_version` and no-ops if already current).

## 5. How to seed

```bash
# from the repo root
python scripts/seed_database.py
```

Loads every `data/seed/*.csv` row into the database in dependency order, upserting by `id` (safe to re-run). Prints inserted/updated/skipped/error counts per table.

## 6. How to validate

```bash
python scripts/validate_database.py
```

Row counts, orphan checks (including the polymorphic `evidence.related_entity_id`, which is not a DB-level foreign key), spatial data sanity, and provenance-status distributions — the live-database counterpart of `scripts/validate_dataset.py`.

## 7. How to run FastAPI locally against Supabase

```bash
cd backend
uvicorn app.main:app --reload
```

Then open `http://localhost:8000/docs` for interactive API docs, or `http://localhost:8000/health` to confirm database connectivity.

## Local PostgreSQL instead

If you'd rather not use Supabase at all, any local Postgres 15+ with PostGIS and pgvector works identically — just point `DATABASE_URL`/`DIRECT_DATABASE_URL` at it (e.g. `postgresql://postgres:postgres@localhost:5432/skill_navigator`) and run steps 4–7 the same way. On most distros: `apt install postgresql postgresql-15-postgis-3 postgresql-15-pgvector` (or the Postgres.app / Docker `postgis/postgis` + a pgvector-enabled image on Mac/Windows). This environment's sandbox had neither Docker nor a local Postgres available, so this path was not exercised in this pass — see the implementation report.
