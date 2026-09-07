"""Deterministic eligibility rule evaluator. Mirrors docs/ARCHITECTURE.md
Section G exactly. Never guesses: missing data -> UNKNOWN -> UNCERTAIN verdict,
never ELIGIBLE or NOT_ELIGIBLE. The LLM is never involved in this module.
"""
from __future__ import annotations

from itertools import groupby
from operator import attrgetter

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Document, EligibilityRule, Evidence, Scheme, SchemeDocument, Source
from app.schemas.common import EvidenceOut, source_provenance
from app.schemas.scheme import (
    EligibilityCheckRequest,
    RuleResult,
    SchemeDocumentOut,
    SchemeEligibilityResult,
)

_RESULT_PASS = "pass"
_RESULT_FAIL = "fail"
_RESULT_UNKNOWN = "unknown"


def _profile_value(profile: EligibilityCheckRequest, field_path: str):
    """worker_profiles.<field> -> a value from the request, or None if unknown."""
    field = field_path.split(".", 1)[-1]
    named = {
        "age": profile.age,
        "occupation_id": profile.occupation,  # see note in evaluate_scheme()
        "social_security_status": profile.social_security_status,
        "education_level": profile.education,
        "district": profile.district,
        "employment_status": profile.employment_status,
    }
    if field in named and named[field] is not None:
        return named[field]
    return profile.extra_attributes.get(field)


def _coerce_bool(v) -> bool | None:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        if v.strip().lower() in ("true", "yes", "1"):
            return True
        if v.strip().lower() in ("false", "no", "0"):
            return False
    return None


def _normalize_slug(v: str) -> str:
    return v.strip().lower().replace(" ", "-")


def evaluate_rule(rule: EligibilityRule, profile: EligibilityCheckRequest) -> str:
    if rule.value is not None and rule.value.strip().upper().startswith(
        "REQUIRES OFFICIAL SOURCE VERIFICATION"
    ):
        # The rule's own value is an unresolved placeholder — can never be
        # evaluated as true/false regardless of what the worker profile says.
        return _RESULT_UNKNOWN

    raw = _profile_value(profile, rule.field_path)
    if raw is None:
        return _RESULT_UNKNOWN

    op = rule.operator
    value = rule.value or ""

    try:
        if op == "gte":
            return _RESULT_PASS if float(raw) >= float(value) else _RESULT_FAIL
        if op == "lte":
            return _RESULT_PASS if float(raw) <= float(value) else _RESULT_FAIL
        if op == "gt":
            return _RESULT_PASS if float(raw) > float(value) else _RESULT_FAIL
        if op == "lt":
            return _RESULT_PASS if float(raw) < float(value) else _RESULT_FAIL
        if op == "eq":
            as_bool = _coerce_bool(value)
            if as_bool is not None:
                actual = _coerce_bool(raw)
                return (
                    _RESULT_UNKNOWN
                    if actual is None
                    else (_RESULT_PASS if actual == as_bool else _RESULT_FAIL)
                )
            return _RESULT_PASS if _normalize_slug(str(raw)) == _normalize_slug(value) else _RESULT_FAIL
        if op == "neq":
            return _RESULT_PASS if _normalize_slug(str(raw)) != _normalize_slug(value) else _RESULT_FAIL
        if op == "in":
            options = {_normalize_slug(v) for v in value.split(";") if v}
            return _RESULT_PASS if _normalize_slug(str(raw)) in options else _RESULT_FAIL
        if op == "not_in":
            options = {_normalize_slug(v) for v in value.split(";") if v}
            return _RESULT_PASS if _normalize_slug(str(raw)) not in options else _RESULT_FAIL
        if op == "exists":
            return _RESULT_PASS
        if op == "not_exists":
            return _RESULT_FAIL
    except (TypeError, ValueError):
        return _RESULT_UNKNOWN

    return _RESULT_UNKNOWN


def _combine_group(results: list[str], connectors: list[str]) -> str:
    """AND/OR-combine one rule_group_id's results, in the order given.
    All current seed data uses AND-only groups; OR is implemented per the
    architecture spec even though the current data doesn't exercise it.
    """
    if not results:
        return _RESULT_UNKNOWN
    acc = results[0]
    for res, conn in zip(results[1:], connectors[1:] or connectors, strict=False):
        if conn == "OR":
            if acc == _RESULT_PASS or res == _RESULT_PASS:
                acc = _RESULT_PASS
            elif acc == _RESULT_UNKNOWN or res == _RESULT_UNKNOWN:
                acc = _RESULT_UNKNOWN
            else:
                acc = _RESULT_FAIL
        else:  # AND (default)
            if acc == _RESULT_FAIL or res == _RESULT_FAIL:
                acc = _RESULT_FAIL
            elif acc == _RESULT_UNKNOWN or res == _RESULT_UNKNOWN:
                acc = _RESULT_UNKNOWN
            else:
                acc = _RESULT_PASS
    return acc


def evaluate_scheme(
    db: Session, scheme: Scheme, profile: EligibilityCheckRequest
) -> SchemeEligibilityResult:
    rules = list(
        db.execute(
            select(EligibilityRule)
            .where(EligibilityRule.scheme_id == scheme.id)
            .order_by(EligibilityRule.rule_group_id)
        ).scalars()
    )

    reasons: list[RuleResult] = []
    group_results: list[str] = []
    any_mandatory_fail = False
    any_mandatory_unknown = False
    any_source_unverified = False

    for rule in rules:
        result = evaluate_rule(rule, profile)
        reasons.append(
            RuleResult(
                rule_id=rule.id,
                field_path=rule.field_path,
                human_readable_condition=rule.human_readable_condition,
                result=result,
                mandatory=rule.mandatory,
            )
        )
        rule_source = db.get(Source, rule.source_id)
        if rule_source is None or source_provenance(rule_source.verification_status).value not in (
            "OFFICIAL_VERIFIED",
        ):
            any_source_unverified = True
        if rule.rule_status == "needs-review":
            any_source_unverified = True
        if rule.mandatory:
            if result == _RESULT_FAIL:
                any_mandatory_fail = True
            elif result == _RESULT_UNKNOWN:
                any_mandatory_unknown = True

    grouped = groupby(rules, key=attrgetter("rule_group_id"))
    for _, group_iter in grouped:
        group_rules = list(group_iter)
        group_result_list = [
            r.result for r in reasons if r.rule_id in {gr.id for gr in group_rules}
        ]
        connectors = [gr.logic_connector or "AND" for gr in group_rules]
        group_results.append(_combine_group(group_result_list, connectors))

    if any_mandatory_fail:
        verdict = "not_eligible"
    elif any_mandatory_unknown or any_source_unverified:
        verdict = "uncertain"
    elif not rules:
        verdict = "uncertain"
    else:
        verdict = "eligible"

    evidence_rows = list(
        db.execute(
            select(Evidence, Source)
            .join(Source, Source.id == Evidence.source_id)
            .where(Evidence.related_entity_type == "scheme")
            .where(Evidence.related_entity_id == scheme.id)
        ).all()
    )
    evidence_out = [
        EvidenceOut(
            id=ev.id,
            source_id=src.id,
            source_title=src.title,
            source_authority=src.authority,
            official_url=src.official_url,
            claim_text=ev.claim_text,
            excerpt_text=ev.excerpt_text,
            verification_status=ev.verification_status,
            provenance=source_provenance(src.verification_status),
        )
        for ev, src in evidence_rows
    ]

    doc_rows = list(
        db.execute(
            select(SchemeDocument, Document)
            .join(Document, Document.id == SchemeDocument.document_id)
            .where(SchemeDocument.scheme_id == scheme.id)
        ).all()
    )
    documents_out = [
        SchemeDocumentOut(
            document_id=doc.id,
            document_name=doc.name,
            scheme_id=sd.scheme_id,
            mandatory=sd.mandatory,
            description=doc.description,
            issuing_authority=doc.issuing_authority,
            how_to_obtain=doc.how_to_obtain,
        )
        for sd, doc in doc_rows
    ]

    return SchemeEligibilityResult(
        scheme_id=scheme.id,
        scheme_name=scheme.name_en,
        verdict=verdict,
        reasons=reasons,
        evidence=evidence_out,
        documents=documents_out,
    )


def check_eligibility(
    db: Session, profile: EligibilityCheckRequest
) -> list[SchemeEligibilityResult]:
    stmt = select(Scheme)
    if profile.scheme_id:
        stmt = stmt.where(Scheme.id == profile.scheme_id)
    schemes = list(db.execute(stmt).scalars())
    return [evaluate_scheme(db, s, profile) for s in schemes]
