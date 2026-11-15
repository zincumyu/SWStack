"""Password hashing and cookie-backed session helpers.

Only stdlib primitives are used: PBKDF2-HMAC-SHA256 for passwords and an
opaque random token for sessions. Session tokens are stored hashed in SQLite.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from collections.abc import Iterator
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import (
    SESSION_COOKIE_NAME,
    SESSION_DEFAULT_TTL_SECONDS,
    SESSION_REMEMBER_TTL_SECONDS,
)
from .models import AppSession, User, utcnow

PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    digest_b64 = base64.b64encode(derived).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${digest_b64}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        algorithm, iterations_raw, salt_b64, digest_b64 = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except (ValueError, TypeError):
        return False
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(derived, expected)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: Session, user: User, remember: bool) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    ttl = SESSION_REMEMBER_TTL_SECONDS if remember else SESSION_DEFAULT_TTL_SECONDS
    expires_at = utcnow() + timedelta(seconds=ttl)
    db.add(
        AppSession(
            token_hash=_token_hash(token),
            user_id=user.id,
            created_at=utcnow(),
            expires_at=expires_at,
        )
    )
    return token, expires_at


def revoke_session(db: Session, token: str | None) -> None:
    if not token:
        return
    session = db.scalar(
        select(AppSession).where(AppSession.token_hash == _token_hash(token))
    )
    if session:
        db.delete(session)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def resolve_session_user(request: Request, db: Session) -> User | None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    session = db.scalar(
        select(AppSession).where(AppSession.token_hash == _token_hash(token))
    )
    if session is None:
        return None
    if _as_utc(session.expires_at) <= utcnow():
        db.delete(session)
        db.commit()
        return None
    user = session.user
    if user is None or user.status != "active":
        return None
    return user


def get_db(request: Request) -> Iterator[Session]:
    session_factory = request.app.state.session_factory
    with session_factory() as db:
        try:
            yield db
        except Exception:
            db.rollback()
            raise


def get_current_user(
    request: Request, db: Session = Depends(get_db)
) -> User:
    user = resolve_session_user(request, db)
    if user is None:
        raise HTTPException(status_code=401, detail="请先登录")
    return user


def get_optional_user(
    request: Request, db: Session = Depends(get_db)
) -> User | None:
    return resolve_session_user(request, db)


def cookie_max_age(remember: bool) -> int | None:
    return SESSION_REMEMBER_TTL_SECONDS if remember else None
