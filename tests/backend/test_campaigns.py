"""Campaign API route tests."""

from unittest.mock import patch

# Routes import repo funcs as aliases — patch at the route module level
R = "backend.api.routes.campaigns"


# ── List / Get ───────────────────────────────────────────────

def test_list_campaigns_empty(client):
    with patch(f"{R}.repo_list", return_value=[]):
        res = client.get("/api/campaigns")
    assert res.status_code == 200
    assert res.json() == []


def test_list_campaigns_returns_data(client):
    campaigns = [{"id": "c1", "name": "Test", "status": "draft", "created_at": "2025-01-01"}]
    with patch(f"{R}.repo_list", return_value=campaigns):
        res = client.get("/api/campaigns")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Test"


def test_get_campaign_not_found(client):
    with patch(f"{R}.repo_get", return_value=None):
        res = client.get("/api/campaigns/nonexistent")
    assert res.status_code == 404


def test_get_campaign_found(client, auth_brand):
    cmp = {"id": "c1", "name": "Lasena", "status": "completed", "brand_id": auth_brand["id"]}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.get("/api/campaigns/c1")
    assert res.status_code == 200
    assert res.json()["name"] == "Lasena"


# ── Create ───────────────────────────────────────────────────

def test_create_campaign(client):
    with patch(f"{R}.repo_create", return_value="new-uuid"):
        res = client.post("/api/campaigns", json={"brief": {}, "name": "Acme"})
    assert res.status_code == 200
    assert res.json()["id"] == "new-uuid"


def test_create_campaign_db_unavailable(client):
    with patch(f"{R}.repo_create", return_value=None):
        res = client.post("/api/campaigns", json={"brief": {}})
    assert res.status_code == 503


# ── Run (Job Queue) ──────────────────────────────────────────

def test_run_campaign_enqueues_job(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "draft", "brief": {"brand_name": "Test"}}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{R}.repo_update", return_value=True), \
         patch("backend.db.repositories.job_repo.get_job_for_campaign", return_value=None), \
         patch("backend.db.repositories.job_repo.enqueue", return_value="job-uuid"):
        res = client.post("/api/campaigns/c1/run")
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert res.json()["job_id"] == "job-uuid"


def test_run_campaign_already_running(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "running", "brief": {}}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.post("/api/campaigns/c1/run")
    assert res.status_code == 409


def test_run_campaign_no_brief(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "draft", "brief": None}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.post("/api/campaigns/c1/run")
    assert res.status_code == 400


# ── Delete ───────────────────────────────────────────────────

def test_delete_campaign(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "draft"}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{R}.repo_delete", return_value=True):
        res = client.delete("/api/campaigns/c1")
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_delete_running_campaign_blocked(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "running"}
    with patch(f"{R}.repo_get", return_value=cmp):
        res = client.delete("/api/campaigns/c1")
    assert res.status_code == 409


# ── Update ───────────────────────────────────────────────────

def test_update_campaign(client, auth_brand):
    cmp = {"id": "c1", "brand_id": auth_brand["id"], "status": "draft"}
    with patch(f"{R}.repo_get", return_value=cmp), \
         patch(f"{R}.repo_update", return_value=True):
        res = client.put("/api/campaigns/c1", json={"name": "Updated"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
