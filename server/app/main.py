"""FastAPI application factory for the SWStack minimum backend loop."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .config import Settings
from .database import create_engine_for_url, create_session_factory
from .models import Base
from .routers import (
    auth,
    community,
    follows,
    notifications,
    projects,
    questions,
    search,
    tags,
    users,
)
from .seed import seed_database


def _validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "请求参数无效"
    first = errors[0]
    location = [
        str(part) for part in first.get("loc", ()) if part not in ("body", "query", "path")
    ]
    field = ".".join(location)
    error_type = first.get("type", "")
    if error_type == "missing":
        return f"缺少必填字段: {field}" if field else "缺少必填字段"
    message = str(first.get("msg", "请求参数无效"))
    return f"{field}: {message}" if field else message


def create_app(database_url: str | None = None) -> FastAPI:
    settings = Settings.from_env(database_url)
    engine = create_engine_for_url(settings.database_url)
    session_factory = create_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        Base.metadata.create_all(bind=engine)
        with session_factory() as db:
            seed_database(db)
        yield
        engine.dispose()

    app = FastAPI(
        title="SWStack API",
        version="0.1.0",
        description="Minimum backend loop for the SWStack Vue frontend.",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = session_factory

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": _validation_message(exc)},
        )

    app.include_router(auth.router)
    app.include_router(questions.router)
    app.include_router(tags.router)
    app.include_router(users.router)
    app.include_router(follows.router)
    app.include_router(search.router)
    app.include_router(community.router)
    app.include_router(projects.router)
    app.include_router(notifications.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, Any]:
        with session_factory() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok"}

    return app


app = create_app()
