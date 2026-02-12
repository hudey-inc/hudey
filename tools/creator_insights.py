"""Creator insights tool - enrich creators with Brand Fit scores from InsightIQ.

Used during the discovery phase: after initial search + Claude ranking,
the top N creators are enriched with brand fit analysis from InsightIQ.
This provides data-driven brand compatibility scoring to complement
the AI-based ranking.

Two-stage approach:
  1. Discovery: Brand Fit on top 10 ranked creators (this tool)
  2. Campaign: Purchase Intent + Comments Relevance (campaign_insights.py)
"""

import json
import logging
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

from models.actions import AgentAction, ToolResult
from models.campaign import Creator
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logger = logging.getLogger(__name__)


class CreatorInsightsTool(BaseTool):
    """Enrich creators with InsightIQ Brand Fit analysis.

    Runs brand fit analysis on the top N creators after discovery
    to provide data-driven brand compatibility scores.
    """

    action_type = "creator_insights"

    def __init__(self, max_creators: int = 10):
        self.max_creators = max_creators
        self._phyllo = None

    def _get_phyllo(self):
        if self._phyllo is None:
            from services.phyllo_client import PhylloClient
            self._phyllo = PhylloClient()
        return self._phyllo

    def enrich_with_brand_fit(
        self,
        creators: list[Creator],
        brand_name: str,
        brand_description: str,
        max_creators: Optional[int] = None,
    ) -> list[Creator]:
        """Run brand fit analysis on top creators and attach scores.

        Only processes creators with external_id (InsightIQ profile ID).
        Skips sandbox environments.

        Args:
            creators: Ranked list of creators (best first)
            brand_name: Brand/company name
            brand_description: Brand description, industry, target audience
            max_creators: Override for how many top creators to enrich

        Returns:
            Same list with brand_fit_score and brand_fit_data populated
            for successfully analyzed creators.
        """
        phyllo = self._get_phyllo()
        if not phyllo.is_configured:
            logger.info("InsightIQ not configured — skipping brand fit enrichment")
            return creators

        if "sandbox" in phyllo.base_url:
            logger.info("InsightIQ sandbox — skipping brand fit (not supported)")
            return creators

        limit = max_creators or self.max_creators
        enriched = 0

        for creator in creators[:limit]:
            ext_id = creator.external_id
            if not ext_id:
                continue

            # Resolve platform to work_platform_id for better results
            wp_id = phyllo.PLATFORM_IDS.get(creator.platform)

            try:
                result = phyllo.analyze_brand_fit(
                    creator_id=ext_id,
                    brand_name=brand_name,
                    brand_description=brand_description,
                    work_platform_id=wp_id,
                    max_wait=45,
                )
                if result:
                    # Extract score — InsightIQ returns various formats
                    score = (
                        result.get("brand_fit_score")
                        or result.get("score")
                        or result.get("overall_score")
                        or result.get("compatibility_score")
                    )
                    if score is not None:
                        creator.brand_fit_score = float(score)
                    creator.brand_fit_data = result
                    enriched += 1
                    logger.info(
                        "Brand fit for %s: score=%s",
                        creator.username,
                        creator.brand_fit_score,
                    )
            except Exception as e:
                logger.warning("Brand fit failed for %s: %s", creator.username, e)

        logger.info("Brand fit enrichment complete: %d/%d creators", enriched, min(limit, len(creators)))
        return creators

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Execute brand fit enrichment on discovered creators."""
        if not context.creators:
            return ToolResult(success=False, error="No creators to enrich")
        if not context.brief:
            return ToolResult(success=False, error="No brief — need brand info")

        brand_name = context.brief.brand_name or "Brand"
        brand_desc = " ".join(filter(None, [
            context.brief.brand_name,
            context.brief.industry if hasattr(context.brief, "industry") else None,
            context.brief.target_audience,
            context.brief.key_message,
        ]))

        max_creators = action.input.get("max_creators", self.max_creators)

        try:
            enriched = self.enrich_with_brand_fit(
                creators=context.creators,
                brand_name=brand_name,
                brand_description=brand_desc,
                max_creators=max_creators,
            )

            # Build summary
            scores = [
                {"username": c.username, "brand_fit_score": c.brand_fit_score}
                for c in enriched
                if c.brand_fit_score is not None
            ]

            return ToolResult(
                success=True,
                output={
                    "enriched_count": len(scores),
                    "total_creators": len(enriched),
                    "brand_fit_scores": scores,
                    "creators": [c.model_dump() for c in enriched],
                },
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
