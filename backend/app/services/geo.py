"""PostGIS-backed nearby-training-centre search and centre → schema mapping.

Never fabricates a coordinate: any centre with NULL latitude/longitude has a
NULL `location` column (see the generated column in
migrations/versions/0001_initial_schema.py) and is therefore automatically
excluded from every ST_DWithin query below — no special-casing needed.
"""
from __future__ import annotations

from geoalchemy2.functions import ST_Distance, ST_DWithin, ST_MakePoint, ST_SetSRID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CentreCourse, Course, TrainingCentre
from app.schemas.common import centre_course_provenance, training_centre_provenance
from app.schemas.training_centre import MappedCourseOut, NearbyTrainingCentreOut, TrainingCentreOut


def _mapped_courses_for(db: Session, centre_id: str) -> list[MappedCourseOut]:
    rows = (
        db.execute(
            select(CentreCourse, Course.title)
            .join(Course, Course.id == CentreCourse.course_id)
            .where(CentreCourse.centre_id == centre_id)
        )
        .all()
    )
    return [
        MappedCourseOut(
            course_id=cc.course_id,
            course_title=title,
            freshness_flag=cc.freshness_flag,
            provenance=centre_course_provenance(cc.freshness_flag),
            batch_schedule_note=cc.batch_schedule_note,
        )
        for cc, title in rows
    ]


def to_training_centre_out(centre: TrainingCentre) -> TrainingCentreOut:
    return TrainingCentreOut(
        id=centre.id,
        name=centre.name,
        centre_name=centre.name,
        type=centre.type,
        district=centre.district,
        taluk=centre.taluk,
        address=centre.address,
        latitude=float(centre.latitude) if centre.latitude is not None else None,
        longitude=float(centre.longitude) if centre.longitude is not None else None,
        recognition_status=centre.recognition_status,
        geocoding_status=getattr(centre, "geocoding_status", None),
        geocoding_source=getattr(centre, "geocoding_source", None),
        geocoding_confidence=getattr(centre, "geocoding_confidence", None),
        geocoding_query=getattr(centre, "geocoding_query", None),
        geocoded_at=getattr(centre, "geocoded_at", None),
        provenance=training_centre_provenance(centre.recognition_status),
        contact_phone=centre.contact_phone,
        contact_email=centre.contact_email,
        last_verified=centre.last_verified,
    )


def to_nearby_out(
    db: Session,
    centre: TrainingCentre,
    distance_km: float | None = None,
    distance_type: str | None = None,
) -> NearbyTrainingCentreOut:
    base = to_training_centre_out(centre)
    if distance_km is None and (centre.latitude is None or centre.longitude is None):
        distance_type = "district_only"
    return NearbyTrainingCentreOut(
        **base.model_dump(),
        distance_km=distance_km,
        distance_type=distance_type,
        mapped_courses=_mapped_courses_for(db, centre.id),
    )


def find_nearby_centres(
    db: Session,
    latitude: float,
    longitude: float,
    radius_km: float,
    course_id: str | None = None,
    skill_id: str | None = None,
    limit: int = 50,
    distance_type: str = "exact",
) -> list[NearbyTrainingCentreOut]:
    """Verified/curated training centres within radius_km of (lat, lng).

    Optionally filtered to centres that have a centre_courses row for a
    specific course_id, or for any course teaching a specific skill_id.
    """
    point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    distance_expr = ST_Distance(TrainingCentre.location, point) / 1000.0

    stmt = (
        select(TrainingCentre, distance_expr.label("distance_km"))
        .where(TrainingCentre.location.isnot(None))
        .where(ST_DWithin(TrainingCentre.location, point, radius_km * 1000))
    )

    if course_id:
        stmt = stmt.join(CentreCourse, CentreCourse.centre_id == TrainingCentre.id).where(
            CentreCourse.course_id == course_id
        )
    elif skill_id:
        stmt = (
            stmt.join(CentreCourse, CentreCourse.centre_id == TrainingCentre.id)
            .join(Course, Course.id == CentreCourse.course_id)
            .where(Course.skill_id == skill_id)
        )

    stmt = stmt.order_by(distance_expr).limit(limit)

    rows = db.execute(stmt).all()
    return [to_nearby_out(db, centre, float(dist), distance_type=distance_type) for centre, dist in rows]

