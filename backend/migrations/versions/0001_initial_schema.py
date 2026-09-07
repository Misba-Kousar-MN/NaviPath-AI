"""Initial schema: extensions, all 15 tables, constraints, indexes.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-05

Mirrors docs/DATABASE_IMPLEMENTATION_PLAN.md exactly. One table per
data/seed/*.csv file, TEXT primary keys equal to the existing CSV IDs
(no UUID regeneration — see plan §4), plus created_at/updated_at.
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def _timestamps():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Embedding dimension is read from the running app's settings (EMBEDDING_DIMENSION),
    # never hard-coded — see docs/DATABASE_IMPLEMENTATION_PLAN.md §8.
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from app.core.config import get_settings

    embedding_dim = get_settings().embedding_dimension

    # --- sources (provenance root) ---
    op.create_table(
        "sources",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("authority", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("official_url", sa.Text),
        sa.Column("source_type", sa.Text),
        sa.Column("publication_date", sa.Date),
        sa.Column("retrieved_date", sa.Date),
        sa.Column("last_verified_date", sa.Date),
        sa.Column("verification_status", sa.Text, nullable=False),
        sa.Column("notes", sa.Text),
        *_timestamps(),
        sa.CheckConstraint(
            "source_type IS NULL OR source_type IN "
            "('act','notification','gazette','portal-page','pdf-guideline','helpline-confirmed','other')",
            name="ck_sources_source_type",
        ),
        sa.CheckConstraint(
            "verification_status IN ('verified','pending-review','broken-link','superseded')",
            name="ck_sources_verification_status",
        ),
    )

    # --- locations ---
    op.create_table(
        "locations",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("district", sa.Text, nullable=False),
        sa.Column("taluk", sa.Text),
        sa.Column("centroid_lat", sa.Numeric),
        sa.Column("centroid_lng", sa.Numeric),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
    )
    op.create_index("ix_locations_source_id", "locations", ["source_id"])

    # --- document_chunks (pgvector) ---
    op.create_table(
        "document_chunks",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("chunk_text", sa.Text, nullable=False),
        sa.Column("section", sa.Text),
        sa.Column("retrieved_date", sa.Date),
        sa.Column("promoted_to_evidence", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("embedding_status", sa.Text, nullable=False, server_default="not-generated"),
        *_timestamps(),
        sa.CheckConstraint(
            "embedding_status IN ('not-generated','generated','stale')",
            name="ck_document_chunks_embedding_status",
        ),
    )
    op.create_index("ix_document_chunks_source_id", "document_chunks", ["source_id"])
    # embedding column added via raw DDL, at the exact dimension read from EMBEDDING_DIMENSION
    # (pgvector's vector(N) type requires a fixed N at column-creation time — see plan §8).
    op.execute(f"ALTER TABLE document_chunks ADD COLUMN embedding vector({embedding_dim})")
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding ON document_chunks "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)"
    )

    # --- occupations ---
    op.create_table(
        "occupations",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name_en", sa.Text, nullable=False),
        sa.Column("name_hi", sa.Text),
        sa.Column("name_kn", sa.Text),
        sa.Column("sector", sa.Text, nullable=False),
        sa.Column("nco_code", sa.Text),
        sa.Column("is_informal_sector", sa.Boolean),
        sa.Column("description", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
    )
    op.create_index("ix_occupations_source_id", "occupations", ["source_id"])

    # --- skills ---
    op.create_table(
        "skills",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name_en", sa.Text, nullable=False),
        sa.Column("name_hi", sa.Text),
        sa.Column("name_kn", sa.Text),
        sa.Column("category", sa.Text, nullable=False),
        sa.Column("skill_level", sa.Text, nullable=False),
        sa.Column("is_certifiable", sa.Boolean),
        sa.Column("certifying_body", sa.Text),
        sa.Column("description", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
        sa.CheckConstraint(
            "category IN ('technical','digital','safety','soft-skill','certification')",
            name="ck_skills_category",
        ),
        sa.CheckConstraint(
            "skill_level IN ('beginner','intermediate','advanced')", name="ck_skills_skill_level"
        ),
    )
    op.create_index("ix_skills_source_id", "skills", ["source_id"])

    # --- occupation_skills ---
    op.create_table(
        "occupation_skills",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("occupation_id", sa.Text, sa.ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("skill_id", sa.Text, sa.ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("relevance", sa.Text),
        sa.Column("curation_status", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
        sa.UniqueConstraint("occupation_id", "skill_id", name="uq_occupation_skills_pair"),
        sa.CheckConstraint(
            "relevance IS NULL OR relevance IN ('core','supporting')",
            name="ck_occupation_skills_relevance",
        ),
        sa.CheckConstraint(
            "curation_status IS NULL OR curation_status IN ('verified','expert-heuristic','needs-review')",
            name="ck_occupation_skills_curation_status",
        ),
    )
    op.create_index("ix_occupation_skills_occupation_id", "occupation_skills", ["occupation_id"])
    op.create_index("ix_occupation_skills_skill_id", "occupation_skills", ["skill_id"])
    op.create_index("ix_occupation_skills_source_id", "occupation_skills", ["source_id"])

    # --- skill_transitions ---
    op.create_table(
        "skill_transitions",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column(
            "from_occupation_id", sa.Text, sa.ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=False
        ),
        sa.Column("to_skill_id", sa.Text, sa.ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("bridge_skill_ids", sa.Text),
        sa.Column("rationale", sa.Text, nullable=False),
        sa.Column("confidence", sa.Text),
        sa.Column("market_demand_note", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
        sa.CheckConstraint(
            "confidence IS NULL OR confidence IN ('data-driven','expert-curated','heuristic')",
            name="ck_skill_transitions_confidence",
        ),
    )
    op.create_index("ix_skill_transitions_from_occupation_id", "skill_transitions", ["from_occupation_id"])
    op.create_index("ix_skill_transitions_to_skill_id", "skill_transitions", ["to_skill_id"])
    op.create_index("ix_skill_transitions_source_id", "skill_transitions", ["source_id"])

    # --- courses ---
    op.create_table(
        "courses",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("skill_id", sa.Text, sa.ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("level", sa.Text),
        sa.Column("duration_value", sa.Numeric),
        sa.Column("duration_unit", sa.Text),
        sa.Column("mode", sa.Text),
        sa.Column("languages_supported", sa.Text),
        sa.Column("certifying_body", sa.Text),
        sa.Column("is_government_recognized", sa.Boolean),
        sa.Column("fee_type", sa.Text),
        sa.Column("fee_amount_inr", sa.Numeric),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("last_verified", sa.Date),
        *_timestamps(),
        sa.CheckConstraint(
            "level IS NULL OR level IN ('beginner','intermediate','advanced')", name="ck_courses_level"
        ),
        sa.CheckConstraint(
            "duration_unit IS NULL OR duration_unit IN ('hours','days','weeks')",
            name="ck_courses_duration_unit",
        ),
        sa.CheckConstraint("mode IS NULL OR mode IN ('online','offline','hybrid')", name="ck_courses_mode"),
    )
    op.create_index("ix_courses_skill_id", "courses", ["skill_id"])
    op.create_index("ix_courses_source_id", "courses", ["source_id"])

    # --- training_centres (PostGIS) ---
    op.create_table(
        "training_centres",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("type", sa.Text),
        sa.Column("district", sa.Text, nullable=False),
        sa.Column("taluk", sa.Text),
        sa.Column("address", sa.Text),
        sa.Column("latitude", sa.Numeric),
        sa.Column("longitude", sa.Numeric),
        sa.Column("recognition_status", sa.Text),
        sa.Column("contact_phone", sa.Text),
        sa.Column("contact_email", sa.Text),
        sa.Column(
            "official_source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False
        ),
        sa.Column("last_verified", sa.Date),
        *_timestamps(),
        sa.CheckConstraint(
            "recognition_status IS NULL OR recognition_status IN "
            "('govt-recognized','empanelled','unverified','private-recognized')",
            name="ck_training_centres_recognition_status",
        ),
    )
    op.create_index("ix_training_centres_district", "training_centres", ["district"])
    op.create_index("ix_training_centres_official_source_id", "training_centres", ["official_source_id"])
    # Generated geography column — NULL whenever lat/lng is NULL (ST_MakePoint is STRICT).
    # Never fabricates a coordinate; see docs/DATABASE_IMPLEMENTATION_PLAN.md §7.
    op.execute(
        "ALTER TABLE training_centres ADD COLUMN location geography(Point, 4326) "
        "GENERATED ALWAYS AS ("
        "  CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL "
        "  THEN ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography "
        "  ELSE NULL END"
        ") STORED"
    )
    op.execute("CREATE INDEX ix_training_centres_location ON training_centres USING GIST (location)")

    # --- centre_courses ---
    op.create_table(
        "centre_courses",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("centre_id", sa.Text, sa.ForeignKey("training_centres.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("course_id", sa.Text, sa.ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("batch_schedule_note", sa.Text),
        sa.Column("fee_override_inr", sa.Numeric),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("last_verified", sa.Date),
        sa.Column("freshness_flag", sa.Text),
        *_timestamps(),
        sa.UniqueConstraint("centre_id", "course_id", name="uq_centre_courses_pair"),
        sa.CheckConstraint(
            "freshness_flag IS NULL OR freshness_flag IN ('CURRENT','HISTORICAL','NEEDS_REVALIDATION')",
            name="ck_centre_courses_freshness_flag",
        ),
    )
    op.create_index("ix_centre_courses_centre_id", "centre_courses", ["centre_id"])
    op.create_index("ix_centre_courses_course_id", "centre_courses", ["course_id"])
    op.create_index("ix_centre_courses_source_id", "centre_courses", ["source_id"])

    # --- schemes ---
    op.create_table(
        "schemes",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name_en", sa.Text, nullable=False),
        sa.Column("name_hi", sa.Text),
        sa.Column("name_kn", sa.Text),
        sa.Column("issuing_authority", sa.Text, nullable=False),
        sa.Column("scheme_type", sa.Text),
        sa.Column("benefit_summary", sa.Text),
        sa.Column("official_url", sa.Text),
        sa.Column("status", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("last_verified", sa.Date),
        *_timestamps(),
        sa.CheckConstraint(
            "scheme_type IS NULL OR scheme_type IN "
            "('skilling','financial-support','insurance','social-security')",
            name="ck_schemes_scheme_type",
        ),
        sa.CheckConstraint("status IS NULL OR status IN ('active','expired','unknown')", name="ck_schemes_status"),
    )
    op.create_index("ix_schemes_source_id", "schemes", ["source_id"])

    # --- eligibility_rules ---
    op.create_table(
        "eligibility_rules",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("scheme_id", sa.Text, sa.ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("rule_group_id", sa.Integer),
        sa.Column("field_path", sa.Text, nullable=False),
        sa.Column("operator", sa.Text, nullable=False),
        sa.Column("value", sa.Text),
        sa.Column("logic_connector", sa.Text),
        sa.Column("mandatory", sa.Boolean),
        sa.Column("human_readable_condition", sa.Text, nullable=False),
        sa.Column("rule_status", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("last_verified", sa.Date),
        *_timestamps(),
        sa.CheckConstraint(
            "operator IN ('eq','neq','in','not_in','gte','lte','gt','lt','exists','not_exists')",
            name="ck_eligibility_rules_operator",
        ),
        sa.CheckConstraint(
            "logic_connector IS NULL OR logic_connector IN ('AND','OR')",
            name="ck_eligibility_rules_logic_connector",
        ),
        sa.CheckConstraint(
            "rule_status IS NULL OR rule_status IN ('verified','draft','needs-review')",
            name="ck_eligibility_rules_rule_status",
        ),
    )
    op.create_index("ix_eligibility_rules_scheme_id", "eligibility_rules", ["scheme_id"])
    op.create_index("ix_eligibility_rules_source_id", "eligibility_rules", ["source_id"])

    # --- documents ---
    op.create_table(
        "documents",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("issuing_authority", sa.Text),
        sa.Column("how_to_obtain", sa.Text),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
    )
    op.create_index("ix_documents_source_id", "documents", ["source_id"])

    # --- scheme_documents ---
    op.create_table(
        "scheme_documents",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("scheme_id", sa.Text, sa.ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("document_id", sa.Text, sa.ForeignKey("documents.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("mandatory", sa.Boolean),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT")),
        *_timestamps(),
    )
    op.create_index("ix_scheme_documents_scheme_id", "scheme_documents", ["scheme_id"])
    op.create_index("ix_scheme_documents_document_id", "scheme_documents", ["document_id"])
    op.create_index("ix_scheme_documents_source_id", "scheme_documents", ["source_id"])

    # --- evidence ---
    op.create_table(
        "evidence",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("source_id", sa.Text, sa.ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("related_entity_type", sa.Text, nullable=False),
        sa.Column("related_entity_id", sa.Text, nullable=False),
        sa.Column("claim_text", sa.Text, nullable=False),
        sa.Column("excerpt_text", sa.Text, nullable=False),
        sa.Column("page_or_section", sa.Text),
        sa.Column("verification_status", sa.Text, nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "related_entity_type IN "
            "('occupation','skill','course','training_centre','scheme','eligibility_rule','document')",
            name="ck_evidence_related_entity_type",
        ),
        sa.CheckConstraint(
            "verification_status IN ('verified','candidate-unverified')",
            name="ck_evidence_verification_status",
        ),
    )
    op.create_index("ix_evidence_source_id", "evidence", ["source_id"])
    op.create_index("ix_evidence_related_entity", "evidence", ["related_entity_type", "related_entity_id"])


def downgrade() -> None:
    for table in (
        "evidence",
        "scheme_documents",
        "documents",
        "eligibility_rules",
        "schemes",
        "centre_courses",
        "training_centres",
        "courses",
        "skill_transitions",
        "occupation_skills",
        "skills",
        "occupations",
        "document_chunks",
        "locations",
        "sources",
    ):
        op.drop_table(table)
