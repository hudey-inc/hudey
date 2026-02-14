"""Tests for the aggregate analytics dashboard endpoint."""

import pytest
from unittest.mock import patch, MagicMock

# Patch targets — the inline imports within analytics_dashboard resolve to repo modules
CAMP_REPO = "backend.db.repositories.campaign_repo"
EMAIL_REPO = "backend.db.repositories.email_event_repo"
ENG_REPO = "backend.db.repositories.engagement_repo"
MON_REPO = "backend.db.repositories.monitor_repo"


def _mock_campaigns():
    return [
        {"id": "cmp-1", "name": "Campaign Alpha", "status": "completed", "created_at": "2025-01-01T00:00:00Z"},
        {"id": "cmp-2", "name": "Campaign Beta", "status": "running", "created_at": "2025-01-15T00:00:00Z"},
    ]


def _mock_email_summary(sent=5, delivered=4, opened=3, clicked=1, bounced=0):
    return {
        "total_sent": sent,
        "delivered": delivered,
        "opened": opened,
        "clicked": clicked,
        "bounced": bounced,
        "per_creator": [],
    }


def _mock_engagements(campaign_id):
    if campaign_id == "cmp-1":
        return [
            {
                "id": "eng-1", "campaign_id": "cmp-1", "creator_id": "cr-1",
                "creator_name": "Alice", "creator_email": "alice@test.com",
                "platform": "instagram", "status": "agreed",
                "terms": {"fee_gbp": 500}, "latest_proposal": None,
                "message_history": [], "response_timestamp": "2025-01-02T12:00:00Z",
                "created_at": "2025-01-01T12:00:00Z", "updated_at": "2025-01-02T12:00:00Z",
            },
            {
                "id": "eng-2", "campaign_id": "cmp-1", "creator_id": "cr-2",
                "creator_name": "Bob", "creator_email": "bob@test.com",
                "platform": "tiktok", "status": "contacted",
                "terms": None, "latest_proposal": None,
                "message_history": [], "response_timestamp": None,
                "created_at": "2025-01-01T12:00:00Z", "updated_at": "2025-01-01T12:00:00Z",
            },
        ]
    return []


def _mock_campaign_detail(campaign_id, brand_id=None):
    if campaign_id == "cmp-1":
        return {
            "id": "cmp-1", "name": "Campaign Alpha", "status": "completed",
            "brief": {"budget_gbp": 2000, "brand_name": "Alpha"},
        }
    if campaign_id == "cmp-2":
        return {
            "id": "cmp-2", "name": "Campaign Beta", "status": "running",
            "brief": {"budget_gbp": 1000, "brand_name": "Beta"},
        }
    return None


def _mock_monitor_summary(campaign_id):
    if campaign_id == "cmp-1":
        return {
            "posts_live": 2, "total_likes": 300, "total_comments": 40,
            "total_shares": 10, "total_saves": 5,
            "avg_compliance_score": 85.0, "compliance_issues": 1, "fully_compliant": 1,
        }
    return {}


def test_dashboard_returns_aggregated_data(client):
    """GET /api/analytics/dashboard returns complete aggregated analytics."""
    with patch(f"{CAMP_REPO}.list_campaigns", return_value=_mock_campaigns()), \
         patch(f"{CAMP_REPO}.get_campaign", side_effect=_mock_campaign_detail), \
         patch(f"{EMAIL_REPO}.get_delivery_summary", return_value=_mock_email_summary()), \
         patch(f"{ENG_REPO}.get_engagements", side_effect=_mock_engagements), \
         patch(f"{MON_REPO}.get_monitor_summary", side_effect=_mock_monitor_summary):
        res = client.get("/api/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()

        # Top-level aggregates
        assert data["totalCampaigns"] == 2
        assert data["totalCreatorsContacted"] == 2
        assert data["totalAgreed"] == 1
        assert data["totalDeclined"] == 0
        assert data["responseRate"] == 50  # 1 responded out of 2
        assert data["conversionRate"] == 50  # 1 agreed out of 2

        # Email stats
        assert data["emailStats"]["totalSent"] == 10  # 5 per campaign * 2
        assert data["emailStats"]["openRate"] > 0

        # Per-campaign breakdown
        assert len(data["perCampaign"]) == 2
        assert data["perCampaign"][0]["id"] == "cmp-1"

        # All creators
        assert len(data["allCreators"]) == 2
        assert data["allCreators"][0]["name"] == "Alice"
        assert data["allCreators"][0]["agreed"] is True
        assert data["allCreators"][0]["feeGbp"] == 500

        # Engagement funnel
        assert data["engagementFunnel"]["agreed"] == 1
        assert data["engagementFunnel"]["contacted"] == 1

        # Platform breakdown
        assert len(data["platformBreakdown"]) == 2

        # Content performance
        assert data["contentPerformance"]["totalPostsLive"] == 2
        assert data["contentPerformance"]["totalLikes"] == 300
        assert data["contentPerformance"]["avgComplianceScore"] == 85.0

        # Budget tracking
        assert data["budgetTracking"]["totalBudget"] == 3000  # 2000 + 1000
        assert data["budgetTracking"]["totalAgreedFees"] == 500
        assert data["budgetTracking"]["avgCostPerCreator"] == 500


def test_dashboard_empty_campaigns(client):
    """GET /api/analytics/dashboard returns zeroed data when no campaigns exist."""
    with patch(f"{CAMP_REPO}.list_campaigns", return_value=[]):
        res = client.get("/api/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert data["totalCampaigns"] == 0
        assert data["totalCreatorsContacted"] == 0
        assert data["perCampaign"] == []
        assert data["allCreators"] == []
        assert data["contentPerformance"]["totalPostsLive"] == 0
        assert data["budgetTracking"]["totalBudget"] == 0


def test_dashboard_handles_repo_errors(client):
    """GET /api/analytics/dashboard handles errors in individual repo calls gracefully."""
    with patch(f"{CAMP_REPO}.list_campaigns", return_value=_mock_campaigns()), \
         patch(f"{CAMP_REPO}.get_campaign", side_effect=Exception("db error")), \
         patch(f"{EMAIL_REPO}.get_delivery_summary", side_effect=Exception("db error")), \
         patch(f"{ENG_REPO}.get_engagements", side_effect=Exception("db error")), \
         patch(f"{MON_REPO}.get_monitor_summary", side_effect=Exception("db error")):
        res = client.get("/api/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()
        # Should still return structure even if all per-campaign queries fail
        assert data["totalCampaigns"] == 2
        assert data["totalCreatorsContacted"] == 0
        assert data["emailStats"]["totalSent"] == 0


def test_dashboard_email_breakdown(client):
    """Email breakdown contains per-campaign data."""
    with patch(f"{CAMP_REPO}.list_campaigns", return_value=_mock_campaigns()), \
         patch(f"{CAMP_REPO}.get_campaign", side_effect=_mock_campaign_detail), \
         patch(f"{EMAIL_REPO}.get_delivery_summary", return_value=_mock_email_summary(sent=10, opened=8)), \
         patch(f"{ENG_REPO}.get_engagements", return_value=[]), \
         patch(f"{MON_REPO}.get_monitor_summary", return_value={}):
        res = client.get("/api/analytics/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert len(data["emailBreakdown"]) == 2
        assert data["emailBreakdown"][0]["sent"] == 10
        assert data["emailBreakdown"][0]["opened"] == 8
