from __future__ import annotations

from pydantic import BaseModel


class OccupationOut(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None
    name_kn: str | None = None
    sector: str
    nco_code: str | None = None
    is_informal_sector: bool | None = None
    description: str | None = None

    model_config = {"from_attributes": True}


class SkillOut(BaseModel):
    id: str
    name_en: str
    name_hi: str | None = None
    name_kn: str | None = None
    category: str
    skill_level: str
    is_certifiable: bool | None = None
    certifying_body: str | None = None
    description: str | None = None

    model_config = {"from_attributes": True}
