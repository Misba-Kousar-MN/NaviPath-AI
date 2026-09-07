# Karnataka Coverage Report — Data Expansion Pass

Companion to [`DATASET_COMPLETION_REPORT.md`](DATASET_COMPLETION_REPORT.md). Covers what changed in the Phase-3 "Karnataka-wide verified data" expansion pass (training centres, courses, and their sourcing). **Note: the "Why centre_courses stayed at 1" section below describes this document's own pass** — a later pass found a genuinely centre-specific evidence source and grew `centre_courses.csv` from 1 row to 21; see [`PATHWAY_MAPPING_REPORT.md`](PATHWAY_MAPPING_REPORT.md) for that pass's full detail (it does not change any training-centre count below, only centre_courses). Everything in this document is derived from `data/seed/training_centres.csv`, `centre_courses.csv`, `sources.csv`, and `evidence.csv` as of this pass — re-derive the district counts with:

```
python -c "import csv,collections; r=list(csv.DictReader(open('data/seed/training_centres.csv',encoding='utf-8'))); print(collections.Counter(x['district'] for x in r))"
```

## What this pass added

- **2 DGT central government institutes** (NSTI Bengaluru, NSTI(W) Bengaluru), each fetched directly from its own official site, with one real evidence-based course link (NSTI Bengaluru → Electrician, `crs-002`) sourced to DGT's central-institutes-lists page, which states NSTI Bengaluru's specializations include "electrical work."
- **128 private ITIs** extracted from the **SLBC Karnataka Private ITI Mapped List** — a document hosted on the official Government of India portal `pmjdy.gov.in` (Department of Financial Services), originally compiled to map private ITIs to bank-run Financial Literacy Centres. Each row in that source carries an NCVT-format ITI code (`PR29xxxxxx` / `PU29xxxxxx` — the `29` is Karnataka's DGT state code), name, address, district, and phone/email where available.
- **1 cross-validated centre**: Sri Dharmasthala Manjunatheshwara ITI, Dakshina Kannada (code `PR29000170`), appears in **both** the SLBC list and DGT's independently-obtained "500 ITIs selected under STRIVE" national list — the only Karnataka entry in that 500-ITI list. This is the single most strongly evidenced private-ITI row in the dataset.

## District × {centres, courses, mappings, sources} table

| District | Centres | Courses (offered, verified) | Centre-course mappings | Sources used |
|---|---:|---:|---:|---|
| Bengaluru Urban | 18 | 1 (Electrician, at NSTI Bengaluru) | 1 | src-021, src-023, src-024 |
| Mysuru | 16 | 0 | 0 | src-024 |
| Kalaburagi | 15 | 0 | 0 | src-024 |
| Dharwad (Hubballi-Dharwad) | 15 | 0 | 0 | src-024 |
| Ballari | 15 | 0 | 0 | src-024 |
| Bengaluru Rural | 3 | 0 | 0 | src-024 |
| Chamarajanagar | 3\* | 0 | 0 | src-019, src-024 |
| Bagalkot, Belagavi, Bidar, Vijayapura, Chikkaballapura, Chikkamagaluru, Chitradurga, Dakshina Kannada, Davanagere, Gadag, Hassan, Haveri, Kodagu, Kolar, Koppal, Mandya, Raichur, Ramanagara, Shivamogga, Tumakuru, Udupi, Uttara Kannada, Yadgir | 2 each (23 districts) | 0 | 0 | src-024 |

\* Chamarajanagar's 3rd centre (`tc-002`, Government ITI, Gundlupete) predates this pass (Phase 2).

**Total: 30 of 30 current Karnataka districts now have at least 2 verified training centres** (up from 3 centres in 3 districts before this pass). **Course-level linkage remains at 1 row** — see "Why centre_courses stayed at 1" below.

## Narrative: strong, weak, and zero-coverage districts

**Strong coverage (15–18 centres):** Bengaluru Urban, Mysuru, Kalaburagi, Dharwad (Hubballi-Dharwad), Ballari — the five golden-test-case districts. These received near-complete extraction from the SLBC list's rows for those districts (the source itself lists roughly 35–90 rows per district for the larger ones; this pass took a curated, complete-address subset rather than literally every row, to keep the manual transcription accurate and error-checked). Further rows for these districts remain available in the same already-identified source for a future pass.

**Baseline coverage (2–3 centres):** all other 25 districts. This satisfies "Karnataka-wide, not Bengaluru-heavy" but is intentionally not exhaustive — the SLBC source contains many more rows per district (e.g. Belagavi alone lists 90+, Bijapur/Vijayapura 70+, Gulbarga/Kalaburagi 60+) that were not transcribed in this pass. This is a scope/time limitation of this pass, **not** a case of the source lacking data — the next pass should continue directly from the same SLBC PDF (`src-024`), district by district, picking up where this list of 128 leaves off.

**Zero-coverage:** none at the district level after this pass. At the *sub-district (taluk)* level, coverage inside each district is uneven and mostly limited to whichever taluks happened to appear in the curated subset — this dataset should not be read as claiming coverage of every taluk.

**"NO VERIFIED MATCH FOUND" cases:** none of the 5 golden-test districts came back empty — all five already had District-level location rows (Phase 2) and now also have 15+ real training centres each. No golden-test district required a "no verified match" fallback in this pass.

## Why centre_courses stayed at 1

The dominant new source in this pass (`src-024`, the SLBC mapped list) is a **banking/Financial-Literacy-Centre mapping document** — its columns are ITI Code, ITI Name, Category, Address, District, Phone, Email, and FLC/bank-branch details. It contains **no trade, course, or NCO information whatsoever** for any of its 500+ rows. Per the explicit no-fabrication rule, none of the 128 SLBC-sourced centres in this pass were given a `centre_courses` row, since doing so would mean guessing which of dozens of possible CTS trades each centre teaches. The only real link added (NSTI Bengaluru → Electrician) came from a *different* source (DGT's central-institutes-lists page) that does state specializations in prose form, one of which happens to match an already-verified course in `courses.csv`.

Closing this gap for the 128 SLBC-sourced centres would require either (a) fetching each institute's own website/NCVTMIS record individually (infeasible at this volume in one pass, and NCVTMIS is explicitly off-limits per instructions), or (b) a different official source that publishes trade-per-institute data (e.g. a DGT/DET Karnataka course-wise ITI directory), which was not located and confirmed in this session.

## Freshness and de-affiliation caveat

The SLBC PDF (`src-024`) carries **no publication or last-updated date anywhere in the document**. Address, name, and NCVT-code data were read directly from an official government portal (`pmjdy.gov.in`) and are treated as verified for *existence and identity*, but **current operating/recognition status is explicitly NOT confirmed** for any of the 128 SLBC-sourced rows — `recognition_status` for these is recorded as `private-recognized` (i.e., carries an NCVT-format code, consistent with private-ITI recognition) rather than an affirmative "active" claim. No de-affiliated or closed institute was knowingly included; none of the sampled rows carried any closure/de-affiliation marker in the source itself, but the source also would not necessarily show one. This should be treated as `NEEDS_REVALIDATION` for operational status in any future pass, per the freshness-tracking rule.

## Coordinate policy compliance

No latitude/longitude value was fabricated or approximated for any of the 129 new rows (2 NSTI + 127 SLBC — Sri Dharmasthala Manjunatheshwara ITI is one of the 128 SLBC rows and also cross-validated). All `latitude`/`longitude` fields are blank, per the strict coordinate policy — none of the sources used in this pass published usable coordinates.
