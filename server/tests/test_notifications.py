"""Notification endpoints for the implemented slice."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _unread(client: TestClient) -> int:
    return client.get("/api/notifications/unread-count").json()["unread"]


def test_notifications_require_login(client: TestClient) -> None:
    assert client.get("/api/notifications").status_code == 401
    assert client.get("/api/notifications/unread-count").status_code == 401
    assert client.patch("/api/notifications/1", json={"read": True}).status_code == 401
    assert client.post("/api/notifications/read-all").status_code == 401


def test_seeded_notifications_and_pagination(client: TestClient, login) -> None:
    login(client)
    page = client.get("/api/notifications", params={"page": 1, "pageSize": 2}).json()
    assert page["total"] == 3
    assert page["page"] == 1
    assert page["pageSize"] == 2
    assert len(page["items"]) == 2
    created = [item["createdAt"] for item in page["items"]]
    assert created == sorted(created, reverse=True)

    second = client.get("/api/notifications", params={"page": 2, "pageSize": 2}).json()
    assert len(second["items"]) == 1


def test_unread_filter_and_mark_read(client: TestClient, login) -> None:
    login(client)
    assert _unread(client) == 2

    unread = client.get("/api/notifications", params={"filter": "unread"}).json()
    assert unread["total"] == 2
    assert all(not item["read"] for item in unread["items"])

    target = unread["items"][0]
    updated = client.patch(f"/api/notifications/{target['id']}", json={"read": True})
    assert updated.status_code == 200
    assert updated.json()["read"] is True
    assert _unread(client) == 1

    missing = client.patch("/api/notifications/999999", json={"read": True})
    assert missing.status_code == 404


def test_read_all(client: TestClient, login) -> None:
    login(client)
    result = client.post("/api/notifications/read-all")
    assert result.status_code == 200
    assert result.json()["updated"] == 2
    assert _unread(client) == 0
    assert client.get("/api/notifications", params={"filter": "unread"}).json()["total"] == 0


def test_answering_a_question_notifies_its_author(client: TestClient, login) -> None:
    login(client, email="admin@swstack.dev", password="admin123")
    # Question 101 belongs to zhouqi, not the admin answering it.
    before = client.get("/api/notifications/unread-count").json()["unread"]
    created = client.post(
        "/api/questions/101/answers",
        json={"body": "补充一个可复现的最小示例, 用来验证回答会触发通知."},
    )
    assert created.status_code == 200
    # The answerer does not get their own notification.
    assert client.get("/api/notifications/unread-count").json()["unread"] == before
