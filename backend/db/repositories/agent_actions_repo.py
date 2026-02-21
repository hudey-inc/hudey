"""Agent actions repository - log actions for audit trail."""

from backend.db.client import get_supabase


def log_action(campaign_id: str, action_type: str, action_input: dict, action_output: dict = None, reasoning: str = None):
    """Append one row to agent_actions."""
    sb = get_supabase()
    if not sb:
        return False
    # Try UUID first, then short_id — avoids f-string injection in .or_()
    campaign = sb.table("campaigns").select("id").eq("id", campaign_id).execute()
    if not campaign.data:
        campaign = sb.table("campaigns").select("id").eq("short_id", campaign_id).execute()
    if not campaign.data or len(campaign.data) == 0:
        return False
    uuid_id = campaign.data[0]["id"]
    row = {
        "campaign_id": uuid_id,
        "action_type": action_type,
        "action_input": action_input or {},
        "action_output": action_output or {},
        "reasoning": reasoning,
    }
    sb.table("agent_actions").insert(row).execute()
    return True
