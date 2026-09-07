#!/usr/bin/env python3
"""Deterministic, idempotent CSV -> PostgreSQL seed loader.

Loads data/seed/*.csv into the Postgres tables created by
backend/migrations/versions/0001_initial_schema.py, in strict dependency
order, using INSERT ... ON CONFLICT (id) DO UPDATE (upsert) so it is safe to
run multiple times against the same database.

Every row is validated (required fields non-empty, every FK resolves to an
already-known id) BEFORE any insert is attempted for that row. A row that
fails validation is skipped and logged with a reason — never silently
dropped, never partially inserted.

Usage:
    cd backend && python ../scripts/seed_database.py
(or from anywhere, as long as backend/ is importable — see sys.path below)
"""
from __future__ import annotations

import csv
import datetime as dt
import os
import sys
from dataclasses import dataclass, field

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND_DIR = os.path.join(_REPO_ROOT, "backend")
sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import select  # noqa: E402
from sqlalchemy.dialects.postgresql import insert as pg_insert  # noqa: E402

from sqlalchemy.exc import SQLAlchemyError  # noqa: E402

from app.db.session import SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    CentreCourse,
    Course,
    Document,
    DocumentChunk,
    EligibilityRule,
    Evidence,
    Location,
    Occupation,
    OccupationSkill,
    Scheme,
    SchemeDocument,
    Skill,
    SkillTransition,
    Source,
    TrainingCentre,
    WageBenchmark,
)

SEED_DIR = os.path.join(_REPO_ROOT, "data", "seed")

BOOL_TRUE = {"true", "yes", "1"}
BOOL_FALSE = {"false", "no", "0"}


def _to_bool(v: str | None) -> bool | None:
    if v is None or v.strip() == "":
        return None
    low = v.strip().lower()
    if low in BOOL_TRUE:
        return True
    if low in BOOL_FALSE:
        return False
    return None  # unrecognized -> unknown, never guessed as True/False


def _to_num(v: str | None):
    if v is None or v.strip() == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _to_int(v: str | None):
    if v is None or v.strip() == "":
        return None
    try:
        return int(v)
    except ValueError:
        return None


def _to_date(v: str | None):
    if v is None or v.strip() == "":
        return None
    try:
        return dt.date.fromisoformat(v.strip())
    except ValueError:
        return None


def _to_datetime(v: str | None):
    if v is None or v.strip() == "":
        return None
    try:
        return dt.datetime.fromisoformat(v.strip())
    except ValueError:
        return None


def _s(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    return v if v != "" else None


@dataclass
class TableSpec:
    csv_name: str
    model: type
    required: list[str]
    fks: list[tuple[str, str]] = field(default_factory=list)  # (column, referenced_table_csv_name)
    converters: dict[str, callable] = field(default_factory=dict)


TABLES: list[TableSpec] = [
    TableSpec(
        "sources",
        Source,
        ["id", "authority", "title", "verification_status"],
        converters={
            "publication_date": _to_date,
            "retrieved_date": _to_date,
            "last_verified_date": _to_date,
        },
    ),
    TableSpec(
        "locations",
        Location,
        ["id", "district"],
        fks=[("source_id", "sources")],
        converters={"centroid_lat": _to_num, "centroid_lng": _to_num},
    ),
    TableSpec(
        "document_chunks",
        DocumentChunk,
        ["id", "source_id", "chunk_text"],
        fks=[("source_id", "sources")],
        converters={"retrieved_date": _to_date, "promoted_to_evidence": _to_bool},
    ),
    TableSpec(
        "occupations",
        Occupation,
        ["id", "name_en", "sector"],
        fks=[("source_id", "sources")],
        converters={"is_informal_sector": _to_bool},
    ),
    TableSpec(
        "skills",
        Skill,
        ["id", "name_en", "category", "skill_level"],
        fks=[("source_id", "sources")],
        converters={"is_certifiable": _to_bool},
    ),
    TableSpec(
        "documents",
        Document,
        ["id", "name"],
        fks=[("source_id", "sources")],
    ),
    TableSpec(
        "schemes",
        Scheme,
        ["id", "name_en", "issuing_authority", "source_id"],
        fks=[("source_id", "sources")],
        converters={"last_verified": _to_date},
    ),
    TableSpec(
        "occupation_skills",
        OccupationSkill,
        ["id", "occupation_id", "skill_id"],
        fks=[("occupation_id", "occupations"), ("skill_id", "skills"), ("source_id", "sources")],
    ),
    TableSpec(
        "skill_transitions",
        SkillTransition,
        ["id", "from_occupation_id", "to_skill_id"],
        fks=[
            ("from_occupation_id", "occupations"),
            ("to_skill_id", "skills"),
            ("source_id", "sources"),
        ],
    ),
    TableSpec(
        "courses",
        Course,
        ["id", "title", "skill_id", "source_id"],
        fks=[("skill_id", "skills"), ("source_id", "sources")],
        converters={
            "duration_value": _to_num,
            "fee_amount_inr": _to_num,
            "is_government_recognized": _to_bool,
            "last_verified": _to_date,
        },
    ),
    TableSpec(
        "training_centres",
        TrainingCentre,
        ["id", "name", "district", "official_source_id"],
        fks=[("official_source_id", "sources")],
        converters={"latitude": _to_num, "longitude": _to_num, "last_verified": _to_date, "geocoded_at": _to_datetime},
    ),
    TableSpec(
        "centre_courses",
        CentreCourse,
        ["id", "centre_id", "course_id", "source_id"],
        fks=[("centre_id", "training_centres"), ("course_id", "courses"), ("source_id", "sources")],
        converters={"fee_override_inr": _to_num, "last_verified": _to_date},
    ),
    TableSpec(
        "eligibility_rules",
        EligibilityRule,
        ["id", "scheme_id", "field_path", "operator", "human_readable_condition", "source_id"],
        fks=[("scheme_id", "schemes"), ("source_id", "sources")],
        converters={"rule_group_id": _to_int, "mandatory": _to_bool, "last_verified": _to_date},
    ),
    TableSpec(
        "scheme_documents",
        SchemeDocument,
        ["id", "scheme_id", "document_id"],
        fks=[("scheme_id", "schemes"), ("document_id", "documents"), ("source_id", "sources")],
        converters={"mandatory": _to_bool},
    ),
    TableSpec(
        "evidence",
        Evidence,
        ["id", "source_id", "related_entity_type", "related_entity_id", "claim_text", "excerpt_text", "verification_status"],
        fks=[("source_id", "sources")],
    ),
    TableSpec(
        "wage_benchmarks",
        WageBenchmark,
        ["id", "occupation_id", "occupation_name", "employment_type", "wage_type", "geography_level", "source_id", "confidence"],
        fks=[("occupation_id", "occupations"), ("source_id", "sources")],
        converters={
            "monthly_min_inr": _to_num,
            "monthly_median_inr": _to_num,
            "monthly_max_inr": _to_num,
        },
    ),
]

# related_entity_type -> csv table its related_entity_id must resolve against.
# evidence.related_entity_id is NOT a DB foreign key (polymorphic — see
# docs/DATABASE_IMPLEMENTATION_PLAN.md §3), so it's validated here instead.
EVIDENCE_ENTITY_TABLE = {
    "occupation": "occupations",
    "skill": "skills",
    "course": "courses",
    "training_centre": "training_centres",
    "scheme": "schemes",
    "eligibility_rule": "eligibility_rules",
    "document": "documents",
}


def load_csv(table: str) -> list[dict]:
    path = os.path.join(SEED_DIR, f"{table}.csv")
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        return [row for row in csv.DictReader(f) if row.get("id")]


def main() -> int:
    print("=" * 70)
    print("Database Seed — CSV -> PostgreSQL")
    print("=" * 70)

    try:
        with engine.connect():
            pass
    except Exception as exc:  # noqa: BLE001
        print(f"\nFATAL: could not connect to the database ({engine.url.render_as_string(hide_password=True)}).")
        print(f"  {exc}")
        print("\nFix DATABASE_URL in backend/.env and re-run. No rows were modified.")
        return 1

    known_ids: dict[str, set[str]] = {}  # csv table name -> set of ids known to exist (DB or this run)
    summary: dict[str, dict[str, int]] = {}

    db = SessionLocal()
    try:
        for spec in TABLES:
            inserted = updated = skipped = errors = 0
            rows = load_csv(spec.csv_name)
            existing_ids: set[str] = set(db.execute(select(spec.model.id)).scalars().all())
            table_ids: set[str] = set(existing_ids)

            for raw in rows:
                row_id = raw.get("id", "").strip()
                reasons = []

                for field_name in spec.required:
                    if not (raw.get(field_name) or "").strip():
                        reasons.append(f"missing required field '{field_name}'")

                for col, ref_table in spec.fks:
                    val = (raw.get(col) or "").strip()
                    if val and val not in known_ids.get(ref_table, set()):
                        reasons.append(f"{col}='{val}' not found in {ref_table} (seed earlier or fix the row)")

                if spec.csv_name == "evidence":
                    etype = (raw.get("related_entity_type") or "").strip()
                    eid = (raw.get("related_entity_id") or "").strip()
                    ref_table = EVIDENCE_ENTITY_TABLE.get(etype)
                    if ref_table is None:
                        reasons.append(f"unknown related_entity_type '{etype}'")
                    elif eid not in known_ids.get(ref_table, set()):
                        reasons.append(
                            f"related_entity_id='{eid}' not found in {ref_table} "
                            f"(for related_entity_type='{etype}')"
                        )

                if reasons:
                    skipped += 1
                    print(f"  [SKIP] {spec.csv_name}.{row_id}: {'; '.join(reasons)}")
                    continue

                values = {}
                for k, v in raw.items():
                    if k is None:
                        continue  # ragged-row artifact; ignore extra unnamed column
                    conv = spec.converters.get(k)
                    values[k] = conv(v) if conv else _s(v)

                stmt = pg_insert(spec.model).values(**values)
                update_cols = {k: v for k, v in values.items() if k != "id"}
                update_cols["updated_at"] = dt.datetime.now(dt.timezone.utc)
                stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
                try:
                    db.execute(stmt)
                except SQLAlchemyError as exc:
                    db.rollback()
                    errors += 1
                    print(f"  [ERROR] {spec.csv_name}.{row_id}: {exc}")
                    continue

                if row_id in existing_ids:
                    updated += 1
                else:
                    inserted += 1
                table_ids.add(row_id)

            db.commit()
            known_ids[spec.csv_name] = table_ids
            summary[spec.csv_name] = {
                "inserted": inserted,
                "updated": updated,
                "skipped": skipped,
                "errors": errors,
                "total_in_csv": len(rows),
            }
            print(
                f"{spec.csv_name:20s} inserted={inserted:4d} updated={updated:4d} "
                f"skipped={skipped:4d} errors={errors:4d} (csv rows: {len(rows)})"
            )
    finally:
        db.close()

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    total_errors = sum(s["errors"] for s in summary.values())
    total_skipped = sum(s["skipped"] for s in summary.values())
    total_inserted = sum(s["inserted"] for s in summary.values())
    total_updated = sum(s["updated"] for s in summary.values())
    for name, s in summary.items():
        print(f"  {name:20s} {s}")
    print(
        f"\nTotal inserted: {total_inserted}  updated: {total_updated}  "
        f"skipped: {total_skipped}  errors: {total_errors}"
    )
    failed = bool(total_errors or total_skipped)
    print(
        "RESULT:",
        "FAIL — see [SKIP]/[ERROR] lines above" if failed else "PASS",
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
