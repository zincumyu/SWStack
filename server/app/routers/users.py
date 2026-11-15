"""Developer directory and public profiles."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import User
from ..security import get_db
from ..serializers import (
    question_score_map,
    tag_follower_count_map,
    user_follower_count_map,
    user_following_count_map,
)
from ..services import build_profile_payload

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/users")
def list_users(db: Session = Depends(get_db)) -> list[dict]:
    users = list(
        db.scalars(
            select(User)
            .where(User.status == "active")
            .order_by(User.reputation.desc())
        ).all()
    )
    tag_counts = tag_follower_count_map(db)
    follower_counts = user_follower_count_map(db)
    following_counts = user_following_count_map(db)
    question_scores = question_score_map(db)
    return [
        build_profile_payload(
            db,
            user,
            tag_counts=tag_counts,
            follower_counts=follower_counts,
            following_counts=following_counts,
            question_scores=question_scores,
        )
        for user in users
    ]


@router.get("/users/{handle}")
def get_user(handle: str, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.handle == handle))
    if user is None or user.status != "active":
        raise HTTPException(status_code=404, detail="没有找到这个开发者")
    return build_profile_payload(db, user)
