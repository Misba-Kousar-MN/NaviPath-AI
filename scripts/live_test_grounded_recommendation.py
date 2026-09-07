"""
Live end-to-end smoke test for Grounded Recommendations.
Invokes the complete pipeline:
  Profile Input
    ↓
  Deterministic Engine (Occupations, Skills, Courses, Centres, Eligibility)
    ↓
  RAG Semantic Retrieval (gemini-embedding-001)
    ↓
  Evidence Validator (Source trust, provenance, similarity threshold)
    ↓
  LLM Explanation Service (gemini-3.6-flash with structured output)
    ↓
  Grounded Recommendation Response
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(root_env)

backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.db.session import SessionLocal
from app.schemas.recommendation import WorkerProfileIn
from app.services.grounded_recommendations import build_grounded_recommendation

def main():
    print("==================================================")
    print("LIVE GROUNDED RECOMMENDATION SMOKE TEST")
    print("==================================================")

    skill_present = bool(os.environ.get("SKILL", "").strip())
    print(f"Gemini API Key ('SKILL') configured: {skill_present}")

    profile = WorkerProfileIn(
        occupation="Delivery / Courier Rider",
        district="Bengaluru Urban",
        age=24,
        education="12th Pass",
    )

    db = SessionLocal()
    try:
        print(f"\nSubmitting profile: {profile.occupation} in {profile.district} (Age: {profile.age})")
        resp = build_grounded_recommendation(db, profile)

        print("\n--- DETERMINISTIC BASELINE VERIFICATION ---")
        print(f"Matched Occupation: {resp.matched_occupation.name_en} ({resp.matched_occupation.id})")
        print(f"Recommended Pathways: {len(resp.recommended_pathways)}")
        for pw in resp.recommended_pathways:
            print(f"  -> Target: {pw.target_skill.name_en} (Confidence: {pw.confidence})")

        print(f"\nRecommended Courses: {len(resp.courses)}")
        for c in resp.courses:
            print(f"  -> [{c.id}] {c.title} (Duration: {c.duration_value} {c.duration_unit}, Source: {c.source_id})")

        print(f"\nRecommended Training Centres: {len(resp.nearby_centres)}")
        for tc in resp.nearby_centres:
            loc_str = f"({tc.latitude:.4f}, {tc.longitude:.4f})" if tc.latitude else "NULL"
            dist_str = f"{tc.distance_km:.2f} km" if tc.distance_km is not None else "N/A"
            print(f"  -> [{tc.id}] {tc.name} | Distance: {dist_str} | Coords: {loc_str}")

        print(f"\nScheme Eligibility Results: {len(resp.eligibility)}")
        for se in resp.eligibility:
            print(f"  -> [{se.scheme_id}] {se.scheme_name}: {se.verdict}")

        print("\n--- GROUNDING & EVIDENCE LAYER ---")
        print(f"Evidence Status: {resp.evidence_status}")
        print(f"Validated Evidence Count: {len(resp.validated_evidence)}")
        for ev in resp.validated_evidence:
            print(f"  [Chunk {ev['chunk_id']}] {ev.get('authority')} | Section: {ev.get('section')} | Similarity: {ev.get('similarity_score', 0):.4f}")

        print("\n--- LLM EXPLANATION / PERSONALIZATION LAYER ---")
        print(f"Explanation Status: {resp.explanation_status}")
        if resp.explanation:
            print(f"\n[SUMMARY]:\n{resp.explanation.summary}")
            print(f"\n[NEXT STEPS]:")
            for ns in resp.explanation.next_steps:
                print(f"  * {ns}")
            if resp.explanation.course_explanations:
                print(f"\n[COURSE EXPLANATION SAMPLE]:")
                ce = resp.explanation.course_explanations[0]
                print(f"  Course: {ce.course_id} - {ce.why_recommended}")
                print(f"  Official Details: {ce.official_details}")
            if resp.explanation.centre_explanations:
                print(f"\n[CENTRE EXPLANATION SAMPLE]:")
                te = resp.explanation.centre_explanations[0]
                print(f"  Centre: {te.centre_id} - {te.distance_explanation}")
                print(f"  Verified Location: {te.verified_location}")
            if resp.explanation.scheme_explanations:
                print(f"\n[SCHEME EXPLANATION SAMPLE]:")
                se = resp.explanation.scheme_explanations[0]
                print(f"  Scheme: {se.scheme_id} - {se.eligibility_summary}")
                print(f"  Verified Benefits: {se.verified_benefits}")

        print("\n==================================================")
        print("TEST COMPLETED SUCCESSFULLY")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    main()
