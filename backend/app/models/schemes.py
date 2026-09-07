"""schemes, eligibility_rules, documents, scheme_documents.
See docs/ARCHITECTURE.md Section D #9-12, Section G (deterministic eligibility).
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Scheme(TimestampMixin, Base):
    __tablename__ = "schemes"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name_en: Mapped[str] = mapped_column(Text, nullable=False)
    name_hi: Mapped[str | None] = mapped_column(Text)
    name_kn: Mapped[str | None] = mapped_column(Text)
    issuing_authority: Mapped[str] = mapped_column(Text, nullable=False)
    scheme_type: Mapped[str | None] = mapped_column(Text)
    benefit_summary: Mapped[str | None] = mapped_column(Text)
    official_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    last_verified: Mapped[date | None] = mapped_column(Date)

    eligibility_rules: Mapped[list["EligibilityRule"]] = relationship(back_populates="scheme")
    scheme_documents: Mapped[list["SchemeDocument"]] = relationship(back_populates="scheme")

    __table_args__ = (
        CheckConstraint(
            "scheme_type IS NULL OR scheme_type IN "
            "('skilling','financial-support','insurance','social-security')",
            name="ck_schemes_scheme_type",
        ),
        CheckConstraint(
            "status IS NULL OR status IN ('active','expired','unknown')",
            name="ck_schemes_status",
        ),
    )


class EligibilityRule(TimestampMixin, Base):
    __tablename__ = "eligibility_rules"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    scheme_id: Mapped[str] = mapped_column(
        ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    rule_group_id: Mapped[int | None] = mapped_column(Integer)
    field_path: Mapped[str] = mapped_column(Text, nullable=False)
    operator: Mapped[str] = mapped_column(Text, nullable=False)
    # Stored as raw TEXT, not JSONB: real values include plain scalars ("18"),
    # ";"-delimited lists ("carpenter;boat-maker;..."), and the
    # "REQUIRES OFFICIAL SOURCE VERIFICATION" sentinel — see
    # docs/DATABASE_IMPLEMENTATION_PLAN.md §1. Parsed by app/services/eligibility.py.
    value: Mapped[str | None] = mapped_column(Text)
    logic_connector: Mapped[str | None] = mapped_column(Text)
    mandatory: Mapped[bool | None] = mapped_column(Boolean)
    human_readable_condition: Mapped[str] = mapped_column(Text, nullable=False)
    rule_status: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    last_verified: Mapped[date | None] = mapped_column(Date)

    scheme: Mapped["Scheme"] = relationship(back_populates="eligibility_rules")

    __table_args__ = (
        CheckConstraint(
            "operator IN ('eq','neq','in','not_in','gte','lte','gt','lt','exists','not_exists')",
            name="ck_eligibility_rules_operator",
        ),
        CheckConstraint(
            "logic_connector IS NULL OR logic_connector IN ('AND','OR')",
            name="ck_eligibility_rules_logic_connector",
        ),
        CheckConstraint(
            "rule_status IS NULL OR rule_status IN ('verified','draft','needs-review')",
            name="ck_eligibility_rules_rule_status",
        ),
    )


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    issuing_authority: Mapped[str | None] = mapped_column(Text)
    how_to_obtain: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    scheme_documents: Mapped[list["SchemeDocument"]] = relationship(back_populates="document")


class SchemeDocument(TimestampMixin, Base):
    __tablename__ = "scheme_documents"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    scheme_id: Mapped[str] = mapped_column(
        ForeignKey("schemes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    mandatory: Mapped[bool | None] = mapped_column(Boolean)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    scheme: Mapped["Scheme"] = relationship(back_populates="scheme_documents")
    document: Mapped["Document"] = relationship(back_populates="scheme_documents")
