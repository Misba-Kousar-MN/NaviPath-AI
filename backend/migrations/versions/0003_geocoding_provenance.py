"""Add geocoding confidence, query columns and update geocoded_at to timestamptz.

Revision ID: 0003_geocoding_provenance
Revises: 0002_add_geocoding_provenance
Create Date: 2026-09-06
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic. Length must be <= 32 chars.
revision = "0003_geocoding_provenance"
down_revision = "0002_add_geocoding_provenance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("training_centres", sa.Column("geocoding_confidence", sa.String(), nullable=True))
    op.add_column("training_centres", sa.Column("geocoding_query", sa.Text(), nullable=True))
    op.alter_column(
        "training_centres",
        "geocoded_at",
        type_=sa.DateTime(timezone=True),
        postgresql_using="geocoded_at::timestamp with time zone",
        existing_type=sa.Date(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "training_centres",
        "geocoded_at",
        type_=sa.Date(),
        postgresql_using="geocoded_at::date",
        existing_type=sa.DateTime(timezone=True),
        nullable=True,
    )
    op.drop_column("training_centres", "geocoding_query")
    op.drop_column("training_centres", "geocoding_confidence")
