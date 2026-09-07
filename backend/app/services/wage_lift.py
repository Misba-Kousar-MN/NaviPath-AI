"""Wage-Lift Engine — deterministic wage benchmark retrieval and lift calculation.

Innovation 3: Skill-Bridge & Wage-Lift Engine.

STRICT RULES:
- All calculations are performed in Python. The LLM never receives raw numeric
  wage values to compute — only the already-calculated results.
- NULL median values produce wage_status='not_available'. No fabrication.
- Every returned benchmark carries full source provenance.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.mock_wages import (
    DATA_STATUS_MOCK,
    MOCK_DISCLAIMER,
    SOURCE_LABEL,
    find_mock_wage,
)
from app.models.provenance import Source
from app.models.wage_benchmark import WageBenchmark
from app.schemas.skill_bridge import (
    WageBenchmarkOut,
    WageLiftOut,
    WageOccupationSummary,
)

logger = logging.getLogger(__name__)

_WAGE_DISCLAIMER = (
    "Indicative earning benchmark based on available source data. "
    "Actual income may vary by location, experience, employer, certification "
    "and employment type. For self-employed workers this is not guaranteed income."
)


def get_wage_benchmark(
    db: Session,
    occupation_id: str | None,
    district: str | None = None,
    occupation_name: str | None = None,
) -> WageBenchmarkOut | None:
    """Retrieve the best available wage benchmark for an occupation.

    Priority:
    1. Verified database benchmark with valid median (district > state > national)
    2. Fallback to mock dataset for hackathon demonstration with explicit mock labels
    3. Returns None if neither exists — no fabrication.
    """
    if occupation_id:
        stmt = (
            select(WageBenchmark)
            .where(WageBenchmark.occupation_id == occupation_id)
            .order_by(
                _geography_priority_expr(),
            )
        )
        rows = db.execute(stmt).scalars().all()
        if rows:
            chosen = rows[0]
            if district:
                for row in rows:
                    if row.district and row.district.lower() == district.lower():
                        chosen = row
                        break

            # If DB row has a valid median, return it
            if chosen.monthly_median_inr is not None:
                source = db.get(Source, chosen.source_id)
                source_title = source.title if source else "Unknown source"
                source_url = source.official_url if source else None

                logger.info(
                    "Database wage benchmark retrieved for occupation_id=%s (confidence=%s)",
                    occupation_id,
                    chosen.confidence,
                    extra={
                        "event": "wage_benchmark_retrieved",
                        "occupation_id": occupation_id,
                        "confidence": chosen.confidence,
                    },
                )

                return WageBenchmarkOut(
                    benchmark_id=chosen.id,
                    occupation_id=chosen.occupation_id,
                    occupation_name=chosen.occupation_name,
                    employment_type=chosen.employment_type,
                    wage_type=chosen.wage_type,
                    monthly_min_inr=float(chosen.monthly_min_inr) if chosen.monthly_min_inr is not None else None,
                    monthly_median_inr=float(chosen.monthly_median_inr),
                    monthly_max_inr=float(chosen.monthly_max_inr) if chosen.monthly_max_inr is not None else None,
                    currency=chosen.currency or "INR",
                    data_period=chosen.data_period,
                    geography_level=chosen.geography_level,
                    district=chosen.district,
                    state=chosen.state,
                    source_id=chosen.source_id,
                    source_title=source_title,
                    source_url=source_url,
                    confidence=chosen.confidence,
                    disclaimer=_WAGE_DISCLAIMER,
                    notes=chosen.notes,
                    data_status="verified" if chosen.confidence == "verified" else "indicative",
                    source_label=source_title,
                    verified=(chosen.confidence == "verified"),
                )

    # Fallback to Mock Wage Dataset for Hackathon demonstration
    mock = find_mock_wage(occupation_id=occupation_id, occupation_name=occupation_name)
    if mock:
        logger.info(
            "Mock wage benchmark retrieved for occupation_id=%s / occupation_name=%s: ₹%.0f",
            occupation_id,
            occupation_name,
            mock["monthly_wage_inr"],
            extra={"event": "mock_wage_benchmark_retrieved"},
        )
        return WageBenchmarkOut(
            benchmark_id=f"mock-{mock['occupation_id']}",
            occupation_id=mock["occupation_id"],
            occupation_name=mock["occupation_name"],
            employment_type=mock["employment_type"],
            wage_type=mock["wage_type"],
            monthly_min_inr=None,
            monthly_median_inr=float(mock["monthly_wage_inr"]),
            monthly_max_inr=None,
            currency=mock.get("currency", "INR"),
            data_period="2024-2025 (Demo)",
            geography_level=mock["geography_level"],
            district=district,
            state=mock.get("state", "Karnataka"),
            source_id="mock-hackathon-data",
            source_title=mock["source_label"],
            source_url=None,
            confidence="candidate" if mock.get("is_candidate") else "illustrative",
            disclaimer=MOCK_DISCLAIMER,
            notes=mock.get("notes"),
            data_status=DATA_STATUS_MOCK,
            source_label=SOURCE_LABEL,
            verified=False,
        )

    logger.info(
        "No wage benchmark or mock found for occupation_id=%s, occupation_name=%s",
        occupation_id,
        occupation_name,
        extra={"event": "wage_benchmark_missing", "occupation_id": occupation_id},
    )
    return None


def calculate_wage_lift(
    current_benchmark: WageBenchmarkOut | None,
    target_benchmark: WageBenchmarkOut | None,
) -> WageLiftOut:
    """Deterministically compute the indicative wage lift between two benchmarks.

    All arithmetic is done here in Python — the LLM is never permitted to
    recompute, override, or infer these values. Negative lifts are preserved.

    Returns WageLiftOut with status:
      'available'     — both medians present and calculated
      'partial'       — only one median present
      'not_available' — neither median available
    """
    curr_med = (
        current_benchmark.monthly_median_inr
        if current_benchmark else None
    )
    tgt_med = (
        target_benchmark.monthly_median_inr
        if target_benchmark else None
    )

    if curr_med is not None and tgt_med is not None:
        absolute_lift = round(tgt_med - curr_med, 2)
        pct_lift = round((absolute_lift / curr_med) * 100, 2) if curr_med != 0 else None
        status = "available"
        logger.info(
            "Wage lift calculated: current=%.0f target=%.0f lift=%.0f (%.1f%%)",
            curr_med, tgt_med, absolute_lift, pct_lift or 0,
            extra={"event": "wage_lift_calculated"},
        )
    elif curr_med is not None or tgt_med is not None:
        absolute_lift = None
        pct_lift = None
        status = "partial"
    else:
        absolute_lift = None
        pct_lift = None
        status = "not_available"

    # Innovation 3 payload extras
    is_available = (status == "available")
    curr_summary = None
    if current_benchmark:
        curr_summary = WageOccupationSummary(
            occupation=current_benchmark.occupation_name,
            monthly_wage_inr=curr_med,
            status=getattr(current_benchmark, "data_status", "mock"),
        )

    tgt_summary = None
    if target_benchmark:
        tgt_summary = WageOccupationSummary(
            occupation=target_benchmark.occupation_name,
            monthly_wage_inr=tgt_med,
            status=getattr(target_benchmark, "data_status", "mock"),
        )

    disclaimer = MOCK_DISCLAIMER if (
        (current_benchmark and getattr(current_benchmark, "data_status", None) == DATA_STATUS_MOCK)
        or (target_benchmark and getattr(target_benchmark, "data_status", None) == DATA_STATUS_MOCK)
    ) else _WAGE_DISCLAIMER

    return WageLiftOut(
        current_benchmark=current_benchmark,
        target_benchmark=target_benchmark,
        absolute_lift_inr=absolute_lift,
        percentage_lift=pct_lift,
        status=status,
        disclaimer=disclaimer,
        available=is_available,
        current=curr_summary,
        target=tgt_summary,
        absolute_difference_inr=absolute_lift,
        percentage_difference=pct_lift,
        unit="monthly",
        data_status=DATA_STATUS_MOCK,
        source_label=SOURCE_LABEL,
    )


def _geography_priority_expr():
    """SQLAlchemy order expression: district < state < national (prefer more specific)."""
    from sqlalchemy import case
    return case(
        (WageBenchmark.geography_level == "district", 1),
        (WageBenchmark.geography_level == "state", 2),
        (WageBenchmark.geography_level == "national", 3),
        else_=4,
    )
