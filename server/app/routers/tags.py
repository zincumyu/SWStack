"""Public tag directory."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..security import get_db
from ..serializers import tag_follower_count_map, tag_payload
from ..services import visible_tags

router = APIRouter(prefix="/api", tags=["tags"])


@router.get("/tags")
def list_tags(db: Session = Depends(get_db)) -> list[dict]:
    counts = tag_follower_count_map(db)
    tags = sorted(
        visible_tags(db), key=lambda tag: tag.base_question_count, reverse=True
    )
    return [tag_payload(tag, counts) for tag in tags]
