"""JSON payload builders that match ``src/api/types.ts`` field names."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Answer,
    AnswerComment,
    AnswerVote,
    Question,
    QuestionComment,
    QuestionVote,
    Tag,
    TagFollow,
    User,
    UserFollow,
)


def iso_z(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return (
        value.astimezone(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def json_list(raw: str | None) -> list[Any]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except (TypeError, ValueError):
        return []
    return parsed if isinstance(parsed, list) else []


def user_summary(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "handle": user.handle,
        "reputation": user.reputation,
        "avatarColor": user.avatar_color,
        "title": user.title,
    }


def auth_user(user: User) -> dict[str, Any]:
    return {
        **user_summary(user),
        "role": user.role,
        "canWriteColumns": user.role == "admin" or bool(user.can_write_columns),
    }


def tag_payload(tag: Tag, tag_follower_counts: dict[int, int] | None = None) -> dict[str, Any]:
    count = (tag_follower_counts or {}).get(tag.id, 0)
    return {
        "slug": tag.slug,
        "name": tag.name,
        "description": tag.description,
        "questionCount": tag.base_question_count,
        "weeklyCount": tag.weekly_count,
        "followerCount": tag.base_follower_count + count,
    }


def comment_payload(comment: QuestionComment | AnswerComment) -> dict[str, Any]:
    return {
        "id": comment.id,
        "body": comment.body,
        "author": user_summary(comment.author),
        "createdAt": iso_z(comment.created_at),
    }


def answer_payload(
    answer: Answer,
    answer_scores: dict[int, int] | None = None,
    viewer_votes: dict[int, int] | None = None,
) -> dict[str, Any]:
    return {
        "id": answer.id,
        "questionId": answer.question_id,
        "body": answer.body,
        "score": answer.base_score + (answer_scores or {}).get(answer.id, 0),
        "accepted": answer.accepted,
        "viewerVote": (viewer_votes or {}).get(answer.id, 0),
        "author": user_summary(answer.author),
        "createdAt": iso_z(answer.created_at),
        "comments": [comment_payload(comment) for comment in answer.comments],
    }


def question_summary(
    question: Question, question_scores: dict[int, int] | None = None,
    tag_follower_counts: dict[int, int] | None = None,
) -> dict[str, Any]:
    return {
        "id": question.id,
        "title": question.title,
        "excerpt": question.excerpt,
        "score": question.base_score + (question_scores or {}).get(question.id, 0),
        "answerCount": len(question.answers),
        "viewCount": question.view_count,
        "hasAcceptedAnswer": any(answer.accepted for answer in question.answers),
        "isFeatured": question.is_featured,
        "tags": [
            {"slug": tag.slug, "name": tag.name} for tag in question.tags
        ],
        "author": user_summary(question.author),
        "createdAt": iso_z(question.created_at),
        "lastActivityAt": iso_z(question.last_activity_at),
    }


def question_detail(
    question: Question,
    question_scores: dict[int, int] | None = None,
    answer_scores: dict[int, int] | None = None,
    tag_follower_counts: dict[int, int] | None = None,
    viewer_vote: int = 0,
    bookmarked: bool = False,
    answer_viewer_votes: dict[int, int] | None = None,
    related: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        **question_summary(question, question_scores, tag_follower_counts),
        "body": question.body,
        "viewerVote": viewer_vote,
        "bookmarked": bookmarked,
        "answersList": [
            answer_payload(answer, answer_scores, answer_viewer_votes)
            for answer in question.answers
        ],
        "related": related or [],
        "comments": [comment_payload(comment) for comment in question.comments],
    }


def user_profile(
    user: User,
    recent_questions: list[dict[str, Any]],
    top_tags: list[Tag],
    tag_follower_counts: dict[int, int],
    follower_count: int,
    following_count: int,
) -> dict[str, Any]:
    tag_by_slug: dict[str, Tag] = {tag.slug: tag for tag in top_tags}
    return {
        **user_summary(user),
        "bio": user.bio,
        "location": user.location,
        "school": user.school,
        "joinedAt": iso_z(user.joined_at),
        "questionCount": user.profile_question_count,
        "answerCount": user.profile_answer_count,
        "viewCount": user.view_count,
        "followerCount": user.base_follower_count + follower_count,
        "followingCount": following_count,
        "topTags": [
            tag_payload(tag_by_slug[slug], tag_follower_counts)
            for slug in json_list(user.top_tags_json)
            if slug in tag_by_slug
        ],
        "badges": json_list(user.badges_json),
        "recentQuestions": recent_questions,
    }


def search_user(user: User) -> dict[str, Any]:
    return {
        **user_summary(user),
        "bio": user.bio,
        "school": user.school,
        "questionCount": user.profile_question_count,
        "answerCount": user.profile_answer_count,
    }


def question_score_map(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(QuestionVote.question_id, func.sum(QuestionVote.value)).group_by(
            QuestionVote.question_id
        )
    ).all()
    return {question_id: int(total or 0) for question_id, total in rows}


def answer_score_map(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(AnswerVote.answer_id, func.sum(AnswerVote.value)).group_by(
            AnswerVote.answer_id
        )
    ).all()
    return {answer_id: int(total or 0) for answer_id, total in rows}


def tag_follower_count_map(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(TagFollow.tag_id, func.count()).group_by(TagFollow.tag_id)
    ).all()
    return {tag_id: int(total) for tag_id, total in rows}


def user_follower_count_map(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(UserFollow.followed_id, func.count()).group_by(UserFollow.followed_id)
    ).all()
    return {user_id: int(total) for user_id, total in rows}


def user_following_count_map(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(UserFollow.follower_id, func.count()).group_by(UserFollow.follower_id)
    ).all()
    return {user_id: int(total) for user_id, total in rows}
