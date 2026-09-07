"""0004_skill_bridge_wage_benchmarks

Skill-Bridge & Wage-Lift Engine — Innovation 3

Changes:
1. Add nullable to_occupation_id column to skill_transitions table.
2. Create wage_benchmarks table with full CHECK constraints and provenance FK.

Revision ID: 0004
Revises: 0003
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic. Length must be <= 32 chars.
revision = "0004_skill_bridge_wages"
down_revision = "0003_geocoding_provenance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add to_occupation_id to skill_transitions
    op.add_column(
        "skill_transitions",
        sa.Column(
            "to_occupation_id",
            sa.Text(),
            sa.ForeignKey("occupations.id", ondelete="RESTRICT"),
            nullable=True,
            comment=(
                "Skill-Bridge Engine: target occupation FK. NULL when the target "
                "occupation is not yet registered in verified occupations table."
            ),
        ),
    )
    op.create_index(
        "ix_skill_transitions_to_occupation_id",
        "skill_transitions",
        ["to_occupation_id"],
    )

    # 2. Create wage_benchmarks table
    op.create_table(
        "wage_benchmarks",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("occupation_id", sa.Text(),
                  sa.ForeignKey("occupations.id", ondelete="RESTRICT"),
                  nullable=True),
        sa.Column("occupation_name", sa.Text(), nullable=False),
        sa.Column("employment_type", sa.Text(), nullable=False),
        sa.Column("wage_type", sa.Text(), nullable=False),
        sa.Column("geography_level", sa.Text(), nullable=False),
        sa.Column("district", sa.Text(), nullable=True),
        sa.Column("state", sa.Text(), nullable=True, server_default="Karnataka"),
        sa.Column("monthly_min_inr", sa.Numeric(), nullable=True),
        sa.Column("monthly_median_inr", sa.Numeric(), nullable=True),
        sa.Column("monthly_max_inr", sa.Numeric(), nullable=True),
        sa.Column("currency", sa.Text(), nullable=False, server_default="INR"),
        sa.Column("data_period", sa.Text(), nullable=True),
        sa.Column("source_id", sa.Text(),
                  sa.ForeignKey("sources.id", ondelete="RESTRICT"),
                  nullable=False),
        sa.Column("confidence", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        # CHECK constraints
        sa.CheckConstraint(
            "employment_type IN ('salaried','self-employed','contract','informal')",
            name="ck_wage_benchmarks_employment_type",
        ),
        sa.CheckConstraint(
            "wage_type IN ('salary','earning')",
            name="ck_wage_benchmarks_wage_type",
        ),
        sa.CheckConstraint(
            "geography_level IN ('district','state','national')",
            name="ck_wage_benchmarks_geography_level",
        ),
        sa.CheckConstraint(
            "confidence IN ('high','medium','low','indicative-only')",
            name="ck_wage_benchmarks_confidence",
        ),
    )
    op.create_index(
        "ix_wage_benchmarks_occupation_id",
        "wage_benchmarks",
        ["occupation_id"],
    )
    op.create_index(
        "ix_wage_benchmarks_source_id",
        "wage_benchmarks",
        ["source_id"],
    )


def downgrade() -> None:
    op.drop_table("wage_benchmarks")
    op.drop_index("ix_skill_transitions_to_occupation_id", "skill_transitions")
    op.drop_column("skill_transitions", "to_occupation_id")
