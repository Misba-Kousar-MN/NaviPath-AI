#!/usr/bin/env python3
"""
Validate the AI Skill Navigator seed dataset (data/seed/*.csv).

Pure standard-library, no dependencies. Run with:
    python scripts/validate_dataset.py

Checks: duplicate IDs, missing required fields, broken foreign keys,
orphan records, invalid URLs, invalid coordinates, empty datasets,
duplicate records. Prints a plain-text report and exits non-zero if
any FAIL-level issue is found (warnings do not fail the run).
"""
import csv
import os
import re
import sys

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "seed")

REQUIRED_FIELDS = {
    "occupations": ["id", "name_en", "sector"],
    "skills": ["id", "name_en", "category", "skill_level"],
    "occupation_skills": ["id", "occupation_id", "skill_id"],
    "skill_transitions": ["id", "from_occupation_id", "to_skill_id"],
    "courses": ["id", "title", "skill_id"],
    "training_centres": ["id", "name", "district"],
    "centre_courses": ["id", "centre_id", "course_id"],
    "schemes": ["id", "name_en", "issuing_authority"],
    "eligibility_rules": ["id", "scheme_id", "field_path", "operator"],
    "documents": ["id", "name"],
    "scheme_documents": ["id", "scheme_id", "document_id"],
    "sources": ["id", "authority", "title"],
    "evidence": ["id", "source_id", "related_entity_type", "related_entity_id"],
    "locations": ["id", "district"],
    "document_chunks": ["id", "source_id", "chunk_text"],
}

# (table, field) -> (referenced_table)
FOREIGN_KEYS = [
    ("occupation_skills", "occupation_id", "occupations"),
    ("occupation_skills", "skill_id", "skills"),
    ("skill_transitions", "from_occupation_id", "occupations"),
    ("skill_transitions", "to_skill_id", "skills"),
    ("courses", "skill_id", "skills"),
    ("centre_courses", "centre_id", "training_centres"),
    ("centre_courses", "course_id", "courses"),
    ("scheme_documents", "scheme_id", "schemes"),
    ("scheme_documents", "document_id", "documents"),
    ("eligibility_rules", "scheme_id", "schemes"),
    ("evidence", "source_id", "sources"),
    ("occupations", "source_id", "sources"),
    ("skills", "source_id", "sources"),
    ("courses", "source_id", "sources"),
    ("training_centres", "official_source_id", "sources"),
    ("schemes", "source_id", "sources"),
    ("eligibility_rules", "source_id", "sources"),
    ("documents", "source_id", "sources"),
    ("scheme_documents", "source_id", "sources"),
    ("document_chunks", "source_id", "sources"),
]

URL_FIELDS = [
    ("sources", "official_url"),
    ("schemes", "official_url"),
]

URL_RE = re.compile(r"^https?://", re.IGNORECASE)
PLACEHOLDER_VALUES = {"", "REQUIRES OFFICIAL SOURCE VERIFICATION", "REQUIRES OFFICIAL SOURCE VERIFICATION (no single official guideline PDF URL was successfully fetched in this session — see pmkvyofficial.org as the starting point)"}


def load_csv(name):
    path = os.path.join(BASE, f"{name}.csv")
    if not os.path.exists(path):
        return None, []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return path, rows


def main():
    failures = []
    warnings = []
    tables = {}
    id_index = {}

    print("=" * 70)
    print("AI Skill Navigator — Seed Dataset Validation Report")
    print("=" * 70)

    for name in REQUIRED_FIELDS:
        path, rows = load_csv(name)
        if path is None:
            failures.append(f"[MISSING FILE] data/seed/{name}.csv does not exist")
            continue
        tables[name] = rows
        print(f"\n--- {name}.csv ---")
        print(f"  Records: {len(rows)}")

        if len(rows) == 0:
            warnings.append(f"[EMPTY] {name}.csv has zero data rows")

        # Required fields present & non-empty
        missing_field_count = 0
        for i, row in enumerate(rows, start=2):  # +1 header, +1 1-index
            for field in REQUIRED_FIELDS[name]:
                if field not in row or row[field] is None or row[field].strip() == "":
                    missing_field_count += 1
                    failures.append(f"[MISSING REQUIRED FIELD] {name}.csv row {i}: '{field}' is empty")
        if missing_field_count == 0:
            print("  Required fields: OK")

        # Duplicate IDs
        ids = [row.get("id", "") for row in rows]
        seen = set()
        dupes = set()
        for _id in ids:
            if _id in seen:
                dupes.add(_id)
            seen.add(_id)
        if dupes:
            failures.append(f"[DUPLICATE ID] {name}.csv has duplicate id(s): {sorted(dupes)}")
        else:
            print("  Duplicate IDs: none")
        id_index[name] = seen

        # Duplicate full rows
        row_tuples = [tuple(sorted(row.items(), key=lambda kv: str(kv[0]))) for row in rows]
        if len(row_tuples) != len(set(row_tuples)):
            warnings.append(f"[DUPLICATE ROW] {name}.csv contains fully duplicate rows")

        # Ragged rows (more/fewer columns than header) surface as a None key in DictReader
        ragged = [i for i, row in enumerate(rows, start=2) if None in row]
        if ragged:
            warnings.append(f"[RAGGED ROW] {name}.csv has extra/misaligned columns at row(s): {ragged}")

    # Foreign key checks
    print("\n--- Foreign key / orphan checks ---")
    fk_issues = 0
    for table, field, ref_table in FOREIGN_KEYS:
        if table not in tables or ref_table not in id_index:
            continue
        ref_ids = id_index[ref_table]
        for i, row in enumerate(tables[table], start=2):
            val = row.get(field, "")
            if val is None or val.strip() == "":
                continue  # optional FK, empty is allowed unless in REQUIRED_FIELDS
            if val not in ref_ids:
                fk_issues += 1
                failures.append(
                    f"[BROKEN FOREIGN KEY] {table}.csv row {i}: {field}='{val}' not found in {ref_table}.id"
                )
    if fk_issues == 0:
        print("  All non-empty foreign keys resolve correctly.")

    # URL sanity checks
    print("\n--- URL sanity checks ---")
    url_issues = 0
    for table, field in URL_FIELDS:
        if table not in tables:
            continue
        for i, row in enumerate(tables[table], start=2):
            val = (row.get(field) or "").strip()
            if val in PLACEHOLDER_VALUES or val.startswith("REQUIRES OFFICIAL SOURCE VERIFICATION"):
                continue  # explicitly flagged as unverified, not a fabricated URL
            if val and not URL_RE.match(val):
                url_issues += 1
                warnings.append(f"[SUSPECT URL] {table}.csv row {i}: {field}='{val}' does not look like a URL")
    if url_issues == 0:
        print("  No malformed URLs found (placeholders explicitly excluded).")

    # Coordinate sanity checks
    print("\n--- Coordinate sanity checks ---")
    coord_issues = 0
    if "locations" in tables:
        for i, row in enumerate(tables["locations"], start=2):
            lat = row.get("centroid_lat", "")
            lng = row.get("centroid_lng", "")
            if lat and lng:
                try:
                    latf, lngf = float(lat), float(lng)
                    # Karnataka bounding box roughly: lat 11.5-18.5, lng 74-78.5
                    if not (11.0 <= latf <= 19.0 and 73.5 <= lngf <= 79.0):
                        coord_issues += 1
                        warnings.append(
                            f"[COORD OUT OF RANGE] locations.csv row {i}: ({lat},{lng}) is outside the expected Karnataka bounding box"
                        )
                except ValueError:
                    coord_issues += 1
                    failures.append(f"[INVALID COORD] locations.csv row {i}: non-numeric lat/lng")
    if "training_centres" in tables:
        for i, row in enumerate(tables["training_centres"], start=2):
            lat = row.get("latitude", "")
            lng = row.get("longitude", "")
            if lat and lng:
                try:
                    float(lat), float(lng)
                except ValueError:
                    coord_issues += 1
                    failures.append(f"[INVALID COORD] training_centres.csv row {i}: non-numeric lat/lng")
    if coord_issues == 0:
        print("  No invalid coordinates found.")

    # Orphan check: rows in child tables never referenced anywhere is not applicable here;
    # instead check that every occupation/skill/scheme/source is referenced at least once
    # where that is expected (informational only, not a failure).
    print("\n--- Reference-coverage (informational) ---")
    if "occupations" in tables and "occupation_skills" in tables:
        used = {r["occupation_id"] for r in tables["occupation_skills"]}
        unused = [r["id"] for r in tables["occupations"] if r["id"] not in used]
        if unused:
            warnings.append(f"[NO SKILL MAPPING] occupations with no occupation_skills row: {unused}")

    if "sources" in tables and "evidence" in tables:
        used = {r["source_id"] for r in tables["evidence"]}
        unused = [r["id"] for r in tables["sources"] if r["id"] not in used]
        if unused:
            warnings.append(f"[NO EVIDENCE ROW] sources with no evidence.csv row citing them: {unused}")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Tables checked: {len(tables)}")
    print(f"FAILURES: {len(failures)}")
    for f in failures:
        print(f"  - {f}")
    print(f"WARNINGS: {len(warnings)}")
    for w in warnings:
        print(f"  - {w}")

    if failures:
        print("\nRESULT: FAIL — fix the failures above before treating this dataset as seed-ready.")
        sys.exit(1)
    else:
        print("\nRESULT: PASS — no structural failures found. Review warnings before production use.")
        sys.exit(0)


if __name__ == "__main__":
    main()
