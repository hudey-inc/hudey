"""Campaign insights tool - Purchase Intent and Comments Relevance analysis.

Used during the campaign phase: analyzes comments on campaign posts to measure
purchase intent and filter relevant comments.

Requires:
  - Campaign posts with content IDs from InsightIQ
  - Product/brand name from campaign brief

Two-stage approach:
  1. Discovery: Brand Fit on top creators (creator_insights.py)
  2. Campaign: Purchase Intent + Comments Relevance (this tool)
"""

import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

from models.actions import AgentAction, ToolResult
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logger = logging.getLogger(__name__)


class CampaignInsightsTool(BaseTool):
    """Analyze campaign posts for Purchase Intent and Comments Relevance.

    Runs InsightIQ analysis on campaign post comments to measure:
    - Purchase Intent: Does the audience show buying interest?
    - Comments Relevance: Which comments genuinely discuss the product?
    """

    action_type = "campaign_insights"

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")
        self._phyllo = None

    def _get_phyllo(self):
        if self._phyllo is None:
            from services.phyllo_client import PhylloClient
            self._phyllo = PhylloClient()
        return self._phyllo

    def analyze_post(
        self,
        content_id: str,
        product_name: str,
        product_description: str = "",
    ) -> dict[str, Any]:
        """Run both Purchase Intent and Comments Relevance on a single post.

        Args:
            content_id: InsightIQ content/post ID
            product_name: Product or brand name being promoted
            product_description: Additional description for context

        Returns:
            Dict with purchase_intent and comments_relevance results.
        """
        phyllo = self._get_phyllo()
        result: dict[str, Any] = {
            "content_id": content_id,
            "product_name": product_name,
            "purchase_intent": None,
            "comments_relevance": None,
        }

        # Purchase Intent
        try:
            pi = phyllo.analyze_purchase_intent(
                content_id=content_id,
                product_name=product_name,
                product_description=product_description,
                max_wait=45,
            )
            if pi:
                result["purchase_intent"] = {
                    "score": pi.get("purchase_intent_score") or pi.get("score"),
                    "intent_count": pi.get("intent_count") or pi.get("purchase_intent_count"),
                    "total_comments": pi.get("total_comments") or pi.get("comments_analyzed"),
                    "intent_percentage": pi.get("intent_percentage") or pi.get("purchase_intent_percentage"),
                    "top_intent_comments": pi.get("top_comments") or pi.get("intent_comments", [])[:5],
                    "raw": pi,
                }
                logger.info("Purchase intent for %s: score=%s", content_id, result["purchase_intent"]["score"])
        except Exception as e:
            logger.warning("Purchase intent failed for %s: %s", content_id, e)

        # Comments Relevance
        try:
            cr = phyllo.analyze_comments_relevance(
                content_id=content_id,
                product_name=product_name,
                product_description=product_description,
                max_wait=45,
            )
            if cr:
                result["comments_relevance"] = {
                    "relevant_count": cr.get("relevant_count") or cr.get("relevant_comments_count"),
                    "total_comments": cr.get("total_comments") or cr.get("comments_analyzed"),
                    "relevance_percentage": cr.get("relevance_percentage") or cr.get("relevant_percentage"),
                    "top_relevant_comments": cr.get("relevant_comments", [])[:10],
                    "sentiment_breakdown": cr.get("sentiment_breakdown") or cr.get("sentiment"),
                    "raw": cr,
                }
                logger.info("Comments relevance for %s: relevant=%s", content_id, result["comments_relevance"]["relevant_count"])
        except Exception as e:
            logger.warning("Comments relevance failed for %s: %s", content_id, e)

        return result

    def analyze_campaign_posts(
        self,
        context: CampaignContext,
        product_name: str,
        product_description: str = "",
    ) -> list[dict[str, Any]]:
        """Analyze all campaign posts for insights.

        Fetches content for each creator, then runs Purchase Intent
        and Comments Relevance on each post.

        Args:
            context: Campaign context with creators and monitoring data
            product_name: Product being promoted
            product_description: Additional context

        Returns:
            List of analysis results per post.
        """
        phyllo = self._get_phyllo()
        if not phyllo.is_configured:
            logger.info("InsightIQ not configured — skipping campaign insights")
            return []

        if "sandbox" in phyllo.base_url:
            logger.info("InsightIQ sandbox — skipping campaign insights")
            return []

        all_results: list[dict[str, Any]] = []

        # Try to get content IDs from monitoring data or fetch fresh
        for creator in context.creators[:10]:
            ext_id = creator.external_id
            if not ext_id:
                continue

            # Fetch recent content
            posts = phyllo.get_creator_content(
                creator_id=str(ext_id),
                platform=creator.platform,
                limit=5,
            )

            for post in posts[:3]:
                content_id = post.get("id") or post.get("content_id") or post.get("external_id")
                if not content_id:
                    continue

                result = self.analyze_post(
                    content_id=str(content_id),
                    product_name=product_name,
                    product_description=product_description,
                )
                result["creator_username"] = creator.username
                result["creator_id"] = creator.id
                result["post_url"] = post.get("url") or post.get("link") or post.get("permalink")
                result["post_metrics"] = {
                    "likes": post.get("likes") or post.get("like_count") or 0,
                    "comments": post.get("comments") or post.get("comment_count") or 0,
                    "shares": post.get("shares") or post.get("share_count") or 0,
                }
                all_results.append(result)

        return all_results

    def _build_summary(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """Build aggregate summary from individual post analyses."""
        summary: dict[str, Any] = {
            "posts_analyzed": len(results),
            "purchase_intent": {
                "avg_score": None,
                "total_intent_comments": 0,
                "total_comments_analyzed": 0,
                "by_creator": [],
            },
            "comments_relevance": {
                "avg_relevance_pct": None,
                "total_relevant": 0,
                "total_analyzed": 0,
                "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
                "by_creator": [],
            },
        }

        pi_scores = []
        cr_pcts = []
        creator_pi: dict[str, list] = {}
        creator_cr: dict[str, list] = {}

        for r in results:
            uname = r.get("creator_username", "unknown")

            # Purchase Intent aggregation
            pi = r.get("purchase_intent")
            if pi:
                score = pi.get("score")
                if score is not None:
                    pi_scores.append(float(score))
                    creator_pi.setdefault(uname, []).append(float(score))
                summary["purchase_intent"]["total_intent_comments"] += int(pi.get("intent_count") or 0)
                summary["purchase_intent"]["total_comments_analyzed"] += int(pi.get("total_comments") or 0)

            # Comments Relevance aggregation
            cr = r.get("comments_relevance")
            if cr:
                pct = cr.get("relevance_percentage")
                if pct is not None:
                    cr_pcts.append(float(pct))
                    creator_cr.setdefault(uname, []).append(float(pct))
                summary["comments_relevance"]["total_relevant"] += int(cr.get("relevant_count") or 0)
                summary["comments_relevance"]["total_analyzed"] += int(cr.get("total_comments") or 0)

                # Sentiment
                sentiment = cr.get("sentiment_breakdown") or {}
                for key in ("positive", "neutral", "negative"):
                    summary["comments_relevance"]["sentiment"][key] += int(sentiment.get(key, 0))

        # Averages
        if pi_scores:
            summary["purchase_intent"]["avg_score"] = round(sum(pi_scores) / len(pi_scores), 1)
        if cr_pcts:
            summary["comments_relevance"]["avg_relevance_pct"] = round(sum(cr_pcts) / len(cr_pcts), 1)

        # Per-creator summaries
        for uname, scores in creator_pi.items():
            summary["purchase_intent"]["by_creator"].append({
                "username": uname,
                "avg_score": round(sum(scores) / len(scores), 1),
                "posts": len(scores),
            })
        for uname, pcts in creator_cr.items():
            summary["comments_relevance"]["by_creator"].append({
                "username": uname,
                "avg_relevance_pct": round(sum(pcts) / len(pcts), 1),
                "posts": len(pcts),
            })

        return summary

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Execute campaign insights analysis."""
        if not context.creators:
            return ToolResult(success=False, error="No creators to analyze")
        if not context.brief:
            return ToolResult(success=False, error="No brief — need product info")

        product_name = (
            action.input.get("product_name")
            or context.brief.brand_name
            or "Product"
        )
        product_desc = action.input.get("product_description") or context.brief.key_message or ""

        try:
            results = self.analyze_campaign_posts(
                context=context,
                product_name=product_name,
                product_description=product_desc,
            )

            summary = self._build_summary(results)

            # Persist results
            path = self.output_dir / f"campaign_insights_{context.campaign_id}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps({
                "campaign_id": context.campaign_id,
                "analyzed_at": datetime.now().isoformat(),
                "summary": summary,
                "posts": results,
            }, indent=2, default=str))

            return ToolResult(
                success=True,
                output={
                    "summary": summary,
                    "posts_analyzed": len(results),
                    "insights_path": str(path),
                },
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))
