"""Contract template & acceptance repository — CRUD + audit trail."""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)

# ── Default Clauses ──────────────────────────────────────────

DEFAULT_CLAUSES = [
    {
        "type": "scope_of_work",
        "title": "Scope of Work",
        "body": (
            "Creator agrees to produce the deliverables outlined in the agreed "
            "campaign terms, meeting all specifications and deadlines set forth "
            "in this agreement."
        ),
        "required": True,
        "order": 0,
    },
    {
        "type": "payment_terms",
        "title": "Payment Terms",
        "body": (
            "Brand will pay the agreed fee within 30 days of content going live "
            "and meeting the requirements outlined in this agreement. Payment "
            "will be made via the method agreed upon during negotiation."
        ),
        "required": True,
        "order": 1,
    },
    {
        "type": "content_rights",
        "title": "Content Rights & Usage",
        "body": (
            "Brand shall have the right to repurpose, reshare, and use "
            "Creator's content across Brand's owned channels (website, social "
            "media, email) for a period of 12 months from the date of "
            "publication. Creator retains ownership of the original content."
        ),
        "required": True,
        "order": 2,
    },
    {
        "type": "ftc_disclosure",
        "title": "FTC / ASA Disclosure Requirements",
        "body": (
            "Creator must include clear and conspicuous disclosure of the paid "
            "partnership in accordance with FTC guidelines and ASA CAP Code, "
            "including but not limited to using #ad or the platform's built-in "
            "paid partnership label."
        ),
        "required": True,
        "order": 3,
    },
    {
        "type": "termination",
        "title": "Termination",
        "body": (
            "Either party may terminate this agreement with 14 days written "
            "notice. In the event of termination, Creator will be compensated "
            "for any completed deliverables."
        ),
        "required": True,
        "order": 4,
    },
]


def _hash_clauses(clauses: list) -> str:
    """Generate SHA-256 hash of clauses for audit integrity."""
    canonical = json.dumps(clauses, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


# ── Contract Templates ───────────────────────────────────────


def create_contract_template(
    brand_id: str,
    name: str,
    clauses: list,
    *,
    description: str = "",
) -> Optional[str]:
    """Insert a contract template. Returns template id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "brand_id": brand_id,
        "name": name,
        "description": description or "",
        "clauses": clauses,
    }
    try:
        r = sb.table("contract_templates").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to create contract template: %s", e)
    return None


def list_contract_templates(brand_id: str, limit: int = 50) -> list:
    """List contract templates for a brand, newest first."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("contract_templates")
            .select("id, name, description, clauses, version, is_active, created_at, updated_at")
            .eq("brand_id", brand_id)
            .eq("is_active", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list contract templates: %s", e)
        return []


def get_contract_template(template_id: str, brand_id: str = None) -> Optional[dict]:
    """Get contract template by id. Verifies brand ownership if brand_id provided."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("contract_templates")
            .select("*")
            .eq("id", template_id)
            .execute()
        )
        if not r.data or len(r.data) == 0:
            return None
        row = r.data[0]
        if brand_id and row.get("brand_id") and row["brand_id"] != brand_id:
            return None
        return row
    except Exception as e:
        logger.warning("Failed to get contract template: %s", e)
        return None


def update_contract_template(template_id: str, brand_id: str, updates: dict) -> bool:
    """Update a contract template. Verifies brand ownership. Bumps version on clause changes."""
    sb = get_supabase()
    if not sb:
        return False
    tmpl = get_contract_template(template_id, brand_id=brand_id)
    if not tmpl:
        return False
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "clauses" in updates:
        updates["version"] = (tmpl.get("version") or 1) + 1
    try:
        sb.table("contract_templates").update(updates).eq("id", tmpl["id"]).execute()
        return True
    except Exception as e:
        logger.warning("Failed to update contract template: %s", e)
        return False


def delete_contract_template(template_id: str, brand_id: str) -> bool:
    """Soft-delete (deactivate) a contract template."""
    return update_contract_template(template_id, brand_id, {"is_active": False})


# ── Contract Acceptances ─────────────────────────────────────


def create_acceptance(
    contract_template_id: str,
    campaign_id: str,
    engagement_id: str,
    creator_id: str,
    brand_id: str,
    clauses_snapshot: list,
    *,
    ip_address: str = None,
    user_agent: str = None,
) -> Optional[str]:
    """Record a contract acceptance with full audit trail. Returns acceptance id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "contract_template_id": contract_template_id,
        "campaign_id": campaign_id,
        "engagement_id": engagement_id,
        "creator_id": creator_id,
        "brand_id": brand_id,
        "clauses_snapshot": clauses_snapshot,
        "content_hash": _hash_clauses(clauses_snapshot),
        "accepted_by_ip": ip_address,
        "accepted_by_ua": user_agent,
    }
    try:
        r = sb.table("contract_acceptances").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to create contract acceptance: %s", e)
    return None


def get_acceptance_for_engagement(engagement_id: str) -> Optional[dict]:
    """Get the contract acceptance for a specific engagement."""
    sb = get_supabase()
    if not sb:
        return None
    try:
        r = (
            sb.table("contract_acceptances")
            .select("*")
            .eq("engagement_id", engagement_id)
            .limit(1)
            .execute()
        )
        if r.data and len(r.data) > 0:
            return r.data[0]
    except Exception as e:
        logger.warning("Failed to get contract acceptance: %s", e)
    return None


def list_acceptances_for_campaign(campaign_id: str) -> list:
    """List all contract acceptances for a campaign."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("contract_acceptances")
            .select("*")
            .eq("campaign_id", campaign_id)
            .order("accepted_at", desc=True)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list contract acceptances: %s", e)
        return []
