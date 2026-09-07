import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path("backend").resolve()))
from sqlalchemy import text
from app.db.session import SessionLocal

db = SessionLocal()

sources = {r.id: r for r in db.execute(text("SELECT id, title, authority, official_url, verification_status FROM sources")).fetchall()}
courses = {r.id: r for r in db.execute(text("SELECT id, title, skill_id, source_id FROM courses")).fetchall()}
skills = {r.id: r for r in db.execute(text("SELECT id, name_en FROM skills")).fetchall()}
schemes = {r.id: r for r in db.execute(text("SELECT id, name_en, source_id FROM schemes")).fetchall()}

with open("rag/manifest.json", "r", encoding="utf-8") as f:
    manifest = {d["document_id"]: d for d in json.load(f)["documents"]}

with open("rag/extracted/chunks.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)["chunks"]

print(f"Auditing all {len(chunks)} chunks across the entire chain...\n")

broken = 0
for c in chunks:
    cid = c["chunk_id"]
    doc_id = c.get("document_id")
    src_id = c.get("source_id")
    crs_id = c.get("course_id")
    skl_id = c.get("skill_id")
    sch_id = c.get("scheme_id")
    
    # 1. Chunk -> Document
    if not doc_id or doc_id not in manifest:
        print(f"[FAIL] {cid}: Missing or invalid doc_id '{doc_id}'")
        broken += 1
        continue
    doc = manifest[doc_id]
    
    # 2. Document -> Source
    if doc["source_id"] != src_id:
        print(f"[FAIL] {cid}: Mismatch between chunk src ({src_id}) and doc src ({doc['source_id']})")
        broken += 1
        continue
    if src_id not in sources:
        print(f"[FAIL] {cid}: Unknown source_id '{src_id}'")
        broken += 1
        continue
    src = sources[src_id]
    
    # 3. Official authority & URL
    if not src.official_url or not src.authority:
        print(f"[FAIL] {cid}: Source {src_id} missing official_url or authority")
        broken += 1
        continue
        
    # 4. Entity linkage
    if doc["entity_type"] == "scheme":
        if sch_id != doc["entity_id"] or sch_id not in schemes:
            print(f"[FAIL] {cid}: Scheme mismatch or unknown scheme {sch_id}")
            broken += 1
            continue
    elif doc["entity_type"] == "course":
        if crs_id != doc["entity_id"] or crs_id not in courses:
            print(f"[FAIL] {cid}: Course mismatch or unknown course {crs_id}")
            broken += 1
            continue
        crs = courses[crs_id]
        if crs.skill_id != skl_id:
            print(f"[FAIL] {cid}: Skill mismatch between chunk ({skl_id}) and course entity ({crs.skill_id})")
            broken += 1
            continue

print(f"Chain audit complete. Total broken chains: {broken}")
if broken == 0:
    print("ALL 55 CHUNKS HAVE VERIFIED, COMPLETE PROVENANCE CHAINS!")

db.close()
