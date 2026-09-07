from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import TrainingCentre
from app.schemas.training_centre import NearbyTrainingCentreOut, TrainingCentreOut
from app.services.geo import find_nearby_centres, to_training_centre_out

router = APIRouter(prefix="/api/training-centres", tags=["training-centres"])


@router.get("", response_model=list[TrainingCentreOut])
def list_training_centres(
    district: str | None = Query(None),
    search: str | None = Query(None, description="Case-insensitive substring match on name"),
    status: str | None = Query(
        None, alias="status", description="Matches recognition_status exactly"
    ),
    db: Session = Depends(get_db),
) -> list[TrainingCentreOut]:
    stmt = select(TrainingCentre)
    if district:
        stmt = stmt.where(TrainingCentre.district.ilike(f"%{district}%"))
    if search:
        stmt = stmt.where(TrainingCentre.name.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(TrainingCentre.recognition_status == status)
    centres = db.execute(stmt).scalars().all()
    return [to_training_centre_out(c) for c in centres]


@router.get("/nearby", response_model=list[NearbyTrainingCentreOut])
def nearby_training_centres(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25, gt=0, le=500),
    course_id: str | None = Query(None),
    skill_id: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[NearbyTrainingCentreOut]:
    if course_id and skill_id:
        raise HTTPException(400, "Provide only one of course_id or skill_id, not both.")
    return find_nearby_centres(
        db, latitude, longitude, radius_km, course_id=course_id, skill_id=skill_id
    )
