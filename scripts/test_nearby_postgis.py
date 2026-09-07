#!/usr/bin/env python3
"""
Test script for verifying nearby-centre spatial logic and API response format.
"""

from __future__ import annotations

import csv
import json
import math
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_CSV = os.path.join(BASE_DIR, "data", "seed", "training_centres.csv")
CENTRE_COURSES_CSV = os.path.join(BASE_DIR, "data", "seed", "centre_courses.csv")
COURSES_CSV = os.path.join(BASE_DIR, "data", "seed", "courses.csv")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def simulate_nearby_query(
    lat: float, lon: float, radius_km: float, course_id: str | None = None, skill_id: str | None = None
) -> list[dict]:
    # Load centres
    centres = []
    with open(SEED_CSV, "r", encoding="utf-8") as f:
        centres = list(csv.DictReader(f))

    # Load centre_courses
    centre_courses = []
    with open(CENTRE_COURSES_CSV, "r", encoding="utf-8") as f:
        centre_courses = list(csv.DictReader(f))

    # Load courses
    courses = {}
    with open(COURSES_CSV, "r", encoding="utf-8") as f:
        for c in csv.DictReader(f):
            courses[c["id"]] = c

    # Group courses by centre
    centre_to_courses = {}
    for cc in centre_courses:
        cid = cc["centre_id"]
        if cid not in centre_to_courses:
            centre_to_courses[cid] = []
        c_meta = courses.get(cc["course_id"], {})
        centre_to_courses[cid].append({
            "course_id": cc["course_id"],
            "course_title": c_meta.get("title", "Unknown Course"),
            "skill_id": c_meta.get("skill_id"),
            "freshness_flag": cc.get("freshness_flag", "CURRENT"),
            "provenance": "OFFICIAL_VERIFIED" if cc.get("freshness_flag") == "CURRENT" else "NEEDS_REVALIDATION",
            "batch_schedule_note": cc.get("batch_schedule_note"),
        })

    results = []
    for c in centres:
        lat_str = c.get("latitude")
        lon_str = c.get("longitude")
        if not lat_str or not lon_str:
            # Null coordinates never appear in spatial queries
            continue

        c_lat = float(lat_str)
        c_lon = float(lon_str)
        dist = haversine_km(lat, lon, c_lat, c_lon)

        if dist <= radius_km:
            mapped = centre_to_courses.get(c["id"], [])
            
            # Course / skill filter
            if course_id and not any(m["course_id"] == course_id for m in mapped):
                continue
            if skill_id and not any(m["skill_id"] == skill_id for m in mapped):
                continue

            results.append({
                "id": c["id"],
                "name": c["name"],
                "centre_name": c["name"],
                "type": c.get("type"),
                "district": c["district"],
                "taluk": c.get("taluk") or None,
                "address": c.get("address"),
                "latitude": c_lat,
                "longitude": c_lon,
                "distance_km": round(dist, 2),
                "recognition_status": c.get("recognition_status"),
                "provenance": "OFFICIAL_VERIFIED" if c.get("recognition_status") == "govt-recognized" else "CURATED",
                "geocoding_status": c.get("geocoding_status"),
                "geocoding_source": c.get("geocoding_source"),
                "geocoded_at": c.get("geocoded_at"),
                "contact_phone": c.get("contact_phone") or None,
                "contact_email": c.get("contact_email") or None,
                "mapped_courses": mapped,
            })

    results.sort(key=lambda x: x["distance_km"])
    return results


def main():
    print("Testing nearby centre query around Bengaluru (12.9716, 77.5946), radius=25km...")
    res = simulate_nearby_query(12.9716, 77.5946, 25.0)
    print(f"Found {len(res)} centres within 25km radius.")
    if res:
        print("\n--- Example Nearby API Response (Top Match) ---")
        print(json.dumps(res[0], indent=2))

    print("\nTesting nearby query with course filter...")
    res_course = simulate_nearby_query(12.9716, 77.5946, 50.0, course_id="crs-002")
    print(f"Found {len(res_course)} centres offering course 'crs-002' within 50km.")
    if res_course:
        print(json.dumps(res_course[0], indent=2))


if __name__ == "__main__":
    main()
