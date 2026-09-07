"""Engine + session factory. Connection is lazy — importing this module never
touches the network; only calling get_db()/health checks does. This is what
lets the FastAPI app start and serve /health even when no database is
reachable, per the project's "honest failure" requirement.
"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_settings = get_settings()

engine = create_engine(
    _settings.database_url,
    pool_pre_ping=True,
    future=True,
    # Fail fast (rather than hang) when no database is reachable — this is what
    # lets /health report {"database": "disconnected"} instead of timing out.
    connect_args={"connect_timeout": 3},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
