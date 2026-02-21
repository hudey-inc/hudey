"""Contract template API routes — manage clickwrap contracts."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("/default-clauses")
def get_default_clauses():
    """Return the default clause set for new contracts."""
    from backend.db.repositories.contract_repo import DEFAULT_CLAUSES

    return DEFAULT_CLAUSES


@router.get("/")
@router.get("")
def list_contracts(brand: dict = Depends(get_current_brand)):
    """List all contract templates for the authenticated brand."""
    from backend.db.repositories.contract_repo import list_contract_templates

    return list_contract_templates(brand_id=brand["id"])


@router.get("/{contract_id}")
def get_contract(contract_id: str, brand: dict = Depends(get_current_brand)):
    """Get a single contract template by id."""
    from backend.db.repositories.contract_repo import get_contract_template

    tmpl = get_contract_template(contract_id, brand_id=brand["id"])
    if not tmpl:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return tmpl


@router.post("")
def create_contract(body: dict, brand: dict = Depends(get_current_brand)):
    """Create a new contract template.

    Body: { name: str, description?: str, clauses?: list }
    If clauses omitted, uses default clauses.
    """
    from backend.db.repositories.contract_repo import (
        DEFAULT_CLAUSES,
        create_contract_template,
    )

    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Contract name is required")

    clauses = body.get("clauses")
    if not clauses or not isinstance(clauses, list):
        clauses = DEFAULT_CLAUSES

    cid = create_contract_template(
        brand_id=brand["id"],
        name=name,
        clauses=clauses,
        description=body.get("description", ""),
    )
    if not cid:
        raise HTTPException(status_code=503, detail="Failed to create contract template")
    return {"id": cid}


@router.put("/{contract_id}")
def update_contract(contract_id: str, body: dict, brand: dict = Depends(get_current_brand)):
    """Update a contract template.

    Body: { name?: str, description?: str, clauses?: list }
    """
    from backend.db.repositories.contract_repo import update_contract_template

    updates = {}
    if "name" in body:
        updates["name"] = body["name"]
    if "description" in body:
        updates["description"] = body["description"]
    if "clauses" in body:
        if not isinstance(body["clauses"], list):
            raise HTTPException(status_code=400, detail="clauses must be an array")
        updates["clauses"] = body["clauses"]

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    ok = update_contract_template(contract_id, brand["id"], updates)
    if not ok:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return {"ok": True}


@router.delete("/{contract_id}")
def delete_contract(contract_id: str, brand: dict = Depends(get_current_brand)):
    """Delete (deactivate) a contract template."""
    from backend.db.repositories.contract_repo import delete_contract_template

    ok = delete_contract_template(contract_id, brand_id=brand["id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return {"ok": True}


@router.get("/{contract_id}/acceptances")
def list_acceptances(contract_id: str, brand: dict = Depends(get_current_brand)):
    """List all acceptances for a contract template."""
    from backend.db.repositories.contract_repo import get_contract_template
    from backend.db.client import get_supabase

    tmpl = get_contract_template(contract_id, brand_id=brand["id"])
    if not tmpl:
        raise HTTPException(status_code=404, detail="Contract template not found")

    sb = get_supabase()
    if not sb:
        return []
    try:
        r = (
            sb.table("contract_acceptances")
            .select("*")
            .eq("contract_template_id", contract_id)
            .order("accepted_at", desc=True)
            .execute()
        )
        return r.data or []
    except Exception as e:
        logger.warning("Failed to list acceptances: %s", e)
        return []
