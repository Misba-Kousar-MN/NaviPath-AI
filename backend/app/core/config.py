"""Application settings, loaded from environment / backend/.env.

No secrets have defaults that point at a real service — DATABASE_URL defaults
to a local placeholder that will simply fail to connect if no local Postgres
exists, which is the correct, honest failure mode (see /health).
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]


def _use_psycopg3(url: str) -> str:
    """Normalize a bare 'postgresql://' URL to 'postgresql+psycopg://' so
    SQLAlchemy picks the psycopg (v3) driver actually installed in this
    project (requirements.txt), rather than defaulting to psycopg2.
    """
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            str(_BACKEND_DIR.parent / ".env"),
            str(_BACKEND_DIR.parent.parent / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/skill_navigator"
    )
    direct_database_url: str | None = None

    @field_validator("database_url", "direct_database_url")
    @classmethod
    def _normalize_driver(cls, v: str | None) -> str | None:
        return _use_psycopg3(v) if v else v

    # Canonical Gemini API key environment variable name
    skill: str | None = None

    embedding_model: str = "gemini-embedding-001"
    embedding_dimension: int = 768
    llm_model: str = "gemini-3.6-flash"

    app_env: str = "local"
    cors_origins: str = "http://localhost:3000"

    # Phase 7 — Voice Engine (Whisper STT + Gemini TTS)
    voice_stt_model: str = "tiny"
    voice_tts_model: str = "gemini-3.1-flash-tts-preview"
    voice_mock_mode: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def migration_database_url(self) -> str:
        return self.direct_database_url or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
