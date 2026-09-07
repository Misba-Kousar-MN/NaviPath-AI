#!/usr/bin/env python3
"""
Golden-test-case coverage check for the AI Skill Navigator seed dataset.

For each of the five golden worker scenarios (see docs/ARCHITECTURE.md Section N),
this script queries the CSVs in data/seed/ the same way the eventual backend would,
and reports what the CURRENT dataset can and cannot support. Anything not backed
by a real row is reported as "NOT AVAILABLE IN VERIFIED DATA" rather than guessed.

Pure standard library. Run with:
    python scripts/test_dataset.py
"""
import csv
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "seed")

NA = "NOT AVAILABLE IN VERIFIED DATA"


def load(name):
    path = os.path.join(BASE, f"{name}.csv")
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def index_by(rows, key):
    return {r[key]: r for r in rows}


def main():
    occupations = load("occupations")
    skills = load("skills")
    occupation_skills = load("occupation_skills")
    skill_transitions = load("skill_transitions")
    courses = load("courses")
    training_centres = load("training_centres")
    centre_courses = load("centre_courses")
    schemes = load("schemes")
    eligibility_rules = load("eligibility_rules")
    locations = load("locations")

    occ_by_id = index_by(occupations, "id")
    skl_by_id = index_by(skills, "id")
    sch_by_id = index_by(schemes, "id")

    def find_occupation_by_name_fragment(fragment):
        fragment = fragment.lower()
        for o in occupations:
            if fragment in o["name_en"].lower():
                return o
        return None

    def skills_for_occupation(occ_id):
        return [skl_by_id[r["skill_id"]] for r in occupation_skills if r["occupation_id"] == occ_id]

    def transitions_for_occupation(occ_id):
        return [t for t in skill_transitions if t["from_occupation_id"] == occ_id]

    def courses_for_skill(skill_id):
        return [c for c in courses if c["skill_id"] == skill_id]

    def centres_for_course(course_id):
        centre_ids = [cc["centre_id"] for cc in centre_courses if cc["course_id"] == course_id]
        return [tc for tc in training_centres if tc["id"] in centre_ids]

    def location_known(district_fragment):
        for loc in locations:
            if district_fragment.lower() in loc["district"].lower():
                return loc
        return None

    def eligibility_for_scheme(scheme_id):
        return [r for r in eligibility_rules if r["scheme_id"] == scheme_id]

    scenarios = [
        {
            "name": "1. Delivery Rider — Bengaluru Urban",
            "occ_fragment": "Delivery",
            "location_fragment": "Bengaluru Urban",
            "candidate_schemes": ["sch-001", "sch-005"],
        },
        {
            "name": "2. Domestic Worker — Mysuru",
            "occ_fragment": "Domestic Worker",
            "location_fragment": "Mysuru",
            "candidate_schemes": ["sch-001", "sch-003", "sch-005"],
        },
        {
            "name": "3. Construction Daily-Wage Migrant — Kalaburagi",
            "occ_fragment": "Construction",
            "location_fragment": "Kalaburagi",
            "candidate_schemes": ["sch-004"],
        },
        {
            "name": "4. Auto-Rickshaw Driver — Hubballi-Dharwad",
            "occ_fragment": "Auto-Rickshaw",
            "location_fragment": "Dharwad",
            "candidate_schemes": ["sch-003", "sch-005"],
        },
        {
            "name": "5. Street Vendor — Ballari",
            "occ_fragment": "Street",
            "location_fragment": "Ballari",
            "candidate_schemes": ["sch-001"],
        },
    ]

    print("=" * 78)
    print("Golden Test Case Coverage — AI Skill Navigator Seed Dataset")
    print("=" * 78)

    for sc in scenarios:
        print(f"\n{'-' * 78}\n{sc['name']}\n{'-' * 78}")

        occ = find_occupation_by_name_fragment(sc["occ_fragment"])
        if occ:
            print(f"Matching occupation: {occ['name_en']} ({occ['id']}) "
                  f"[NCO: {occ['nco_code'] or NA}]")
        else:
            print(f"Matching occupation: {NA}")
            occ = None

        if occ:
            cur_skills = skills_for_occupation(occ["id"])
            if cur_skills:
                print("Current/available skills for this occupation:")
                for s in cur_skills:
                    print(f"  - {s['name_en']} ({s['id']}, NSQF-aligned skill)")
            else:
                print(f"Current/available skills for this occupation: {NA} "
                      f"(no verified occupation_skills row)")

            transitions = transitions_for_occupation(occ["id"])
            if transitions:
                print("Possible skill transitions:")
                for t in transitions:
                    target = skl_by_id.get(t["to_skill_id"], {}).get("name_en", t["to_skill_id"])
                    print(f"  - -> {target}  [confidence: {t['confidence']}]")
                    for c in courses_for_skill(t["to_skill_id"]):
                        print(f"      course: {c['title']} ({c['id']})")
                        centres = centres_for_course(c["id"])
                        if centres:
                            for tc in centres:
                                print(f"        centre: {tc['name']} ({tc['district']})")
                        else:
                            print(f"        matching centre: {NA} "
                                  f"(centre_courses.csv has no verified linkage yet)")
            else:
                print(f"Possible skill transitions: {NA} (no skill_transitions row for this occupation)")
        else:
            print(f"Current/available skills: {NA}")
            print(f"Possible skill transitions: {NA}")

        loc = location_known(sc["location_fragment"])
        if loc:
            print(f"Location match: {loc['district']} "
                  f"(approximate centroid {loc['centroid_lat']}, {loc['centroid_lng']})")
        else:
            print(f"Location match: {NA}")

        print("Potentially relevant schemes:")
        any_scheme = False
        for sid in sc["candidate_schemes"]:
            s = sch_by_id.get(sid)
            if s:
                any_scheme = True
                print(f"  - {s['name_en']} ({s['id']}) [status: {s['status']}]")
                rules = eligibility_for_scheme(sid)
                if rules:
                    for r in rules:
                        print(f"      rule: {r['human_readable_condition']} "
                              f"[{r['rule_status']}]")
                else:
                    print(f"      eligibility rules: {NA}")
        if not any_scheme:
            print(f"  {NA}")

    print(f"\n{'=' * 78}")
    print("Note: rows marked 'needs-review' or 'pending-review' in the underlying")
    print("CSVs are surfaced above as candidates, not as confirmed facts. See")
    print("docs/DATASET_COMPLETION_REPORT.md for the full verification breakdown.")
    print("=" * 78)


if __name__ == "__main__":
    main()
