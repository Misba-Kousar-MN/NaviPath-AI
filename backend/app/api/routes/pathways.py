from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.pathway import PathwayResponse
from app.services.pathways import build_pathway

router = APIRouter(prefix="/api/pathways", tags=["pathways"])


@router.get("", response_model=PathwayResponse)
def get_pathways(
    current_occupation: str = Query(..., description="Occupation id or free text"),
    target_skill: str | None = Query(None, description="Skill id or free text"),
    latitude: float | None = Query(None, ge=-90, le=90),
    longitude: float | None = Query(None, ge=-180, le=180),
    radius_km: float = Query(50, gt=0, le=500),
    db: Session = Depends(get_db),
) -> PathwayResponse:
    return build_pathway(
        db,
        occupation_text=current_occupation,
        target_skill_text=target_skill,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )
