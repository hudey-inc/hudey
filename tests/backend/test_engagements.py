"""Engagement and negotiation route tests.

All these routes live in backend.api.routes.campaigns with inline imports
from engagement_repo, so we patch at the repo module level.
"""

from unittest.mock import patch

R = "backend.api.routes.campaigns"
REPO = "backend.db.repositories.engagement_repo"

MOCK_ENGAGEMENT = {
    "id": "e1",
    "campaign_id": "c1",
    "creator_id": "creator-1",
    "creator_name": "Alice",
    "creator_email": "alice@example.com",
    "platform": "instagram",
    "status": "responded",
    "latest_proposal": None,
    "terms": None,
    "message_history": [
        {"from": "brand", "body": "Hi!", "timestamp": "2025-01-01T00:00:00Z"},
        {"from": "creator", "body": "Interested!", "timestamp": "2025-01-02T00:00:00Z"},
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z",
}


def test_list_engagements(client, auth_brand):
    """GET /api/campaigns/{id}/engagements returns creator engagements."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{REPO}.get_engagements", return_value=[MOCK_ENGAGEMENT]):
        res = client.get("/api/campaigns/c1/engagements")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["creator_name"] == "Alice"


def test_reply_to_creator(client, auth_brand):
    """POST /api/campaigns/{id}/reply appends message and returns ok."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "name": "Test"}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{REPO}.get_engagement", return_value=MOCK_ENGAGEMENT), \
         patch(f"{REPO}.append_message", return_value=True), \
         patch(f"{REPO}.update_status", return_value=True):
        res = client.post("/api/campaigns/c1/reply", json={
            "creator_id": "creator-1",
            "message": "Let's discuss terms!",
        })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["message"]["from"] == "brand"
    assert data["status"] == "negotiating"


def test_reply_missing_fields(client, auth_brand):
    """POST /api/campaigns/{id}/reply returns 400 for missing fields."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.post("/api/campaigns/c1/reply", json={
            "creator_id": "",
            "message": "",
        })
    assert res.status_code == 400


def test_update_engagement_status(client, auth_brand):
    """PATCH /api/campaigns/{id}/engagements/{cid}/status updates status."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{REPO}.get_engagement", return_value=MOCK_ENGAGEMENT), \
         patch(f"{REPO}.update_status", return_value=True):
        res = client.patch("/api/campaigns/c1/engagements/creator-1/status", json={
            "status": "negotiating",
        })
    assert res.status_code == 200
    assert res.json()["status"] == "negotiating"


def test_update_engagement_invalid_status(client, auth_brand):
    """PATCH rejects invalid status values."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.patch("/api/campaigns/c1/engagements/creator-1/status", json={
            "status": "invalid-status",
        })
    assert res.status_code == 400


def test_accept_terms(client, auth_brand):
    """POST /api/campaigns/{id}/accept-terms sets agreed status."""
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "name": "Test"}
    eng = {**MOCK_ENGAGEMENT, "status": "negotiating", "latest_proposal": {"fee_gbp": 500}}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{REPO}.get_engagement", return_value=eng), \
         patch(f"{REPO}.update_status", return_value=True), \
         patch(f"{REPO}.append_message", return_value=True):
        res = client.post("/api/campaigns/c1/accept-terms", json={
            "creator_id": "creator-1",
            "terms": {"fee_gbp": 500, "deliverables": ["1 reel"], "deadline": "2025-03-01"},
        })
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["status"] == "agreed"
    assert data["terms"]["fee_gbp"] == 500
