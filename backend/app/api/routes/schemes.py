from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Scheme
from app.schemas.scheme import EligibilityCheckRequest, EligibilityCheckResponse, SchemeOut
from app.services.eligibility import check_eligibility

router = APIRouter(prefix="/api/schemes", tags=["schemes"])


@router.get("", response_model=list[SchemeOut])
def list_schemes(db: Session = Depends(get_db)) -> list[Scheme]:
    return list(db.execute(select(Scheme)).scalars().all())


@router.post("/check-eligibility", response_model=EligibilityCheckResponse)
def check_scheme_eligibility(
    request: EligibilityCheckRequest, db: Session = Depends(get_db)
) -> EligibilityCheckResponse:
    results = check_eligibility(db, request)
    return EligibilityCheckResponse(results=results)
