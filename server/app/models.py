"""Database models for the minimum SWStack backend loop."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


question_tags = Table(
    "question_tags",
    Base.metadata,
    Column(
        "question_id",
        ForeignKey("questions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Column("position", Integer, nullable=False, default=0),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    handle: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    reputation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avatar_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#3f6273")
    title: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    can_write_columns: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    location: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    school: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    profile_question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    profile_answer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    base_follower_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # JSON encoded lists. Keeping them in text columns avoids extra tables for
    # presentation-only profile fields.
    top_tags_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    badges_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    base_question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    weekly_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    base_follower_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    base_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="published")
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped[User] = relationship(foreign_keys=[author_id], lazy="joined")
    tags: Mapped[list[Tag]] = relationship(
        secondary=question_tags,
        order_by=question_tags.c.position,
        lazy="selectin",
    )
    answers: Mapped[list["Answer"]] = relationship(
        order_by="Answer.id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    comments: Mapped[list["QuestionComment"]] = relationship(
        order_by="QuestionComment.id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    base_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped[User] = relationship(foreign_keys=[author_id], lazy="joined")
    comments: Mapped[list["AnswerComment"]] = relationship(
        order_by="AnswerComment.id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class QuestionComment(Base):
    __tablename__ = "question_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped[User] = relationship(foreign_keys=[author_id], lazy="joined")


class AnswerComment(Base):
    __tablename__ = "answer_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    answer_id: Mapped[int] = mapped_column(ForeignKey("answers.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped[User] = relationship(foreign_keys=[author_id], lazy="joined")


class QuestionVote(Base):
    __tablename__ = "question_votes"
    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_question_vote"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class AnswerVote(Base):
    __tablename__ = "answer_votes"
    __table_args__ = (UniqueConstraint("user_id", "answer_id", name="uq_answer_vote"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    answer_id: Mapped[int] = mapped_column(ForeignKey("answers.id"), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_bookmark"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), nullable=False)


class UserFollow(Base):
    __tablename__ = "user_follows"
    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="uq_user_follow"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    followed_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)


class TagFollow(Base):
    __tablename__ = "tag_follows"
    __table_args__ = (UniqueConstraint("user_id", "tag_id", name="uq_tag_follow"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    link: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AppSession(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped[User] = relationship(lazy="joined")


__all__ = [
    "Answer",
    "AnswerComment",
    "AnswerVote",
    "AppSession",
    "Base",
    "Bookmark",
    "Notification",
    "Question",
    "QuestionComment",
    "QuestionVote",
    "Tag",
    "TagFollow",
    "User",
    "UserFollow",
    "utcnow",
]
