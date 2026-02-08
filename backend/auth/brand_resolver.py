"""Resolve the authenticated user's brand, creating one on first login."""

from backend.db.client import get_supabase


def get_or_create_brand(user_id: str, email: str) -> dict | None:
    """Return the user's brand row. Creates a default brand on first login."""
    sb = get_supabase()
    if not sb:
        return None

    # Look up existing brand
    result = sb.table("brands").select("*").eq("user_id", user_id).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]

    # First login: create a default brand
    brand_name = email.split("@")[0].title() if email else "My Brand"
    insert = sb.table("brands").insert({
        "user_id": user_id,
        "name": brand_name,
    }).execute()

    if insert.data and len(insert.data) > 0:
        return insert.data[0]
    return None
