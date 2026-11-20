from __future__ import annotations


def test_health_is_public(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_guest_session_me_is_401(client):
    response = client.get("/api/session/me")
    assert response.status_code == 401
    assert isinstance(response.json()["detail"], str)
    assert response.json()["detail"] == "请先登录"


def test_login_validation_error_is_string_detail(client):
    response = client.post("/api/auth/login", json={"email": ""})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
    assert "缺少必填字段" in response.json()["detail"]

    response = client.post(
        "/api/auth/login", json={"email": "", "password": "", "remember": False}
    )
    assert response.status_code == 422
    assert response.json()["detail"] == "请输入邮箱和密码"


def test_login_rejects_bad_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "student@swstack.dev",
            "password": "wrong-password",
            "remember": False,
        },
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "邮箱或密码错误"


def test_admin_login_and_session_cookie(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "ADMIN@SWSTACK.DEV",
            "password": "admin123",
            "remember": True,
        },
    )
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["id"] == 1
    assert user["handle"] == "luxing"
    assert user["role"] == "admin"
    assert user["canWriteColumns"] is True

    cookie = response.headers["set-cookie"]
    assert "swstack_session=" in cookie
    assert "HttpOnly" in cookie
    assert "Max-Age=" in cookie
    assert "SameSite=lax" in cookie

    me = client.get("/api/session/me")
    assert me.status_code == 200
    assert me.json()["handle"] == "luxing"


def test_student_login_is_member_and_session_cookie_is_browser_scoped(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "student@swstack.dev",
            "password": "student123",
            "remember": False,
        },
    )
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["id"] == 6
    assert user["role"] == "member"
    assert user["canWriteColumns"] is False
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie
    assert "Max-Age=" not in cookie


def test_logout_clears_session(client, login):
    login(client)
    assert client.get("/api/session/me").status_code == 200

    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert client.get("/api/session/me").status_code == 401

    # Logout is idempotent for guests, matching the mock.
    assert client.post("/api/auth/logout").status_code == 200


def test_login_seed_permissions(client, login):
    admin = login(client, "admin@swstack.dev", "admin123")
    assert admin["canWriteColumns"] is True
    client.post("/api/auth/logout")

    student = login(client)
    assert student["canWriteColumns"] is False
