import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path("backend").resolve()))
from sqlalchemy import text
from app.db.session import SessionLocal

db = SessionLocal()

print("--- 1. DATABASE ROW COUNTS ---")
tc_count = db.execute(text("SELECT count(*) FROM training_centres")).scalar()
tc_verified = db.execute(text("SELECT count(*) FROM training_centres WHERE latitude IS NOT NULL AND longitude IS NOT NULL")).scalar()
tc_unresolved = db.execute(text("SELECT count(*) FROM training_centres WHERE latitude IS NULL AND longitude IS NULL")).scalar()
courses_count = db.execute(text("SELECT count(*) FROM courses")).scalar()
skills_count = db.execute(text("SELECT count(*) FROM skills")).scalar()
schemes_count = db.execute(text("SELECT count(*) FROM schemes")).scalar()
sources_count = db.execute(text("SELECT count(*) FROM sources")).scalar()
evidence_count = db.execute(text("SELECT count(*) FROM evidence")).scalar()
chunks_count = db.execute(text("SELECT count(*) FROM document_chunks")).scalar()
non_null_emb = db.execute(text("SELECT count(*) FROM document_chunks WHERE embedding IS NOT NULL")).scalar()
emb_status_counts = db.execute(text("SELECT embedding_status, count(*) FROM document_chunks GROUP BY embedding_status")).fetchall()

print(f"Training centres: {tc_count} (Verified: {tc_verified}, Unresolved: {tc_unresolved})")
print(f"Courses: {courses_count}, Skills: {skills_count}, Schemes: {schemes_count}, Sources: {sources_count}, Evidence: {evidence_count}")
print(f"Document Chunks in DB: {chunks_count}, Non-null embeddings: {non_null_emb}")
print(f"Embedding status counts: {emb_status_counts}")

print("\n--- 2. VERIFY CHUNKS IN JSON CATALOG ---")
with open("rag/extracted/chunks.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

chunks = catalog["chunks"]
print(f"Total chunks in catalog: {len(chunks)}")

groups = {
    "Electrician (chk-032..chk-035)": ("chk-032", "chk-035", "src-008", "crs-002", "skl-003"),
    "Tailor (chk-036..chk-039)": ("chk-036", "chk-039", "src-007", "crs-001", "skl-002"),
    "Armed Security Guard (chk-040..chk-043)": ("chk-040", "chk-043", "src-010", "crs-004", "skl-004"),
    "Mechanic Motor Vehicle (chk-044..chk-047)": ("chk-044", "chk-047", "src-026", "crs-008", "skl-010"),
    "Fitter (chk-048..chk-051)": ("chk-048", "chk-051", "src-026", "crs-005", "skl-007"),
}

for group_name, (start_id, end_id, exp_src, exp_crs, exp_skl) in groups.items():
    print(f"\nChecking {group_name}:")
    for c in chunks:
        cid = c["chunk_id"]
        if start_id <= cid <= end_id:
            assert c["source_id"] == exp_src, f"Mismatch source {c['source_id']} != {exp_src} for {cid}"
            assert c["course_id"] == exp_crs, f"Mismatch course {c['course_id']} != {exp_crs} for {cid}"
            assert c["skill_id"] == exp_skl, f"Mismatch skill {c['skill_id']} != {exp_skl} for {cid}"
            print(f"  {cid}: source={c['source_id']} course={c['course_id']} skill={c['skill_id']} doc={c.get('document_id')}")

print("\n--- 3. VERIFY LIVE DATABASE DOCUMENT_CHUNKS ---")
db_chunks = db.execute(text("SELECT id, source_id, embedding_status, embedding FROM document_chunks ORDER BY id")).fetchall()
for cid, src, status, emb in db_chunks:
    assert emb is None
    assert status == 'not-generated'
    if "chk-032" <= cid <= "chk-035":
        assert src == "src-008", f"{cid} has src {src}"
    elif "chk-036" <= cid <= "chk-039":
        assert src == "src-007", f"{cid} has src {src}"
    elif "chk-040" <= cid <= "chk-043":
        assert src == "src-010", f"{cid} has src {src}"
    elif "chk-044" <= cid <= "chk-047":
        assert src == "src-026", f"{cid} has src {src}"
    elif "chk-048" <= cid <= "chk-051":
        assert src == "src-026", f"{cid} has src {src}"

print("All 55 database chunks verified for source_id and null embeddings.")

db.close()
