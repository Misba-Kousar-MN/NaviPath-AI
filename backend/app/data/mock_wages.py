"""Mock Wage Dataset for Hackathon Demonstration (Innovation 3).

IMPORTANT SAFETY & INTEGRITY NOTICE:
- There is currently NO verified wage dataset for Karnataka informal workers.
- This dataset contains purely ILLUSTRATIVE / MOCK figures for demonstration purposes.
- It MUST NEVER be presented as official, verified, or government-sourced data.
- All records carry data_status='mock', source_label='Hackathon illustrative data', verified=False.
- The LLM is never permitted to compute or modify wage values.
"""
from __future__ import annotations

from typing import Any

DATA_STATUS_MOCK = "mock"
SOURCE_LABEL = "Hackathon illustrative data"
MOCK_DISCLAIMER = (
    "Illustrative hackathon data — not guaranteed income. Indicative benchmark only — not a guaranteed income. "
    "Actual earnings may vary significantly by location, employer, experience, and trade certification."
)

MOCK_WAGES: list[dict[str, Any]] = [
    {
        "occupation_id": "occ-005",
        "occupation_name": "Delivery Rider",
        "canonical_name": "Delivery / Courier Rider",
        "aliases": [
            "delivery rider",
            "delivery / courier rider",
            "courier rider",
            "delivery boy",
            "delivery person",
            "food delivery",
        ],
        "monthly_wage_inr": 18000.0,
        "wage_type": "monthly",
        "employment_type": "informal",
        "geography_level": "state",
        "state": "Karnataka",
        "data_status": DATA_STATUS_MOCK,
        "source_label": SOURCE_LABEL,
        "verified": False,
        "currency": "INR",
        "is_candidate": False,
        "notes": "Illustrative hackathon demo benchmark for gig and parcel delivery work. Not guaranteed income.",
    },
    {
        "occupation_id": "occ-003",
        "occupation_name": "Electrician",
        "canonical_name": "Electrician",
        "aliases": [
            "electrician",
            "electrical technician",
            "wireman",
            "electrical installation & maintenance",
        ],
        "monthly_wage_inr": 30000.0,
        "wage_type": "monthly",
        "employment_type": "informal",
        "geography_level": "state",
        "state": "Karnataka",
        "data_status": DATA_STATUS_MOCK,
        "source_label": SOURCE_LABEL,
        "verified": False,
        "currency": "INR",
        "is_candidate": False,
        "notes": "Illustrative hackathon demo benchmark for certified electrical technician. Not guaranteed income.",
    },
    {
        "occupation_id": "occ-012",
        "occupation_name": "Motor Vehicle Mechanic",
        "canonical_name": "Motor Vehicle Mechanic",
        "aliases": [
            "motor vehicle mechanic",
            "mechanic motor vehicle",
            "auto mechanic",
            "two wheeler mechanic",
            "car mechanic",
            "mechanic",
        ],
        "monthly_wage_inr": 28000.0,
        "wage_type": "monthly",
        "employment_type": "informal",
        "geography_level": "state",
        "state": "Karnataka",
        "data_status": DATA_STATUS_MOCK,
        "source_label": SOURCE_LABEL,
        "verified": False,
        "currency": "INR",
        "is_candidate": False,
        "notes": "Illustrative hackathon demo benchmark for automotive maintenance and repair. Not guaranteed income.",
    },
    {
        "occupation_id": "occ-009",
        "occupation_name": "Fitter",
        "canonical_name": "Fitter (Mechanical Fitting Trade Worker)",
        "aliases": [
            "fitter",
            "fitter (mechanical fitting trade worker)",
            "mechanical fitter",
            "bench fitter",
            "assembly fitter",
        ],
        "monthly_wage_inr": 29000.0,
        "wage_type": "monthly",
        "employment_type": "informal",
        "geography_level": "state",
        "state": "Karnataka",
        "data_status": DATA_STATUS_MOCK,
        "source_label": SOURCE_LABEL,
        "verified": False,
        "currency": "INR",
        "is_candidate": False,
        "notes": "Illustrative hackathon demo benchmark for mechanical fitting trade worker. Not guaranteed income.",
    },
    {
        "occupation_id": "occ-candidate-ev",
        "occupation_name": "EV Service Technician",
        "canonical_name": "EV Service Technician",
        "aliases": [
            "ev service technician",
            "electric vehicle technician",
            "ev mechanic",
            "electric vehicle service",
        ],
        "monthly_wage_inr": 32000.0,
        "wage_type": "monthly",
        "employment_type": "informal",
        "geography_level": "state",
        "state": "Karnataka",
        "data_status": DATA_STATUS_MOCK,
        "source_label": SOURCE_LABEL,
        "verified": False,
        "currency": "INR",
        "is_candidate": True,
        "candidate_label": "CANDIDATE — NEEDS REVIEW",
        "notes": "Illustrative hackathon demo benchmark for emerging EV service technician (Candidate skill). Not verified.",
    },
]


def find_mock_wage(
    occupation_id: str | None = None,
    occupation_name: str | None = None,
) -> dict[str, Any] | None:
    """Find a mock wage record by occupation_id or text match.

    Returns None if no mock entry matches — caller handles missing data honestly.
    """
    if occupation_id:
        for item in MOCK_WAGES:
            if item["occupation_id"].lower() == occupation_id.lower():
                return item

    if occupation_name:
        name_clean = occupation_name.strip().lower()
        # Direct exact or canonical match
        for item in MOCK_WAGES:
            if (
                item["occupation_name"].lower() == name_clean
                or item["canonical_name"].lower() == name_clean
            ):
                return item
        # Alias match
        for item in MOCK_WAGES:
            for alias in item.get("aliases", []):
                if alias in name_clean or name_clean in alias:
                    return item

    return None
