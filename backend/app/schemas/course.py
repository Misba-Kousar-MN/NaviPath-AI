from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class CourseOut(BaseModel):
    id: str
    title: str
    skill_id: str
    level: str | None = None
    duration_value: float | None = None
    duration_unit: str | None = None
    mode: str | None = None
    languages_supported: str | None = None
    certifying_body: str | None = None
    is_government_recognized: bool | None = None
    fee_type: str | None = None
    fee_amount_inr: float | None = None
    source_id: str
    last_verified: date | None = None

    model_config = {"from_attributes": True}
