"""Shared query helpers and search matching rules."""

from __future__ import annotations

import math
import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Answer, AnswerVote, Bookmark, Question, QuestionVote, Tag, User
from .serializers import (
    question_score_map,
    question_summary,
    tag_follower_count_map,
    tag_payload,
    user_follower_count_map,
    user_following_count_map,
    user_profile,
)


def coerce_int(value: Any, fallback: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def make_excerpt(body: str) -> str:
    plain = re.sub(r"```[\s\S]*?```", " ", body)
    plain = re.sub(r"`[^`]+`", " ", plain)
    plain = re.sub(r"[#>*_\[\]-]", " ", plain)
    plain = re.sub(r"\s+", " ", plain).strip()
    return f"{plain[:116]}..." if len(plain) > 116 else plain


def all_public_questions(db: Session) -> list[Question]:
    return list(
        db.scalars(
            select(Question)
            .where(Question.status == "published")
            .order_by(Question.created_at.desc())
        ).all()
    )


def get_public_question(db: Session, question_id: int) -> Question:
    question = db.get(Question, question_id)
    if question is None or question.status != "published":
        raise HTTPException(status_code=404, detail="没有找到这个问题")
    return question


def visible_tags(db: Session) -> list[Tag]:
    return list(
        db.scalars(select(Tag).where(Tag.status == "active")).all()
    )


def top_tags_for_user(db: Session, user: User) -> list[Tag]:
    slugs = []
    try:
        import json

        slugs = json.loads(user.top_tags_json or "[]")
    except (TypeError, ValueError):
        slugs = []
    if not slugs:
        return []
    tags = list(db.scalars(select(Tag).where(Tag.slug.in_(slugs))).all())
    by_slug = {tag.slug: tag for tag in tags}
    return [by_slug[slug] for slug in slugs if slug in by_slug]


def viewer_question_vote(db: Session, user_id: int, question_id: int) -> int:
    vote = db.scalar(
        select(QuestionVote).where(
            QuestionVote.user_id == user_id,
            QuestionVote.question_id == question_id,
        )
    )
    return vote.value if vote else 0


def viewer_bookmarked(db: Session, user_id: int, question_id: int) -> bool:
    return (
        db.scalar(
            select(Bookmark).where(
                Bookmark.user_id == user_id,
                Bookmark.question_id == question_id,
            )
        )
        is not None
    )


def viewer_answer_vote_map(
    db: Session, user_id: int, question_id: int
) -> dict[int, int]:
    rows = db.execute(
        select(AnswerVote.answer_id, AnswerVote.value)
        .join(Answer, Answer.id == AnswerVote.answer_id)
        .where(Answer.question_id == question_id, AnswerVote.user_id == user_id)
    ).all()
    return {answer_id: int(value) for answer_id, value in rows}


def related_for_question(
    db: Session,
    question: Question,
    question_scores: dict[int, int],
    tag_counts: dict[int, int],
) -> list[dict[str, Any]]:
    current_tags = {tag.id for tag in question.tags}
    candidates: list[tuple[int, Question]] = []
    for other in all_public_questions(db):
        if other.id == question.id:
            continue
        overlap = len(current_tags.intersection({tag.id for tag in other.tags}))
        if overlap > 0:
            candidates.append((overlap, other))
    candidates.sort(
        key=lambda pair: (
            -pair[0],
            -(pair[1].base_score + question_scores.get(pair[1].id, 0)),
        )
    )
    return [
        question_summary(other, question_scores, tag_counts)
        for _, other in candidates[:5]
    ]


def build_profile_payload(
    db: Session,
    user: User,
    *,
    tag_counts: dict[int, int] | None = None,
    follower_counts: dict[int, int] | None = None,
    following_counts: dict[int, int] | None = None,
    question_scores: dict[int, int] | None = None,
) -> dict[str, Any]:
    tag_counts = tag_counts if tag_counts is not None else tag_follower_count_map(db)
    follower_counts = (
        follower_counts if follower_counts is not None else user_follower_count_map(db)
    )
    following_counts = (
        following_counts if following_counts is not None else user_following_count_map(db)
    )
    question_scores = (
        question_scores if question_scores is not None else question_score_map(db)
    )

    recent = list(
        db.scalars(
            select(Question)
            .where(Question.author_id == user.id, Question.status == "published")
            .order_by(Question.created_at.desc())
            .limit(5)
        ).all()
    )
    recent_payload = [
        question_summary(question, question_scores, tag_counts) for question in recent
    ]
    return user_profile(
        user,
        recent_payload,
        top_tags_for_user(db, user),
        tag_counts,
        follower_counts.get(user.id, 0),
        following_counts.get(user.id, 0),
    )


def question_search_text(question: Question) -> str:
    return " ".join(
        [
            question.title,
            question.excerpt,
            question.body,
            question.author.name,
            question.author.handle,
            *(tag.name for tag in question.tags),
        ]
    ).lower()


def tag_search_text(tag: Tag) -> str:
    return f"{tag.name} {tag.description}".lower()


def user_search_text(db: Session, user: User) -> str:
    top_tags = top_tags_for_user(db, user)
    return " ".join(
        [
            user.name,
            user.handle,
            user.title,
            user.bio,
            user.school,
            *(tag.name for tag in top_tags),
        ]
    ).lower()


def match_rank(text: str, normalized: str) -> int:
    value = text.lower()
    if value == normalized:
        return 0
    if value.startswith(normalized):
        return 1
    return 2


def clamp_page(page: int, page_size: int, total: int) -> tuple[int, int]:
    """Clamp a requested page to the last page, mirroring the mock feed/search."""
    clamped = min(page, max(1, math.ceil(total / page_size))) if total > 0 else 1
    return clamped, (clamped - 1) * page_size


