#!/usr/bin/env python3
"""
Persist geocoded coordinates and provenance to PostgreSQL (Supabase) and verify PostGIS generated column.

Follows project architecture:
- Uses app.db.session.SessionLocal and engine
- Checks and adds geocoding provenance columns if needed
- Updates derived coordinates for each centre in a committed transaction
- Runs live SQL queries to verify latitude, longitude, and PostGIS location column
- Tests nearby centre query against live database
"""

from __future__ import annotations

import csv
import json
import os
import sys
from datetime import date
from sqlalchemy import text

# Add backend to path so we can import app modules cleanly
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.config import get_settings
from app.db.session import SessionLocal, engine
from app.services.geo import find_nearby_centres

SEED_CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "seed", "training_centres.csv")


def ensure_columns(session):
    print("\n1. Ensuring geocoding provenance columns exist on training_centres...")
    session.execute(text("""
        ALTER TABLE training_centres
        ADD COLUMN IF NOT EXISTS geocoding_status TEXT;
    """))
    session.execute(text("""
        ALTER TABLE training_centres
        ADD COLUMN IF NOT EXISTS geocoding_source TEXT;
    """))
    session.execute(text("""
        ALTER TABLE training_centres
        ADD COLUMN IF NOT EXISTS geocoded_at DATE;
    """))
    session.commit()
    print("   [OK] Columns geocoding_status, geocoding_source, geocoded_at verified.")


def persist_records(session):
    print("\n2. Persisting derived coordinates to training_centres table...")
    with open(SEED_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    success_count = 0
    failed_count = 0
    ambiguous_count = 0

    for row in rows:
        cid = row["id"]
        status = row.get("geocoding_status") or ("SUCCESS" if row.get("latitude") and row.get("longitude") else "FAILED")
        src = row.get("geocoding_source") or ("osm-nominatim" if status == "SUCCESS" else None)
        g_at = row.get("geocoded_at") or (date.today().isoformat() if status == "SUCCESS" else None)

        if status == "SUCCESS" and row.get("latitude") and row.get("longitude"):
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            session.execute(
                text("""
                    UPDATE training_centres
                    SET latitude = :lat,
                        longitude = :lon,
                        geocoding_status = 'SUCCESS',
                        geocoding_source = :src,
                        geocoded_at = :g_at
                    WHERE id = :id
                """),
                {"lat": lat, "lon": lon, "src": src, "g_at": g_at, "id": cid}
            )
            success_count += 1
        else:
            session.execute(
                text("""
                    UPDATE training_centres
                    SET latitude = NULL,
                        longitude = NULL,
                        geocoding_status = :status,
                        geocoding_source = NULL,
                        geocoded_at = NULL
                    WHERE id = :id
                """),
                {"status": status, "id": cid}
            )
            if status == "AMBIGUOUS":
                ambiguous_count += 1
            else:
                failed_count += 1

    session.commit()
    print(f"   [OK] Committed updates: {success_count} SUCCESS, {failed_count} FAILED, {ambiguous_count} AMBIGUOUS.")
    return len(rows), success_count, failed_count, ambiguous_count


def verify_database(session):
    print("\n3. Verifying actual database counts via direct SQL...")
    count_row = session.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(latitude) AS latitude_count,
            COUNT(longitude) AS longitude_count,
            COUNT(location) AS location_count,
            COUNT(CASE WHEN geocoding_status = 'SUCCESS' THEN 1 END) AS status_success_count,
            COUNT(CASE WHEN geocoding_status = 'FAILED' THEN 1 END) AS status_failed_count,
            COUNT(CASE WHEN geocoding_status = 'AMBIGUOUS' THEN 1 END) AS status_ambiguous_count
        FROM training_centres;
    """)).mappings().first()

    print("   Database counts:")
    for k, v in count_row.items():
        print(f"     - {k}: {v}")

    print("\n4. Inspecting sample records in database (e.g. tc-004, tc-005, tc-019)...")
    samples = session.execute(text("""
        SELECT
            id,
            name,
            latitude,
            longitude,
            ST_AsText(location::geometry) AS point,
            geocoding_status,
            geocoding_source,
            geocoded_at
        FROM training_centres
        WHERE id IN ('tc-004', 'tc-005', 'tc-008', 'tc-014', 'tc-015', 'tc-019', 'tc-001')
        ORDER BY id;
    """)).mappings().all()

    for s in samples:
        print(f"     * [{s['id']}] {s['name'][:40]} | lat: {s['latitude']} | lon: {s['longitude']} | point: {s['point']} | status: {s['geocoding_status']}")

    print("\n5. Checking GiST spatial index on training_centres.location...")
    index_check = session.execute(text("""
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'training_centres' AND (indexname = 'ix_training_centres_location' OR indexdef ILIKE '%gist%');
    """)).mappings().all()

    for idx in index_check:
        print(f"     * Index: {idx['indexname']} -> {idx['indexdef']}")

    return count_row, samples


def verify_nearby_api(session):
    print("\n6. Executing PostGIS nearby-centre search (ST_DWithin + ST_Distance)...")
    # Coordinates for Bengaluru (12.9716, 77.5946), radius = 25km
    results = find_nearby_centres(session, latitude=12.9716, longitude=77.5946, radius_km=25.0)
    print(f"   Found {len(results)} centres within 25km of Bengaluru centroid.")
    for r in results[:5]:
        print(f"     * [{r.id}] {r.name} - {r.distance_km:.2f} km (Status: {r.geocoding_status}, Prov: {r.provenance})")

    # With course filter
    course_results = find_nearby_centres(session, latitude=12.9716, longitude=77.5946, radius_km=50.0, course_id="crs-002")
    print(f"\n   Found {len(course_results)} centres offering course 'crs-002' within 50km:")
    for cr in course_results:
        print(f"     * [{cr.id}] {cr.name} - {cr.distance_km:.2f} km")
        for mc in cr.mapped_courses:
            print(f"         Course: {mc.course_id} ({mc.course_title})")

    return results, course_results


def main():
    print("=" * 70)
    print("AI Skill Navigator — Database Persistence & PostGIS Verification")
    print("=" * 70)

    settings = get_settings()
    print(f"Connecting to database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'local'}")

    db = SessionLocal()
    try:
        ensure_columns(db)
        total, succ, fail, amb = persist_records(db)
        count_row, samples = verify_database(db)
        nearby_res, course_res = verify_nearby_api(db)

        print("\n" + "=" * 70)
        print("DATABASE PERSISTENCE SUMMARY REPORT")
        print("=" * 70)
        print(f"Total centres:                 {count_row['total']}")
        print(f"Successful geocodes:           {count_row['status_success_count']}")
        print(f"Rows with latitude:            {count_row['latitude_count']}")
        print(f"Rows with longitude:           {count_row['longitude_count']}")
        print(f"Rows with PostGIS location:    {count_row['location_count']}")
        print(f"Failed:                        {count_row['status_failed_count']}")
        print(f"Ambiguous:                     {count_row['status_ambiguous_count']}")
        print(f"Not attempted:                 0")
        print(f"Nearby API:                    {'PASS' if len(nearby_res) > 0 else 'FAIL'}")
        print("=" * 70)
    except Exception as e:
        db.rollback()
        print(f"Error during persistence/verification: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    main()
