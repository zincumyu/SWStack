"""Community overview and the project board flag."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_overview_shape(client: TestClient) -> None:
    response = client.get("/api/community/overview")
    assert response.status_code == 200
    payload = response.json()

    stats = payload["stats"]
    assert stats["questionCount"] > 0
    assert stats["answerCount"] > 0
    assert stats["developerCount"] >= 12
    assert 0 <= stats["solvedRate"] <= 100
    assert stats["todayQuestionCount"] >= 0
    assert stats["onlineCount"] > 0

    assert 0 < len(payload["popularTags"]) <= 6
    tag = payload["popularTags"][0]
    assert set(tag) == {
        "slug",
        "name",
        "description",
        "questionCount",
        "weeklyCount",
        "followerCount",
    }
    weekly = [tag["weeklyCount"] for tag in payload["popularTags"]]
    assert weekly == sorted(weekly, reverse=True)

    assert payload["topMembers"]
    member = payload["topMembers"][0]
    assert set(member) == {"user", "weeklyScore", "topTag"}
    assert {"id", "name", "handle", "reputation", "avatarColor", "title"} <= set(
        member["user"]
    )


def test_overview_counts_include_new_questions(client: TestClient, login) -> None:
    login(client)
    before = client.get("/api/community/overview").json()["stats"]["questionCount"]
    created = client.post(
        "/api/questions",
        json={
            "title": "概览计数是否需要包含新问题",
            "body": "提交后概览里的问题数应该加一, 这样侧边栏统计才不会停在旧值.",
            "tags": ["vue3"],
        },
    )
    assert created.status_code == 200
    after = client.get("/api/community/overview").json()["stats"]["questionCount"]
    assert after == before + 1


def test_project_board_reports_closed(client: TestClient) -> None:
    response = client.get("/api/projects/board")
    assert response.status_code == 200
    assert response.json() == {"enabled": False}
