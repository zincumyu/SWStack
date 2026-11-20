from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import create_app
from app.models import Tag


def test_in_memory_database_serves_requests() -> None:
    app = create_app("sqlite:///:memory:")

    with TestClient(app) as client:
        response = client.get("/api/questions")

    assert response.status_code == 200
    assert response.json()["total"] == 12


def test_creating_content_updates_public_counts(client, login) -> None:
    before_profile = client.get("/api/users/suhe").json()
    before_tags = {tag["slug"]: tag for tag in client.get("/api/tags").json()}

    login(client)
    created = client.post(
        "/api/questions",
        json={
            "title": "如何验证聚合计数会同步更新",
            "body": "这是一段足够长的问题正文, 用来验证作者和标签的问题计数会同步更新.",
            "tags": ["vue3"],
        },
    )
    assert created.status_code == 200

    after_profile = client.get("/api/users/suhe").json()
    after_tags = {tag["slug"]: tag for tag in client.get("/api/tags").json()}
    assert after_profile["questionCount"] == before_profile["questionCount"] + 1
    assert after_tags["vue3"]["questionCount"] == before_tags["vue3"]["questionCount"] + 1
    assert after_tags["vue3"]["weeklyCount"] == before_tags["vue3"]["weeklyCount"] + 1

    before_answer_count = after_profile["answerCount"]
    answer = client.post(
        "/api/questions/101/answers",
        json={"body": "这是一条足够长的测试回答, 用于验证回答计数同步更新."},
    )
    assert answer.status_code == 200
    answer_profile = client.get("/api/users/suhe").json()
    assert answer_profile["answerCount"] == before_answer_count + 1


def test_following_feed_ignores_hidden_tags(client, login) -> None:
    login(client)
    before = client.get("/api/feed/following", params={"pageSize": 24}).json()
    assert any(item["id"] == "question-109" for item in before["items"])

    with client.app.state.session_factory() as db:
        tag = db.scalar(select(Tag).where(Tag.slug == "vue3"))
        assert tag is not None
        tag.status = "hidden"
        db.commit()

    after = client.get("/api/feed/following", params={"pageSize": 24}).json()
    assert all(item["id"] != "question-109" for item in after["items"])


def test_huge_notification_page_is_clamped(client, login) -> None:
    login(client)

    response = client.get(
        "/api/notifications",
        params={"page": "999999999999999999999999", "pageSize": 10},
    )

    assert response.status_code == 200
    assert response.json()["page"] == 1_000_000
    assert response.json()["items"] == []
