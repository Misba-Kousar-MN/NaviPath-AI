# /tests

The automated test suite now lives at [`../backend/tests/`](../backend/tests/) (pytest): the five golden test cases from [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) Section N (`test_golden_cases.py`), the 10 required database-query tests (`test_database_queries.py`), unit tests for the deterministic eligibility engine (`test_eligibility_service.py`), and API smoke tests (`test_api_smoke.py`).

Run with:

```bash
cd backend
python -m pytest tests/ -v
```

Tests that need a live database automatically **skip** (never silently pass or fabricate a result) when no database is reachable — see `backend/tests/conftest.py` and `docs/DATABASE_IMPLEMENTATION_REPORT.md` for current status.

This top-level `tests/` directory is kept for any future non-backend tests (e.g. frontend/Voiceflow flow tests) once that layer is built.
