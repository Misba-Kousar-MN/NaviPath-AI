from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Occupation
from app.schemas.occupation import OccupationOut

router = APIRouter(prefix="/api/occupations", tags=["occupations"])


@router.get("", response_model=list[OccupationOut])
def list_occupations(
    search: str | None = Query(None, description="Case-insensitive substring match on name_en"),
    sector: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[Occupation]:
    stmt = select(Occupation)
    if search:
        stmt = stmt.where(Occupation.name_en.ilike(f"%{search}%"))
    if sector:
        stmt = stmt.where(Occupation.sector.ilike(f"%{sector}%"))
    return list(db.execute(stmt).scalars().all())
