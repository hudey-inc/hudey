"""Campaign monitoring tool - track creator posts and metrics via Phyllo or mock."""

import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.actions import AgentAction, AgentActionType, ToolResult
from models.context import CampaignContext
from tools.base import BaseTool


def _map_phyllo_content_to_update(creator_dict: dict, post: dict, platform: str) -> dict:
    """Map Phyllo content/engagement item to monitor_updates structure."""
    return {
        "creator": creator_dict,
        "posted": True,
        "platform": platform,
        "post_link": (
            post.get("url")
            or post.get("link")
            or post.get("permalink")
            or f"https://{platform}.com/{creator_dict.get('username', '')}/posts/{post.get('id', '')}"
        ),
        "posted_at": (
            post.get("published_at")
            or post.get("created_at")
            or post.get("timestamp")
            or datetime.now().isoformat()
        ),
        "metrics": {
            "likes": post.get("likes") or post.get("like_count") or 0,
            "comments": post.get("comments") or post.get("comment_count") or 0,
            "shares": post.get("shares") or post.get("share_count") or 0,
            "saves": post.get("saves") or post.get("save_count") or 0,
        },
        "compliance": {
            "hashtags": bool(post.get("hashtags") or post.get("caption")),
            "mentions": bool(post.get("mentions") or post.get("caption")),
            "deliverables_met": True,
        },
    }


class CampaignMonitorTool(BaseTool):
    """Simulate tracking creator posts and collecting metrics."""

    action_type = AgentActionType.MONITOR_CAMPAIGN.value

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")
        self._phyllo = None

    def _get_phyllo(self):
        if self._phyllo is None:
            from services.phyllo_client import PhylloClient

            self._phyllo = PhylloClient()
        return self._phyllo

    def can_handle(self, action_type: str) -> bool:
        return action_type == self.action_type

    def _fetch_from_phyllo(self, context: CampaignContext) -> Optional[list[dict]]:
        """Fetch real content metrics from Phyllo. Returns None to trigger mock fallback."""
        phyllo = self._get_phyllo()
        if not phyllo.is_configured:
            return None

        updates = []
        for creator in context.creators:
            ext_id = getattr(creator, "external_id", None) or (
                (creator.profile_data or {}).get("phyllo_id")
                if creator.profile_data
                else None
            )
            creator_dict = creator.model_dump()
            empty_update = {
                "creator": creator_dict,
                "posted": False,
                "platform": creator.platform,
                "post_link": "",
                "posted_at": None,
                "metrics": {"likes": 0, "comments": 0, "shares": 0, "saves": 0},
                "compliance": {"hashtags": False, "mentions": False, "deliverables_met": False},
            }

            if not ext_id:
                updates.append(empty_update)
                continue

            posts = phyllo.get_creator_content(
                creator_id=str(ext_id),
                platform=creator.platform,
                limit=10,
            )
            if posts:
                for post in posts[:3]:
                    updates.append(
                        _map_phyllo_content_to_update(
                            creator_dict, post, creator.platform
                        )
                    )
            else:
                updates.append(empty_update)

        return updates if updates else None

    def _generate_mock_updates(self, context: CampaignContext) -> list[dict]:
        """Generate mock monitor updates (fallback)."""
        updates = []
        base_time = datetime.now()
        for creator in context.creators:
            posted = random.random() > 0.2
            updates.append(
                {
                    "creator": creator.model_dump(),
                    "posted": posted,
                    "platform": creator.platform,
                    "post_link": f"https://{creator.platform}.com/{creator.username}/posts/mock",
                    "posted_at": (base_time + timedelta(minutes=random.randint(0, 120))).isoformat(),
                    "metrics": {
                        "likes": random.randint(500, 3000) if posted else 0,
                        "comments": random.randint(20, 200) if posted else 0,
                        "shares": random.randint(5, 50) if posted else 0,
                        "saves": random.randint(10, 80) if posted else 0,
                    },
                    "compliance": {
                        "hashtags": posted and random.random() > 0.1,
                        "mentions": posted and random.random() > 0.1,
                        "deliverables_met": posted,
                    },
                }
            )
        return updates

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Fetch monitor updates from Phyllo or generate mock."""
        if not context.creators:
            return ToolResult(success=False, error="No creators to monitor")

        updates = self._fetch_from_phyllo(context)
        if updates is None:
            updates = self._generate_mock_updates(context)

        path = self.output_dir / f"monitor_updates_{context.campaign_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(updates, indent=2))

        return ToolResult(
            success=True,
            output={
                "monitor_updates": updates,
                "monitor_path": str(path),
                "state": "campaign_active",
            },
        )
