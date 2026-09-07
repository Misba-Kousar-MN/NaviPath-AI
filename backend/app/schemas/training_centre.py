from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.common import ProvenanceStatus


class TrainingCentreOut(BaseModel):
    id: str
    name: str
    centre_name: str | None = None
    type: str | None = None
    district: str
    taluk: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    recognition_status: str | None = None
    geocoding_status: str | None = None
    geocoding_source: str | None = None
    geocoding_confidence: str | None = None
    geocoding_query: str | None = None
    geocoded_at: datetime | date | None = None
    provenance: ProvenanceStatus
    contact_phone: str | None = None
    contact_email: str | None = None
    last_verified: date | None = None

    model_config = {"from_attributes": True}


class MappedCourseOut(BaseModel):
    course_id: str
    course_title: str
    freshness_flag: str | None = None
    provenance: ProvenanceStatus
    batch_schedule_note: str | None = None


class NearbyTrainingCentreOut(TrainingCentreOut):
    # None when this centre is returned outside a lat/lng-anchored nearby-search
    # (e.g. as part of a pathway result with no worker coordinate given).
    distance_km: float | None = None
    distance_type: str | None = None  # exact | approximate | district_only
    mapped_courses: list[MappedCourseOut] = []

