# Data Source Registry

Every source used to populate `data/seed/`, in the same order as `data/seed/sources.csv`. This is the audit trail for Master Prompt 2 (dataset population). Nothing in `data/seed/` is derived from a source not listed here.

Legend — **Status**: `verified` = fetched and read directly in this session, with quoted excerpts in `evidence.csv`/`document_chunks.csv`. `pending-review` = identified via a search-engine summary or a fetch that did not yield full confirmable text; treated as a lead, not a fact. `broken-link` = attempted and failed to resolve.

---

### src-001 — PM Vishwakarma — Official Portal
- **Authority:** Ministry of Micro, Small and Medium Enterprises (MSME), Government of India
- **Source type:** Government portal page
- **URL:** https://pmvishwakarma.gov.in/
- **What was extracted:** Full eligibility criteria, the 18-trade list, and all benefit amounts (training stipend, toolkit incentive, loan tranches and interest rate, digital-transaction incentive).
- **CSVs using it:** `schemes.csv` (sch-001), `eligibility_rules.csv` (er-001–er-006), `occupations.csv` (occ-002, via NCO cross-reference note), `evidence.csv` (ev-001–ev-004), `document_chunks.csv` (chk-001, chk-002), `documents.csv`/`scheme_documents.csv` (doc-001, doc-003 — inferred, see limitation).
- **Retrieved:** 2026-09-05. **Status:** verified.
- **Limitations:** The requirement for a bank account (doc-003) is inferred from standard DBT-scheme practice, not an explicit quote from this page — flagged accordingly.

### src-002 — e-Shram Portal — FAQs
- **Authority:** Ministry of Labour & Employment, Government of India
- **Source type:** Government portal page
- **URL:** https://eshram.gov.in/faqs
- **What was extracted:** Eligibility (age 16–59, unorganised-sector definition, ESIC/EPFO exclusion, income-tax exclusion), required documents (Aadhaar, Aadhaar-linked mobile), and the explicit statement that only registration — no direct financial benefit — is currently offered.
- **CSVs using it:** `schemes.csv` (sch-002), `eligibility_rules.csv` (er-007–er-010), `documents.csv`/`scheme_documents.csv` (doc-001, doc-002), `evidence.csv` (ev-005–ev-007), `document_chunks.csv` (chk-003, chk-004).
- **Retrieved:** 2026-09-05. **Status:** verified.
- **Limitations:** None for the claims actually used; this source explicitly contradicts the commonly repeated (but here treated as unverified) claim of an automatic accident-insurance benefit — that claim was deliberately NOT included.

### src-003 — About e-Shram Portal
- **Authority:** Ministry of Labour & Employment, Government of India
- **Source type:** Government portal page
- **URL:** https://eshram.gov.in/e-shram-portal
- **What was extracted:** Not used for any specific factual claim; identified only via search summary.
- **CSVs using it:** `schemes.csv` (sch-002, official_url field only).
- **Status:** pending-review. **Limitation:** Not independently fetched/read in full this session.

### src-004 — Chief Minister's Kaushalya Karnataka Yojane (CMKKY)
- **Authority:** Skill Development, Entrepreneurship and Livelihood Department, Government of Karnataka
- **Source type:** Government portal page
- **URL:** https://kaushalya.karnataka.gov.in/7/chief-minister-kaushalya-karnataka-yojane/en
- **What was extracted:** Confirmed directly: 70% placement target, self-registration via kaushalkar.com, NSQF-aligned course design.
- **CSVs using it:** `schemes.csv` (sch-003), `eligibility_rules.csv` (er-011, er-012 — both flagged needs-review), `evidence.csv` (ev-012), `document_chunks.csv` (chk-005).
- **Retrieved:** 2026-09-05. **Status:** pending-review (partially verified — see notes).
- **Limitations:** Age/education eligibility (commonly cited as 18–35) was NOT found on the fetched page text and remains unverified.

### src-005 — KBOCWWB Benefits page (Karnataka Labour Dept.)
- **Authority:** Labour Department, Government of Karnataka
- **URL:** https://labour.karnataka.gov.in/info-2/Karnataka+Building+and+Other+Construction+Workers%E2%80%99+Welfare+Board+Benefits/en
- **What was extracted:** Nothing directly — fetch failed with a TLS certificate error. Benefit categories in `schemes.csv` (sch-004) come from a secondary search-engine summary citing this URL.
- **CSVs using it:** `schemes.csv` (sch-004), `evidence.csv` (ev-013, marked `candidate-unverified`).
- **Status:** pending-review. **Limitation:** Direct fetch failed; content not independently confirmed.

### src-006 — KBOCWWB Official Board Website
- **Authority:** Karnataka Building And Other Construction Workers Welfare Board
- **URL:** https://karbwwb.karnataka.gov.in/en
- **What was extracted:** Board formation year (2007) and helpline number (155214).
- **CSVs using it:** `eligibility_rules.csv` (er-013), `documents.csv`/`scheme_documents.csv` (doc-004, sd-005).
- **Status:** pending-review. **Limitation:** Detailed registration eligibility (e.g. minimum days worked) was not present in the fetched content.

### src-007 — Qualification Pack: Self Employed Tailor (AMH/Q1947 v2.0)
- **Authority:** Apparel, Made-ups & Home Furnishing Sector Skill Council (AMHSSC), under MSDE/NSDC/NCVET
- **URL:** https://nqr.gov.in/sites/default/files/AMH_Q1947_v2.0%20Self%20Employed%20Tailor.pdf
- **What was extracted:** QP code, NSQF Level 4, NCO-2015/7531.0100, minimum education (8th class + 6 months experience), minimum job-entry age (18).
- **CSVs using it:** `occupations.csv` (occ-002), `skills.csv` (skl-002), `occupation_skills.csv` (os-002), `courses.csv` (crs-001), `evidence.csv` (ev-008).
- **Retrieved:** 2026-09-05. **Status:** verified (full PDF downloaded and read).

### src-008 — Qualification Pack: Electrician (ELE/Q5804 v1.0)
- **Authority:** Electronics Sector Skills Council of India (ESSCI)
- **URL:** https://www.essc-india.org/images/QPs/Electrician%20-%20%20ELE_Q5804_v1.0.pdf
- **What was extracted:** QP code, NSQF Level 4, NCO-2015/7411.0100, minimum education, minimum job-entry age (18).
- **CSVs using it:** `occupations.csv` (occ-003), `skills.csv` (skl-003), `occupation_skills.csv` (os-003), `courses.csv` (crs-002), `skill_transitions.csv` (st-001), `evidence.csv` (ev-009).
- **Retrieved:** 2026-09-05. **Status:** verified (full PDF downloaded and read).

### src-009 — Qualification Pack: General Housekeeper (DWC/Q0102 v3.0)
- **Authority:** Domestic Workers Sector Skill Council (DWSSC)
- **URL:** https://dwsscindia.com/wp-content/uploads/2024/04/DWC_General-Houseekeeper_Q0102_v3.0.pdf
- **What was extracted:** QP code, NSQF Level 2, NCO-2015/5152.0100, "no formal education prescribed", minimum job-entry age (18).
- **CSVs using it:** `occupations.csv` (occ-001), `skills.csv` (skl-001), `occupation_skills.csv` (os-001), `courses.csv` (crs-003), `skill_transitions.csv` (st-002), `evidence.csv` (ev-010).
- **Retrieved:** 2026-09-05. **Status:** verified (full PDF downloaded and read).

### src-010 — Qualification File: Armed Security Guard (NCVET Code 2022/OAFM/MEPSC/05426)
- **Authority:** Management & Entrepreneurship and Professional Skills Council (MEPSC)
- **URL:** https://www.nqr.gov.in/qualification/file/QFile_Armed%20Security%20Guard_English_210624.pdf
- **What was extracted:** QP code, NSQF Level 4, NCO-2015/5414.0151, full entry eligibility (Class 10 + 2 years experience, age 21, physical-fitness standards), total training duration (450 hours: 174 theory + 276 practical).
- **CSVs using it:** `occupations.csv` (occ-004), `skills.csv` (skl-004), `occupation_skills.csv` (os-004), `courses.csv` (crs-004), `evidence.csv` (ev-011), `document_chunks.csv` (chk-006).
- **Retrieved:** 2026-09-05. **Status:** verified (full 49-page PDF downloaded and read).

### src-011 — Beauty Therapist Qualification Listing (BWS/Q0102)
- **Authority:** NQR / NCVET
- **URL:** https://www.nqr.gov.in/public/qualifications/3973
- **What was extracted:** Title and QP code only, from a search snippet.
- **CSVs using it:** `skills.csv` (skl-005, marked "candidate — needs review"), `skill_transitions.csv` (st-003).
- **Status:** pending-review. **Limitation:** Full qualification file not read; treat as a lead only.

### src-012 — Qualification File: Electric Vehicle Service Technician
- **Authority:** NQR / NCVET
- **URL:** https://www.nqr.gov.in/sites/default/files/QF%20-%20Electric%20Vehicle%20Service%20Technician.pdf
- **What was extracted:** Nothing confirmable — PDF fetch returned unparsable binary and was not re-attempted.
- **CSVs using it:** `skills.csv` (skl-006, marked "candidate — needs review"), `skill_transitions.csv` (st-004).
- **Status:** pending-review.

### src-013 — PMKVY 4.0 (PIB press releases, aggregated)
- **Authority:** Press Information Bureau, Government of India
- **URL:** https://www.pib.gov.in/PressReleasePage.aspx?PRID=1895304
- **What was extracted:** General scheme description only, from a search-engine aggregation of multiple PIB releases.
- **CSVs using it:** `schemes.csv` (sch-005), `eligibility_rules.csv` (er-014, er-015 — both needs-review).
- **Status:** pending-review. **Limitation:** No single official guideline document was fetched and quoted; the commonly cited age band (15–45 / 18–59) is unconfirmed.

### src-014 — General geographic reference (district centroids)
- **Authority:** N/A (general reference, not a single official dataset)
- **What was extracted:** Approximate lat/long centroids for 6 Karnataka districts.
- **CSVs using it:** `locations.csv` (loc-001–loc-006).
- **Status:** pending-review. **Limitation:** Not cross-checked against an official Survey of India / Census GIS dataset in this session; always presented as "approximate" per Architecture Section I.

### src-015 — Karnataka Skill Development Corporation (Kaushalkar) homepage
- **URL:** https://kaushalkar.karnataka.gov.in/english — **Status:** pending-review. Identified via search only; not used for any specific quoted claim.

### src-016 — Regional Directorate of Skill Development & Entrepreneurship, Karnataka (DGT)
- **URL:** https://rdsdekarnataka.dgt.gov.in/ — **Status:** pending-review. Recommended starting point for the sprint team to obtain a verified Government-ITI list; not fetched in this session.

### src-017 — DET Karnataka Government ITIs Index
- **URL:** http://emptrg.kar.nic.in/govt-itis-index.htm — **Status:** broken-link (DNS resolution failed 2026-09-05). Recorded so this dead end isn't re-attempted blindly.

### src-018 — Government Tool Room and Training Centre, Rajajinagar (OGD Platform India reference)
- **URL:** https://karnataka.data.gov.in/resource/gttc-diploma-courses-data — **Status:** pending-review. Used only to name `training_centres.csv` row tc-001 (address/coordinates left null).

### src-019 — Government ITI, Gundlupete
- **URL:** https://govtitippura.in/ — **Status:** pending-review. Used only to name `training_centres.csv` row tc-002.

### src-020 — DET Mysuru Division Office
- **URL:** https://detmysurudivision.org/ — **Status:** pending-review. Used only to name `training_centres.csv` row tc-003.

---

## Coverage summary

| Status | Count |
|---|---:|
| verified (fetched, read, quoted) | 6 |
| pending-review (lead only) | 13 |
| broken-link | 1 |
| **Total sources** | **20** |

## Sources deliberately NOT used as primary evidence

Per the data-quality rules, no blog, coaching-website, Quora/Reddit, scraped directory, or AI-generated dataset was used as a factual source anywhere in this dataset. Several such pages appeared in search results (e.g. vajiramandravi.com, cleartax.in, govtschemesindia.com) and were read only to *locate* the correct official URL, never cited as evidence.
