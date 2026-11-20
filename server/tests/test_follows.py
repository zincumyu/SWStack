from __future__ import annotations


def test_follow_status_requires_auth_and_returns_seeds(client, login):
    assert client.get("/api/me/follows").status_code == 401

    login(client)
    status = client.get("/api/me/follows").json()
    assert set(status["users"]) == {"luxing", "zhouqi", "hejia"}
    assert set(status["tags"]) == {"vue3", "typescript", "fastapi"}


def test_toggle_user_follow_and_unfollow(client, login):
    login(client)
    follow = client.post("/api/users/chenmo/follow")
    assert follow.status_code == 200
    assert follow.json() == {"following": True, "followerCount": 1181}
    assert "chenmo" in client.get("/api/me/follows").json()["users"]

    unfollow = client.post("/api/users/chenmo/follow")
    assert unfollow.status_code == 200
    assert unfollow.json() == {"following": False, "followerCount": 1180}
    assert "chenmo" not in client.get("/api/me/follows").json()["users"]


def test_toggle_existing_user_follow(client, login):
    login(client)
    unfollow = client.post("/api/users/zhouqi/follow")
    assert unfollow.json() == {"following": False, "followerCount": 1420}
    follow = client.post("/api/users/zhouqi/follow")
    assert follow.json() == {"following": True, "followerCount": 1421}


def test_user_follow_validation(client, login):
    login(client)
    self_follow = client.post("/api/users/suhe/follow")
    assert self_follow.status_code == 422
    assert self_follow.json()["detail"] == "不能关注自己"

    missing = client.post("/api/users/nobody/follow")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "没有找到这个开发者"

    assert client.post("/api/users/suhe/follow").status_code == 422


def test_toggle_tag_follow_and_feed_visibility(client, login):
    login(client)
    follow = client.post("/api/tags/react/follow")
    assert follow.status_code == 200
    assert follow.json() == {"following": True, "followerCount": 2871}
    assert "react" in client.get("/api/me/follows").json()["tags"]

    feed = client.get("/api/feed/following").json()
    assert any(item["id"] == "question-108" for item in feed["items"])

    unfollow = client.post("/api/tags/react/follow")
    assert unfollow.json() == {"following": False, "followerCount": 2870}
    feed = client.get("/api/feed/following").json()
    assert all(item["id"] != "question-108" for item in feed["items"])

    missing = client.post("/api/tags/nope/follow")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "没有找到这个标签"


def test_following_feed_default_items_and_uniqueness(client, login):
    assert client.get("/api/feed/following").status_code == 401

    login(client)
    feed = client.get("/api/feed/following").json()
    assert feed["total"] == 7
    assert feed["page"] == 1
    assert feed["pageSize"] == 12
    ids = [item["id"] for item in feed["items"]]
    assert ids == [
        "question-101", "question-102", "question-103", "question-104",
        "question-109", "question-111", "question-112",
    ]
    assert len(ids) == len(set(ids))
    for item in feed["items"]:
        assert item["type"] == "question"
        assert item["createdAt"].endswith("Z")
        assert item["question"]["id"] == int(item["id"].split("-")[1])


def test_following_feed_pagination_clamps(client, login):
    login(client)
    page_two = client.get(
        "/api/feed/following", params={"page": 2, "pageSize": 2}
    ).json()
    assert page_two["page"] == 2
    assert page_two["pageSize"] == 2
    assert [item["id"] for item in page_two["items"]] == [
        "question-103", "question-104",
    ]

    last_page = client.get(
        "/api/feed/following", params={"page": 99, "pageSize": 2}
    ).json()
    assert last_page["page"] == 4
    assert [item["id"] for item in last_page["items"]] == ["question-112"]

    large = client.get(
        "/api/feed/following", params={"pageSize": 100}
    ).json()
    assert large["pageSize"] == 24


def test_following_feed_updates_when_following_a_new_user(client, login):
    login(client)
    before = client.get("/api/feed/following").json()
    assert all(item["id"] != "question-108" for item in before["items"])

    client.post("/api/users/guyan/follow")
    after = client.get("/api/feed/following").json()
    assert after["total"] == before["total"] + 1
    assert any(item["id"] == "question-108" for item in after["items"])
    assert [item["id"] for item in after["items"]][0] == "question-101"
