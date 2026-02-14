"""Tests for campaign monitoring endpoints and compliance verification."""

import pytest
from unittest.mock import patch, MagicMock

R = "backend.api.routes.campaigns"


def _campaign(**overrides):
    """Helper to create a campaign dict."""
    base = {
        "id": "cmp-1", "brand_id": "brand-uuid-1234", "name": "Test",
        "status": "completed", "result_json": {}, "completed_at": None,
    }
    base.update(overrides)
    return base


def test_monitor_endpoint_returns_snapshot(client):
    """GET /api/campaigns/{id}/monitor returns latest snapshot."""
    snapshot = {
        "id": "snap-1",
        "campaign_id": "cmp-1",
        "snapshot_data": [{"posted": True, "metrics": {"likes": 100}}],
        "summary": {"posts_live": 1, "total_likes": 100},
        "created_at": "2025-01-01T00:00:00Z",
    }

    with patch(f"{R}.repo_get", return_value=_campaign()), \
         patch("backend.db.repositories.monitor_repo.get_latest_snapshot", return_value=snapshot):
        res = client.get("/api/campaigns/cmp-1/monitor")
        assert res.status_code == 200
        data = res.json()
        assert data["snapshot_id"] == "snap-1"
        assert len(data["updates"]) == 1
        assert data["summary"]["posts_live"] == 1


def test_monitor_endpoint_no_snapshot(client):
    """GET /api/campaigns/{id}/monitor returns empty when no snapshots."""
    with patch(f"{R}.repo_get", return_value=_campaign(result_json=None)), \
         patch("backend.db.repositories.monitor_repo.get_latest_snapshot", return_value=None):
        res = client.get("/api/campaigns/cmp-1/monitor")
        assert res.status_code == 200
        data = res.json()
        assert data["updates"] == []
        assert data["snapshot_id"] is None


def test_monitor_404(client):
    """GET /api/campaigns/{id}/monitor returns 404 for missing campaign."""
    with patch(f"{R}.repo_get", return_value=None):
        res = client.get("/api/campaigns/missing/monitor")
        assert res.status_code == 404


def test_insights_endpoint(client):
    """GET /api/campaigns/{id}/insights returns insights data."""
    summary = {"posts_analyzed": 5, "purchase_intent": {"avg_score": 72.3}}

    with patch(f"{R}.repo_get", return_value=_campaign()), \
         patch("backend.db.repositories.insights_repo.get_insights_summary", return_value=summary), \
         patch("backend.db.repositories.insights_repo.get_insights", return_value=[]):
        res = client.get("/api/campaigns/cmp-1/insights")
        assert res.status_code == 200
        data = res.json()
        assert data["summary"]["posts_analyzed"] == 5


def test_report_endpoint(client):
    """GET /api/campaigns/{id}/report returns enriched report."""
    cmp = _campaign(
        status="completed",
        result_json={"report": {"insights": {"executive_summary": ["Done"]}}},
        completed_at="2025-01-01T00:00:00Z",
    )

    with patch(f"{R}.repo_get", return_value=cmp), \
         patch("backend.db.repositories.monitor_repo.get_monitor_summary", return_value={"posts_live": 3}), \
         patch("backend.db.repositories.insights_repo.get_insights_summary", return_value={"posts_analyzed": 2}):
        res = client.get("/api/campaigns/cmp-1/report")
        assert res.status_code == 200
        data = res.json()
        assert data["monitor_summary"]["posts_live"] == 3
        assert data["insights_summary"]["posts_analyzed"] == 2
        assert data["status"] == "completed"


def test_insights_endpoint_404(client):
    """GET /api/campaigns/{id}/insights returns 404 for missing campaign."""
    with patch(f"{R}.repo_get", return_value=None):
        res = client.get("/api/campaigns/missing/insights")
        assert res.status_code == 404


def test_report_endpoint_404(client):
    """GET /api/campaigns/{id}/report returns 404 for missing campaign."""
    with patch(f"{R}.repo_get", return_value=None):
        res = client.get("/api/campaigns/missing/report")
        assert res.status_code == 404
