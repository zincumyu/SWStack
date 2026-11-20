from __future__ import annotations


def test_search_endpoints_require_auth(client):
    for path in ("/api/search", "/api/search/suggest", "/api/search/trending"):
        response = client.get(path)
        assert response.status_code == 401
        assert response.json()["detail"] == "请先登录"


def test_search_all_preview_shape(client, login):
    login(client)
    response = client.get(
        "/api/search", params={"q": "vue", "type": "all"}
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "keyword", "type", "sort", "page", "pageSize", "total", "counts",
        "questions", "projects", "columns", "tags", "users",
    }
    assert body["keyword"] == "vue"
    assert body["type"] == "all"
    assert body["sort"] == "relevance"
    assert body["page"] == 1
    assert body["pageSize"] == 4
    assert body["counts"] == {
        "questions": 2, "projects": 0, "columns": 0, "tags": 1, "users": 3,
    }
    assert body["total"] == 6
    assert {item["id"] for item in body["questions"]} == {101, 109}
    assert [tag["slug"] for tag in body["tags"]] == ["vue3"]
    assert {user["handle"] for user in body["users"]} == {
        "luxing", "zhouqi", "tanyue",
    }
    assert body["projects"] == [] and body["columns"] == []
    search_user = body["users"][0]
    assert {"bio", "school", "questionCount", "answerCount"} <= set(search_user)


def test_search_specific_type_and_pagination(client, login):
    login(client)
    tags = client.get(
        "/api/search", params={"q": "type", "type": "tags"}
    ).json()
    assert tags["type"] == "tags"
    assert tags["total"] == 1
    assert tags["pageSize"] == 8
    assert [tag["slug"] for tag in tags["tags"]] == ["typescript"]
    assert tags["questions"] == [] and tags["users"] == []

    users = client.get(
        "/api/search", params={"q": "周其", "type": "users"}
    ).json()
    assert users["total"] == 1
    assert users["users"][0]["handle"] == "zhouqi"
    assert users["users"][0]["school"] == "软件工程"

    questions = client.get(
        "/api/search",
        params={"q": "FastAPI", "type": "questions", "pageSize": 1, "page": 2},
    ).json()
    assert questions["total"] == 2
    assert questions["page"] == 2
    assert questions["pageSize"] == 1
    assert len(questions["questions"]) == 1
    assert questions["questions"][0]["id"] == 111

    clamped = client.get(
        "/api/search",
        params={"q": "FastAPI", "type": "questions", "pageSize": 1, "page": 99},
    ).json()
    assert clamped["page"] == 2


def test_search_sort_and_invalid_parameters(client, login):
    login(client)
    newest = client.get(
        "/api/search", params={"q": "vue", "type": "questions", "sort": "newest"}
    ).json()
    assert newest["sort"] == "newest"
    assert [item["id"] for item in newest["questions"]] == [101, 109]
    created = [item["createdAt"] for item in newest["questions"]]
    assert created == sorted(created, reverse=True)

    invalid = client.get(
        "/api/search",
        params={"q": "vue", "type": "not-a-type", "sort": "not-a-sort"},
    ).json()
    assert invalid["type"] == "all"
    assert invalid["sort"] == "relevance"


def test_search_without_keyword_is_empty(client, login):
    login(client)
    body = client.get("/api/search").json()
    assert body["keyword"] == ""
    assert body["counts"] == {
        "questions": 0, "projects": 0, "columns": 0, "tags": 0, "users": 0,
    }
    assert body["total"] == 0
    assert body["questions"] == []
    assert body["tags"] == []
    assert body["users"] == []


def test_search_suggest(client, login):
    login(client)
    response = client.get("/api/search/suggest", params={"q": "vue"})
    assert response.status_code == 200
    body = response.json()
    assert body["keyword"] == "vue"
    assert 1 <= len(body["items"]) <= 8
    assert all(
        set(item) == {"kind", "label", "description", "target"}
        for item in body["items"]
    )
    assert {item["kind"] for item in body["items"]} <= {
        "question", "project", "column", "tag", "user",
    }
    assert body["items"][0]["kind"] == "question"
    assert body["items"][0]["target"] == "/questions/101"

    limited = client.get(
        "/api/search/suggest", params={"q": "vue", "limit": 2}
    ).json()
    assert len(limited["items"]) == 2

    empty = client.get("/api/search/suggest", params={"q": ""}).json()
    assert empty == {"keyword": "", "items": []}


def test_search_trending(client, login):
    login(client)
    response = client.get("/api/search/trending")
    assert response.status_code == 200
    trending = response.json()
    assert len(trending) == 8
    assert set(trending[0]) == {"keyword", "count"}
    assert trending[0] == {"keyword": "javascript", "count": 126}
    assert [item["count"] for item in trending] == sorted(
        [item["count"] for item in trending], reverse=True
    )
