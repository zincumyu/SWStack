"""SQLAlchemy engine/session setup.

The engine and session factory are attached to ``app.state`` by the application
factory, which lets tests build isolated apps against temporary databases.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import ensure_sqlite_directory


def create_engine_for_url(database_url: str) -> Engine:
    ensure_sqlite_directory(database_url)
    url = make_url(database_url)
    is_sqlite = url.get_backend_name() == "sqlite"
    is_memory = is_sqlite and url.database in (None, "", ":memory:")
    engine_options: dict = {"future": True}

    if is_sqlite:
        engine_options["connect_args"] = {"check_same_thread": False}
    if is_memory:
        engine_options["poolclass"] = StaticPool

    return create_engine(database_url, **engine_options)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
