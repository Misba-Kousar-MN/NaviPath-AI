#!/usr/bin/env python3
"""
Comprehensive Multi-Pass Locality-First Geocoding Pipeline for Karnataka Training Centres.

Features:
- Locality-first query normalization eliminating door/building/complex noise
- Distinguishes high-value geographic tokens (Nagar, Road, Layout, Cross, Circle, Taluk, etc.)
- Multi-pass fallback strategy (Locality+District, Taluk+District, Cleaned Addr, PIN, Centre Name+Locality)
- Deterministic scoring & geographic validation (Country, State, District, Taluk, PIN, Locality token overlap)
- Classification into HIGH, MEDIUM, LOW, AMBIGUOUS, FAILED
- Unresolved categorization: PLACEHOLDER, INSUFFICIENT_ADDRESS, FAILED_NO_RESULT, FAILED_VALIDATION, AMBIGUOUS
- Zero coordinate fabrication: unresolvable addresses remain NULL
- Rate limit compliant (1 req/sec max) with persistent JSON cache
- Direct PostgreSQL / Supabase persistence with SQLAlchemy transaction commit
- Fresh session database verification for PostGIS geography(Point, 4326) generated column
- Generates geocoding_report.json, geocoding_report.csv, and unresolved_report.json
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
import urllib.parse
import urllib.request

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED_CSV = os.path.join(BASE_DIR, "data", "seed", "training_centres.csv")
CACHE_FILE = os.path.join(BASE_DIR, "data", "cache", "nominatim_cache.json")
REPORT_JSON = os.path.join(BASE_DIR, "data", "geocoding_report.json")
REPORT_CSV = os.path.join(BASE_DIR, "data", "geocoding_report.csv")
UNRESOLVED_JSON = os.path.join(BASE_DIR, "data", "unresolved_report.json")

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.config import get_settings
from app.db.session import SessionLocal, engine
from sqlalchemy import text

# Karnataka Geographic Bounding Box
KTK_MIN_LAT, KTK_MAX_LAT = 11.5, 18.6
KTK_MIN_LNG, KTK_MAX_LNG = 74.0, 78.7

USER_AGENT = "AISkillNavigator-LocalityFirstGeocoding/2.0 (responsible-geocoding; hackathon)"

# District alias mapping
DISTRICT_ALIASES = {
    "bengaluru urban": ["bengaluru", "bangalore", "bangalore urban", "bengaluru urban", "bangalore north", "bangalore south", "bangalore east"],
    "bengaluru rural": ["bengaluru rural", "bangalore rural", "devanahalli", "nelamangala", "doddaballapura", "hosakote"],
    "mysuru": ["mysuru", "mysore", "nanjangud", "hunsur", "t narasipura"],
    "dharwad (hubballi-dharwad)": ["dharwad", "hubballi", "hubli", "hubballi-dharwad", "kundgol", "navalgund"],
    "dharwad": ["dharwad", "hubballi", "hubli", "hubballi-dharwad"],
    "belagavi": ["belagavi", "belgaum", "gokak", "chikodi", "athani", "bailhongal"],
    "ballari": ["ballari", "bellary", "hospet", "hosapete", "sandur", "siruguppa", "kudligi"],
    "vijayapura": ["vijayapura", "bijapur", "indi", "sindgi", "muddebihal", "basavana bagewadi"],
    "kalaburagi": ["kalaburagi", "gulbarga", "sedam", "chittapur", "aland", "afzalpur", "jeevargi"],
    "shivamogga": ["shivamogga", "shimoga", "sagara", "bhadravathi", "shikaripura", "soraba", "thirthahalli"],
    "chikkamagaluru": ["chikkamagaluru", "chikmagalur", "mudigere", "kadur", "tarikere", "koppar", "narasimharajapura", "sringeri"],
    "tumakuru": ["tumakuru", "tumkur", "madhugiri", "sira", "tiptur", "kunigal", "koratagere", "gubbi", "turuvekere", "pavagada"],
    "chamarajanagar": ["chamarajanagar", "chamarajanagara", "kollegal", "gundlupet", "yelandur", "hanur"],
    "chikkaballapura": ["chikkaballapura", "chickballapur", "bagepalli", "chintamani", "gauribidanur", "sidlaghatta", "gudibande"],
    "dakshina kannada": ["dakshina kannada", "mangalore", "mangaluru", "south canara", "bantwal", "puttur", "belthangady", "sullia", "ullal"],
    "uttara kannada": ["uttara kannada", "karwar", "north canara", "sirsi", "kumta", "bhatkal", "ankola", "honavar", "dandeli", "yellapur", "haliyal", "joida"],
    "bagalkot": ["bagalkot", "bagalkote", "badami", "jamkhandi", "mudhol", "hungund", "bilagi", "ilkal", "rabkavi banhatti"],
    "davanagere": ["davanagere", "davangere", "harihar", "channagiri", "honnali", "jagalur", "harapanahalli"],
    "chitradurga": ["chitradurga", "challakere", "hiriyur", "holalkere", "hosadurga", "molakalmuru"],
    "bidar": ["bidar", "bhalki", "humnabad", "basavakalyan", "aurad"],
    "hassan": ["hassan", "channarayapatna", "channarayapattana", "arasikere", "arsikere", "sakleshpur", "holenarasipura", "arkalgud", "belur", "alshur"],
    "haveri": ["haveri", "ranebennur", "byadgi", "hangal", "hirekerur", "shiggaon", "savada"],
    "kodagu": ["kodagu", "coorg", "madikeri", "somwarpet", "virajpet", "kushalnagar"],
    "kolar": ["kolar", "kgf", "kolar gold fields", "bangarapet", "malur", "mulbagal", "srinivaspur", "robertsonpet"],
    "koppal": ["koppal", "gangavathi", "kushtagi", "yalaburga"],
    "mandya": ["mandya", "maddur", "malavalli", "srirangapatna", "pandavapura", "nagamangala", "krishnarajpet", "melukote"],
    "raichur": ["raichur", "manvi", "sindhanur", "devadurga", "lingasugur", "maski"],
    "ramanagara": ["ramanagara", "channapatna", "channapattana", "kanakapura", "magadi"],
    "udupi": ["udupi", "kundapura", "karkala", "kaup", "brahmavara", "byndoor", "hebri"],
    "yadgir": ["yadgir", "yadigiri", "shahapur", "shorapur", "surpur", "hunasagi", "wadagera", "gurmitkal"],
}

# Low-value prefixes/tokens to remove from search queries
LOW_VALUE_PATTERNS = [
    r"\bNo\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\b\#\s*\d+[\w\/\-]*\b",
    r"\bDoor\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bHouse\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bPlot\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bFlat\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bShop\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bBuilding\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bSurvey\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bSy\.?\s*No\.?[\-\s]*\d+[\w\/\-]*\b",
    r"\bPB\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bP\.?B\.?\s*No\.?\s*[:\-\#]?\s*\d+[\w\/\-]*\b",
    r"\bCA\.?\s*Site\s*No[\(\w\)\s\d\.\-]*\b",
    r"\bID-\d+\b",
    r"\bK\.?B\.?C\.?\s*Complex\b",
    r"\b\d+\s*(?:st|nd|rd|th)\s*Floor\b",
    r"\bFloor\b",
    r"\bBlock\s*[-A-Za-z0-9]+\b",
    r"\bRoom\s*[-A-Za-z0-9]+\b",
    r"\bUnit\s*[-A-Za-z0-9]+\b",
    r"\bAt\s*Post:?\b",
    r"\bTq\.?:?\b",
    r"\bDt\.?:?\b",
    r"\bDist\.?:?\b",
    r"\bDistrict\b",
    r"\bTaluk\b",
    r"\bTaluku\b",
    r"\bPO\b",
    r"\bP\.O\.\b",
    r"\bNear\b",
    r"\bOpp\.?\b",
    r"\bOpposite\b",
    r"\bBehind\b",
    r"\bBeside\b",
]

# Generic institution tokens to strip when cleaning centre name for search
INSTITUTION_STRIP_PATTERNS = [
    r"\b(Private ITI|Pvt ITI|Government ITI|Govt ITI|Govt\.? ITI|Pvt\.? ITI)\b",
    r"\b(Industrial Training Centre|Industrial Training Institute|Training Institute|Training Centre|Technical Training Centre)\b",
    r"\b(ITC|ITI|IT Centre|I\.T\.C\.?|I\.T\.I\.?)\b",
    r"\b(Trust|Society|Samsthe|Sansthe|Vidyavardhaka|Vidya Samsthe|Education Trust|Educational Trust)\b",
    r"\b(MIS\s*[A-Z0-9]+)\b",
    r"\b(for Women|for the Deaf|Minorities|Memorial)\b",
]

STOP_WORDS = {
    "karnataka", "india", "road", "street", "cross", "main", "near", "opp", "opposite",
    "post", "tq", "taluk", "dist", "district", "iti", "itc", "private", "govt", "government",
    "industrial", "training", "institute", "centre", "center", "trust", "society", "building",
    "no", "plot", "site", "door", "complex", "extension", "nagar", "layout"
}


def load_cache() -> dict[str, list]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache: dict[str, list]):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def query_nominatim(query_str: str, cache: dict[str, list]) -> list[dict]:
    normalized_q = query_str.strip().lower()
    if not normalized_q:
        return []
    if normalized_q in cache:
        return cache[normalized_q]

    params = {
        "q": query_str,
        "format": "jsonv2",
        "addressdetails": "1",
        "namedetails": "1",
        "limit": "5",
        "countrycodes": "in",
    }
    url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        time.sleep(1.05)  # Strict 1 req/sec limit
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            cache[normalized_q] = data
            save_cache(cache)
            return data
    except Exception as e:
        print(f"    [WARN] Geocoding request failed for '{query_str}': {e}", file=sys.stderr)
        return []


def clean_district_name(district: str | None) -> str:
    if not district:
        return ""
    d = re.sub(r"\(.*?\)", "", district).strip()
    # Normalize common naming variants
    if d.lower() in ("bengaluru urban", "bangalore urban"):
        return "Bengaluru"
    if d.lower() in ("bengaluru rural", "bangalore rural"):
        return "Bengaluru Rural"
    if d.lower() in ("mysuru", "mysore"):
        return "Mysuru"
    if d.lower() in ("ballari", "bellary"):
        return "Ballari"
    if d.lower() in ("belagavi", "belgaum"):
        return "Belagavi"
    if d.lower() in ("kalaburagi", "gulbarga"):
        return "Kalaburagi"
    if d.lower() in ("vijayapura", "bijapur"):
        return "Vijayapura"
    if d.lower() in ("shivamogga", "shimoga"):
        return "Shivamogga"
    if d.lower() in ("tumakuru", "tumkur"):
        return "Tumakuru"
    if d.lower() in ("dakshina kannada", "mangalore"):
        return "Mangaluru"
    return d


def extract_pin(text: str) -> str | None:
    match = re.search(r"\b(5[678]\d{4})\b", text)
    return match.group(1) if match else None


def clean_centre_name(raw_name: str) -> str:
    """
    Cleans institute name into a compact distinctive name for secondary queries.
    Does NOT modify the database value.
    """
    name = raw_name
    for pat in INSTITUTION_STRIP_PATTERNS:
        name = re.sub(pat, " ", name, flags=re.IGNORECASE)
    # Remove punctuation
    name = re.sub(r"[\#\(\)\/\,\.\-\:\;]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def extract_geographic_segments(raw_addr: str) -> list[str]:
    """
    Extracts high-value geographic segments (localities, roads, areas, taluks)
    while removing door numbers, complex names, floor, and building noise.
    """
    if not raw_addr:
        return []

    t = raw_addr
    for pat in LOW_VALUE_PATTERNS:
        t = re.sub(pat, " ", t, flags=re.IGNORECASE)

    # Split on commas, semicolons, dashes, or newlines
    raw_segments = re.split(r"[,;\n\r]+", t)
    clean_segments = []

    for seg in raw_segments:
        s = seg.strip()
        s = re.sub(r"^[0-9\s\.\-\#\/\:]+", "", s)  # leading numbers
        s = re.sub(r"[0-9\s\.\-\#\/\:]+$", "", s)  # trailing numbers
        s = re.sub(r"[\#\(\)\/]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        # Filter out empty or trivial words
        if len(s) >= 3 and not s.isdigit() and s.lower() not in ("karnataka", "india"):
            clean_segments.append(s)

    return clean_segments


def build_query_passes(row: dict) -> list[tuple[str, str]]:
    """
    Constructs multi-pass locality-first query candidates.
    PASS 1: [strong locality/landmark], [district], Karnataka, India
    PASS 2: [strong locality/landmark], [taluk], [district], Karnataka, India
    PASS 3: [cleaned geographic address], [district], Karnataka, India
    PASS 4: [PIN], Karnataka, India
    PASS 5: [clean centre name], [strong locality], [district], Karnataka, India
    PASS 6: [clean centre name], [district], Karnataka, India
    PASS 7: [cleaned address], Karnataka, India
    """
    raw_addr = (row.get("address") or "").strip()
    raw_name = (row.get("name") or "").strip()
    taluk = (row.get("taluk") or "").strip()
    district = clean_district_name(row.get("district"))
    pin = extract_pin(raw_addr)

    geo_segments = extract_geographic_segments(raw_addr)
    clean_name = clean_centre_name(raw_name)

    # Reconstruct cleaned address
    clean_addr = ", ".join(geo_segments) if geo_segments else raw_addr

    passes: list[tuple[str, str]] = []
    seen_queries = set()

    def add_pass(pname: str, parts: list[str]):
        valid_parts = [p.strip() for p in parts if p and p.strip()]
        q = ", ".join(valid_parts)
        q_norm = q.lower()
        if q_norm and q_norm not in seen_queries:
            seen_queries.add(q_norm)
            passes.append((pname, q))

    # PASS 1: Strong locality/landmark + District
    if geo_segments:
        # Take the most specific locality (first or combined first two)
        loc = geo_segments[0]
        add_pass("PASS_1_LOCALITY_DIST", [loc, district, "Karnataka", "India"])
        if len(geo_segments) > 1:
            loc2 = f"{geo_segments[0]}, {geo_segments[1]}"
            add_pass("PASS_1B_LOCALITIES_DIST", [loc2, district, "Karnataka", "India"])

    # PASS 2: Strong locality + Taluk + District
    if geo_segments and taluk:
        add_pass("PASS_2_LOCALITY_TALUK_DIST", [geo_segments[0], taluk, district, "Karnataka", "India"])
    elif taluk:
        add_pass("PASS_2B_TALUK_DIST", [taluk, district, "Karnataka", "India"])

    # PASS 3: Cleaned geographic address + District
    if clean_addr:
        add_pass("PASS_3_CLEAN_ADDR_DIST", [clean_addr, district, "Karnataka", "India"])

    # PASS 4: PIN + District
    if pin:
        add_pass("PASS_4_PIN", [pin, district, "Karnataka", "India"])

    # PASS 5: Cleaned centre name + Strong locality + District
    if len(clean_name) > 3 and geo_segments:
        add_pass("PASS_5_NAME_LOCALITY_DIST", [clean_name, geo_segments[0], district, "Karnataka", "India"])

    # PASS 6: Cleaned centre name + District
    if len(clean_name) > 3:
        add_pass("PASS_6_NAME_DIST", [clean_name, district, "Karnataka", "India"])

    # PASS 7: Cleaned address + State
    if clean_addr:
        add_pass("PASS_7_CLEAN_ADDR_STATE", [clean_addr, "Karnataka", "India"])

    return passes


def score_candidate(candidate: dict, row: dict, query_pass: str, query_str: str) -> tuple[float, list[str]]:
    """
    Deterministic scoring and validation for a candidate returned by Nominatim.
    """
    reasons = []
    score = 0.0

    # 1. Coordinate check
    try:
        lat = float(candidate["lat"])
        lon = float(candidate["lon"])
    except (KeyError, ValueError):
        return 0.0, ["Invalid coordinates"]

    if not (KTK_MIN_LAT <= lat <= KTK_MAX_LAT and KTK_MIN_LNG <= lon <= KTK_MAX_LNG):
        return 0.0, ["Coordinates outside Karnataka bounding box"]

    # Guard: Reject administrative boundary / city / district centroids
    addresstype = (candidate.get("addresstype") or "").lower()
    place_type = (candidate.get("type") or "").lower()
    category = (candidate.get("category") or "").lower()
    if addresstype in ("city", "country", "state", "state_district", "county") or (category == "boundary" and place_type == "administrative"):
        return 0.0, [f"Rejected administrative/city centroid ({addresstype or category})"]

    addr_obj = candidate.get("address", {})
    display_name = (candidate.get("display_name") or "").lower()

    # 2. Country validation
    country = addr_obj.get("country", "").lower()
    if country == "india" or "india" in display_name:
        score += 25
        reasons.append("Country=India (+25)")
    else:
        return 0.0, ["Not in India"]

    # 3. State validation
    state = addr_obj.get("state", "").lower()
    if state == "karnataka" or "karnataka" in display_name:
        score += 25
        reasons.append("State=Karnataka (+25)")
    else:
        return 0.0, ["Not in Karnataka"]

    # 4. District validation
    row_district = (row.get("district") or "").lower().strip()
    valid_aliases = DISTRICT_ALIASES.get(row_district, [clean_district_name(row_district).lower()])
    
    cand_dist = addr_obj.get("state_district", "").lower()
    cand_county = addr_obj.get("county", "").lower()
    cand_city = addr_obj.get("city", "").lower()

    district_matched = any(
        alias in display_name or alias in cand_dist or alias in cand_county or alias in cand_city
        for alias in valid_aliases if alias
    )
    if district_matched:
        score += 20
        reasons.append("District matched (+20)")
    else:
        # Check if matched another known Karnataka district
        other_districts = [d for d in DISTRICT_ALIASES if d != row_district]
        mismatched = any(od in cand_dist for od in other_districts if od in cand_dist)
        if mismatched:
            score -= 30
            reasons.append("Mismatched district (-30)")

    # 5. PIN / Postcode validation
    target_pin = extract_pin(row.get("address", ""))
    cand_pin = addr_obj.get("postcode", "").strip()
    if target_pin and cand_pin:
        if target_pin == cand_pin:
            score += 15
            reasons.append(f"PIN match {target_pin} (+15)")

    # 6. Taluk / Locality match
    taluk = (row.get("taluk") or "").lower().strip()
    if taluk and (taluk in display_name or taluk in addr_obj.get("town", "").lower() or taluk in addr_obj.get("suburb", "").lower()):
        score += 10
        reasons.append(f"Taluk match '{taluk}' (+10)")

    # 7. Token overlap (significant words from name + address)
    tokens_target = set(re.findall(r"\b[a-zA-Z]{4,}\b", (row.get("name", "") + " " + row.get("address", "")).lower()))
    tokens_target = {t for t in tokens_target if t not in STOP_WORDS}
    tokens_cand = set(re.findall(r"\b[a-zA-Z]{4,}\b", display_name))
    
    overlap = tokens_target.intersection(tokens_cand)
    if len(overlap) >= 3:
        score += 15
        reasons.append(f"Strong token overlap {list(overlap)[:3]} (+15)")
    elif len(overlap) >= 1:
        score += 8
        reasons.append(f"Token overlap {list(overlap)[:2]} (+8)")

    # 8. Plausible POI type
    category = candidate.get("category", "")
    place_type = candidate.get("type", "")
    if category in ("amenity", "building", "office", "education", "highway", "place") or place_type in ("school", "college", "university", "industrial", "commercial", "suburb", "residential", "locality", "village", "town"):
        score += 5
        reasons.append(f"Plausible POI ({category}/{place_type}) (+5)")

    return max(0.0, score), reasons


def geocode_single_centre(row: dict, cache: dict[str, list]) -> dict:
    cid = row["id"]
    name = row["name"]
    addr = (row.get("address") or "").strip()
    district = row.get("district", "")
    taluk = row.get("taluk", "")

    # Check for placeholder address
    if not addr or "REQUIRES OFFICIAL SOURCE VERIFICATION" in addr.upper():
        return {
            "centre_id": cid,
            "centre_name": name,
            "original_address": addr,
            "district": district,
            "taluk": taluk,
            "latitude": None,
            "longitude": None,
            "status": "FAILED",
            "confidence": "NONE",
            "provider": None,
            "geocoding_query": None,
            "provider_result": None,
            "validation_reason": "Placeholder / unverified address ('REQUIRES OFFICIAL SOURCE VERIFICATION')",
            "unresolved_category": "PLACEHOLDER",
            "attempted_passes": [],
            "geocoded_at": None,
        }

    query_passes = build_query_passes(row)
    if not query_passes:
        return {
            "centre_id": cid,
            "centre_name": name,
            "original_address": addr,
            "district": district,
            "taluk": taluk,
            "latitude": None,
            "longitude": None,
            "status": "FAILED",
            "confidence": "NONE",
            "provider": None,
            "geocoding_query": None,
            "provider_result": None,
            "validation_reason": "Insufficient address data to construct search queries",
            "unresolved_category": "INSUFFICIENT_ADDRESS",
            "attempted_passes": [],
            "geocoded_at": None,
        }

    best_candidate = None
    best_score = 0.0
    best_reasons = []
    best_query = ""
    best_pass = ""
    attempted_summary = []
    total_candidates_found = 0

    for pass_name, q in query_passes:
        candidates = query_nominatim(q, cache)
        cand_count = len(candidates)
        total_candidates_found += cand_count
        attempted_summary.append({"pass": pass_name, "query": q, "candidates_returned": cand_count})

        if not candidates:
            continue

        scored_candidates = []
        for cand in candidates:
            sc, reasons = score_candidate(cand, row, pass_name, q)
            if sc > 0:
                scored_candidates.append((sc, cand, reasons))

        if not scored_candidates:
            continue

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_sc, top_cand, top_reasons = scored_candidates[0]

        # Check for ambiguity among returned results
        if len(scored_candidates) > 1:
            second_sc, second_cand, _ = scored_candidates[1]
            try:
                lat1, lon1 = float(top_cand["lat"]), float(top_cand["lon"])
                lat2, lon2 = float(second_cand["lat"]), float(second_cand["lon"])
                dist_approx_km = abs(lat1 - lat2) * 111.0 + abs(lon1 - lon2) * 111.0
                if dist_approx_km > 25.0 and abs(top_sc - second_sc) < 10.0:
                    return {
                        "centre_id": cid,
                        "centre_name": name,
                        "original_address": addr,
                        "district": district,
                        "taluk": taluk,
                        "latitude": None,
                        "longitude": None,
                        "status": "AMBIGUOUS",
                        "confidence": "AMBIGUOUS",
                        "provider": "osm-nominatim",
                        "geocoding_query": q,
                        "provider_result": top_cand.get("display_name"),
                        "validation_reason": f"Multiple distant candidates (>25km) in {pass_name}",
                        "unresolved_category": "AMBIGUOUS",
                        "attempted_passes": attempted_summary,
                        "geocoded_at": None,
                    }
            except (KeyError, ValueError):
                pass

        if top_sc > best_score:
            best_score = top_sc
            best_candidate = top_cand
            best_reasons = top_reasons
            best_query = q
            best_pass = pass_name

        # If high confidence (>= 75), stop passes early
        if best_score >= 75:
            break

    now_iso = datetime.now(timezone.utc).isoformat()

    # Determine confidence classification
    if best_candidate and best_score >= 75:
        lat = round(float(best_candidate["lat"]), 6)
        lon = round(float(best_candidate["lon"]), 6)
        return {
            "centre_id": cid,
            "centre_name": name,
            "original_address": addr,
            "district": district,
            "taluk": taluk,
            "latitude": lat,
            "longitude": lon,
            "status": "SUCCESS",
            "confidence": "HIGH",
            "provider": "osm-nominatim",
            "geocoding_query": best_query,
            "provider_result": best_candidate.get("display_name"),
            "validation_reason": f"High confidence match (Score {best_score}): {'; '.join(best_reasons)}",
            "unresolved_category": None,
            "attempted_passes": attempted_summary,
            "geocoded_at": now_iso,
        }
    elif best_candidate and best_score >= 55:
        lat = round(float(best_candidate["lat"]), 6)
        lon = round(float(best_candidate["lon"]), 6)
        return {
            "centre_id": cid,
            "centre_name": name,
            "original_address": addr,
            "district": district,
            "taluk": taluk,
            "latitude": lat,
            "longitude": lon,
            "status": "SUCCESS",
            "confidence": "MEDIUM",
            "provider": "osm-nominatim",
            "geocoding_query": best_query,
            "provider_result": best_candidate.get("display_name"),
            "validation_reason": f"Medium confidence validated match (Score {best_score}): {'; '.join(best_reasons)}",
            "unresolved_category": None,
            "attempted_passes": attempted_summary,
            "geocoded_at": now_iso,
        }
    else:
        unresolved_cat = "FAILED_NO_RESULT" if total_candidates_found == 0 else "FAILED_VALIDATION"
        return {
            "centre_id": cid,
            "centre_name": name,
            "original_address": addr,
            "district": district,
            "taluk": taluk,
            "latitude": None,
            "longitude": None,
            "status": "FAILED",
            "confidence": "LOW",
            "provider": "osm-nominatim" if best_candidate else None,
            "geocoding_query": best_query if best_query else (query_passes[0][1] if query_passes else None),
            "provider_result": best_candidate.get("display_name") if best_candidate else None,
            "validation_reason": f"Insufficient match quality (Score {best_score} < 55)" if best_candidate else "No matching results across all query passes",
            "unresolved_category": unresolved_cat,
            "attempted_passes": attempted_summary,
            "geocoded_at": None,
        }


def run_full_pipeline():
    print("=" * 80)
    print("AI Skill Navigator — Locality-First Multi-Pass Geocoding & Persistence")
    print("=" * 80)

    # 1. Load centres directly from live database
    print("1. Loading training centres from live PostgreSQL database...")
    db = SessionLocal()
    try:
        db_rows = db.execute(text("""
            SELECT id, name, district, taluk, address, latitude, longitude,
                   geocoding_status, geocoding_source, geocoding_confidence, geocoding_query, geocoded_at
            FROM training_centres
            ORDER BY id;
        """)).mappings().fetchall()
        rows = [dict(r) for r in db_rows]
    finally:
        db.close()

    print(f"Loaded {len(rows)} training centres from live database.")

    cache = load_cache()
    print(f"Loaded {len(cache)} cached queries from Nominatim cache.")

    results = []
    high_count = 0
    medium_count = 0
    low_count = 0
    failed_count = 0
    ambiguous_count = 0
    placeholder_count = 0
    usable_count = 0

    for i, row in enumerate(rows, 1):
        res = geocode_single_centre(row, cache)
        results.append(res)

        addr = (row.get("address") or "").strip()
        if not addr or "REQUIRES OFFICIAL SOURCE VERIFICATION" in addr.upper():
            placeholder_count += 1
        else:
            usable_count += 1

        conf = res["confidence"]
        status = res["status"]
        if conf == "HIGH":
            high_count += 1
        elif conf == "MEDIUM":
            medium_count += 1
        elif conf == "AMBIGUOUS":
            ambiguous_count += 1
        else:
            low_count += 1

        if status == "FAILED":
            failed_count += 1

        if i % 20 == 0 or i == len(rows):
            print(f"  Processed {i}/{len(rows)} centres (High: {high_count}, Medium: {medium_count}, Unresolved: {len(results) - high_count - medium_count})...")

    # Save cache
    save_cache(cache)

    # Save detailed JSON and CSV reports
    os.makedirs(os.path.dirname(REPORT_JSON), exist_ok=True)
    with open(REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    report_fields = [
        "centre_id", "centre_name", "original_address", "district", "taluk", "geocoding_query",
        "latitude", "longitude", "status", "confidence", "provider", "provider_result",
        "validation_reason", "unresolved_category", "geocoded_at"
    ]
    with open(REPORT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=report_fields)
        writer.writeheader()
        for r in results:
            row_dict = {k: r.get(k) for k in report_fields}
            writer.writerow(row_dict)

    # Save Unresolved Report
    unresolved_rows = [r for r in results if r["status"] != "SUCCESS"]
    with open(UNRESOLVED_JSON, "w", encoding="utf-8") as f:
        json.dump(unresolved_rows, f, indent=2, ensure_ascii=False)

    # Update data/seed/training_centres.csv to stay in sync
    if os.path.exists(SEED_CSV):
        with open(SEED_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = list(reader.fieldnames or [])
            seed_rows = list(reader)

        for field in ["geocoding_status", "geocoding_source", "geocoding_confidence", "geocoding_query", "geocoded_at"]:
            if field not in fieldnames:
                fieldnames.append(field)

        res_by_id = {r["centre_id"]: r for r in results}
        for srow in seed_rows:
            r = res_by_id.get(srow["id"])
            if r:
                srow["latitude"] = str(r["latitude"]) if r["latitude"] is not None else ""
                srow["longitude"] = str(r["longitude"]) if r["longitude"] is not None else ""
                srow["geocoding_status"] = r["status"]
                srow["geocoding_source"] = r["provider"] or ""
                srow["geocoding_confidence"] = r["confidence"]
                srow["geocoding_query"] = r["geocoding_query"] or ""
                srow["geocoded_at"] = r["geocoded_at"] or ""

        with open(SEED_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(seed_rows)

    # Persist directly into PostgreSQL / Supabase
    print("\nPersisting derived coordinates directly to live PostgreSQL / Supabase...")
    db = SessionLocal()
    try:
        now_dt = datetime.now(timezone.utc)
        for r in results:
            cid = r["centre_id"]
            if r["status"] == "SUCCESS" and r["latitude"] is not None and r["longitude"] is not None:
                db.execute(text("""
                    UPDATE training_centres
                    SET latitude = :lat,
                        longitude = :lon,
                        geocoding_status = :status,
                        geocoding_source = :src,
                        geocoding_confidence = :conf,
                        geocoding_query = :q,
                        geocoded_at = :g_at,
                        updated_at = :u_at
                    WHERE id = :id
                """), {
                    "lat": r["latitude"],
                    "lon": r["longitude"],
                    "status": r["status"],
                    "src": r["provider"],
                    "conf": r["confidence"],
                    "q": r["geocoding_query"],
                    "g_at": now_dt,
                    "u_at": now_dt,
                    "id": cid
                })
            else:
                db.execute(text("""
                    UPDATE training_centres
                    SET latitude = NULL,
                        longitude = NULL,
                        geocoding_status = :status,
                        geocoding_source = NULL,
                        geocoding_confidence = :conf,
                        geocoding_query = :q,
                        geocoded_at = NULL,
                        updated_at = :u_at
                    WHERE id = :id
                """), {
                    "status": r["status"],
                    "conf": r["confidence"],
                    "q": r["geocoding_query"],
                    "u_at": now_dt,
                    "id": cid
                })

        db.commit()
        print("[OK] Committed all updates to database transaction.")

    except Exception as e:
        db.rollback()
        print(f"Error persisting to database: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

    # Fresh session verification
    print("\n" + "=" * 80)
    print("FRESH SESSION DATABASE VERIFICATION")
    print("=" * 80)
    fresh_session = SessionLocal()
    try:
        counts = fresh_session.execute(text("""
            SELECT
                COUNT(*) AS total,
                COUNT(latitude) AS latitude_count,
                COUNT(longitude) AS longitude_count,
                COUNT(location) AS location_count,
                COUNT(CASE WHEN geocoding_status = 'SUCCESS' THEN 1 END) AS status_success_count,
                COUNT(CASE WHEN geocoding_confidence = 'HIGH' THEN 1 END) AS high_count,
                COUNT(CASE WHEN geocoding_confidence = 'MEDIUM' THEN 1 END) AS medium_count,
                COUNT(CASE WHEN geocoding_status = 'FAILED' THEN 1 END) AS status_failed_count,
                COUNT(CASE WHEN geocoding_status = 'AMBIGUOUS' THEN 1 END) AS status_ambiguous_count
            FROM training_centres;
        """)).mappings().first()

        for k, v in counts.items():
            print(f"  {k:30s}: {v}")

        # Verify location equals geocoded count
        loc_check = fresh_session.execute(text("""
            SELECT COUNT(*)
            FROM training_centres
            WHERE latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND location IS NOT NULL;
        """)).scalar()
        print(f"  Geocoded & Valid PostGIS location count: {loc_check}")

    finally:
        fresh_session.close()

    print("=" * 80)


if __name__ == "__main__":
    run_full_pipeline()
