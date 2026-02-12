"""Creator discovery tool - find and rank creators."""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from anthropic import Anthropic
from dotenv import load_dotenv

from models.actions import AgentAction, ToolResult
from models.brief import CreatorCriteria
from models.campaign import Creator
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logger = logging.getLogger(__name__)


def _map_phyllo_to_creator(raw: dict) -> Creator:
    """Map InsightIQ API response to Creator model.

    InsightIQ returns fields like:
      platform_username, full_name, external_id, url, follower_count,
      engagement_rate, average_likes, creator_location, contact_details,
      work_platform: {id, name}, introduction, is_verified, gender, language
    """
    # Username: InsightIQ uses platform_username
    username = (
        raw.get("platform_username")
        or raw.get("username")
        or raw.get("handle")
        or str(raw.get("external_id", "unknown"))
    )

    # Platform: extract from work_platform object or fall back
    wp = raw.get("work_platform") or {}
    platform = (
        (wp.get("name") if isinstance(wp, dict) else None)
        or raw.get("platform")
        or "instagram"
    ).lower().replace(" ", "_")

    followers = raw.get("follower_count") or raw.get("subscriber_count") or 0
    eng = raw.get("engagement_rate") or raw.get("avg_engagement")

    # Categories not directly returned by InsightIQ search; use introduction as hint
    categories = raw.get("categories") or []
    if isinstance(categories, str):
        categories = [categories]

    # Location from creator_location or contact_details
    location = raw.get("creator_location")
    if isinstance(location, dict):
        # InsightIQ returns {city, state, country} — join non-null parts
        parts = [location.get("city"), location.get("state"), location.get("country")]
        location = ", ".join(p for p in parts if p) or None
    if not location:
        contact = raw.get("contact_details")
        if isinstance(contact, dict):
            location = contact.get("country") or contact.get("city")

    ext_id = raw.get("external_id") or raw.get("id")

    return Creator(
        id=str(ext_id) if ext_id else None,
        external_id=str(ext_id) if ext_id else None,
        username=str(username),
        platform=platform,
        display_name=raw.get("full_name") or raw.get("display_name") or username,
        follower_count=int(followers) if followers else 0,
        engagement_rate=float(eng) if eng is not None else None,
        categories=categories,
        location=str(location) if location else None,
        email=raw.get("email"),
        profile_data=raw,
    )


RANK_PROMPT = """Analyze these creators for an influencer campaign.

Brand: {brand_name}
Target audience: {target_audience}
Key message: {key_message}

Rank by:
1. Brand fit score (if available — higher is better, 0-100 scale)
2. Audience authenticity (engagement patterns)
3. Content style fit with brand
4. Past brand collaboration history (infer from categories)
5. Growth trajectory (use follower count and engagement as proxy)

Creators (JSON array):
{creators_json}

Return a JSON array of creator usernames in ranked order (best first). Example:
["username1", "username2", "username3"]

Return ONLY the JSON array, no other text."""


class CreatorDiscoveryTool(BaseTool):
    """Find and rank creators for campaigns."""

    action_type = "find_creators"

    def __init__(self, mock_path: Optional[Path] = None):
        self.mock_path = mock_path or Path(".tmp/mock_creators.json")
        self._client = None
        self._phyllo = None

    def _get_phyllo(self):
        if self._phyllo is None:
            from services.phyllo_client import PhylloClient

            self._phyllo = PhylloClient()
        return self._phyllo

    def _get_client(self) -> Optional[Anthropic]:
        if self._client is None and os.getenv("ANTHROPIC_API_KEY"):
            self._client = Anthropic()
        return self._client

    def find_creators(self, criteria: CreatorCriteria) -> list[Creator]:
        """Find creators matching criteria. Uses Phyllo if API key set, else mock.

        Flow: Search → Brand Fit enrichment (top 10) → Claude ranking
        """
        raw: list[Creator] = []

        phyllo = self._get_phyllo()
        if phyllo.is_configured:
            follower_min, follower_max = criteria.follower_range
            phyllo_results = phyllo.search_creators(
                platforms=criteria.platforms,
                follower_min=follower_min,
                follower_max=follower_max,
                categories=criteria.categories or None,
                locations=criteria.locations or None,
                limit=criteria.max_results,
            )
            if phyllo_results:
                raw = [_map_phyllo_to_creator(r) for r in phyllo_results]

        if not raw and self.mock_path.exists():
            data = json.loads(self.mock_path.read_text())
            for c in data:
                if isinstance(c, dict):
                    c = dict(c)
                    c.setdefault("external_id", None)  # Mock has no Phyllo ID
                raw.append(Creator(**c) if isinstance(c, dict) else c)

        # Enrich top creators with Brand Fit before ranking
        if raw and criteria.brand_name:
            raw = self._enrich_brand_fit(raw, criteria)

        return self.agent_rank(raw, criteria)

    def _enrich_brand_fit(
        self, creators: list[Creator], criteria: CreatorCriteria
    ) -> list[Creator]:
        """Enrich top creators with InsightIQ Brand Fit scores.

        Only runs if InsightIQ is configured and not on sandbox.
        Enriches top 10 creators to keep API calls manageable.
        """
        try:
            from tools.creator_insights import CreatorInsightsTool
            insights = CreatorInsightsTool(max_creators=10)
            brand_desc = " ".join(filter(None, [
                criteria.brand_name,
                criteria.target_audience,
                criteria.key_message,
            ]))
            return insights.enrich_with_brand_fit(
                creators=creators,
                brand_name=criteria.brand_name or "Brand",
                brand_description=brand_desc,
            )
        except Exception as e:
            logger.warning("Brand fit enrichment failed: %s", e)
            return creators

    def agent_rank(
        self,
        creators: list[Creator],
        criteria: CreatorCriteria,
    ) -> list[Creator]:
        """Use Claude to rank creators by fit for the campaign."""
        client = self._get_client()
        if not client or not creators:
            return creators[: criteria.max_results]

        creators_data = [
            {
                "username": c.username,
                "platform": c.platform,
                "follower_count": c.follower_count,
                "engagement_rate": c.engagement_rate,
                "categories": c.categories,
                "location": c.location,
                **({"brand_fit_score": c.brand_fit_score} if c.brand_fit_score is not None else {}),
            }
            for c in creators
        ]

        prompt = RANK_PROMPT.format(
            brand_name=criteria.brand_name or "Brand",
            target_audience=criteria.target_audience or "General",
            key_message=criteria.key_message or "Campaign message",
            creators_json=json.dumps(creators_data, indent=2),
        )

        try:
            msg = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
            ranked_usernames = json.loads(text)
        except Exception:
            ranked_usernames = [c.username for c in creators]

        creator_by_username = {c.username: c for c in creators}
        ranked = []
        for u in ranked_usernames:
            if u in creator_by_username:
                ranked.append(creator_by_username[u])
        for c in creators:
            if c not in ranked:
                ranked.append(c)

        return ranked[: criteria.max_results]

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Execute creator discovery."""
        if not context.brief or not context.strategy:
            return ToolResult(success=False, error="Missing brief or strategy")

        criteria = CreatorCriteria(
            platforms=context.brief.platforms,
            follower_range=context.brief.follower_range,
            categories=action.input.get("categories", []),
            locations=action.input.get("locations", []),
            max_results=min(
                context.strategy.creator_count,
                action.input.get("max_results", 20),
            ),
            brand_name=context.brief.brand_name,
            target_audience=context.brief.target_audience,
            key_message=context.brief.key_message,
        )

        try:
            creators = self.find_creators(criteria)
            return ToolResult(
                success=True,
                output={
                    "creators": [c.model_dump() for c in creators],
                    "creator_criteria": criteria.model_dump(),
                },
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
