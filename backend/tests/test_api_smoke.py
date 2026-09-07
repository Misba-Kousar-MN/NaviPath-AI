"""API-layer smoke tests that don't require a live database — they verify
the app boots, every route is registered, and /health reports honestly
whichever way the database connection actually goes (never crashes).
"""
from __future__ import annotations


def test_health_endpoint_never_crashes(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert body["database"] in ("connected", "disconnected")


def test_openapi_schema_has_expected_paths(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = set(r.json()["paths"].keys())
    expected = {
        "/health",
        "/api/occupations",
        "/api/skills",
        "/api/courses",
        "/api/training-centres",
        "/api/training-centres/nearby",
        "/api/pathways",
        "/api/schemes",
        "/api/schemes/check-eligibility",
        "/api/recommendations",
    }
    missing = expected - paths
    assert not missing, f"Routes missing from OpenAPI schema: {missing}"


def test_docs_ui_serves(client):
    r = client.get("/docs")
    assert r.status_code == 200
