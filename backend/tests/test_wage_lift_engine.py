"""Unit and contract tests for Wage-Lift Engine (Innovation 3).

Verifies:
1. Deterministic wage lift arithmetic in Python (never by LLM).
2. Honest handling of missing benchmarks (status='partial' or 'not_available', no fabrication).
3. Mandatory provenance and disclaimer presence.
4. Correct percentage and absolute math.
"""
from __future__ import annotations

import pytest

from app.schemas.skill_bridge import WageBenchmarkOut, WageLiftOut
from app.services.wage_lift import calculate_wage_lift


def _make_benchmark(
    benchmark_id: str,
    occupation_name: str,
    median_inr: float | None,
    min_inr: float | None = None,
    max_inr: float | None = None,
) -> WageBenchmarkOut:
    return WageBenchmarkOut(
        benchmark_id=benchmark_id,
        occupation_name=occupation_name,
        employment_type="salaried",
        wage_type="salary",
        monthly_min_inr=min_inr,
        monthly_median_inr=median_inr,
        monthly_max_inr=max_inr,
        currency="INR",
        geography_level="state",
        state="Karnataka",
        source_id="src-027",
        source_title="Labour Bureau Wage Survey",
        confidence="verified",
    )


class TestWageLiftCalculation:
    """Deterministic arithmetic tests — pure Python execution."""

    def test_both_benchmarks_present_positive_lift(self):
        curr = _make_benchmark("wb-1", "Delivery Rider", 16000.0)
        tgt = _make_benchmark("wb-2", "Electrician", 20500.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "available"
        assert lift.absolute_lift_inr == 4500.0
        # 4500 / 16000 * 100 = 28.125 -> round 28.12
        assert lift.percentage_lift == 28.12
        assert len(lift.disclaimer) > 10

    def test_both_benchmarks_present_negative_lift(self):
        curr = _make_benchmark("wb-1", "Senior Fitter", 25000.0)
        tgt = _make_benchmark("wb-2", "Junior Assistant", 18000.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "available"
        assert lift.absolute_lift_inr == -7000.0
        assert lift.percentage_lift == -28.0

    def test_missing_target_benchmark_returns_partial(self):
        curr = _make_benchmark("wb-1", "Delivery Rider", 16000.0)
        lift = calculate_wage_lift(curr, None)

        assert lift.status == "partial"
        assert lift.absolute_lift_inr is None
        assert lift.percentage_lift is None

    def test_missing_current_benchmark_returns_partial(self):
        tgt = _make_benchmark("wb-2", "Electrician", 20500.0)
        lift = calculate_wage_lift(None, tgt)

        assert lift.status == "partial"
        assert lift.absolute_lift_inr is None
        assert lift.percentage_lift is None

    def test_missing_both_benchmarks_returns_not_available(self):
        lift = calculate_wage_lift(None, None)

        assert lift.status == "not_available"
        assert lift.absolute_lift_inr is None
        assert lift.percentage_lift is None

    def test_benchmark_with_null_median_treated_as_missing_median(self):
        curr = _make_benchmark("wb-1", "Domestic Worker", None)
        tgt = _make_benchmark("wb-2", "Electrician", 20500.0)

        lift = calculate_wage_lift(curr, tgt)
        assert lift.status == "partial"
        assert lift.absolute_lift_inr is None

    def test_disclaimer_mandatory_and_truthful(self):
        curr = _make_benchmark("wb-1", "Auto Driver", 15000.0)
        tgt = _make_benchmark("wb-2", "Motor Vehicle Mechanic", 21000.0)

        lift = calculate_wage_lift(curr, tgt)
        assert "not guaranteed" in lift.disclaimer.lower() or "indicative" in lift.disclaimer.lower()
