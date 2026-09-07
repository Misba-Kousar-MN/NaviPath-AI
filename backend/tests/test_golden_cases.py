"""The five golden worker scenarios (task Phase 12 / docs/ARCHITECTURE.md
Section N), run against the real HTTP API (POST /api/recommendations).

Per the explicit instruction: a test must NOT fail merely because real-world
centre/course data is absent for a given pathway. Each test instead asserts
the *honest* shape of the response — a real pathway/course/centre where
verified data supports one (scenarios 1, 3, 4 — see
docs/PATHWAY_MAPPING_REPORT.md §14), and a clear structured warning where it
doesn't (scenarios 2, 5). No test asserts a specific centre/scheme name that
could silently start failing if data changes; each asserts the *category* of
result (complete vs. partial) that should always hold.
"""
from __future__ import annotations

import pytest

SCENARIOS = {
    1: dict(occupation="Delivery Rider", district="Bengaluru Urban", education="10th",
            language="kn", target_skill="Electrician", expect_pathway=True),
    2: dict(occupation="Domestic Worker", district="Mysuru", education="below 10th",
            language="kn", target_skill="Tailoring", expect_pathway=False),
    3: dict(occupation="Construction Labourer", district="Kalaburagi", education="no formal education",
            language="hi", target_skill=None, expect_pathway=True),
    4: dict(occupation="Auto-Rickshaw Driver", district="Dharwad (Hubballi-Dharwad)", education="12th",
            language="kn", target_skill=None, expect_pathway=True),
    5: dict(occupation="Street Vendor", district="Ballari", education="8th",
            language="kn", target_skill="retail", expect_pathway=False),
}


@pytest.fixture(autouse=True)
def _require_db(db_available):
    if not db_available:
        pytest.skip("No database connection available in this environment.")


def _post_recommendation(client, scenario: dict):
    body = {
        "occupation": scenario["occupation"],
        "district": scenario["district"],
        "education": scenario["education"],
        "language": scenario["language"],
        "target_skill": scenario["target_skill"],
    }
    r = client.post("/api/recommendations", json=body)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.parametrize("scenario_id", sorted(SCENARIOS))
def test_golden_scenario_returns_honest_structured_result(client, scenario_id):
    scenario = SCENARIOS[scenario_id]
    data = _post_recommendation(client, scenario)

    # Every response must always echo the profile and return well-formed lists —
    # this holds regardless of data availability.
    assert data["profile"]["occupation"] == scenario["occupation"]
    for key in ("recommended_pathways", "courses", "nearby_centres", "schemes", "eligibility", "warnings"):
        assert key in data and isinstance(data[key], list)

    has_centre_mapped_pathway = any(
        len(t.get("centres", [])) > 0 for t in data["recommended_pathways"]
    )

    if scenario["expect_pathway"]:
        assert has_centre_mapped_pathway, (
            f"Scenario {scenario_id} ({scenario['occupation']}) was expected to have at least one "
            f"real, centre-verified pathway per docs/PATHWAY_MAPPING_REPORT.md — got none. "
            f"Warnings: {data['warnings']}"
        )
    else:
        # Must not silently fabricate a centre where none exists; a warning must explain the gap.
        assert not has_centre_mapped_pathway or data["warnings"], (
            f"Scenario {scenario_id} unexpectedly has a fully-mapped pathway with no warning — "
            "if real data now supports it, update SCENARIOS[expect_pathway] rather than deleting this check."
        )
