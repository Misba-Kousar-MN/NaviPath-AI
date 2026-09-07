"""Pure unit tests for the deterministic eligibility rule evaluator.
No database needed — app/services/eligibility.evaluate_rule() takes plain
objects with the right attributes, so these run in every environment.
"""
from __future__ import annotations

from types import SimpleNamespace

from app.schemas.scheme import EligibilityCheckRequest
from app.services.eligibility import evaluate_rule


def _rule(**kwargs):
    defaults = dict(
        id="er-test",
        field_path="worker_profiles.age",
        operator="gte",
        value="18",
        mandatory=True,
        logic_connector="AND",
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_gte_pass():
    rule = _rule(operator="gte", value="18")
    profile = EligibilityCheckRequest(age=25)
    assert evaluate_rule(rule, profile) == "pass"


def test_gte_fail():
    rule = _rule(operator="gte", value="18")
    profile = EligibilityCheckRequest(age=16)
    assert evaluate_rule(rule, profile) == "fail"


def test_missing_field_is_unknown_never_guessed():
    rule = _rule(field_path="worker_profiles.age", operator="gte", value="18")
    profile = EligibilityCheckRequest()  # age not provided
    assert evaluate_rule(rule, profile) == "unknown"


def test_in_operator_matches_semicolon_list():
    rule = _rule(field_path="worker_profiles.occupation_id", operator="in", value="carpenter;mason;tailor")
    profile = EligibilityCheckRequest(occupation="Tailor")
    assert evaluate_rule(rule, profile) == "pass"


def test_in_operator_no_match():
    rule = _rule(field_path="worker_profiles.occupation_id", operator="in", value="carpenter;mason;tailor")
    profile = EligibilityCheckRequest(occupation="delivery rider")
    assert evaluate_rule(rule, profile) == "fail"


def test_not_in_operator():
    rule = _rule(
        field_path="worker_profiles.social_security_status", operator="not_in", value="ESIC;EPFO"
    )
    profile = EligibilityCheckRequest(social_security_status="none")
    assert evaluate_rule(rule, profile) == "pass"

    profile2 = EligibilityCheckRequest(social_security_status="EPFO")
    assert evaluate_rule(rule, profile2) == "fail"


def test_boolean_extra_attribute():
    rule = _rule(
        field_path="worker_profiles.is_government_employee_or_family", operator="eq", value="false"
    )
    profile_pass = EligibilityCheckRequest(extra_attributes={"is_government_employee_or_family": False})
    assert evaluate_rule(rule, profile_pass) == "pass"

    profile_fail = EligibilityCheckRequest(extra_attributes={"is_government_employee_or_family": True})
    assert evaluate_rule(rule, profile_fail) == "fail"

    profile_unknown = EligibilityCheckRequest()  # attribute never supplied
    assert evaluate_rule(rule, profile_unknown) == "unknown"


def test_placeholder_sentinel_value_is_always_unknown():
    rule = _rule(operator="gte", value="REQUIRES OFFICIAL SOURCE VERIFICATION")
    profile = EligibilityCheckRequest(age=99)
    assert evaluate_rule(rule, profile) == "unknown"


def test_lte_and_range():
    lte = _rule(operator="lte", value="59")
    assert evaluate_rule(lte, EligibilityCheckRequest(age=59)) == "pass"
    assert evaluate_rule(lte, EligibilityCheckRequest(age=60)) == "fail"
