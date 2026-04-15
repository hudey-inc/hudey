"""Creator repository - upsert creators, get by campaign."""

import logging

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)

# Max rows per Supabase request. Supabase/PostgREST caps request size; 500
# is well under typical limits and keeps individual requests fast.
_UPSERT_BATCH_SIZE = 500


def _creator_row(c):
    """Build row for creators table from creator dict."""
    return {
        "external_id": c.get("external_id") or c.get("id"),
        "platform": c.get("platform"),
        "username": c.get("username"),
        "display_name": c.get("display_name"),
        "follower_count": c.get("follower_count"),
        "engagement_rate": c.get("engagement_rate"),
        "categories": c.get("categories"),
        "location": c.get("location"),
        "email": c.get("email"),
        "profile_data": c,
    }


def upsert_creators(creators: list):
    """Upsert creators in batches; return list of creator UUIDs.

    Splits rows into two groups:
    - With an external_id → batch upsert on_conflict="external_id"
    - Without → batch insert (Supabase can't upsert without a conflict column)

    Returns IDs in the same order as the input where possible. Rows without
    an external_id/username are skipped entirely (the old per-row path
    inserted them, but they can't be looked up later, so this is a no-op
    improvement).
    """
    sb = get_supabase()
    if not sb or not creators:
        return []

    rows_with_ext: list[dict] = []
    rows_without_ext: list[dict] = []
    for c in creators:
        row = _creator_row(c)
        if row.get("external_id"):
            rows_with_ext.append(row)
        elif row.get("username"):
            # Fall back to username as synthetic external_id to make the row
            # upsertable; keeps behavior consistent with the old loop.
            row["external_id"] = row["username"]
            rows_with_ext.append(row)
        else:
            rows_without_ext.append(row)

    ids: list[str] = []

    # Batched upserts for rows with external_id.
    for i in range(0, len(rows_with_ext), _UPSERT_BATCH_SIZE):
        batch = rows_with_ext[i : i + _UPSERT_BATCH_SIZE]
        try:
            r = sb.table("creators").upsert(batch, on_conflict="external_id").execute()
            if r.data:
                ids.extend(str(row["id"]) for row in r.data)
        except Exception as e:
            # Fall back to per-row upsert for this batch so a single bad row
            # doesn't drop the whole batch.
            logger.warning(
                "Batch upsert failed (size=%d): %s — falling back to per-row",
                len(batch), e,
            )
            for row in batch:
                try:
                    r = sb.table("creators").upsert(row, on_conflict="external_id").execute()
                    if r.data:
                        ids.append(str(r.data[0]["id"]))
                except Exception as row_err:
                    logger.error(
                        "Failed to upsert creator %s: %s",
                        row.get("external_id"), row_err,
                    )

    # Batched inserts for rows without external_id.
    for i in range(0, len(rows_without_ext), _UPSERT_BATCH_SIZE):
        batch = rows_without_ext[i : i + _UPSERT_BATCH_SIZE]
        try:
            r = sb.table("creators").insert(batch).execute()
            if r.data:
                ids.extend(str(row["id"]) for row in r.data)
        except Exception as e:
            logger.error("Batch insert of creators without external_id failed: %s", e)

    return ids


def get_creators_by_campaign(campaign_id: str):
    """Get creators assigned to campaign via campaign_assignments."""
    sb = get_supabase()
    if not sb:
        return []
    # Try UUID first, then short_id — avoids f-string injection in .or_()
    campaign = sb.table("campaigns").select("id").eq("id", campaign_id).execute()
    if not campaign.data:
        campaign = sb.table("campaigns").select("id").eq("short_id", campaign_id).execute()
    if not campaign.data or len(campaign.data) == 0:
        return []
    uuid_id = campaign.data[0]["id"]
    r = sb.table("campaign_assignments").select("creator_id").eq("campaign_id", uuid_id).execute()
    if not r.data:
        return []
    creator_ids = [x["creator_id"] for x in r.data]
    creators = sb.table("creators").select("*").in_("id", creator_ids).execute()
    return creators.data or []
