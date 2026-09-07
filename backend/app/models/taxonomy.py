"""occupations, skills, occupation_skills, skill_transitions.
See docs/ARCHITECTURE.md Section D #2-5.
"""
from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Occupation(TimestampMixin, Base):
    __tablename__ = "occupations"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name_en: Mapped[str] = mapped_column(Text, nullable=False)
    name_hi: Mapped[str | None] = mapped_column(Text)
    name_kn: Mapped[str | None] = mapped_column(Text)
    sector: Mapped[str] = mapped_column(Text, nullable=False)
    nco_code: Mapped[str | None] = mapped_column(Text)
    is_informal_sector: Mapped[bool | None] = mapped_column(Boolean)
    description: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    occupation_skills: Mapped[list["OccupationSkill"]] = relationship(
        back_populates="occupation", foreign_keys="OccupationSkill.occupation_id"
    )
    outgoing_transitions: Mapped[list["SkillTransition"]] = relationship(
        back_populates="from_occupation", foreign_keys="SkillTransition.from_occupation_id"
    )


class Skill(TimestampMixin, Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name_en: Mapped[str] = mapped_column(Text, nullable=False)
    name_hi: Mapped[str | None] = mapped_column(Text)
    name_kn: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    skill_level: Mapped[str] = mapped_column(Text, nullable=False)
    is_certifiable: Mapped[bool | None] = mapped_column(Boolean)
    certifying_body: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    courses: Mapped[list["Course"]] = relationship(back_populates="skill")

    __table_args__ = (
        CheckConstraint(
            "category IN ('technical','digital','safety','soft-skill','certification')",
            name="ck_skills_category",
        ),
        CheckConstraint(
            "skill_level IN ('beginner','intermediate','advanced')",
            name="ck_skills_skill_level",
        ),
    )


class OccupationSkill(TimestampMixin, Base):
    __tablename__ = "occupation_skills"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    occupation_id: Mapped[str] = mapped_column(
        ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    skill_id: Mapped[str] = mapped_column(
        ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    relevance: Mapped[str | None] = mapped_column(Text)
    curation_status: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    occupation: Mapped["Occupation"] = relationship(
        back_populates="occupation_skills", foreign_keys=[occupation_id]
    )
    skill: Mapped["Skill"] = relationship(foreign_keys=[skill_id])

    __table_args__ = (
        UniqueConstraint("occupation_id", "skill_id", name="uq_occupation_skills_pair"),
        CheckConstraint(
            "relevance IS NULL OR relevance IN ('core','supporting')",
            name="ck_occupation_skills_relevance",
        ),
        CheckConstraint(
            "curation_status IS NULL OR curation_status IN "
            "('verified','expert-heuristic','needs-review')",
            name="ck_occupation_skills_curation_status",
        ),
    )


class SkillTransition(TimestampMixin, Base):
    __tablename__ = "skill_transitions"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    from_occupation_id: Mapped[str] = mapped_column(
        ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    to_skill_id: Mapped[str] = mapped_column(
        ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Skill-Bridge Engine (Innovation 3): nullable FK to the target occupation.
    # Allows the engine to resolve target occupation name/sector/wage without a
    # reverse skill→occupation join. NULL for transitions whose target occupation
    # is not yet registered in the verified occupations table.
    to_occupation_id: Mapped[str | None] = mapped_column(
        ForeignKey("occupations.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    bridge_skill_ids: Mapped[str | None] = mapped_column(Text)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[str | None] = mapped_column(Text)
    market_demand_note: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), index=True
    )

    from_occupation: Mapped["Occupation"] = relationship(
        back_populates="outgoing_transitions", foreign_keys=[from_occupation_id]
    )
    to_skill: Mapped["Skill"] = relationship(foreign_keys=[to_skill_id])
    to_occupation: Mapped["Occupation | None"] = relationship(
        foreign_keys=[to_occupation_id]
    )

    __table_args__ = (
        CheckConstraint(
            "confidence IS NULL OR confidence IN ('data-driven','expert-curated','heuristic')",
            name="ck_skill_transitions_confidence",
        ),
    )
