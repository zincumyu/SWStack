"""Community overview for the sidebar cards.

Only the live numbers are computed from the database; the marketing-style
counters (solved rate, online count) mirror the mock seed so the page keeps the
same visual density.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Answer, Question, Tag, User
from ..security import get_db
from ..serializers import tag_follower_count_map, tag_payload, user_summary

router = APIRouter(prefix="/api", tags=["community"])

# Mirrors ``communityStats`` in src/mocks/data.ts for the counters that are not
# derivable from the seeded slice.
BASE_QUESTION_COUNT = 12482
BASE_ANSWER_COUNT = 38210
BASE_DEVELOPER_COUNT = 8604
SOLVED_RATE = 78
ONLINE_COUNT = 214

TOP_MEMBER_SCORES = [
    ("luxing", 860, "typescript"),
    ("hejia", 720, "golang"),
    ("chenmo", 640, "fastapi"),
    ("xuzhou", 580, "vue3"),
    ("linyi", 430, "rust"),
]


@router.get("/community/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    live_questions = db.scalar(select(func.count()).select_from(Question)) or 0
    live_answers = db.scalar(select(func.count()).select_from(Answer)) or 0
    live_users = db.scalar(select(func.count()).select_from(User)) or 0
    today_questions = db.scalar(
        select(func.count())
        .select_from(Question)
        .where(Question.created_at >= func.datetime("now", "-1 day"))
    ) or 0

    tag_counts = tag_follower_count_map(db)
    tags = list(db.scalars(select(Tag).where(Tag.status == "active")).all())
    popular = sorted(tags, key=lambda tag: tag.weekly_count, reverse=True)[:6]

    top_members = []
    for handle, weekly_score, top_tag in TOP_MEMBER_SCORES:
        user = db.scalar(select(User).where(User.handle == handle))
        if user is None or user.status != "active":
            continue
        top_members.append(
            {"user": user_summary(user), "weeklyScore": weekly_score, "topTag": top_tag}
        )

    return {
        "stats": {
            "questionCount": BASE_QUESTION_COUNT + int(live_questions),
            "answerCount": BASE_ANSWER_COUNT + int(live_answers),
            "developerCount": BASE_DEVELOPER_COUNT + int(live_users),
            "solvedRate": SOLVED_RATE,
            "todayQuestionCount": int(today_questions),
            "onlineCount": ONLINE_COUNT,
        },
        "popularTags": [tag_payload(tag, tag_counts) for tag in popular],
        "topMembers": top_members,
    }
