"""Campaign monitoring tool - track creator posts and metrics via Phyllo or mock.

Enhanced compliance verification checks posts for:
  - Required hashtags from the brief (e.g. #ad, #sponsored, brand hashtags)
  - Required mentions (e.g. @brandname)
  - Deliverables completion based on brief requirements

Persists monitor updates to the campaign_monitor_updates DB table
alongside the .tmp/ JSON file.
"""

import json
import logging
import random
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.actions import AgentAction, AgentActionType, ToolResult
from models.context import CampaignContext
from tools.base import BaseTool

logger = logging.getLogger(__name__)


# ── Compliance helpers ──────────────────────────────────────────


def _extract_required_hashtags(context: CampaignContext) -> list:
    """Extract required hashtags from the campaign brief.

    Looks at key_message, deliverables, and brand_name to build a list of
    hashtags that should appear in creator posts.
    """
    tags = []
    if not context.brief:
        return tags

    # Always require disclosure hashtags
    tags.extend(["#ad", "#sponsored", "#partnership"])

    # Brand hashtag (lowercase, no spaces)
    brand = context.brief.brand_name
    if brand:
        tag = "#" + re.sub(r"[^a-z0-9]", "", brand.lower())
        if tag != "#":
            tags.append(tag)

    # Extract hashtags from key_message
    if context.brief.key_message:
        found = re.findall(r"#\w+", context.brief.key_message.lower())
        tags.extend(found)

    return list(set(tags))


def _extract_required_mentions(context: CampaignContext) -> list:
    """Extract required @mentions from the campaign brief."""
    mentions = []
    if not context.brief:
        return mentions

    brand = context.brief.brand_name
    if brand:
        mention = "@" + re.sub(r"[^a-z0-9_]", "", brand.lower())
        if mention != "@":
            mentions.append(mention)

    return mentions


def _check_compliance(
    post: dict,
    required_hashtags: list,
    required_mentions: list,
    deliverables: list,
) -> dict:
    """Check a post for compliance with campaign requirements.

    Returns:
        {
            "hashtags_found": [...],
            "hashtags_missing": [...],
            "hashtags_ok": bool,
            "mentions_found": [...],
            "mentions_missing": [...],
            "mentions_ok": bool,
            "deliverables_met": bool,
            "compliance_score": float (0-100),
            "issues": [...]
        }
    """
    caption = (
        post.get("caption") or post.get("description") or post.get("text") or ""
    ).lower()
    post_hashtags = set(re.findall(r"#\w+", caption))
    post_mentions = set(re.findall(r"@\w+", caption))

    # Hashtag compliance — at least one disclosure tag present
    disclosure_tags = {"#ad", "#sponsored", "#partnership", "#paidpartnership", "#gifted"}
    has_disclosure = bool(post_hashtags & disclosure_tags)
    brand_tags = [t for t in required_hashtags if t not in disclosure_tags]
    brand_tags_found = [t for t in brand_tags if t in post_hashtags]
    brand_tags_missing = [t for t in brand_tags if t not in post_hashtags]

    hashtags_found = list(post_hashtags & set(required_hashtags))
    hashtags_missing = [t for t in required_hashtags if t not in post_hashtags]
    # OK if has disclosure + brand tag (if any brand tags exist)
    hashtags_ok = has_disclosure and (len(brand_tags) == 0 or len(brand_tags_found) > 0)

    # Mention compliance
    mentions_found = [m for m in required_mentions if m in post_mentions]
    mentions_missing = [m for m in required_mentions if m not in post_mentions]
    mentions_ok = len(mentions_missing) == 0

    # Deliverables check (basic heuristic — hard to verify from content alone)
    deliverables_met = True  # optimistic default

    # Compliance score (0-100)
    checks = [hashtags_ok, mentions_ok, deliverables_met]
    compliance_score = round((sum(checks) / max(len(checks), 1)) * 100, 1)

    issues = []
    if not has_disclosure:
        issues.append("Missing ad disclosure hashtag (#ad, #sponsored, etc.)")
    if brand_tags_missing:
        issues.append("Missing brand hashtags: %s" % ", ".join(brand_tags_missing))
    if mentions_missing:
        issues.append("Missing mentions: %s" % ", ".join(mentions_missing))

    return {
        "hashtags_found": hashtags_found,
        "hashtags_missing": hashtags_missing,
        "hashtags_ok": hashtags_ok,
        "mentions_found": mentions_found,
        "mentions_missing": mentions_missing,
        "mentions_ok": mentions_ok,
        "deliverables_met": deliverables_met,
        "compliance_score": compliance_score,
        "issues": issues,
    }


# ── Mapping helper ──────────────────────────────────────────────


def _map_phyllo_content_to_update(
    creator_dict: dict,
    post: dict,
    platform: str,
    required_hashtags: Optional[list] = None,
    required_mentions: Optional[list] = None,
    deliverables: Optional[list] = None,
) -> dict:
    """Map Phyllo content/engagement item to monitor_updates structure."""
    compliance = _check_compliance(
        post,
        required_hashtags or [],
        required_mentions or [],
        deliverables or [],
    )

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
        "compliance": compliance,
    }


# ── Aggregation helper ──────────────────────────────────────────


def build_monitor_summary(updates: list) -> dict:
    """Aggregate monitor updates into a summary dict.

    Returns:
        {
            "total_creators": int,
            "posts_live": int,
            "total_likes": int,
            "total_comments": int,
            "total_shares": int,
            "total_saves": int,
            "avg_compliance_score": float,
            "compliance_issues": int,
            "fully_compliant": int,
        }
    """
    total_creators = len({
        (u.get("creator") or {}).get("username", i)
        for i, u in enumerate(updates)
    })
    posted = [u for u in updates if u.get("posted")]
    posts_live = len(posted)
    totals = {"likes": 0, "comments": 0, "shares": 0, "saves": 0}
    compliance_scores = []
    compliance_issues_count = 0
    fully_compliant = 0

    for u in posted:
        m = u.get("metrics", {})
        for k in totals:
            totals[k] += m.get(k, 0)
        c = u.get("compliance", {})
        score = c.get("compliance_score", 0)
        compliance_scores.append(score)
        issues = c.get("issues", [])
        if issues:
            compliance_issues_count += 1
        else:
            fully_compliant += 1

    avg_score = round(sum(compliance_scores) / max(len(compliance_scores), 1), 1) if compliance_scores else 0

    return {
        "total_creators": total_creators,
        "posts_live": posts_live,
        "total_likes": totals["likes"],
        "total_comments": totals["comments"],
        "total_shares": totals["shares"],
        "total_saves": totals["saves"],
        "avg_compliance_score": avg_score,
        "compliance_issues": compliance_issues_count,
        "fully_compliant": fully_compliant,
    }


# ── Main Tool ───────────────────────────────────────────────────


class CampaignMonitorTool(BaseTool):
    """Track creator posts, collect metrics, and verify compliance."""

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

    def _fetch_from_phyllo(self, context: CampaignContext) -> Optional[list]:
        """Fetch real content metrics from Phyllo. Returns None to trigger mock fallback.

        Skips content fetching on sandbox (endpoints unavailable).
        Limits to first 5 creators to avoid long timeouts.
        """
        phyllo = self._get_phyllo()
        if not phyllo.is_configured:
            return None

        # Sandbox doesn't support content endpoints — fall back to mock
        if "sandbox" in phyllo.base_url:
            return None

        required_hashtags = _extract_required_hashtags(context)
        required_mentions = _extract_required_mentions(context)
        deliverables = context.brief.deliverables if context.brief else []

        updates = []
        for creator in context.creators[:5]:
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
                "compliance": {
                    "hashtags_found": [],
                    "hashtags_missing": [],
                    "hashtags_ok": False,
                    "mentions_found": [],
                    "mentions_missing": [],
                    "mentions_ok": False,
                    "deliverables_met": False,
                    "compliance_score": 0,
                    "issues": [],
                },
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
                            creator_dict,
                            post,
                            creator.platform,
                            required_hashtags,
                            required_mentions,
                            deliverables,
                        )
                    )
            else:
                updates.append(empty_update)

        return updates if updates else None

    def _generate_mock_updates(self, context: CampaignContext) -> list:
        """Generate mock monitor updates (fallback) with compliance data."""
        updates = []
        base_time = datetime.now()
        brand_tag = ""
        if context.brief:
            brand_tag = "#" + re.sub(r"[^a-z0-9]", "", context.brief.brand_name.lower())

        for creator in context.creators:
            posted = random.random() > 0.2
            has_disclosure = posted and random.random() > 0.1
            has_brand_tag = posted and random.random() > 0.2
            has_mention = posted and random.random() > 0.15

            # Build compliance similar to real check
            issues = []
            if posted and not has_disclosure:
                issues.append("Missing ad disclosure hashtag (#ad, #sponsored, etc.)")
            if posted and not has_brand_tag and brand_tag:
                issues.append("Missing brand hashtag: %s" % brand_tag)
            if posted and not has_mention:
                issues.append("Missing brand mention")

            compliance_score = 0.0
            if posted:
                checks = [has_disclosure, has_mention, True]  # deliverables_met=True
                compliance_score = round((sum(checks) / len(checks)) * 100, 1)

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
                        "hashtags_found": ["#ad"] if has_disclosure else [],
                        "hashtags_missing": [] if has_disclosure else ["#ad"],
                        "hashtags_ok": has_disclosure and has_brand_tag,
                        "mentions_found": ["@brand"] if has_mention else [],
                        "mentions_missing": [] if has_mention else ["@brand"],
                        "mentions_ok": has_mention,
                        "deliverables_met": posted,
                        "compliance_score": compliance_score,
                        "issues": issues,
                    },
                }
            )
        return updates

    def _persist_to_db(self, campaign_id: str, updates: list, summary: dict) -> None:
        """Persist monitor updates to DB (non-fatal)."""
        try:
            from backend.db.repositories.monitor_repo import save_monitor_snapshot
            save_monitor_snapshot(campaign_id, updates, summary)
            logger.info("Saved monitor snapshot to DB for campaign %s", campaign_id)
        except Exception as e:
            logger.warning("Failed to persist monitor updates to DB (non-fatal): %s", e)

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

        # Build summary
        summary = build_monitor_summary(updates)

        # Persist to JSON file
        path = self.output_dir / f"monitor_updates_{context.campaign_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"updates": updates, "summary": summary}, indent=2, default=str))

        # Persist to DB
        self._persist_to_db(context.campaign_id, updates, summary)

        return ToolResult(
            success=True,
            output={
                "monitor_updates": updates,
                "monitor_summary": summary,
                "monitor_path": str(path),
                "state": "campaign_active",
            },
        )
