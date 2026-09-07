# /data

## Templates

`templates/` holds header-only CSVs matching the entities defined in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) Section D. They contain no rows and no invented government data.

## Population rules (apply during the hackathon sprint, not before)

1. Every row in `schemes.csv`, `eligibility_rules.csv`, `training_centres.csv`, `courses.csv`, or `documents.csv` must carry a non-empty `source_id` that resolves to a row in `sources.csv`.
2. Every `sources.csv` row's `official_url` must be a real URL a team member has actually opened and read — never a guessed or pattern-generated URL.
3. If a fact cannot be traced to an official source during the sprint, do not add the row. Instead note it as `REQUIRES OFFICIAL SOURCE VERIFICATION` in a scratch doc for future follow-up.
4. Prefer a small number of deeply-verified rows (one or two districts/sectors) over broad, shallow, unverified coverage. See `docs/ARCHITECTURE.md` Section Q for the reasoning.
5. `evidence.csv` rows are the audit trail — every claim shown to an end user should be traceable through `evidence` back to `sources`.

## seed/

Populated with a real, verified-first dataset (see [`docs/DATASET_COMPLETION_REPORT.md`](../docs/DATASET_COMPLETION_REPORT.md) for the full breakdown and [`docs/DATA_SOURCE_REGISTRY.md`](../docs/DATA_SOURCE_REGISTRY.md) for every source). It is intentionally small: a handful of occupations, skills, schemes, and eligibility rules that are genuinely traceable to official Government of India / Government of Karnataka sources, rather than a large fabricated dataset. Before using it, run:

```
python scripts/validate_dataset.py   # structural checks — should print RESULT: PASS
python scripts/test_dataset.py       # golden-test-case coverage against the current data
```

Known gaps (see the completion report §8, [`../docs/KARNATAKA_COVERAGE_REPORT.md`](../docs/KARNATAKA_COVERAGE_REPORT.md), and [`../docs/PATHWAY_MAPPING_REPORT.md`](../docs/PATHWAY_MAPPING_REPORT.md) for the full list): `centre_courses.csv` has 21 verified centre-to-course links across 10 of 140 centres (grown from 1 by finding DGT's own DST affiliation order, which names specific institutes and trades) — the other 130 centres still have zero course linkage because their source (the SLBC private-ITI list) has no trade/course data at all. Several schemes have only `needs-review` eligibility rules, a few skills are unverified "candidates," and most of the 128 SLBC-sourced private training centres are verified for name/address/district only, not current operating status. These are documented, not hidden — extend the dataset by adding more rows the same way, never by relaxing the sourcing rules above.
