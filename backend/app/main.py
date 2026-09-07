"""FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --reload --app-dir backend
or, from inside backend/:
    uvicorn app.main:app --reload
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    courses,
    health,
    occupations,
    pathways,
    rag,
    recommendations,
    schemes,
    skill_bridge,
    skills,
    training_centres,
    voice,
)
from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.core.middleware import RequestTracingMiddleware

settings = get_settings()
setup_logging()

app = FastAPI(
    title="AI Skill Navigator for Informal Workers — Karnataka",
    description=(
        "Deterministic, database-backed skill/course/training-centre/scheme API. "
        "No fact in any response is invented by an LLM — see docs/ARCHITECTURE.md."
    ),
    version="0.1.0",
)

app.add_middleware(RequestTracingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health.router,
    occupations.router,
    skills.router,
    courses.router,
    training_centres.router,
    pathways.router,
    schemes.router,
    recommendations.router,
    skill_bridge.router,
    rag.router,
    voice.router,
):
    app.include_router(router)
