"""Routes incoming creator responses to the correct campaign and engagement."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# Ensure project root on path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.campaign import CreatorEngagement, EngagementStatus


def _default_tmp() -> Path:
    return Path(__file__).resolve().parent.parent / ".tmp"


def _load_message_mapping(tmp_dir: Path) -> dict[str, dict[str, str]]:
    """Load message_id -> {campaign_id, creator_id, email} mapping."""
    path = tmp_dir / "outreach_message_ids.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}


def _load_engagements(tmp_dir: Path, campaign_id: str) -> dict[str, dict]:
    """Load engagements for a campaign."""
    path = tmp_dir / "campaign_engagements" / f"{campaign_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text())
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _save_engagements(tmp_dir: Path, campaign_id: str, engagements: dict[str, dict]) -> None:
    """Persist engagements for a campaign."""
    path = tmp_dir / "campaign_engagements" / f"{campaign_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(engagements, indent=2))


def _lookup_by_email(tmp_dir: Path, from_email: str) -> Optional[tuple[str, str]]:
    """Find (campaign_id, creator_id) by creator email from outreach_sent files."""
    sent_dir = tmp_dir
    for f in sent_dir.glob("outreach_sent_*.json"):
        try:
            data = json.loads(f.read_text())
            messages = data.get("messages", [])
            for m in messages:
                if (m.get("email") or "").lower().strip() == from_email.lower().strip():
                    campaign_id = f.stem.replace("outreach_sent_", "")
                    return (campaign_id, m.get("creator_id", ""))
        except (json.JSONDecodeError, KeyError):
            continue
    return None


def ingest_response(
    body: str,
    *,
    message_id: Optional[str] = None,
    from_email: Optional[str] = None,
    timestamp: Optional[str] = None,
    tmp_dir: Optional[Path] = None,
) -> dict[str, Any]:
    """
    Route an incoming creator response to the correct campaign/engagement.

    Args:
        body: Reply text from creator
        message_id: Resend message ID (In-Reply-To) for lookup
        from_email: Creator email (fallback when message_id not available)
        timestamp: ISO timestamp; defaults to now
        tmp_dir: Override .tmp directory

    Returns:
        {"success": bool, "campaign_id": str, "creator_id": str, "engagement": dict} or error
    """
    tmp = tmp_dir or _default_tmp()
    ts = timestamp or datetime.now(timezone.utc).isoformat()

    campaign_id: Optional[str] = None
    creator_id: Optional[str] = None

    if message_id:
        mapping = _load_message_mapping(tmp)
        entry = mapping.get(message_id)
        if entry:
            campaign_id = entry.get("campaign_id")
            creator_id = entry.get("creator_id")

    if not campaign_id and from_email:
        lookup = _lookup_by_email(tmp, from_email)
        if lookup:
            campaign_id, creator_id = lookup

    if not campaign_id or not creator_id:
        return {
            "success": False,
            "error": "Could not resolve campaign/creator from message_id or from_email",
        }

    engagements = _load_engagements(tmp, campaign_id)
    cid = str(creator_id)
    raw = engagements.get(cid, {})
    eng = CreatorEngagement(
        creator_id=cid,
        status=EngagementStatus(raw.get("status", "responded")),
        latest_proposal=raw.get("latest_proposal"),
        terms=raw.get("terms"),
        message_history=list(raw.get("message_history", [])),
        response_timestamp=raw.get("response_timestamp"),
        notes=raw.get("notes"),
    )

    eng.message_history.append({
        "from": "creator",
        "body": body,
        "timestamp": ts,
    })
    eng.response_timestamp = ts
    eng.status = EngagementStatus.RESPONDED

    engagements[cid] = eng.model_dump()
    _save_engagements(tmp, campaign_id, engagements)

    return {
        "success": True,
        "campaign_id": campaign_id,
        "creator_id": cid,
        "engagement": eng.model_dump(),
    }
