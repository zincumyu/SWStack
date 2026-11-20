from __future__ import annotations

QUESTION_SUMMARY_KEYS = {
    "id",
    "title",
    "excerpt",
    "score",
    "answerCount",
    "viewCount",
    "hasAcceptedAnswer",
    "isFeatured",
    "tags",
    "author",
    "createdAt",
    "lastActivityAt",
}


def test_question_list_shape_and_default_pagination(client):
    body = client.get("/api/questions").json()
    assert set(body) == {"items", "total", "page", "pageSize"}
    assert body["total"] == 12
    assert body["page"] == 1
    assert body["pageSize"] == 8
    assert len(body["items"]) == 8
    first = body["items"][0]
    assert set(first) == QUESTION_SUMMARY_KEYS
    assert first["id"] == 101
    assert first["author"]["handle"] == "zhouqi"
    assert first["answerCount"] == 2
    assert first["hasAcceptedAnswer"] is True
    assert {tag["slug"] for tag in first["tags"]} == {"vue3", "typescript"}
    assert set(first["tags"][0]) == {"slug", "name"}


def test_question_list_sorting(client):
    votes = client.get("/api/questions", params={"sort": "votes"}).json()
    assert [item["id"] for item in votes["items"][:3]] == [101, 110, 104]

    newest = client.get("/api/questions", params={"sort": "newest"}).json()
    assert [item["id"] for item in newest["items"][:3]] == [101, 102, 103]

    active = client.get("/api/questions", params={"sort": "active"}).json()
    assert active["items"][0]["id"] == 101
    assert active["items"][1]["id"] == 110

    unanswered = client.get(
        "/api/questions", params={"sort": "unanswered"}
    ).json()
    assert unanswered["total"] == 1
    assert unanswered["items"][0]["id"] == 107
    assert unanswered["items"][0]["answerCount"] == 0


def test_question_list_filters_and_pagination(client):
    vue = client.get("/api/questions", params={"tag": "vue3"}).json()
    assert {item["id"] for item in vue["items"]} == {101, 109}

    typescript = client.get(
        "/api/questions", params={"tag": "typescript"}
    ).json()
    assert {item["id"] for item in typescript["items"]} == {101, 103}

    keyword = client.get("/api/questions", params={"q": "aiohttp"}).json()
    assert keyword["total"] == 1
    assert keyword["items"][0]["id"] == 111

    chinese = client.get(
        "/api/questions", params={"q": "二分查找"}
    ).json()
    assert {item["id"] for item in chinese["items"]} == {112}

    page_two = client.get(
        "/api/questions", params={"page": 2, "pageSize": 5}
    ).json()
    assert page_two["total"] == 12
    assert page_two["page"] == 2
    assert page_two["pageSize"] == 5
    assert len(page_two["items"]) == 5
    assert [item["id"] for item in page_two["items"]] == [106, 107, 108, 109, 110]

    clamped = client.get("/api/questions", params={"pageSize": 100}).json()
    assert clamped["pageSize"] == 30
    assert len(clamped["items"]) == 12

    fallback = client.get(
        "/api/questions", params={"page": "not-a-number", "sort": "unknown"}
    ).json()
    assert fallback["page"] == 1
    assert fallback["items"][0]["id"] == 101


def test_question_detail_and_view_count(client):
    first = client.get("/api/questions/101")
    assert first.status_code == 200
    detail = first.json()
    assert "body" in detail and "related" in detail and "answersList" in detail
    assert detail["viewCount"] == 1821
    assert detail["viewerVote"] == 0
    assert detail["bookmarked"] is False
    assert detail["answerCount"] == 2
    assert len(detail["answersList"]) == 2
    assert detail["answersList"][0]["accepted"] is True
    assert detail["answersList"][0]["score"] == 36
    assert detail["answersList"][0]["comments"][0]["body"].startswith("第二段")
    assert len(detail["comments"]) == 2
    assert all(item["id"] != 101 for item in detail["related"])
    assert any(item["id"] == 109 for item in detail["related"])

    second = client.get("/api/questions/101").json()
    assert second["viewCount"] == 1822

    missing = client.get("/api/questions/999")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "没有找到这个问题"


def test_admin_seeded_bookmark_is_visible(client, login):
    login(client, "admin@swstack.dev", "admin123")
    detail = client.get("/api/questions/102").json()
    assert detail["bookmarked"] is True


def test_create_question_validation_and_success(client, login):
    guest = client.post(
        "/api/questions",
        json={"title": "Valid enough title", "body": "x" * 30, "tags": ["vue3"]},
    )
    assert guest.status_code == 401

    login(client)
    short_title = client.post(
        "/api/questions",
        json={"title": "bad", "body": "x" * 30, "tags": ["vue3"]},
    )
    assert short_title.status_code == 422
    assert short_title.json()["detail"] == "标题至少需要 8 个字符"

    short_body = client.post(
        "/api/questions",
        json={"title": "A sufficiently long title", "body": "short", "tags": ["vue3"]},
    )
    assert short_body.status_code == 422
    assert short_body.json()["detail"] == "问题描述至少需要 20 个字符"

    no_tags = client.post(
        "/api/questions",
        json={
            "title": "A sufficiently long title",
            "body": "This body is definitely longer than twenty characters.",
            "tags": [],
        },
    )
    assert no_tags.status_code == 422
    assert no_tags.json()["detail"] == "请至少添加一个标签"

    created = client.post(
        "/api/questions",
        json={
            "title": "如何用 FastAPI 实现分页接口",
            "body": "我正在实现一个分页接口, 需要返回 items, total, page 和 pageSize 字段.",
            "tags": ["fastapi", "custom-topic"],
        },
    )
    assert created.status_code == 200
    question = created.json()
    assert question["id"] == 113
    assert question["author"]["handle"] == "suhe"
    assert question["score"] == 0
    assert question["viewCount"] == 1
    assert question["answerCount"] == 0
    assert {tag["slug"] for tag in question["tags"]} == {"fastapi", "custom-topic"}

    by_tag = client.get("/api/questions", params={"tag": "custom-topic"}).json()
    assert by_tag["total"] == 1
    assert by_tag["items"][0]["id"] == 113

    tags = client.get("/api/tags").json()
    assert "custom-topic" not in {tag["slug"] for tag in tags}

    detail = client.get("/api/questions/113").json()
    assert "分页接口" in detail["body"]
    assert any(
        tag == {"slug": "custom-topic", "name": "custom-topic"}
        for tag in detail["tags"]
    )


def test_create_question_truncates_tags_to_five(client, login):
    login(client)
    response = client.post(
        "/api/questions",
        json={
            "title": "A question with many tags",
            "body": "This body is definitely longer than twenty characters.",
            "tags": ["vue3", "typescript", "fastapi", "python", "sql", "git"],
        },
    )
    assert response.status_code == 200
    assert len(response.json()["tags"]) == 5


def test_question_vote_requires_auth_and_updates_score(client, login):
    guest = client.post("/api/questions/101/vote", json={"value": 1})
    assert guest.status_code == 401

    login(client)
    up = client.post("/api/questions/101/vote", json={"value": 1})
    assert up.status_code == 200
    assert up.json() == {"score": 43, "viewerVote": 1}

    down = client.post("/api/questions/101/vote", json={"value": -1})
    assert down.status_code == 200
    assert down.json() == {"score": 41, "viewerVote": -1}

    cleared = client.post("/api/questions/101/vote", json={"value": 0})
    assert cleared.status_code == 200
    assert cleared.json() == {"score": 42, "viewerVote": 0}

    invalid = client.post("/api/questions/101/vote", json={"value": 5})
    assert invalid.status_code == 422
    assert invalid.json()["detail"] == "投票值必须是 -1, 0 或 1"

    client.post("/api/questions/101/vote", json={"value": 1})
    detail = client.get("/api/questions/101").json()
    assert detail["viewerVote"] == 1
    assert detail["score"] == 43


def test_question_bookmark_toggle(client, login):
    guest = client.post(
        "/api/questions/101/bookmark", json={"bookmarked": True}
    )
    assert guest.status_code == 401

    login(client)
    on = client.post("/api/questions/101/bookmark", json={"bookmarked": True})
    assert on.status_code == 200
    assert on.json() == {"bookmarked": True}
    assert client.get("/api/questions/101").json()["bookmarked"] is True

    off = client.post("/api/questions/101/bookmark", json={"bookmarked": False})
    assert off.json() == {"bookmarked": False}
    assert client.get("/api/questions/101").json()["bookmarked"] is False

    toggled = client.post("/api/questions/101/bookmark")
    assert toggled.status_code == 200
    assert toggled.json() == {"bookmarked": True}


def test_create_answer_and_vote(client, login):
    guest = client.post("/api/questions/101/answers", json={"body": "x" * 30})
    assert guest.status_code == 401

    login(client)
    short = client.post("/api/questions/101/answers", json={"body": "too short"})
    assert short.status_code == 422
    assert short.json()["detail"] == "回答至少需要 20 个字符"

    response = client.post(
        "/api/questions/101/answers",
        json={"body": "我通常会把这个组合式函数拆成更小的单元, 方便复用和测试."},
    )
    assert response.status_code == 200
    answer = response.json()
    assert answer["questionId"] == 101
    assert answer["author"]["handle"] == "suhe"
    assert answer["score"] == 0
    assert answer["viewerVote"] == 0
    assert answer["accepted"] is False
    assert answer["comments"] == []

    detail = client.get("/api/questions/101").json()
    assert detail["answerCount"] == 3
    assert detail["answersList"][-1]["id"] == answer["id"]

    up = client.post(f"/api/answers/{answer['id']}/vote", json={"value": 1})
    assert up.status_code == 200
    assert up.json() == {"score": 1, "viewerVote": 1}

    zero = client.post(f"/api/answers/{answer['id']}/vote", json={"value": 0})
    assert zero.json() == {"score": 0, "viewerVote": 0}

    invalid = client.post(f"/api/answers/{answer['id']}/vote", json={"value": 2})
    assert invalid.status_code == 422

    missing = client.post("/api/answers/9999/vote", json={"value": 1})
    assert missing.status_code == 404
    assert missing.json()["detail"] == "没有找到这个回答"


def test_vote_existing_answer(client, login):
    first_answer = client.get("/api/questions/101").json()["answersList"][0]
    login(client)
    response = client.post(
        f"/api/answers/{first_answer['id']}/vote", json={"value": 1}
    )
    assert response.status_code == 200
    assert response.json() == {"score": 37, "viewerVote": 1}
