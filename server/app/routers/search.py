"""Full-site search, suggestions and trending terms."""

from __future__ import annotations

from urllib.parse import quote

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import User
from ..security import get_current_user, get_db
from ..serializers import (
    question_score_map,
    question_summary,
    search_user,
    tag_follower_count_map,
    tag_payload,
)
from ..services import (
    all_public_questions,
    coerce_int,
    match_rank,
    question_search_text,
    tag_search_text,
    user_search_text,
    visible_tags,
)

router = APIRouter(prefix="/api", tags=["search"])

SEARCH_TYPES = {"all", "questions", "projects", "columns", "tags", "users"}


def _read_type(value: str | None) -> str:
    return value if value in SEARCH_TYPES else "all"


def _read_sort(value: str | None) -> str:
    return "newest" if value == "newest" else "relevance"


@router.get("/search/suggest")
def suggest(
    q: str | None = None,
    limit: str | None = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    keyword = (q or "").strip()
    normalized = keyword.lower()
    max_items = min(10, max(1, coerce_int(limit, 8)))
    if not normalized:
        return {"keyword": keyword, "items": []}

    question_scores = question_score_map(db)
    matched_questions = [
        question
        for question in all_public_questions(db)
        if normalized in question_search_text(question)
    ]
    matched_questions.sort(key=lambda item: item.last_activity_at, reverse=True)
    matched_questions.sort(
        key=lambda item: (
            match_rank(item.title, normalized),
            -(item.base_score + question_scores.get(item.id, 0)),
        )
    )

    matched_tags = [
        tag for tag in visible_tags(db) if normalized in tag_search_text(tag)
    ]
    matched_tags.sort(key=lambda item: item.base_question_count, reverse=True)
    matched_tags.sort(key=lambda item: match_rank(item.name, normalized))

    active_users = list(
        db.scalars(select(User).where(User.status == "active")).all()
    )
    matched_users = [
        item for item in active_users if normalized in user_search_text(db, item)
    ]
    matched_users.sort(key=lambda item: item.reputation, reverse=True)
    matched_users.sort(key=lambda item: match_rank(item.name, normalized))

    candidates: list[tuple[int, int, str, dict]] = []
    for question in matched_questions[:3]:
        candidates.append(
            (
                match_rank(question.title, normalized),
                0,
                question.title,
                {
                    "kind": "question",
                    "label": question.title,
                    "description": f"{question.author.name}, {len(question.answers)} 个回答",
                    "target": f"/questions/{question.id}",
                },
            )
        )
    for tag in matched_tags[:2]:
        candidates.append(
            (
                match_rank(tag.name, normalized),
                3,
                tag.name,
                {
                    "kind": "tag",
                    "label": tag.name,
                    "description": f"{tag.base_question_count} 个问题, 本周新增 {tag.weekly_count}",
                    "target": f"/tags/{quote(tag.slug, safe='')}",
                },
            )
        )
    for profile in matched_users[:2]:
        candidates.append(
            (
                match_rank(profile.name, normalized),
                4,
                profile.name,
                {
                    "kind": "user",
                    "label": profile.name,
                    "description": f"@{profile.handle}, {profile.title}",
                    "target": f"/users/{quote(profile.handle, safe='')}",
                },
            )
        )

    candidates.sort(key=lambda item: (item[0], item[1], item[2]))
    return {
        "keyword": keyword,
        "items": [candidate[3] for candidate in candidates[:max_items]],
    }


@router.get("/search/trending")
def trending(
    user=Depends(get_current_user), db: Session = Depends(get_db)
) -> list[dict]:
    tags = sorted(visible_tags(db), key=lambda tag: tag.weekly_count, reverse=True)
    return [
        {"keyword": tag.name, "count": tag.weekly_count} for tag in tags[:8]
    ]


@router.get("/search")
def search(
    q: str | None = None,
    type: str | None = None,
    sort: str | None = None,
    page: str | None = None,
    pageSize: str | None = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    keyword = (q or "").strip()
    normalized = keyword.lower()
    search_type = _read_type(type)
    search_sort = _read_sort(sort)
    requested_page = max(1, coerce_int(page, 1))
    requested_page_size = min(20, max(1, coerce_int(pageSize, 8)))
    preview_size = 4

    question_scores = question_score_map(db)
    tag_counts = tag_follower_count_map(db)

    matched_questions = [
        item
        for item in all_public_questions(db)
        if normalized and normalized in question_search_text(item)
    ]
    if search_sort == "newest":
        matched_questions.sort(key=lambda item: item.created_at, reverse=True)
    else:
        matched_questions.sort(key=lambda item: item.last_activity_at, reverse=True)
        matched_questions.sort(
            key=lambda item: (
                0 if normalized in item.title.lower() else 1,
                -(item.base_score + question_scores.get(item.id, 0)),
            )
        )

    matched_tags = [
        tag
        for tag in visible_tags(db)
        if normalized and normalized in tag_search_text(tag)
    ]
    matched_tags.sort(key=lambda tag: tag.base_question_count, reverse=True)

    active_users = list(
        db.scalars(select(User).where(User.status == "active")).all()
    )
    matched_profiles = [
        profile
        for profile in active_users
        if normalized and normalized in user_search_text(db, profile)
    ]
    if search_sort == "newest":
        matched_profiles.sort(key=lambda profile: profile.joined_at, reverse=True)
    else:
        matched_profiles.sort(key=lambda profile: profile.reputation, reverse=True)

    # Projects and columns are not part of the implemented slice; their counts
    # and result arrays stay empty, matching the frontend shape.
    matched_projects: list = []
    matched_columns: list = []

    matched_question_payloads = [
        question_summary(item, question_scores, tag_counts)
        for item in matched_questions
    ]
    matched_tag_payloads = [tag_payload(tag, tag_counts) for tag in matched_tags]
    matched_user_payloads = [search_user(profile) for profile in matched_profiles]

    counts = {
        "questions": len(matched_question_payloads),
        "projects": len(matched_projects),
        "columns": len(matched_columns),
        "tags": len(matched_tag_payloads),
        "users": len(matched_user_payloads),
    }
    if search_type == "all":
        total = sum(counts.values())
        current_page = 1
        page_size = preview_size
    else:
        total = counts[search_type]
        page_size = requested_page_size
        if total == 0:
            current_page = 1
        else:
            max_page = max(1, (total + page_size - 1) // page_size)
            current_page = min(requested_page, max_page)

    output = {
        "keyword": keyword,
        "type": search_type,
        "sort": search_sort,
        "page": current_page,
        "pageSize": page_size,
        "total": total,
        "counts": counts,
        "questions": [],
        "projects": [],
        "columns": [],
        "tags": [],
        "users": [],
    }

    start = (current_page - 1) * page_size
    if search_type == "all":
        output["questions"] = matched_question_payloads[:preview_size]
        output["projects"] = matched_projects[:preview_size]
        output["columns"] = matched_columns[:preview_size]
        output["tags"] = matched_tag_payloads[:preview_size]
        output["users"] = matched_user_payloads[:preview_size]
    elif search_type == "questions":
        output["questions"] = matched_question_payloads[start : start + page_size]
    elif search_type == "projects":
        output["projects"] = matched_projects[start : start + page_size]
    elif search_type == "columns":
        output["columns"] = matched_columns[start : start + page_size]
    elif search_type == "tags":
        output["tags"] = matched_tag_payloads[start : start + page_size]
    else:
        output["users"] = matched_user_payloads[start : start + page_size]

    return output
