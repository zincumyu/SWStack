"""Question list/detail, ask, voting, bookmarks and answers."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..models import (
    Answer,
    AnswerVote,
    Bookmark,
    Question,
    QuestionVote,
    Tag,
    utcnow,
)
from ..schemas import BookmarkInput, CreateAnswerInput, CreateQuestionInput, VoteInput
from ..security import get_current_user, get_db, get_optional_user
from .notifications import notify
from ..serializers import (
    answer_payload,
    answer_score_map,
    question_detail,
    question_score_map,
    question_summary,
    tag_follower_count_map,
)
from ..services import (
    all_public_questions,
    coerce_int,
    get_public_question,
    make_excerpt,
    question_search_text,
    related_for_question,
    viewer_answer_vote_map,
    viewer_bookmarked,
    viewer_question_vote,
)

router = APIRouter(prefix="/api", tags=["questions"])


def _validate_vote(value: int) -> int:
    if value not in (-1, 0, 1):
        raise HTTPException(status_code=422, detail="投票值必须是 -1, 0 或 1")
    return value


@router.get("/questions")
def list_questions(
    page: str | None = None,
    pageSize: str | None = None,
    sort: str | None = None,
    tag: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    requested_page = max(1, coerce_int(page, 1))
    page_size = min(30, max(1, coerce_int(pageSize, 8)))
    keyword = (q or "").strip()
    tag_slug = (tag or "").strip()

    items = [
        question
        for question in all_public_questions(db)
        if (not tag_slug or any(item.slug == tag_slug for item in question.tags))
        and (not keyword or keyword.lower() in question_search_text(question))
    ]

    if sort == "unanswered":
        items = [question for question in items if not question.answers]

    question_scores = question_score_map(db)
    if sort == "votes":
        items.sort(
            key=lambda item: -(item.base_score + question_scores.get(item.id, 0))
        )
    elif sort == "active":
        items.sort(key=lambda item: item.last_activity_at, reverse=True)
    else:
        items.sort(key=lambda item: item.created_at, reverse=True)

    total = len(items)
    start = (requested_page - 1) * page_size
    tag_counts = tag_follower_count_map(db)
    return {
        "items": [
            question_summary(question, question_scores, tag_counts)
            for question in items[start : start + page_size]
        ],
        "total": total,
        "page": requested_page,
        "pageSize": page_size,
    }


@router.get("/questions/{question_id}")
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
) -> dict:
    question = get_public_question(db, question_id)
    db.execute(
        update(Question)
        .where(Question.id == question.id)
        .values(view_count=Question.view_count + 1)
        .execution_options(synchronize_session=False)
    )
    db.commit()
    db.refresh(question)

    question_scores = question_score_map(db)
    answer_scores = answer_score_map(db)
    tag_counts = tag_follower_count_map(db)
    viewer_vote = 0
    bookmarked = False
    answer_votes: dict[int, int] = {}
    if user is not None:
        viewer_vote = viewer_question_vote(db, user.id, question.id)
        bookmarked = viewer_bookmarked(db, user.id, question.id)
        answer_votes = viewer_answer_vote_map(db, user.id, question.id)

    return question_detail(
        question,
        question_scores,
        answer_scores,
        tag_counts,
        viewer_vote=viewer_vote,
        bookmarked=bookmarked,
        answer_viewer_votes=answer_votes,
        related=related_for_question(db, question, question_scores, tag_counts),
    )


@router.post("/questions")
def create_question(
    payload: CreateQuestionInput,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    title = payload.title.strip()
    body = payload.body.strip()
    requested_tags = [tag.strip() for tag in payload.tags if tag.strip()]

    if len(title) < 8:
        raise HTTPException(status_code=422, detail="标题至少需要 8 个字符")
    if len(body) < 20:
        raise HTTPException(status_code=422, detail="问题描述至少需要 20 个字符")
    if not requested_tags:
        raise HTTPException(status_code=422, detail="请至少添加一个标签")

    selected_tags: list[Tag] = []
    seen_slugs: set[str] = set()
    for slug in requested_tags[:5]:
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        tag = db.scalar(select(Tag).where(Tag.slug == slug))
        if tag is None:
            # The mock accepts free-form tag slugs on questions without adding
            # them to the public tag directory; a hidden row gives us the same
            # behavior while keeping a relational tag reference.
            tag = Tag(
                slug=slug,
                name=slug,
                description="",
                base_question_count=0,
                weekly_count=0,
                base_follower_count=0,
                status="hidden",
            )
            db.add(tag)
            db.flush()
        selected_tags.append(tag)

    timestamp = utcnow()
    question = Question(
        title=title,
        excerpt=make_excerpt(body),
        body=body,
        base_score=0,
        view_count=1,
        is_featured=False,
        status="published",
        author_id=user.id,
        created_at=timestamp,
        last_activity_at=timestamp,
        tags=selected_tags,
    )
    user.profile_question_count += 1
    for tag in selected_tags:
        tag.base_question_count += 1
        tag.weekly_count += 1

    db.add(question)
    db.commit()

    question_scores = question_score_map(db)
    tag_counts = tag_follower_count_map(db)
    return question_summary(question, question_scores, tag_counts)


@router.post("/questions/{question_id}/vote")
def vote_question(
    question_id: int,
    payload: VoteInput,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    value = _validate_vote(payload.value)
    question = get_public_question(db, question_id)

    vote = db.scalar(
        select(QuestionVote).where(
            QuestionVote.user_id == user.id,
            QuestionVote.question_id == question.id,
        )
    )
    if value == 0:
        if vote is not None:
            db.delete(vote)
    elif vote is None:
        db.add(QuestionVote(user_id=user.id, question_id=question.id, value=value))
    else:
        vote.value = value
    db.commit()

    score = question.base_score
    rows = db.execute(
        select(QuestionVote.value).where(QuestionVote.question_id == question.id)
    ).all()
    score += sum(int(row[0]) for row in rows)
    return {"score": score, "viewerVote": value}


@router.post("/questions/{question_id}/bookmark")
def bookmark_question(
    question_id: int,
    payload: BookmarkInput | None = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    question = get_public_question(db, question_id)
    existing = db.scalar(
        select(Bookmark).where(
            Bookmark.user_id == user.id,
            Bookmark.question_id == question.id,
        )
    )
    if payload is not None and payload.bookmarked is not None:
        desired = payload.bookmarked
    else:
        desired = existing is None

    if desired and existing is None:
        db.add(Bookmark(user_id=user.id, question_id=question.id))
    elif not desired and existing is not None:
        db.delete(existing)
    db.commit()
    return {"bookmarked": desired}


@router.post("/questions/{question_id}/answers")
def create_answer(
    question_id: int,
    payload: CreateAnswerInput,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    question = get_public_question(db, question_id)
    body = payload.body.strip()
    if len(body) < 20:
        raise HTTPException(status_code=422, detail="回答至少需要 20 个字符")

    timestamp = utcnow()
    answer = Answer(
        question_id=question.id,
        body=body,
        base_score=0,
        accepted=False,
        author_id=user.id,
        created_at=timestamp,
    )
    db.add(answer)
    user.profile_answer_count += 1
    question.last_activity_at = timestamp
    if question.author_id != user.id:
        notify(
            db,
            question.author_id,
            type="question_answered",
            title="你的问题收到新回答",
            body=f"{user.name} 回答了你的问题: {question.title}.",
            link=f"/questions/{question.id}",
            created_at=timestamp,
        )
    db.commit()

    return answer_payload(answer, answer_score_map(db))


@router.post("/answers/{answer_id}/vote")
def vote_answer(
    answer_id: int,
    payload: VoteInput,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    value = _validate_vote(payload.value)
    answer = db.get(Answer, answer_id)
    if answer is None:
        raise HTTPException(status_code=404, detail="没有找到这个回答")
    parent = db.get(Question, answer.question_id)
    if parent is None or parent.status != "published":
        raise HTTPException(status_code=404, detail="没有找到这个回答")

    vote = db.scalar(
        select(AnswerVote).where(
            AnswerVote.user_id == user.id,
            AnswerVote.answer_id == answer.id,
        )
    )
    if value == 0:
        if vote is not None:
            db.delete(vote)
    elif vote is None:
        db.add(AnswerVote(user_id=user.id, answer_id=answer.id, value=value))
    else:
        vote.value = value
    db.commit()

    rows = db.execute(
        select(AnswerVote.value).where(AnswerVote.answer_id == answer.id)
    ).all()
    score = answer.base_score + sum(int(row[0]) for row in rows)
    return {"score": score, "viewerVote": value}
