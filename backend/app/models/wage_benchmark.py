"""wage_benchmarks — indicative earning/salary benchmarks for occupations.

Skill-Bridge & Wage-Lift Engine (Innovation 3).

Design rules (see docs/ARCHITECTURE.md):
- Every benchmark MUST reference a source via source_id.
- monthly_min/median/max are NULLABLE — missing data returns wage_status='not_available'
  rather than a fabricated figure.
- The LLM is never permitted to compute or modify wage values.
- All displayed values carry a mandatory disclaimer (not guaranteed income).
"""
from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class WageBenchmark(TimestampMixin, Base):
    __tablename__ = "wage_benchmarks"

    id: Mapped[str] = mapped_column(Text, primary_key=True)

    # Soft link to occupation — nullable because some benchmarks are sector-level
    # and do not correspond to a single occupation row.
    occupation_id: Mapped[str | None] = mapped_column(
        ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    # Denormalized for display (avoids a join when occupation_id is NULL)
    occupation_name: Mapped[str] = mapped_column(Text, nullable=False)

    # Employment context
    employment_type: Mapped[str] = mapped_column(Text, nullable=False)
    # 'salary' for salaried jobs; 'earning' for self-employed/informal
    wage_type: Mapped[str] = mapped_column(Text, nullable=False)

    # Geographic scope — prefer district-level; fall back to state/national
    geography_level: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str | None] = mapped_column(Text, nullable=True)
    state: Mapped[str | None] = mapped_column(Text, nullable=True, default="Karnataka")

    # Wage values — ALL NULLABLE (absent = not_available, never fabricated)
    monthly_min_inr: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    monthly_median_inr: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    monthly_max_inr: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    currency: Mapped[str] = mapped_column(Text, nullable=False, default="INR")

    # Provenance
    data_period: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    confidence: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    occupation = relationship("Occupation", foreign_keys=[occupation_id])
    source = relationship("Source", foreign_keys=[source_id])

    __table_args__ = (
        CheckConstraint(
            "employment_type IN ('salaried','self-employed','contract','informal')",
            name="ck_wage_benchmarks_employment_type",
        ),
        CheckConstraint(
            "wage_type IN ('salary','earning')",
            name="ck_wage_benchmarks_wage_type",
        ),
        CheckConstraint(
            "geography_level IN ('district','state','national')",
            name="ck_wage_benchmarks_geography_level",
        ),
        CheckConstraint(
            "confidence IN ('high','medium','low','indicative-only')",
            name="ck_wage_benchmarks_confidence",
        ),
    )
