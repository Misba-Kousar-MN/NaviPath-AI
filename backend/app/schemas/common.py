"""Shared response building blocks — provenance normalization lives here.

The dataset already tracks status per-table (verification_status,
curation_status, rule_status, freshness_flag, recognition_status). Rather than
duplicate that as a new DB column (which the task explicitly says to avoid
unless necessary), this module derives one normalized, API-facing label —
OFFICIAL_VERIFIED / CURATED / NEEDS_REVALIDATION / DEMO / UNVERIFIED — from
whichever underlying status field a given row already carries. This never
changes the underlying data; it's a read-time projection only.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class ProvenanceStatus(str, Enum):
    OFFICIAL_VERIFIED = "OFFICIAL_VERIFIED"
    CURATED = "CURATED"
    NEEDS_REVALIDATION = "NEEDS_REVALIDATION"
    DEMO = "DEMO"
    UNVERIFIED = "UNVERIFIED"


def source_provenance(verification_status: str | None) -> ProvenanceStatus:
    """Maps sources.verification_status -> ProvenanceStatus."""
    return {
        "verified": ProvenanceStatus.OFFICIAL_VERIFIED,
        "pending-review": ProvenanceStatus.NEEDS_REVALIDATION,
        "broken-link": ProvenanceStatus.NEEDS_REVALIDATION,
        "superseded": ProvenanceStatus.NEEDS_REVALIDATION,
    }.get((verification_status or "").strip(), ProvenanceStatus.UNVERIFIED)


def centre_course_provenance(freshness_flag: str | None) -> ProvenanceStatus:
    """Maps centre_courses.freshness_flag -> ProvenanceStatus."""
    return {
        "CURRENT": ProvenanceStatus.OFFICIAL_VERIFIED,
        "HISTORICAL": ProvenanceStatus.NEEDS_REVALIDATION,
        "NEEDS_REVALIDATION": ProvenanceStatus.NEEDS_REVALIDATION,
    }.get((freshness_flag or "").strip(), ProvenanceStatus.UNVERIFIED)


def training_centre_provenance(recognition_status: str | None) -> ProvenanceStatus:
    """Maps training_centres.recognition_status -> ProvenanceStatus.

    'private-recognized' is deliberately CURATED, not OFFICIAL_VERIFIED: it means
    the centre's existence/name/address is verified via an official portal, but
    current operating status is not confirmed (see docs/KARNATAKA_COVERAGE_REPORT.md).
    """
    return {
        "govt-recognized": ProvenanceStatus.OFFICIAL_VERIFIED,
        "empanelled": ProvenanceStatus.OFFICIAL_VERIFIED,
        "private-recognized": ProvenanceStatus.CURATED,
        "unverified": ProvenanceStatus.UNVERIFIED,
    }.get((recognition_status or "").strip(), ProvenanceStatus.UNVERIFIED)


class EvidenceOut(BaseModel):
    id: str
    source_id: str
    source_title: str
    source_authority: str
    official_url: str | None
    claim_text: str
    excerpt_text: str
    verification_status: str
    provenance: ProvenanceStatus

    model_config = {"from_attributes": True}


class Warning(BaseModel):
    code: str
    message: str
