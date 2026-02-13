"""Approval API route tests."""

from unittest.mock import patch

R = "backend.api.routes.approvals"


def test_approvals_status(client):
    """GET /api/approvals/status returns ok."""
    res = client.get("/api/approvals/status")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_list_pending_approvals(client, auth_brand):
    """GET /api/approvals/pending returns only brand's pending approvals."""
    campaign = {"id": "c1", "brand_id": auth_brand["id"]}
    pending = [
        {"id": "a1", "campaign_id": "c1", "status": "pending", "approval_type": "strategy"},
    ]
    with patch(f"{R}.repo_pending", return_value=pending), \
         patch(f"{R}.repo_get_campaign", return_value=campaign):
        res = client.get("/api/approvals/pending")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_campaign_approvals(client, auth_brand):
    """GET /api/campaigns/{id}/approvals lists approvals for a campaign."""
    campaign = {"id": "c1", "brand_id": auth_brand["id"]}
    approvals = [{"id": "a1", "approval_type": "strategy", "status": "approved"}]
    with patch(f"{R}.repo_get_campaign", return_value=campaign), \
         patch(f"{R}.repo_list", return_value=approvals):
        res = client.get("/api/campaigns/c1/approvals")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_decide_approval_approve(client):
    """PUT /api/approvals/{id} approves a pending approval."""
    with patch(f"{R}.repo_decide", return_value=True):
        res = client.put("/api/approvals/a1", json={
            "status": "approved",
            "feedback": "Looks good",
        })
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_decide_approval_invalid_status(client):
    """PUT /api/approvals/{id} rejects invalid status values."""
    res = client.put("/api/approvals/a1", json={"status": "maybe"})
    assert res.status_code == 400


def test_create_approval(client, auth_brand):
    """POST /api/campaigns/{id}/approvals creates an approval request."""
    campaign = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get_campaign", return_value=campaign), \
         patch(f"{R}.repo_create", return_value="a-new"):
        res = client.post("/api/campaigns/c1/approvals", json={
            "approval_type": "strategy",
            "payload": {"strategy": "test"},
        })
    assert res.status_code == 200
    assert res.json()["id"] == "a-new"


def test_create_approval_missing_fields(client, auth_brand):
    """POST /api/campaigns/{id}/approvals returns 400 for missing fields."""
    campaign = {"id": "c1", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get_campaign", return_value=campaign):
        res = client.post("/api/campaigns/c1/approvals", json={
            "approval_type": "strategy",
            # missing payload
        })
    assert res.status_code == 400
