from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(tmp_path):
    database_url = f"sqlite:///{(tmp_path / 'swstack-test.db').as_posix()}"
    app = create_app(database_url)
    with TestClient(app) as test_client:
        yield test_client
    app.state.engine.dispose()


@pytest.fixture
def login():
    def _login(
        client: TestClient,
        email: str = "student@swstack.dev",
        password: str = "student123",
        remember: bool = True,
    ) -> dict:
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password, "remember": remember},
        )
        assert response.status_code == 200, response.text
        return response.json()["user"]

    return _login
