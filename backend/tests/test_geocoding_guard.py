"""Tests protecting geocoding integrity, anti-fabrication guards, and PostGIS location consistency.
"""
from __future__ import annotations

import pytest
from sqlalchemy import text


@pytest.fixture(autouse=True)
def _require_db(db_available):
    if not db_available:
        pytest.skip("No database connection available in this environment.")


def test_unresolved_centres_have_strict_null_coordinates_and_location(db_session):
    """Every unresolved training centre must have NULL latitude, longitude, and PostGIS location."""
    rows = db_session.execute(text("""
        SELECT id, name, latitude, longitude, location
        FROM training_centres
        WHERE geocoding_status != 'SUCCESS' OR geocoding_status IS NULL
    """)).mappings().all()

    assert len(rows) == 71, f"Expected exactly 71 unresolved centres, found {len(rows)}"
    for r in rows:
        assert r["latitude"] is None, f"Unresolved centre {r['id']} has non-null latitude"
        assert r["longitude"] is None, f"Unresolved centre {r['id']} has non-null longitude"
        assert r["location"] is None, f"Unresolved centre {r['id']} has non-null PostGIS location"


def test_verified_centres_have_valid_physical_coordinates_and_postgis_geography(db_session):
    """Every verified centre must have valid coordinates in Karnataka and valid PostGIS geography."""
    rows = db_session.execute(text("""
        SELECT id, name, latitude, longitude, location, geocoding_confidence,
               ST_IsValid(location::geometry) AS is_valid_geom
        FROM training_centres
        WHERE geocoding_status = 'SUCCESS'
    """)).mappings().all()

    assert len(rows) == 69, f"Expected exactly 69 verified centres, found {len(rows)}"
    for r in rows:
        lat = float(r["latitude"])
        lng = float(r["longitude"])
        # Karnataka bounds: Lat 11.5 to 18.6, Lng 74.0 to 78.7
        assert 11.5 <= lat <= 18.6, f"Centre {r['id']} latitude {lat} outside Karnataka"
        assert 74.0 <= lng <= 78.7, f"Centre {r['id']} longitude {lng} outside Karnataka"
        assert lat < lng, f"Centre {r['id']} appears to have inverted lat/lng: lat={lat}, lng={lng}"
        assert r["location"] is not None, f"Centre {r['id']} missing PostGIS location"
        assert r["is_valid_geom"] is True, f"Centre {r['id']} PostGIS geometry is invalid"
        assert r["geocoding_confidence"] == "HIGH", f"Centre {r['id']} confidence is not HIGH"


def test_no_verified_centre_uses_district_centroid(db_session):
    """No training centre may have coordinates matching a district centroid from the locations table."""
    centroids = db_session.execute(text("""
        SELECT district, centroid_lat, centroid_lng
        FROM locations
        WHERE centroid_lat IS NOT NULL AND centroid_lng IS NOT NULL
    """)).mappings().all()

    verified = db_session.execute(text("""
        SELECT id, name, latitude, longitude
        FROM training_centres
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)).mappings().all()

    for v in verified:
        v_lat = float(v["latitude"])
        v_lng = float(v["longitude"])
        for c in centroids:
            c_lat = float(c["centroid_lat"])
            c_lng = float(c["centroid_lng"])
            dist_sq = (v_lat - c_lat) ** 2 + (v_lng - c_lng) ** 2
            assert dist_sq > 0.000001, (
                f"Centre {v['id']} ({v['name']}) coordinates match district centroid for {c['district']}!"
            )


def test_zero_duplicate_coordinates_in_verified_centres(db_session):
    """Every verified physical centre must have unique coordinates (no duplicate cluster fallbacks)."""
    coords = db_session.execute(text("""
        SELECT latitude, longitude, COUNT(*) as cnt
        FROM training_centres
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY latitude, longitude
        HAVING COUNT(*) > 1
    """)).mappings().all()

    assert len(coords) == 0, f"Found duplicate coordinates in verified centres: {coords}"


def test_score_candidate_rejects_administrative_and_city_boundaries():
    """Unit test: score_candidate in geocode_centres must reject administrative/city centroids."""
    import os, sys
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    scripts_dir = os.path.join(base_dir, "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    from geocode_centres import score_candidate

    dummy_row = {"district": "Bengaluru Urban", "name": "Test ITI", "address": "Test Road"}
    city_candidate = {
        "lat": "12.976794",
        "lon": "77.590082",
        "category": "boundary",
        "type": "administrative",
        "addresstype": "city",
        "name": "Bengaluru",
        "display_name": "Bengaluru, Bangalore North, Bengaluru Urban, Karnataka, India",
        "address": {"city": "Bengaluru", "state": "Karnataka", "country": "India"}
    }
    score, reasons = score_candidate(city_candidate, dummy_row, "PASS_6", "test query")
    assert score == 0.0, f"City administrative centroid was not rejected! Score: {score}"
    assert any("Rejected administrative/city centroid" in r for r in reasons)
