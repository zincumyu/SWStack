"""Follow relationships, follow status and the following feed."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Tag, TagFollow, User, UserFollow
from ..security import get_current_user, get_db
from ..serializers import (
    iso_z,
    question_score_map,
    question_summary,
    tag_follower_count_map,
    user_follower_count_map,
)
from ..services import all_public_questions, clamp_page, coerce_int

router = APIRouter(prefix="/api", tags=["follows"])


@router.get("/me/follows")
def follow_status(
    user=Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    followed_users = list(
        db.scalars(
            select(User.handle)
            .join(UserFollow, UserFollow.followed_id == User.id)
            .where(UserFollow.follower_id == user.id)
        ).all()
    )
    followed_tags = list(
        db.scalars(
            select(Tag.slug)
            .join(TagFollow, TagFollow.tag_id == Tag.id)
            .where(TagFollow.user_id == user.id)
        ).all()
    )
    return {"users": followed_users, "tags": followed_tags}


@router.post("/users/{handle}/follow")
def toggle_user_follow(
    handle: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    target = db.scalar(select(User).where(User.handle == handle))
    if target is None or target.status != "active":
        raise HTTPException(status_code=404, detail="没有找到这个开发者")
    if target.id == user.id:
        raise HTTPException(status_code=422, detail="不能关注自己")

    existing = db.scalar(
        select(UserFollow).where(
            UserFollow.follower_id == user.id,
            UserFollow.followed_id == target.id,
        )
    )
    following = existing is None
    if following:
        db.add(UserFollow(follower_id=user.id, followed_id=target.id))
    else:
        db.delete(existing)
    db.commit()

    incoming = db.scalar(
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.followed_id == target.id)
    )
    return {
        "following": following,
        "followerCount": target.base_follower_count + int(incoming or 0),
    }


@router.post("/tags/{slug}/follow")
def toggle_tag_follow(
    slug: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    tag = db.scalar(select(Tag).where(Tag.slug == slug))
    if tag is None or tag.status != "active":
        raise HTTPException(status_code=404, detail="没有找到这个标签")

    existing = db.scalar(
        select(TagFollow).where(
            TagFollow.user_id == user.id,
            TagFollow.tag_id == tag.id,
        )
    )
    following = existing is None
    if following:
        db.add(TagFollow(user_id=user.id, tag_id=tag.id))
    else:
        db.delete(existing)
    db.commit()

    incoming = db.scalar(
        select(func.count())
        .select_from(TagFollow)
        .where(TagFollow.tag_id == tag.id)
    )
    return {
        "following": following,
        "followerCount": tag.base_follower_count + int(incoming or 0),
    }


@router.get("/feed/following")
def following_feed(
    page: str | None = None,
    pageSize: str | None = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    requested_page = max(1, coerce_int(page, 1))
    page_size = min(24, max(1, coerce_int(pageSize, 12)))

    followed_user_ids = set(
        db.scalars(
            select(UserFollow.followed_id).where(UserFollow.follower_id == user.id)
        ).all()
    )
    followed_tag_ids = set(
        db.scalars(
            select(TagFollow.tag_id)
            .join(Tag, Tag.id == TagFollow.tag_id)
            .where(TagFollow.user_id == user.id, Tag.status == "active")
        ).all()
    )

    matching = [
        question
        for question in all_public_questions(db)
        if question.author.status == "active"
        and (
            question.author_id in followed_user_ids
            or any(tag.id in followed_tag_ids for tag in question.tags)
        )
    ]
    matching.sort(
        key=lambda question: (question.created_at, f"question-{question.id}"),
        reverse=True,
    )

    total = len(matching)
    current_page, start = clamp_page(requested_page, page_size, total)
    question_scores = question_score_map(db)
    tag_counts = tag_follower_count_map(db)
    return {
        "items": [
            {
                "id": f"question-{question.id}",
                "type": "question",
                "createdAt": iso_z(question.created_at),
                "question": question_summary(question, question_scores, tag_counts),
            }
            for question in matching[start : start + page_size]
        ],
        "total": total,
        "page": current_page,
        "pageSize": page_size,
    }
