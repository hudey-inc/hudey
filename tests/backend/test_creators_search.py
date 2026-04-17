"""Integration tests for POST /api/creators/search.

Covers the two-path flow introduced when we swapped Phyllo for the new
stack as the preferred provider:

  Path A: new stack configured + categories supplied → orchestrator used
  Path B: new stack not configured OR returned 0 rows → Phyllo fallback

Also covers the cache hit path and the ``nobody configured`` early return.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

R = "backend.api.routes.creators"
BRIDGE = "backend.api.routes._new_stack_search"


@pytest.fixture(autouse=True)
def _clear_search_cache():
    """Route caches creator IDs by search params. Without clearing, the
    first test's result leaks into subsequent tests that use the same body
    shape and we'd see ``provider: cache`` everywhere."""
    from backend.cache import search_cache
    search_cache.clear()
    yield
    search_cache.clear()


@pytest.fixture(autouse=True)
def _bind_route_supabase_to_mock(mock_sb):
    """The route imports ``get_supabase`` by name at module-load time. The
    first test pulls ``client`` → imports ``backend.main`` → binds
    ``route_mod.get_supabase`` to whatever ``backend.db.client.get_supabase``
    was at that moment — which is the first fixture's ``MagicMock``, not
    the real function. Every subsequent test then keeps hitting the first
    test's mock return value instead of its own seeded ``mock_sb``.

    Explicit per-test patch below points the route's bound reference at
    whatever ``mock_sb`` the current test just built."""
    from unittest.mock import patch as _p
    with _p("backend.api.routes.creators.get_supabase", return_value=mock_sb):
        yield


def _valid_body(**over):
    body = {
        "platforms": ["instagram"],
        "follower_min": 1_000,
        "follower_max": 1_000_000,
        "categories": ["fashion"],
        "locations": ["UK"],
        "limit": 5,
    }
    body.update(over)
    return body


def _seed_creator_row(mock_sb, creator_id: str, **fields):
    row = {
        "id": creator_id,
        "external_id": fields.get("external_id", f"instagram:{creator_id}"),
        "platform": fields.get("platform", "instagram"),
        "username": fields.get("username", creator_id),
        "display_name": fields.get("display_name", creator_id),
        "follower_count": fields.get("follower_count", 10_000),
        "engagement_rate": fields.get("engagement_rate", 0.04),
        "categories": fields.get("categories", []),
        "location": fields.get("location"),
        "email": fields.get("email"),
        "profile_data": fields.get("profile_data", {}),
        "brand_fit_score": fields.get("brand_fit_score"),
    }
    mock_sb.seed_table("creators", [row])
    mock_sb.seed_table("saved_creators", [])
    return row


# ── Cache-miss path: new stack is used when configured ─────

def test_search_uses_new_stack_when_configured(client, mock_sb):
    _seed_creator_row(mock_sb, "uuid-1", username="eco_anna")

    new_dicts = [{
        "external_id": "instagram:eco_anna",
        "platform": "instagram",
        "username": "eco_anna",
        "display_name": "Eco Anna",
        "follower_count": 25_000,
        "engagement_rate": 0.062,
        "categories": [],
        "location": None,
        "email": None,
        "profile_data": {"bio": "Slow fashion"},
    }]
    diagnostics = {
        "configured": True, "providers_enabled": ["scrapecreators"],
        "discovered": 10, "after_filter": 5, "returned": 1, "breakers": {},
    }

    async def _fake_run_search(**_kw):
        return new_dicts, diagnostics

    with patch(f"{BRIDGE}.new_stack_configured", return_value=True), \
         patch(f"{BRIDGE}.run_search", side_effect=_fake_run_search), \
         patch(f"{R}.upsert_creators", return_value=["uuid-1"]):
        res = client.post("/api/creators/search", json=_valid_body())

    assert res.status_code == 200
    body = res.json()
    assert body["provider"]["name"] == "new_stack"
    assert body["total"] == 1
    assert body["creators"][0]["username"] == "eco_anna"
    assert body["diagnostics"]["providers_enabled"] == ["scrapecreators"]


# ── Fallback: new stack returns 0 → use Phyllo ──────────────

def test_search_falls_back_to_phyllo_when_new_stack_empty(client, mock_sb):
    # The Phyllo fallback *path* — we only assert the provider flip here;
    # the actual creator rendering is covered by the new-stack test, and
    # the Phyllo path was already battle-tested before this refactor.
    async def _empty_new_stack(**_kw):
        return [], {"reason": "no hashtag matches", "configured": True}

    with patch(f"{BRIDGE}.new_stack_configured", return_value=True), \
         patch(f"{BRIDGE}.run_search", side_effect=_empty_new_stack):

        class _EmptyPhyllo:
            is_configured = True
            base_url = "https://api.sandbox.insightiq.ai/v1"
            last_error = None
            def search_creators(self, **_kw):
                return []  # force the 0-results branch so we don't touch upsert

        with patch("services.phyllo_client.PhylloClient", return_value=_EmptyPhyllo()):
            res = client.post("/api/creators/search", json=_valid_body())

    assert res.status_code == 200
    body = res.json()
    # Provider was flipped to insightiq after new-stack fell through.
    assert body["provider"]["name"] == "insightiq"
    assert body["provider"]["env"] == "sandbox"
    # Diagnostics from the new-stack attempt are preserved for debugging.
    assert body["diagnostics"]["reason"] == "no hashtag matches"


# ── New stack not configured → straight to Phyllo ───────────

def test_search_uses_phyllo_when_new_stack_unconfigured(client, mock_sb):
    # New stack isn't set → skip Path A entirely, go straight to Phyllo.
    # Phyllo returns empty here so we don't have to mock the upsert chain —
    # the important signal is the ``provider`` flip, not the row rendering.
    with patch(f"{BRIDGE}.new_stack_configured", return_value=False):
        class _EmptyProdPhyllo:
            is_configured = True
            base_url = "https://api.insightiq.ai/v1"  # production URL
            last_error = None
            def search_creators(self, **_kw):
                return []

        with patch("services.phyllo_client.PhylloClient", return_value=_EmptyProdPhyllo()):
            res = client.post("/api/creators/search", json=_valid_body())

    assert res.status_code == 200
    body = res.json()
    assert body["provider"]["name"] == "insightiq"
    assert body["provider"]["env"] == "production"


# ── Nothing configured → early return ───────────────────────

def test_search_returns_none_when_no_provider_configured(client, mock_sb):
    with patch(f"{BRIDGE}.new_stack_configured", return_value=False):
        class _UnconfiguredPhyllo:
            is_configured = False
            base_url = "https://api.sandbox.insightiq.ai/v1"
            last_error = None
        with patch("services.phyllo_client.PhylloClient", return_value=_UnconfiguredPhyllo()):
            res = client.post("/api/creators/search", json=_valid_body())

    assert res.status_code == 200
    body = res.json()
    assert body["configured"] is False
    assert body["provider"]["name"] == "none"
    assert body["total"] == 0


# ── Phyllo error path surfaces diagnostics ──────────────────

def test_search_surfaces_phyllo_error_block(client, mock_sb):
    async def _empty_new_stack(**_kw):
        return [], {"reason": "not configured", "configured": False}

    with patch(f"{BRIDGE}.new_stack_configured", return_value=True), \
         patch(f"{BRIDGE}.run_search", side_effect=_empty_new_stack):

        class _ErrPhyllo:
            is_configured = True
            base_url = "https://api.sandbox.insightiq.ai/v1"
            last_error = {
                "method": "POST", "path": "/social/creators/profiles/search",
                "status_code": 403, "message": "Forbidden", "body": "{}",
            }
            def search_creators(self, **_kw):
                return []

        with patch("services.phyllo_client.PhylloClient", return_value=_ErrPhyllo()):
            res = client.post("/api/creators/search", json=_valid_body())

    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["provider"]["name"] == "insightiq"
    assert body["provider"]["env"] == "sandbox"
    assert body["error"]["status_code"] == 403
    assert body["error"]["source"] == "insightiq"


# ── Cache hit path ──────────────────────────────────────────

def test_search_cache_hit_short_circuits_providers(client, mock_sb):
    _seed_creator_row(mock_sb, "cached-uuid", username="cached_user")

    # Pre-seed the search cache.
    from backend.cache import cache_key, search_cache
    body = _valid_body()
    sk = cache_key(
        "search", body["platforms"], body["follower_min"], body["follower_max"],
        body["categories"], body["locations"], body["limit"],
    )
    search_cache.set(sk, ["cached-uuid"])
    try:
        # If either provider were invoked the test would fail — neither is
        # patched, so a real call would explode.
        with patch(f"{BRIDGE}.new_stack_configured", return_value=True) as nc, \
             patch(f"{BRIDGE}.run_search") as rs:
            res = client.post("/api/creators/search", json=body)
            rs.assert_not_called()
            nc.assert_not_called()

        assert res.status_code == 200
        payload = res.json()
        assert payload["provider"]["name"] == "cache"
        assert payload["creators"][0]["username"] == "cached_user"
    finally:
        # Don't leak cache state to other tests.
        search_cache.clear()
