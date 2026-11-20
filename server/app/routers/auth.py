"""Login, logout and the current-session endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import SESSION_COOKIE_NAME
from ..models import User
from ..schemas import LoginInput
from ..security import (
    cookie_max_age,
    create_session,
    get_current_user,
    get_db,
    revoke_session,
    verify_password,
)
from ..serializers import auth_user

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/login")
def login(
    payload: LoginInput,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    email = payload.email.strip()
    password = payload.password
    if not email or not password:
        raise HTTPException(status_code=422, detail="请输入邮箱和密码")

    user = db.scalar(
        select(User).where(func.lower(User.email) == email.lower())
    )
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="账号已被停用, 请联系管理员")

    token, _expires_at = create_session(db, user, payload.remember)
    db.commit()

    secure = request.app.state.settings.cookie_secure
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=cookie_max_age(payload.remember),
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
    )
    return {"user": auth_user(user)}


@router.post("/auth/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    revoke_session(db, request.cookies.get(SESSION_COOKIE_NAME))
    db.commit()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=request.app.state.settings.cookie_secure,
        samesite="lax",
        httponly=True,
    )
    return {"success": True}


@router.get("/session/me")
def session_me(user: User = Depends(get_current_user)) -> dict:
    return auth_user(user)
