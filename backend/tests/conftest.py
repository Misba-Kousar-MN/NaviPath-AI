"""Shared pytest fixtures.

Tests that need a live database automatically SKIP (never fail/fabricate)
when no database is reachable — this environment's sandbox cannot resolve
Supabase's direct-connect hostname (see docs/DATABASE_IMPLEMENTATION_REPORT.md
"Known limitations"), so these fixtures are what let `pytest` still run
usefully (exercising the pure business logic and the API layer) even without
DB connectivity, while being explicit that the DB-dependent tests were
skipped, not silently "passed."
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


def _db_reachable() -> bool:
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return True
    except Exception:  # noqa: BLE001
        return False


DB_AVAILABLE = _db_reachable()


@pytest.fixture(scope="session")
def db_available() -> bool:
    return DB_AVAILABLE


@pytest.fixture()
def db_session():
    if not DB_AVAILABLE:
        pytest.skip("No database connection available in this environment.")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client():
    from starlette.testclient import TestClient

    with TestClient(app) as c:
        yield c
