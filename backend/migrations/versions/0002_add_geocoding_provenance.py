"""Add geocoding provenance columns to training_centres.

Revision ID: 0002_add_geocoding_provenance
Revises: 0001_initial_schema
Create Date: 2026-09-05
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002_add_geocoding_provenance"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("training_centres", sa.Column("geocoding_status", sa.Text(), nullable=True))
    op.add_column("training_centres", sa.Column("geocoding_source", sa.Text(), nullable=True))
    op.add_column("training_centres", sa.Column("geocoded_at", sa.Date(), nullable=True))
    op.create_check_constraint(
        "ck_training_centres_geocoding_status",
        "training_centres",
        "geocoding_status IS NULL OR geocoding_status IN ('SUCCESS','FAILED','AMBIGUOUS','NOT_GEOCODED')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_training_centres_geocoding_status", "training_centres", type_="check")
    op.drop_column("training_centres", "geocoded_at")
    op.drop_column("training_centres", "geocoding_source")
    op.drop_column("training_centres", "geocoding_status")
