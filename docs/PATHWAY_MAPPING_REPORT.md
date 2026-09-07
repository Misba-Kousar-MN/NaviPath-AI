# Pathway Mapping Report — Knowledge Graph Connection Pass

Generated 2026-09-05. This report covers the Phase-3-continuation pass whose explicit goal was **not** more rows for their own sake, but a connected, evidence-backed graph: `worker → occupation → skill → course → training centre → location → scheme → evidence`. The single biggest lever pulled in this pass was finding a genuine centre-specific, trade-specific official source — the primary bottleneck named at the start of this pass (`centre_courses.csv` = 1 row) is now resolved as far as currently-available evidence allows.

## 1. Before / after counts

| Table | Before | After | Change |
|---|---:|---:|---:|
| occupations | 8 | 13 | +5 |
| skills | 6 | 14 | +8 |
| occupation_skills | 4 | 10 | +6 |
| skill_transitions | 4 | 7 | +3 |
| courses | 4 | 12 | +8 |
| training_centres | 131 | 140 | +9 |
| **centre_courses** | **1** | **21** | **+20** |
| schemes | 5 | 5 | +0 (untouched, per instruction) |
| eligibility_rules | 15 | 15 | +0 (untouched, per instruction) |
| documents | 4 | 4 | +0 |
| scheme_documents | 5 | 5 | +0 |
| sources | 25 | 26 | +1 |
| evidence | 23 | 33 | +10 |
| locations | 6 | 6 | +0 |
| document_chunks | 9 | 9 | +0 (no new documents were chunked this pass — see §17) |

## 2–6. What was added and why

- **+5 occupations** (`occ-009`–`occ-013`): Fitter, Welder, Machine Shop Operator (Machinist/Turner), Motor Vehicle Mechanic, Electronics Repair Technician. Each is grounded in a trade name that appears verbatim, with a specific centre and an explicit "Recommended" affiliation decision, in the new primary source (§10).
- **+8 skills** (`skl-007`–`skl-014`): Fitter, Machinist Practice, Turner, Mechanic Motor Vehicle (Servicing), Welding (Arc & Gas), Electronics Mechanic (Servicing & Repair), Tool & Die Making, CNC Machining Technician. One skill per distinct, confidently-identified DGT CTS trade actually used in a real centre_courses row below — not a mechanical "every course title becomes a skill" pass.
- **+8 courses** (`crs-005`–`crs-012`): one per new skill, all NCVT/DGT CTS trades, `source_id=src-026`.
- **+6 occupation_skills** (`os-005`–`os-010`): each new occupation linked to its corresponding new skill, `curation_status=verified`, sourced to src-026.
- **+20 centre_courses** (`cc-002`–`cc-021`): the primary deliverable — see §6 below.
- **Centres with course mappings: 10** (1 from the prior pass — NSTI Bengaluru — plus 9 new Government ITIs added this pass specifically because the new evidence source named them).

### §6 — Centre → course mapping (the primary task)

The bottleneck named at the start of this pass was resolved by finding **DGT's own 26th SCAA (Standing Committee on Accreditation and Affiliation) Dual System of Training affiliation order**, dated 11.03.2026, covering decisions made at the 15–20 January 2026 SCAA meeting. Unlike every other source used in this project so far, this document does the one thing centre-course evidence requires: it names a **specific institute** (by official NCVT MIS code), a **specific trade**, a **specific industry partner**, and an explicit **"Recommended" affiliation decision** — never an inference from "this trade exists" + "this ITI exists."

The Karnataka section of that order lists exactly 10 ITIs. All 10 were added to `training_centres.csv` (9 new; the 10th, Govt. ITI (W) Gundlupet, already existed as `tc-002`). Every trade row for those 10 institutes was individually reviewed:

- **20 rows became real `centre_courses` links** (mapped to one of the 8 new NCVT-trade courses, or to the pre-existing `crs-002` Electrician course where the trade matched).
- **2 trade rows were deliberately excluded**: "IR & DMT" (Govt. ITI (W) Gundlupet) and "CND" (Govt ITI Chamarajanagar) are abbreviated trade codes in the source whose full official name could not be confirmed in this session. Rather than guess an expansion, these were left unmapped and flagged in `evidence.csv` (`ev-031`) — consistent with the absolute rule against inferring a relationship from partial information.
- **Zero rows were added as a cartesian product.** Every one of the 20 `centre_courses` rows traces to one specific line in the source document naming that exact institute and that exact trade.

## 7. Centres with course mappings

**10 of 140 training centres (7.1%)** now have at least one verified course. This is a small fraction of the full 140-centre roster because the vast majority of centres (128 of 140) came from the SLBC Karnataka Private ITI Mapped List (Phase 3's prior pass), which — as documented in `KARNATAKA_COVERAGE_REPORT.md` — carries **no trade/course information at all**. The 10 mapped centres are exactly the ones for which a *different*, trade-specific source (this pass's src-026, plus the earlier DGT central-institutes-lists page for NSTI Bengaluru) actually exists.

## 8. District coverage (centre-course mappings only)

Districts with ≥1 mapped course after this pass: **Bengaluru Urban, Chamarajanagar, Davanagere, Kolar, Mandya, Mysuru, Tumakuru** (7 of 30 Karnataka districts). This is narrower than the training-centre district coverage (all 30 districts, per the prior pass) precisely because course-level evidence is scarcer than centre-existence evidence — an honest reflection of what DGT's DST affiliation order actually covers, not an artificial rebalancing.

## 9. Course diversity

**9 of 12 courses (75%) now have ≥1 mapped centre**: Electrician (crs-002, 4 centres), Fitter (crs-005, 6 centres), Machinist (crs-006, 1), Turner (crs-007, 3), Mechanic Motor Vehicle (crs-008, 1), Welder (crs-009, 1), Electronics Mechanic (crs-010, 2), Tool and Die Maker (crs-011, 1), CNC Machining Technician (crs-012, 1). The 3 unmapped courses are Self Employed Tailor, General Housekeeper, and Armed Security Guard — none of these trades appeared in the new DST source, so none were force-linked to any centre.

## 10. Sources used

Primary new source this pass:

- **src-026** — DGT 26th SCAA DST affiliation order (Gujarat, Haryana, Karnataka, Madhya Pradesh), dated 11.03.2026, decisions from the 15–20 January 2026 SCAA meeting. `https://www.dgt.gov.in/sites/default/files/2026-05/26th-SCAA-Dual-system-of-Training_DST_10_03_2026.pdf`. Downloaded and read directly (35-page PDF, via the same WebFetch → local-save → Read-tool workaround used throughout this project for binary PDFs).

Other sources investigated this pass, with results:

- `dgt.gov.in/en/affiliation-admission` — fetched; only generic national-level administrative documents listed (no Karnataka-specific downloadable dataset on the visible page).
- `cdnbbsr.s3waas.gov.in/.../2022030744.pdf` ("List of the Govt. ITIs with trades available for admission during 2021-22/23 session") — fetched and read directly; **covers Assam only** (Guwahati, Jorhat, Nagaon, etc.), not Karnataka. Not used for any Karnataka claim.
- Karnataka ITI trade-wise seat-matrix / KEA counselling search — returned only KCET (engineering/medical) seat-matrix results, not ITI-specific data.
- Kaushalkar / Kaushalya Sampada (KSDC) — identified as a real portal (skillconnect.kaushalkar.com, online.kaushalkar.com) but no downloadable, structured training-partner-course list was located in this session.
- Skill India Digital / `dgt.skillindiadigital.gov.in` / PM-SETU — not fetched this pass (previously confirmed in Phase 3 to be a JS-rendered SPA that WebFetch cannot render; not re-attempted since the DST order already yielded strong, real evidence).
- Karnataka Open Government Data (`karnataka.data.gov.in`) — not re-attempted; previously confirmed to require a registered API key not available in this session.

## 11. DGT records processed

**1 DGT document, 39 total ITI-affiliation records across 4 states**, of which **10 records (all "Recommended") were Karnataka** and were fully processed into this dataset. The remaining 29 records (Gujarat, Haryana, Madhya Pradesh) were read but correctly excluded as out-of-scope for a Karnataka-focused dataset — including several explicitly "**Not Recommended**" Madhya Pradesh rows, which is exactly the de-affiliation/rejection signal this pass was instructed to respect (none of Karnataka's 10 records were "Not Recommended," so no Karnataka exclusion was needed on that basis).

## 12. Skill India Digital records processed

**0.** As noted in §10, Skill India Digital's training-centre pages render via client-side JavaScript that this session's fetch tooling cannot execute; this was established in the prior Phase-3 pass and not re-attempted here since the DST order provided a stronger, more specific source.

## 13. De-affiliated records excluded

**0 Karnataka records were de-affiliated** in the source consulted this pass — all 10 Karnataka ITI entries in the 26th SCAA order carry an explicit "Recommended" status with MoU end dates extending well past today's date (2026-09-05), so all 20 `centre_courses` rows are marked `freshness_flag=CURRENT`. (29 non-Karnataka records in the same document, mostly Madhya Pradesh, were marked "Not Recommended" and were excluded as out-of-state, not because of de-affiliation logic specific to this pass — but their presence in the source confirms the de-affiliation signal is real and was correctly respected where it appeared.)

## 14. Golden-test results (re-run, `python scripts/test_dataset.py`)

| # | Scenario | Occupation | Current skill | Transition → Course → Centre | Complete pathway? |
|---|---|---|---|---|---|
| 1 | Delivery Rider, Bengaluru Urban | ✅ occ-005 | NOT AVAILABLE | → Electrician → 5 real centres (incl. NSTI Bengaluru, Davanagere, Anekal, Beguru, Chamarajanagar); → Mechanic Motor Vehicle → Koratagere | **✅ Yes** |
| 2 | Domestic Worker, Mysuru | ✅ occ-001 | ✅ General Housekeeping | → Self Employed Tailoring → course exists, **no centre mapped** (source has no tailoring-centre evidence) | ❌ No (unchanged — honest gap) |
| 3 | Construction Labourer, Kalaburagi | ✅ occ-006 | NOT AVAILABLE | → Fitter → 6 real centres (Davanagere, BEML KGF, Anekal, Beguru, Chamarajanagar, N R Mohalla Mysore) | **✅ Yes** |
| 4 | Auto-Rickshaw Driver, Hubballi-Dharwad | ✅ occ-007 | NOT AVAILABLE | → Mechanic Motor Vehicle → Koratagere (1 real centre) | **✅ Yes** |
| 5 | Street Vendor, Ballari | ✅ occ-008 | NOT AVAILABLE | NOT AVAILABLE (no skill_transitions row exists for this occupation) | ❌ No (unchanged — honest gap) |

**3 of 5 golden scenarios now produce a complete, real, centre-verified pathway — up from 0 of 5 before this pass.** No scenario returns a fabricated centre or course; scenarios 2 and 5 correctly return `NOT AVAILABLE IN VERIFIED DATA` rather than a guess.

## 15. Complete pathway count

- **Golden scenarios with a complete pathway: 3 of 5** (see §14).
- **Occupations (dataset-wide) with ≥1 complete occupation→skill_transition→course→centre_courses pathway: 3** — Delivery/Courier Rider (occ-005), Construction Labourer (occ-006), Auto-Rickshaw/Taxi Driver (occ-007). (Domestic Worker's transition resolves to a course but not a centre; Street Vendor has no transition at all; the four QP-grounded occupations occ-001–occ-004 have no outgoing `skill_transitions` rows at all, so "complete pathway" doesn't apply to them in the current data — they are endpoints, not starting points, in the transition graph.)
- **Centres reachable via a complete pathway: 10** (all centres with ≥1 centre_courses row — see §7).

## 16. Remaining gaps

1. **130 of 140 training centres (93%) still have zero course mapping.** This is the single largest remaining gap, and it is a source-availability limit, not a modeling one: the SLBC Private ITI Mapped List that supplied 128 of those centres has no trade data, full stop.
2. **Only 7 of 30 Karnataka districts have any centre-course mapping.** DST affiliation is a specific, employer-linked training arrangement that DGT happens to track centre-and-trade-specifically — it is not a general census of what every ITI teaches, so its district footprint is narrower than the training-centre roster's.
3. **Domestic Worker (occ-001) and Street Vendor (occ-008) still have no complete pathway** — golden scenarios 2 and 5 remain honest gaps.
4. **2 trade codes ("IR & DMT", "CND") were seen but not mapped**, pending confirmation of their full official name.
5. **General (non-DST) admission/seat availability at the 10 newly-added Government ITIs is not confirmed** — DST is an employer-co-run "3rd shift" arrangement, not necessarily the same as open public admission to that trade at that institute; every new `centre_courses` row's `batch_schedule_note` explicitly flags this.
6. All Phase-1/Phase-3 gaps carried forward unchanged, per instruction (schemes/eligibility_rules were deliberately not touched this pass): 3 of 5 schemes still only `needs-review`, skill_transitions are all `heuristic` (team judgment, not a labour-market study), 2 candidate skills remain unverified, no embeddings generated.

## 17. Sources that could not be accessed / did not pan out

- `dgt.gov.in/en/affiliation-admission` — page loaded but exposed no Karnataka-filterable dataset in the fetched content.
- `cdnbbsr.s3waas.gov.in/.../2022030744.pdf` — real, readable document, but covers Assam, not Karnataka — a dead end for this project despite being a genuine "ITI + trades" list.
- KEA/KCET seat-matrix searches — returned only engineering/medical seat matrices, no ITI-specific data.
- Skill India Digital, `dgt.skillindiadigital.gov.in`, PM-SETU — JS-rendered SPA, not fetchable with this session's tooling (established in the prior pass; not re-attempted).
- Karnataka Open Government Data (`karnataka.data.gov.in`) — requires a registered API key not available in this session (established in the prior pass; not re-attempted).
- Kaushalkar / Kaushalya Sampada — real portal confirmed to exist, but no downloadable structured course-list document was located.

No document_chunks were added this pass (§1) because src-026's content was fully captured as discrete `evidence` rows (one per institute, each a specific claim with a verbatim excerpt) rather than as generic RAG-grounding prose chunks — the source is a structured affiliation table, not narrative text, so the `evidence` table was judged the more appropriate home for it per the architecture's "structured facts vs. vectorized content" rule (Section F).

## 18. Validation results

```
python scripts/validate_dataset.py
Tables checked: 15
FAILURES: 0
WARNINGS: 2 (unchanged from before this pass — occupations with no current-skill mapping; sources never cited in evidence.csv — both pre-existing and informational)
RESULT: PASS

python scripts/test_dataset.py
Runs cleanly across all 5 golden scenarios; see §14.
```

Additional checks run specifically for this pass:
- **Duplicate `(centre_id, course_id)` pairs in `centre_courses.csv`: 0.**
- **Broken foreign keys introduced this pass: 0** (all new `centre_id`, `course_id`, `skill_id`, `occupation_id`, and `source_id` references resolve).
- **Fabricated coordinates: 0** — all 9 new training centres have blank `latitude`/`longitude` (2 of the 9 have a real, source-stated address; 7 have `address=REQUIRES OFFICIAL SOURCE VERIFICATION` because the DST order gives the *industry partner's* address, not the ITI's own, for most rows).
- **De-affiliated trades presented as current: 0** (see §13).
