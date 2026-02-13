"""Notification API route tests."""

from unittest.mock import patch

R = "backend.api.routes.notifications"


def test_list_notifications(client, auth_brand):
    """GET /api/notifications returns brand's notifications."""
    notifs = [{"id": "n1", "brand_id": auth_brand["id"], "title": "Test", "is_read": False}]
    with patch(f"{R}.repo_list", return_value=notifs):
        res = client.get("/api/notifications")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_unread_count(client, auth_brand):
    """GET /api/notifications/unread-count returns count."""
    with patch(f"{R}.repo_count_unread", return_value=3):
        res = client.get("/api/notifications/unread-count")
    assert res.status_code == 200
    assert res.json()["count"] == 3


def test_mark_notification_read(client, auth_brand):
    """PUT /api/notifications/{id}/read marks as read."""
    with patch(f"{R}.repo_mark_read", return_value=True):
        res = client.put("/api/notifications/n1/read")
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_mark_notification_read_not_found(client, auth_brand):
    """PUT /api/notifications/{id}/read returns 404 if not found."""
    with patch(f"{R}.repo_mark_read", return_value=False):
        res = client.put("/api/notifications/bad-id/read")
    assert res.status_code == 404


def test_mark_all_read(client, auth_brand):
    """PUT /api/notifications/read-all marks all as read."""
    with patch(f"{R}.repo_mark_all_read", return_value=None):
        res = client.put("/api/notifications/read-all")
    assert res.status_code == 200
    assert res.json()["ok"] is True
