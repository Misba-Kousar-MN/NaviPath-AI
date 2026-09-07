from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.context import set_session_id
from app.schemas.recommendation import RecommendationResponse, WorkerProfileIn
from app.services.grounded_recommendations import build_grounded_recommendation

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("", response_model=RecommendationResponse)
def post_recommendation(
    profile: WorkerProfileIn, db: Session = Depends(get_db)
) -> RecommendationResponse:
    if profile.session_id:
        set_session_id(profile.session_id)
    return build_grounded_recommendation(db, profile)
