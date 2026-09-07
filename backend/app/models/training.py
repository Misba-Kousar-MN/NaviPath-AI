"""courses, training_centres, centre_courses — the core pathway/geo tables.
See docs/ARCHITECTURE.md Section D #6-8 and docs/DATABASE_IMPLEMENTATION_PLAN.md §7.
"""
from __future__ import annotations

from datetime import date, datetime

from geoalchemy2 import Geography
from sqlalchemy import Boolean, CheckConstraint, Computed, Date, DateTime, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Course(TimestampMixin, Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    skill_id: Mapped[str] = mapped_column(
        ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    level: Mapped[str | None] = mapped_column(Text)
    duration_value: Mapped[float | None] = mapped_column(Numeric)
    duration_unit: Mapped[str | None] = mapped_column(Text)
    mode: Mapped[str | None] = mapped_column(Text)
    languages_supported: Mapped[str | None] = mapped_column(Text)
    certifying_body: Mapped[str | None] = mapped_column(Text)
    is_government_recognized: Mapped[bool | None] = mapped_column(Boolean)
    # Deliberately free TEXT, not a CHECK-constrained enum: real seed data legitimately
    # contains the "REQUIRES OFFICIAL SOURCE VERIFICATION" sentinel here — see
    # docs/DATABASE_IMPLEMENTATION_PLAN.md §1/§2.
    fee_type: Mapped[str | None] = mapped_column(Text)
    fee_amount_inr: Mapped[float | None] = mapped_column(Numeric)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    last_verified: Mapped[date | None] = mapped_column(Date)

    skill: Mapped["Skill"] = relationship(back_populates="courses")  # noqa: F821
    centre_courses: Mapped[list["CentreCourse"]] = relationship(back_populates="course")

    __table_args__ = (
        CheckConstraint(
            "level IS NULL OR level IN ('beginner','intermediate','advanced')",
            name="ck_courses_level",
        ),
        CheckConstraint(
            "duration_unit IS NULL OR duration_unit IN ('hours','days','weeks')",
            name="ck_courses_duration_unit",
        ),
        CheckConstraint(
            "mode IS NULL OR mode IN ('online','offline','hybrid')",
            name="ck_courses_mode",
        ),
    )


class TrainingCentre(TimestampMixin, Base):
    __tablename__ = "training_centres"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    # Deliberately free TEXT (organically-grown value set across population passes) —
    # see docs/DATABASE_IMPLEMENTATION_PLAN.md §1.
    type: Mapped[str | None] = mapped_column(Text)
    district: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    taluk: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Numeric)
    longitude: Mapped[float | None] = mapped_column(Numeric)
    # Generated column: NULL whenever latitude or longitude is NULL (PostGIS's
    # ST_MakePoint is STRICT — never fabricates a coordinate). Never written to directly.
    location = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        Computed(
            "CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL "
            "THEN ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography "
            "ELSE NULL END",
            persisted=True,
        ),
        nullable=True,
    )
    recognition_status: Mapped[str | None] = mapped_column(Text)
    geocoding_status: Mapped[str | None] = mapped_column(Text)
    geocoding_source: Mapped[str | None] = mapped_column(Text)
    geocoding_confidence: Mapped[str | None] = mapped_column(Text)
    geocoding_query: Mapped[str | None] = mapped_column(Text)
    geocoded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    contact_phone: Mapped[str | None] = mapped_column(Text)
    contact_email: Mapped[str | None] = mapped_column(Text)
    official_source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    last_verified: Mapped[date | None] = mapped_column(Date)

    centre_courses: Mapped[list["CentreCourse"]] = relationship(back_populates="centre")

    __table_args__ = (
        CheckConstraint(
            "recognition_status IS NULL OR recognition_status IN "
            "('govt-recognized','empanelled','unverified','private-recognized')",
            name="ck_training_centres_recognition_status",
        ),
        CheckConstraint(
            "geocoding_status IS NULL OR geocoding_status IN "
            "('SUCCESS','FAILED','AMBIGUOUS','NOT_GEOCODED')",
            name="ck_training_centres_geocoding_status",
        ),
    )


class CentreCourse(TimestampMixin, Base):
    __tablename__ = "centre_courses"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    centre_id: Mapped[str] = mapped_column(
        ForeignKey("training_centres.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    course_id: Mapped[str] = mapped_column(
        ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    batch_schedule_note: Mapped[str | None] = mapped_column(Text)
    fee_override_inr: Mapped[float | None] = mapped_column(Numeric)
    source_id: Mapped[str] = mapped_column(
        ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    last_verified: Mapped[date | None] = mapped_column(Date)
    freshness_flag: Mapped[str | None] = mapped_column(Text)

    centre: Mapped["TrainingCentre"] = relationship(back_populates="centre_courses")
    course: Mapped["Course"] = relationship(back_populates="centre_courses")

    __table_args__ = (
        UniqueConstraint("centre_id", "course_id", name="uq_centre_courses_pair"),
        CheckConstraint(
            "freshness_flag IS NULL OR freshness_flag IN "
            "('CURRENT','HISTORICAL','NEEDS_REVALIDATION')",
            name="ck_centre_courses_freshness_flag",
        ),
    )
