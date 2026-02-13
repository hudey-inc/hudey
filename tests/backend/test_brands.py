"""Brand API route tests."""

from unittest.mock import patch

R = "backend.api.routes.brands"


def test_get_my_brand(client, auth_brand):
    """GET /api/brands/me returns the authenticated brand."""
    res = client.get("/api/brands/me")
    assert res.status_code == 200
    assert res.json()["id"] == auth_brand["id"]
    assert res.json()["name"] == auth_brand["name"]


def test_update_my_brand(client, auth_brand):
    """PUT /api/brands/me updates brand fields."""
    updated = {**auth_brand, "name": "Updated Brand"}
    with patch(f"{R}.repo_update", return_value=updated):
        res = client.put("/api/brands/me", json={"name": "Updated Brand"})
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Brand"


def test_update_my_brand_empty_body(client):
    """PUT /api/brands/me returns 400 for empty body."""
    res = client.put("/api/brands/me", json={})
    assert res.status_code == 400


def test_update_my_brand_db_failure(client, auth_brand):
    """PUT /api/brands/me returns 500 when update fails."""
    with patch(f"{R}.repo_update", return_value=None):
        res = client.put("/api/brands/me", json={"name": "X"})
    assert res.status_code == 500
