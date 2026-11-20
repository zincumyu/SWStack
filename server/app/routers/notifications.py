"""In-app notifications for the implemented slice."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Notification, User
from ..security import get_current_user, get_db
from ..serializers import iso_z
from ..services import coerce_int

router = APIRouter(prefix="/api", tags=["notifications"])


def notification_payload(item: Notification) -> dict:
    return {
        "id": item.id,
        "type": item.type,
        "title": item.title,
        "body": item.body,
        "read": item.read,
        "createdAt": iso_z(item.created_at),
        "link": item.link,
    }


def notify(
    db: Session,
    user_id: int,
    *,
    type: str,
    title: str,
    body: str,
    link: str,
    created_at=None,
) -> Notification:
    """Queue a notification. Callers commit with their own transaction."""
    from ..models import utcnow

    item = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
        read=False,
        created_at=created_at or utcnow(),
    )
    db.add(item)
    return item


@router.get("/notifications")
def list_notifications(
    page: str | None = None,
    pageSize: str | None = None,
    filter: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    current_page = min(1_000_000, max(1, coerce_int(page, 1)))
    page_size = min(50, max(1, coerce_int(pageSize, 10)))
    unread_only = filter == "unread"

    statement = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        statement = statement.where(Notification.read.is_(False))
    total = db.scalar(
        select(func.count()).select_from(statement.subquery())
    ) or 0
    items = list(
        db.scalars(
            statement.order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset((current_page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return {
        "items": [notification_payload(item) for item in items],
        "total": int(total),
        "page": current_page,
        "pageSize": page_size,
    }


@router.get("/notifications/unread-count")
def unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    total = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.read.is_(False))
    ) or 0
    return {"unread": int(total)}


@router.patch("/notifications/{notification_id}")
def update_notification(
    notification_id: int,
    payload: dict | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    item = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="没有找到这条通知")
    desired = True
    if isinstance(payload, dict) and isinstance(payload.get("read"), bool):
        desired = payload["read"]
    item.read = desired
    db.commit()
    db.refresh(item)
    return notification_payload(item)


@router.post("/notifications/read-all")
def read_all(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    items = list(
        db.scalars(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.read.is_(False),
            )
        ).all()
    )
    for item in items:
        item.read = True
    db.commit()
    return {"updated": len(items)}
