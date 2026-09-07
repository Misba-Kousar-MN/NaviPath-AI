#!/usr/bin/env python3
"""Validate the live PostgreSQL database (post-seed).

Checks table existence, row counts, duplicate IDs, orphan records (including
the polymorphic evidence.related_entity_id, which is NOT a DB-level foreign
key), centre-course/scheme-document/occupation-skill/skill-transition/
source-evidence relationship counts, spatial data validity, NULL coordinates,
and provenance/status value distributions. Prints a plain-text report and
exits non-zero on any FAIL-level issue (mirrors scripts/validate_dataset.py's
report style, but against the database instead of the CSVs).

Usage:
    python scripts/validate_database.py
"""
from __future__ import annotations

import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND_DIR = os.path.join(_REPO_ROOT, "backend")
sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import func, inspect, select, text  # noqa: E402

from app.db.session import SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    CentreCourse,
    Course,
    Document,
    EligibilityRule,
    Evidence,
    Occupation,
    OccupationSkill,
    Scheme,
    SchemeDocument,
    SkillTransition,
    Source,
    TrainingCentre,
)

EVIDENCE_ENTITY_MODEL = {
    "occupation": Occupation,
    "skill": None,  # set below to avoid an import cycle in the dict literal
    "course": Course,
    "training_centre": TrainingCentre,
    "scheme": Scheme,
    "eligibility_rule": EligibilityRule,
    "document": Document,
}
from app.models import Skill  # noqa: E402

EVIDENCE_ENTITY_MODEL["skill"] = Skill

EXPECTED_TABLES = [
    "sources",
    "locations",
    "document_chunks",
    "occupations",
    "skills",
    "occupation_skills",
    "skill_transitions",
    "courses",
    "training_centres",
    "centre_courses",
    "schemes",
    "eligibility_rules",
    "documents",
    "scheme_documents",
    "evidence",
]


def main() -> int:
    failures: list[str] = []
    warnings: list[str] = []

    print("=" * 70)
    print("DATABASE VALIDATION")
    print("=" * 70)

    try:
        with engine.connect():
            pass
    except Exception as exc:  # noqa: BLE001
        print(f"\nFATAL: could not connect to the database.\n  {exc}")
        return 1

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    for t in EXPECTED_TABLES:
        if t not in existing_tables:
            failures.append(f"[MISSING TABLE] '{t}' does not exist — run 'alembic upgrade head' first.")

    if failures:
        print("\n".join(f"  - {f}" for f in failures))
        print("\nSTATUS: FAIL (schema not migrated)")
        return 1

    db = SessionLocal()
    try:
        print("\n--- Row counts ---")
        counts: dict[str, int] = {}
        for t in EXPECTED_TABLES:
            n = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar_one()
            counts[t] = n
            print(f"{t:20s} {n}")

        print("\n--- Duplicate ID checks (PK-enforced, sanity check only) ---")
        dup_issues = 0
        for t in EXPECTED_TABLES:
            n_ids = db.execute(text(f"SELECT COUNT(id) FROM {t}")).scalar_one()
            n_distinct = db.execute(text(f"SELECT COUNT(DISTINCT id) FROM {t}")).scalar_one()
            if n_ids != n_distinct:
                dup_issues += 1
                failures.append(f"[DUPLICATE ID] {t}: {n_ids} rows but only {n_distinct} distinct ids")
        if dup_issues == 0:
            print("  None (primary keys enforce this at the DB level).")

        print("\n--- Orphan checks ---")
        orphan_issues = 0

        # Polymorphic evidence.related_entity_id -> NOT a DB foreign key; checked here.
        for etype, model in EVIDENCE_ENTITY_MODEL.items():
            ev_rows = db.execute(
                select(Evidence.id, Evidence.related_entity_id).where(
                    Evidence.related_entity_type == etype
                )
            ).all()
            if not ev_rows:
                continue
            known_ids = set(db.execute(select(model.id)).scalars().all())
            for ev_id, rel_id in ev_rows:
                if rel_id not in known_ids:
                    orphan_issues += 1
                    failures.append(
                        f"[ORPHAN EVIDENCE] evidence.{ev_id}: related_entity_id='{rel_id}' "
                        f"not found in {etype} table"
                    )
        if orphan_issues == 0:
            print("  evidence.related_entity_id: all resolve correctly.")

        print("\n--- Relationship counts ---")
        occ_skill_pairs = db.execute(select(func.count()).select_from(OccupationSkill)).scalar_one()
        skill_trans = db.execute(select(func.count()).select_from(SkillTransition)).scalar_one()
        centre_course_pairs = db.execute(select(func.count()).select_from(CentreCourse)).scalar_one()
        scheme_doc_pairs = db.execute(select(func.count()).select_from(SchemeDocument)).scalar_one()
        print(f"  occupation_skills: {occ_skill_pairs}")
        print(f"  skill_transitions: {skill_trans}")
        print(f"  centre_courses:    {centre_course_pairs}")
        print(f"  scheme_documents:  {scheme_doc_pairs}")

        centres_with_course = db.execute(
            select(func.count(func.distinct(CentreCourse.centre_id)))
        ).scalar_one()
        courses_with_centre = db.execute(
            select(func.count(func.distinct(CentreCourse.course_id)))
        ).scalar_one()
        print(f"  training_centres with >=1 mapped course: {centres_with_course} / {counts['training_centres']}")
        print(f"  courses with >=1 mapped centre: {courses_with_centre} / {counts['courses']}")

        print("\n--- Spatial data validity ---")
        total_centres = counts["training_centres"]
        with_coords = db.execute(
            text("SELECT COUNT(*) FROM training_centres WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
        ).scalar_one()
        with_location = db.execute(
            text("SELECT COUNT(*) FROM training_centres WHERE location IS NOT NULL")
        ).scalar_one()
        null_coords = total_centres - with_coords
        if with_coords != with_location:
            failures.append(
                f"[SPATIAL MISMATCH] {with_coords} centres have lat/lng but {with_location} have a "
                "non-NULL location geography — the generated column is out of sync."
            )
        else:
            print(f"  centres with lat/lng -> location populated: {with_location}/{with_coords} (consistent)")
        print(f"  centres with NULL coordinates (excluded from nearby search, by design): {null_coords}")

        invalid_coords = db.execute(
            text(
                "SELECT COUNT(*) FROM training_centres WHERE "
                "(latitude IS NOT NULL AND (latitude < 11.0 OR latitude > 19.0)) OR "
                "(longitude IS NOT NULL AND (longitude < 73.5 OR longitude > 79.0))"
            )
        ).scalar_one()
        if invalid_coords:
            warnings.append(
                f"[COORD OUT OF RANGE] {invalid_coords} training_centres rows have coordinates "
                "outside the expected Karnataka bounding box"
            )

        print("\n--- Provenance / status value distributions ---")
        for table, col in [
            ("sources", "verification_status"),
            ("training_centres", "recognition_status"),
            ("centre_courses", "freshness_flag"),
            ("eligibility_rules", "rule_status"),
            ("evidence", "verification_status"),
        ]:
            rows = db.execute(text(f"SELECT {col}, COUNT(*) FROM {table} GROUP BY {col} ORDER BY 1")).all()
            dist = ", ".join(f"{v or 'NULL'}={c}" for v, c in rows)
            print(f"  {table}.{col}: {dist}")

    finally:
        db.close()

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"FAILURES: {len(failures)}")
    for f in failures:
        print(f"  - {f}")
    print(f"WARNINGS: {len(warnings)}")
    for w in warnings:
        print(f"  - {w}")
    status = "FAIL" if failures else "PASS"
    print(f"\nSTATUS: {status}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
