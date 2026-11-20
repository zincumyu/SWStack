from __future__ import annotations


def test_tags_are_public_and_sorted_by_question_count(client):
    response = client.get("/api/tags")
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) == 12
    assert tags[0]["slug"] == "javascript"
    assert tags[0]["questionCount"] == 6732
    assert tags[0]["weeklyCount"] == 126

    by_slug = {tag["slug"]: tag for tag in tags}
    assert set(by_slug) == {
        "javascript", "typescript", "vue3", "react", "python", "fastapi",
        "golang", "rust", "sql", "docker", "git", "algorithm",
    }
    assert set(tags[0]) == {
        "slug", "name", "description", "questionCount", "weeklyCount", "followerCount",
    }
    # The seeded student follows these three tags, so each count is +1.
    assert by_slug["vue3"]["followerCount"] == 3241
    assert by_slug["typescript"]["followerCount"] == 3911
    assert by_slug["fastapi"]["followerCount"] == 1421
    assert by_slug["react"]["followerCount"] == 2870


def test_users_directory_is_public_and_sorted_by_reputation(client):
    response = client.get("/api/users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 12
    assert users[0]["handle"] == "luxing"
    assert users[0]["reputation"] == 12480

    by_handle = {user["handle"]: user for user in users}
    expected = {
        "id", "name", "handle", "reputation", "avatarColor", "title",
        "bio", "location", "school", "joinedAt", "questionCount",
        "answerCount", "viewCount", "followerCount", "followingCount",
        "topTags", "badges", "recentQuestions",
    }
    assert set(by_handle["luxing"]) == expected
    # The seeded student follows luxing.
    assert by_handle["luxing"]["followerCount"] == 1861
    assert by_handle["suhe"]["followingCount"] == 3
    assert by_handle["suhe"]["followerCount"] == 870
    assert {tag["slug"] for tag in by_handle["luxing"]["topTags"]} == {
        "vue3", "typescript", "javascript",
    }
    assert by_handle["luxing"]["badges"][0]["label"] == "年度贡献者"


def test_user_profile_detail(client):
    response = client.get("/api/users/luxing")
    assert response.status_code == 200
    profile = response.json()
    assert profile["handle"] == "luxing"
    assert profile["location"] == "杭州"
    assert profile["school"] == "计算机科学与技术"
    assert profile["questionCount"] == 48
    assert profile["answerCount"] == 126
    assert profile["followerCount"] == 1861
    assert len(profile["recentQuestions"]) == 1
    assert profile["recentQuestions"][0]["id"] == 112
    assert len(profile["topTags"]) == 3
    assert "description" in profile["topTags"][0]


def test_user_profile_feeds_and_unknown_handle(client, login):
    login(client)
    suhe = client.get("/api/users/suhe").json()
    recent_ids = {item["id"] for item in suhe["recentQuestions"]}
    assert recent_ids == {105}

    missing = client.get("/api/users/nobody")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "没有找到这个开发者"
