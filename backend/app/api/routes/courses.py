from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Course, OccupationSkill
from app.schemas.course import CourseOut

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CourseOut])
def list_courses(
    skill_id: str | None = Query(None),
    occupation_id: str | None = Query(
        None, description="Courses teaching a skill this occupation currently uses"
    ),
    course_type: str | None = Query(None, description="Matches courses.mode"),
    db: Session = Depends(get_db),
) -> list[Course]:
    stmt = select(Course)
    if skill_id:
        stmt = stmt.where(Course.skill_id == skill_id)
    if occupation_id:
        skill_ids = select(OccupationSkill.skill_id).where(
            OccupationSkill.occupation_id == occupation_id
        )
        stmt = stmt.where(Course.skill_id.in_(skill_ids))
    if course_type:
        stmt = stmt.where(Course.mode == course_type)
    return list(db.execute(stmt).scalars().all())
