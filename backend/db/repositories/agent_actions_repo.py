"""Agent actions repository - log actions for audit trail."""

from backend.db.client import get_supabase


def log_action(campaign_id: str, action_type: str, action_input: dict, action_output: dict = None, reasoning: str = None):
    """Append one row to agent_actions."""
    sb = get_supabase()
    if not sb:
        return False
    campaign = sb.table("campaigns").select("id").or_(f"id.eq.{campaign_id},short_id.eq.{campaign_id}").execute()
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
