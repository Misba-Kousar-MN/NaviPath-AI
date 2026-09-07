from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Skill
from app.schemas.occupation import SkillOut

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
def list_skills(
    search: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[Skill]:
    stmt = select(Skill)
    if search:
        stmt = stmt.where(Skill.name_en.ilike(f"%{search}%"))
    if category:
        stmt = stmt.where(Skill.category == category)
    return list(db.execute(stmt).scalars().all())
