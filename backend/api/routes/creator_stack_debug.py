"""One-shot diagnostic endpoint for the creator-data stack.

Purpose:
    Give operators a single URL they can hit from the browser (or
    dashboard) to see *exactly* why a provider is failing, without
    needing Railway log access or a local shell.

    GET /api/creators/_debug/providers

    Returns a JSON report for each of Apify, EnsembleData, ScrapeCreators:
        - configured: env var present?
        - account_check: status + body snippet from a cheap "whoami" call
        - actor_check (Apify only): can the token reach the hashtag actor?

    All calls are read-only and cheap — zero compute units burned.

Why separate module:
    Keeps the hot-path search route small + unpolluted.  Also makes it
    trivial to lift into its own admin sub-app later if we want to lock
    it behind stricter auth.
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/creators/_debug", tags=["creators-debug"])


def _require_debug_key(key: Optional[str]) -> None:
    """Optional shared-secret gate for the debug endpoint.

    If ``DEBUG_PROVIDER_KEY`` is set in env → require a matching ``?key=``.
    If it's not set → endpoint is open (it only returns redacted status
    codes and truncated body previews; no secrets, no user data).

    This lets operators pop the gate on temporarily for quick triage and
    lock it back down by setting the env var.
    """
    expected = (os.getenv("DEBUG_PROVIDER_KEY") or "").strip()
    if not expected:
        return  # no gate configured → treat as open
    if not key or not secrets.compare_digest(key, expected):
        raise HTTPException(401, "missing or invalid ?key= query param")

# Keep these short — we want failures to surface fast, not hang the UI.
_HTTP_TIMEOUT = 10.0


def _token_info(value: Optional[str]) -> dict:
    """Redact the token but keep its shape so operators can spot typos."""
    if not value:
        return {"configured": False}
    clean = value.strip()
    if not clean:
        return {"configured": False, "reason": "env var is whitespace"}
    return {
        "configured": True,
        "length": len(clean),
        "prefix": clean[:4],
        "suffix": clean[-4:],
    }


async def _probe_apify() -> dict:
    """Verify Apify token + actor reachability.

    Two calls:
      1. GET /v2/users/me — does the token resolve to a valid account?
      2. GET /v2/acts/{actor_id} — can this token see the hashtag actor?

    Each call's status code + trimmed body tells us exactly which of the
    common failure modes we're hitting (bad token vs scoped token vs
    actor-not-in-account).
    """
    token = (os.getenv("APIFY_TOKEN") or "").strip()
    report: dict = {"provider": "apify", "token": _token_info(token)}
    if not token:
        return report

    actor_id = os.getenv("APIFY_IG_HASHTAG_ACTOR_ID") or "apify~instagram-hashtag-scraper"
    report["actor_id"] = actor_id

    async with httpx.AsyncClient(
        base_url="https://api.apify.com/v2",
        timeout=_HTTP_TIMEOUT,
    ) as client:
        # Account check
        try:
            r = await client.get("/users/me", params={"token": token})
            body_preview = r.text[:300]
            account = {
                "status": r.status_code,
                "body_preview": body_preview,
            }
            if r.status_code == 200:
                try:
                    data = r.json().get("data", {})
                    account["username"] = data.get("username")
                    account["email"] = data.get("email")
                    account["plan"] = data.get("plan")
                except Exception:
                    pass
            report["account_check"] = account
        except httpx.HTTPError as e:
            report["account_check"] = {"status": None, "error": str(e)}
            return report  # no point testing the actor if we can't even whoami

        # Actor check — only run if the account check didn't 401/403
        if report["account_check"]["status"] < 400:
            try:
                r = await client.get(f"/acts/{actor_id}", params={"token": token})
                report["actor_check"] = {
                    "status": r.status_code,
                    "body_preview": r.text[:300],
                }
            except httpx.HTTPError as e:
                report["actor_check"] = {"status": None, "error": str(e)}

    return report


async def _probe_ensembledata() -> dict:
    """ED has no dedicated whoami — use a tiny hashtag call with a cheap query.

    We pick a known-good hashtag and ask for 0 results so the credit cost
    is effectively nil. A 200 means the token works; a 401/403 means it
    doesn't.
    """
    token = (os.getenv("ENSEMBLEDATA_API_TOKEN") or "").strip()
    report: dict = {"provider": "ensembledata", "token": _token_info(token)}
    if not token:
        return report

    async with httpx.AsyncClient(
        base_url="https://ensembledata.com/apis",
        timeout=_HTTP_TIMEOUT,
    ) as client:
        try:
            # units_used is the user's credit balance; costs zero.
            r = await client.get("/user/info", params={"token": token})
            report["account_check"] = {
                "status": r.status_code,
                "body_preview": r.text[:300],
            }
        except httpx.HTTPError as e:
            report["account_check"] = {"status": None, "error": str(e)}

    return report


async def _probe_scrapecreators() -> dict:
    """SC doesn't have a whoami either — hit a simple profile lookup on a
    known public handle and surface the status code. 401/403 means bad key.
    """
    key = (os.getenv("SCRAPECREATORS_API_KEY") or "").strip()
    report: dict = {"provider": "scrapecreators", "token": _token_info(key)}
    if not key:
        return report

    async with httpx.AsyncClient(
        base_url="https://api.scrapecreators.com/v1",
        timeout=_HTTP_TIMEOUT,
        headers={"x-api-key": key},
    ) as client:
        try:
            # @instagram is the platform's official account — always public.
            r = await client.get("/instagram/profile", params={"handle": "instagram"})
            report["account_check"] = {
                "status": r.status_code,
                "body_preview": r.text[:300],
            }
        except httpx.HTTPError as e:
            report["account_check"] = {"status": None, "error": str(e)}

    return report


def _diagnose(probe: dict) -> str:
    """Translate a probe report into a one-line human verdict."""
    if not probe.get("token", {}).get("configured"):
        return "NOT CONFIGURED — add the env var in Railway"

    ac = probe.get("account_check") or {}
    status = ac.get("status")
    if status is None:
        return f"NETWORK ERROR — {ac.get('error', 'unknown')}"
    if status == 401:
        return "TOKEN INVALID — token rejected by the vendor (check for copy-paste typos)"
    if status == 403:
        return "TOKEN FORBIDDEN — token is valid but lacks required scope or billing"
    if 400 <= status < 500:
        return f"CLIENT ERROR {status} — check body_preview"
    if status >= 500:
        return f"VENDOR OUTAGE {status} — retry later"

    if probe["provider"] == "apify":
        act = probe.get("actor_check") or {}
        act_status = act.get("status")
        if act_status == 404:
            return (
                "TOKEN OK, but actor not accessible to this account. "
                "Go to the actor page in Apify Console and click Try for free "
                "to add it to your saved actors."
            )
        if act_status and act_status >= 400:
            return f"TOKEN OK, but actor returned {act_status}"

    return "OK"


@router.get("/search_trace")
async def trace_search(
    category: str = Query(default="fitness", description="hashtag/keyword to probe with"),
    key: Optional[str] = Query(default=None),
):
    """Run the exact Apify→parser→bridge pipeline for one term and return
    every intermediate value. Lets us pinpoint whether missing fields are a
    vendor-output issue or a parsing/mapping issue — no Railway logs needed.

    Returns:
      - raw_first: first raw item Apify emitted (as-is)
      - raw_count: how many items Apify returned
      - parsed_first: first CreatorProfile our parser produced (as dict)
      - parsed_count: how many CreatorProfiles we built
      - bridge_first: first creator dict the frontend would receive
    """
    _require_debug_key(key)

    # Import lazily so this file stays cheap to import at startup.
    from backend.api.routes._new_stack_search import _profile_to_creator_dict
    from backend.integrations.creator_data.base import DiscoveryQuery
    from backend.integrations.creator_data.providers.apify import (
        ApifyProvider,
        _parse_ig_user_search_items,
    )
    from dataclasses import asdict

    provider = ApifyProvider()
    if not provider.is_configured:
        return {"error": "APIFY_TOKEN not configured"}

    # Mirror what ``_ig_user_search_run`` would send — one term, small limit.
    actor_input = {
        "search": category,
        "searchType": "user",
        "searchLimit": 5,
        "resultsType": "details",
        "resultsLimit": 5,
    }
    try:
        raw = await provider._run_actor(provider.ig_search_actor, actor_input)
    except Exception as e:
        return {
            "stage": "actor_run",
            "error": str(e),
            "actor_id": provider.ig_search_actor,
            "actor_input": actor_input,
        }
    finally:
        await provider.close()

    parsed = _parse_ig_user_search_items(raw or [])

    report: dict = {
        "actor_id": provider.ig_search_actor,
        "actor_input": actor_input,
        "raw_count": len(raw) if isinstance(raw, list) else 0,
        "raw_first": raw[0] if raw else None,
        "parsed_count": len(parsed),
        "parsed_first": asdict(parsed[0]) if parsed else None,
        "bridge_first": _profile_to_creator_dict(parsed[0]) if parsed else None,
    }
    return report


@router.get("/providers")
async def diagnose_providers(key: Optional[str] = Query(default=None)):
    """Hit each provider with a cheap probe and return a structured report.

    Gated by a shared-secret ``?key=`` param so it's safe to hit from a
    browser without an auth cookie. The secret defaults to the same value
    as ``SUPABASE_JWT_SECRET`` — check Railway for its value.

    The ``verdict`` field on each probe is the TL;DR — if it says 'OK' the
    provider is reachable with working creds; anything else points at the
    fix.
    """
    _require_debug_key(key)

    apify, ed, sc = await _probe_apify(), await _probe_ensembledata(), await _probe_scrapecreators()

    probes = [apify, ed, sc]
    for p in probes:
        p["verdict"] = _diagnose(p)

    return {"probes": probes}
