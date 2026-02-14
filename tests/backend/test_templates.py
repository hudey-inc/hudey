"""Tests for campaign templates and duplicate campaign endpoints."""

import pytest
from unittest.mock import patch, MagicMock

# Patch targets — inline imports resolve to actual repo modules
TMPL_REPO = "backend.db.repositories.template_repo"
CAMP_REPO = "backend.db.repositories.campaign_repo"
CAMP_ROUTE = "backend.api.routes.campaigns"


def _campaign(**overrides):
    base = {
        "id": "cmp-1",
        "brand_id": "brand-uuid-1234",
        "name": "Test Campaign",
        "status": "completed",
        "brief": {"brand_name": "Test", "objective": "Launch product"},
        "target_audience": {"age": "18-35"},
        "deliverables": ["1x Reel"],
        "timeline": "4 weeks",
    }
    base.update(overrides)
    return base


def _template(**overrides):
    base = {
        "id": "tpl-1",
        "brand_id": "brand-uuid-1234",
        "name": "Product Launch Template",
        "description": "Standard product launch brief",
        "brief": {"brand_name": "Test", "objective": "Launch product"},
        "strategy": None,
        "usage_count": 3,
        "created_at": "2025-01-01T00:00:00Z",
    }
    base.update(overrides)
    return base


# ── Duplicate Campaign Tests ──────────────────────────────────


def test_duplicate_campaign(client):
    """POST /api/campaigns/{id}/duplicate creates a new draft copy."""
    with patch(f"{CAMP_ROUTE}.repo_get", return_value=_campaign()), \
         patch(f"{CAMP_ROUTE}.repo_create", return_value="new-cmp-uuid"):
        res = client.post("/api/campaigns/cmp-1/duplicate", json={})
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "new-cmp-uuid"
        assert data["source_campaign_id"] == "cmp-1"


def test_duplicate_campaign_with_custom_name(client):
    """POST /api/campaigns/{id}/duplicate accepts a custom name."""
    with patch(f"{CAMP_ROUTE}.repo_get", return_value=_campaign()), \
         patch(f"{CAMP_ROUTE}.repo_create", return_value="new-cmp-uuid") as mock_create:
        res = client.post("/api/campaigns/cmp-1/duplicate", json={"name": "My Custom Copy"})
        assert res.status_code == 200
        # Verify custom name was passed to repo_create
        assert mock_create.call_args[1]["name"] == "My Custom Copy"


def test_duplicate_campaign_not_found(client):
    """POST /api/campaigns/{id}/duplicate returns 404 for missing campaign."""
    with patch(f"{CAMP_ROUTE}.repo_get", return_value=None):
        res = client.post("/api/campaigns/missing/duplicate", json={})
        assert res.status_code == 404


def test_duplicate_campaign_default_name(client):
    """POST /api/campaigns/{id}/duplicate appends (copy) to original name."""
    with patch(f"{CAMP_ROUTE}.repo_get", return_value=_campaign(name="Alpha")), \
         patch(f"{CAMP_ROUTE}.repo_create", return_value="new-cmp-uuid") as mock_create:
        res = client.post("/api/campaigns/cmp-1/duplicate", json={})
        assert res.status_code == 200
        assert mock_create.call_args[1]["name"] == "Alpha (copy)"


# ── Template CRUD Tests ──────────────────────────────────────


def test_list_templates(client):
    """GET /api/templates returns list of templates."""
    with patch(f"{TMPL_REPO}.list_templates", return_value=[_template()]):
        res = client.get("/api/templates")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Product Launch Template"


def test_list_templates_empty(client):
    """GET /api/templates returns empty list when no templates exist."""
    with patch(f"{TMPL_REPO}.list_templates", return_value=[]):
        res = client.get("/api/templates")
        assert res.status_code == 200
        assert res.json() == []


def test_get_template(client):
    """GET /api/templates/{id} returns template data."""
    with patch(f"{TMPL_REPO}.get_template", return_value=_template()):
        res = client.get("/api/templates/tpl-1")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "tpl-1"
        assert data["usage_count"] == 3


def test_get_template_not_found(client):
    """GET /api/templates/{id} returns 404 for missing template."""
    with patch(f"{TMPL_REPO}.get_template", return_value=None):
        res = client.get("/api/templates/missing")
        assert res.status_code == 404


def test_create_template(client):
    """POST /api/templates creates a new template from brief."""
    with patch(f"{TMPL_REPO}.create_template", return_value="tpl-new"):
        res = client.post("/api/templates", json={
            "name": "New Template",
            "description": "Test desc",
            "brief": {"brand_name": "Test"},
        })
        assert res.status_code == 200
        assert res.json()["id"] == "tpl-new"


def test_create_template_from_campaign(client):
    """POST /api/templates with campaign_id copies brief from campaign."""
    with patch(f"{CAMP_REPO}.get_campaign", return_value=_campaign()), \
         patch(f"{TMPL_REPO}.create_template", return_value="tpl-from-cmp"):
        res = client.post("/api/templates", json={
            "name": "From Campaign",
            "campaign_id": "cmp-1",
        })
        assert res.status_code == 200
        assert res.json()["id"] == "tpl-from-cmp"


def test_create_template_missing_name(client):
    """POST /api/templates requires a name."""
    res = client.post("/api/templates", json={"brief": {"test": True}})
    assert res.status_code == 400


def test_delete_template(client):
    """DELETE /api/templates/{id} deletes the template."""
    with patch(f"{TMPL_REPO}.delete_template", return_value=True):
        res = client.delete("/api/templates/tpl-1")
        assert res.status_code == 200
        assert res.json()["ok"] is True


def test_delete_template_not_found(client):
    """DELETE /api/templates/{id} returns 404 for missing template."""
    with patch(f"{TMPL_REPO}.delete_template", return_value=False):
        res = client.delete("/api/templates/missing")
        assert res.status_code == 404


# ── Create Campaign from Template ────────────────────────────


def test_create_campaign_from_template(client):
    """POST /api/templates/{id}/create-campaign creates a draft campaign."""
    with patch(f"{TMPL_REPO}.get_template", return_value=_template()), \
         patch(f"{CAMP_REPO}.create_campaign", return_value="new-cmp-from-tpl"), \
         patch(f"{TMPL_REPO}.increment_usage", return_value=True):
        res = client.post("/api/templates/tpl-1/create-campaign", json={})
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "new-cmp-from-tpl"
        assert data["template_id"] == "tpl-1"


def test_create_campaign_from_template_with_overrides(client):
    """POST /api/templates/{id}/create-campaign accepts brief_overrides."""
    with patch(f"{TMPL_REPO}.get_template", return_value=_template()), \
         patch(f"{CAMP_REPO}.create_campaign", return_value="new-cmp") as mock_create, \
         patch(f"{TMPL_REPO}.increment_usage", return_value=True):
        res = client.post("/api/templates/tpl-1/create-campaign", json={
            "name": "Custom Name",
            "brief_overrides": {"budget_gbp": 5000},
        })
        assert res.status_code == 200
        # Verify brief was merged with overrides
        brief_arg = mock_create.call_args[0][0]  # first positional arg
        assert brief_arg["budget_gbp"] == 5000
        assert mock_create.call_args[1]["name"] == "Custom Name"


def test_create_campaign_from_template_not_found(client):
    """POST /api/templates/{id}/create-campaign returns 404 for missing template."""
    with patch(f"{TMPL_REPO}.get_template", return_value=None):
        res = client.post("/api/templates/missing/create-campaign", json={})
        assert res.status_code == 404
