"""Request bodies for the implemented slice."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: str
    password: str
    remember: bool = False


class CreateQuestionInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    body: str
    tags: list[str] = Field(default_factory=list)


class VoteInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    value: int


class BookmarkInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    bookmarked: bool | None = None


class CreateAnswerInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    body: str
