from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.schemas.common import EvidenceOut


class SchemeDocumentOut(BaseModel):
    document_id: str
    document_name: str
    scheme_id: str | None = None
    mandatory: bool | None = None
    description: str | None = None
    issuing_authority: str | None = None
    how_to_obtain: str | None = None


class SchemeOut(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None
    name_kn: str | None = None
    issuing_authority: str
    scheme_type: str | None = None
    benefit_summary: str | None = None
    official_url: str | None = None
    status: str | None = None
    last_verified: date | None = None
    documents: list[SchemeDocumentOut] = []

    model_config = {"from_attributes": True}


class EligibilityCheckRequest(BaseModel):
    occupation: str | None = None
    age: int | None = None
    education: str | None = None
    district: str | None = None
    employment_status: str | None = None
    social_security_status: str | None = None
    scheme_id: str | None = None  # if omitted, checks every scheme
    # Anything an eligibility_rules.field_path needs that isn't one of the named
    # fields above (e.g. is_government_employee_or_family, is_income_tax_payee,
    # prior_similar_scheme_loan_last_5_years). Keyed by the field_path's last
    # segment. A field_path with no matching key here (or above) evaluates to
    # UNKNOWN, per the architecture's "never guess missing data" rule.
    extra_attributes: dict[str, str | int | bool | None] = {}


class RuleResult(BaseModel):
    rule_id: str
    field_path: str
    human_readable_condition: str
    result: str  # pass | fail | unknown
    mandatory: bool | None = None


class SchemeEligibilityResult(BaseModel):
    scheme_id: str
    scheme_name: str
    verdict: str  # eligible | not_eligible | uncertain
    reasons: list[RuleResult]
    evidence: list[EvidenceOut] = []
    documents: list[SchemeDocumentOut] = []



class EligibilityCheckResponse(BaseModel):
    results: list[SchemeEligibilityResult]
