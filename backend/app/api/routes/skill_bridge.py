"""Skill-Bridge & Wage-Lift Engine API routes (Innovation 3).

Exposes:
- GET  /api/skill-bridge/pathways      -> SkillBridgeResult
- POST /api/skill-bridge/compare       -> SkillBridgeComparison
- GET  /api/skill-bridge/benchmarks    -> list[WageBenchmarkOut]
- POST /api/skill-bridge/wage-lift     -> WageLiftOut
"""
from __future__ import annotations

import logging
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.wage_benchmark import WageBenchmark
from app.schemas.skill_bridge import (
    SkillBridgeCompareRequest,
    SkillBridgeComparison,
    SkillBridgeResult,
    WageBenchmarkOut,
    WageLiftOut,
)
from app.services.skill_bridge import build_skill_bridge_result, compare_pathways
from app.services.wage_lift import calculate_wage_lift, get_wage_benchmark

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skill-bridge", tags=["skill-bridge"])


@router.get("/pathways", response_model=SkillBridgeResult)
def get_skill_bridge_pathways(
    occupation: str = Query(..., description="Occupation ID or free text name"),
    district: str | None = Query(None, description="District name for localized training centres & benchmarks"),
    target_occupation_id: str | None = Query(None, description="Optional target occupation filter"),
    latitude: float | None = Query(None, ge=-90, le=90),
    longitude: float | None = Query(None, ge=-180, le=180),
    radius_km: float = Query(50.0, gt=0, le=500),
    db: Session = Depends(get_db),
) -> SkillBridgeResult:
    """Computes deterministic skill-bridge pathways from current occupation."""
    return build_skill_bridge_result(
        db=db,
        occupation_text=occupation,
        district=district,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        target_occupation_id=target_occupation_id,
    )


@router.post("/compare", response_model=SkillBridgeComparison)
def compare_skill_bridge_pathways(
    body: SkillBridgeCompareRequest,
    db: Session = Depends(get_db),
) -> SkillBridgeComparison:
    """Side-by-side deterministic comparison of two target transition pathways."""
    result_a = build_skill_bridge_result(
        db=db,
        occupation_text=body.occupation,
        district=body.district,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    pathway_a = None
    pathway_b = None
    for p in result_a.pathways:
        if (
            p.target_skill.id.lower() == body.target_skill_a.lower()
            or p.target_skill.name_en.lower() == body.target_skill_a.lower()
        ):
            pathway_a = p
        if (
            p.target_skill.id.lower() == body.target_skill_b.lower()
            or p.target_skill.name_en.lower() == body.target_skill_b.lower()
        ):
            pathway_b = p

    if not pathway_a:
        raise HTTPException(
            status_code=404,
            detail=f"No pathway found for target skill '{body.target_skill_a}' from occupation '{body.occupation}'.",
        )
    if not pathway_b:
        raise HTTPException(
            status_code=404,
            detail=f"No pathway found for target skill '{body.target_skill_b}' from occupation '{body.occupation}'.",
        )

    return compare_pathways(pathway_a, pathway_b)


@router.get("/benchmarks", response_model=list[WageBenchmarkOut])
def get_benchmarks(
    occupation_id: str | None = Query(None, description="Filter by occupation ID"),
    district: str | None = Query(None, description="Filter by district"),
    db: Session = Depends(get_db),
) -> list[WageBenchmarkOut]:
    """Retrieve wage benchmarks with source provenance."""
    stmt = select(WageBenchmark)
    if occupation_id:
        stmt = stmt.where(WageBenchmark.occupation_id == occupation_id)
    if district:
        stmt = stmt.where(WageBenchmark.district.ilike(f"%{district}%"))

    rows = db.execute(stmt).scalars().all()
    out = []
    seen_ids = set()
    for r in rows:
        bm = get_wage_benchmark(db, r.occupation_id, district=district)
        if bm and bm.benchmark_id not in seen_ids:
            seen_ids.add(bm.benchmark_id)
            out.append(bm)
    if occupation_id and not out:
        bm = get_wage_benchmark(db, occupation_id, district=district)
        if bm:
            out.append(bm)
    return out


@router.post("/wage-lift", response_model=WageLiftOut)
def post_wage_lift(
    current_occupation_id: str = Query(...),
    target_occupation_id: str = Query(...),
    district: str | None = Query(None),
    db: Session = Depends(get_db),
) -> WageLiftOut:
    """Deterministically compute wage lift between two occupations."""
    current_bm = get_wage_benchmark(db, current_occupation_id, district=district)
    target_bm = get_wage_benchmark(db, target_occupation_id, district=district)
    return calculate_wage_lift(current_bm, target_bm)
