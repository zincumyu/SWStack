"""Runtime configuration for the SWStack backend.

All values have local-development defaults so the server can be started with
``uv run uvicorn app.main:app --reload --port 8000`` without any .env file.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_DB_URL = "sqlite:///./data/swstack.db"
SESSION_COOKIE_NAME = "swstack_session"
SESSION_REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60
SESSION_DEFAULT_TTL_SECONDS = 12 * 60 * 60

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
)


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str
    cookie_secure: bool
    cors_origins: tuple[str, ...]

    @classmethod
    def from_env(cls, database_url: str | None = None) -> "Settings":
        origins_raw = os.getenv("SWSTACK_CORS_ORIGINS", "")
        origins = tuple(
            origin.strip() for origin in origins_raw.split(",") if origin.strip()
        ) or DEFAULT_CORS_ORIGINS
        return cls(
            database_url=database_url
            or os.getenv("SWSTACK_DB_URL")
            or os.getenv("DATABASE_URL")
            or DEFAULT_DB_URL,
            cookie_secure=_env_bool("SWSTACK_COOKIE_SECURE", False),
            cors_origins=origins,
        )


def ensure_sqlite_directory(database_url: str) -> None:
    """Create the parent directory for a file-backed SQLite database."""
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        return
    raw_path = database_url[len(prefix) :]
    if not raw_path or raw_path == ":memory:" or raw_path.startswith("file:"):
        return
    # URL database names use forward slashes, including Windows drive letters.
    path = Path(raw_path)
    path.parent.mkdir(parents=True, exist_ok=True)
