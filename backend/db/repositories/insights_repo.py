"""Campaign insights repository — persist InsightIQ analysis to DB.

Stores per-post Purchase Intent and Comments Relevance results in the
campaign_insights table (created in migration 007).
"""

import logging
from typing import Optional

from backend.db.client import get_supabase

logger = logging.getLogger(__name__)


def save_insight(
    campaign_id: str,
    insight_type: str,
    *,
    creator_id: Optional[str] = None,
    content_id: Optional[str] = None,
    post_url: Optional[str] = None,
    score: Optional[float] = None,
    data: Optional[dict] = None,
) -> Optional[str]:
    """Insert a campaign insight row. Returns insight id or None."""
    sb = get_supabase()
    if not sb:
        return None
    row = {
        "campaign_id": campaign_id,
        "insight_type": insight_type,
    }
    if creator_id:
        row["creator_id"] = creator_id
    if content_id:
        row["content_id"] = content_id
    if post_url:
        row["post_url"] = post_url
    if score is not None:
        row["score"] = score
    if data:
        row["data"] = data
    try:
        r = sb.table("campaign_insights").insert(row).execute()
        if r.data and len(r.data) > 0:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning("Failed to save campaign insight: %s", e)
    return None


def save_post_insights(campaign_id: str, post_result: dict) -> list[str]:
    """Save both purchase_intent and comments_relevance for a single post.

    Args:
        campaign_id: UUID of the campaign
        post_result: Dict from CampaignInsightsTool.analyze_post() with keys:
            content_id, creator_id, post_url, purchase_intent, comments_relevance

    Returns:
        List of created insight IDs.
    """
    ids = []
    content_id = post_result.get("content_id")
    creator_id = post_result.get("creator_id")
    post_url = post_result.get("post_url")

    # Purchase Intent
    pi = post_result.get("purchase_intent")
    if pi:
        iid = save_insight(
            campaign_id,
            "purchase_intent",
            creator_id=str(creator_id) if creator_id else None,
            content_id=content_id,
            post_url=post_url,
            score=pi.get("score"),
            data={k: v for k, v in pi.items() if k != "raw"},
        )
        if iid:
            ids.append(iid)

    # Comments Relevance
    cr = post_result.get("comments_relevance")
    if cr:
        iid = save_insight(
            campaign_id,
            "comments_relevance",
            creator_id=str(creator_id) if creator_id else None,
            content_id=content_id,
            post_url=post_url,
            score=cr.get("relevance_percentage"),
            data={k: v for k, v in cr.items() if k != "raw"},
        )
        if iid:
            ids.append(iid)

    return ids


def get_insights(campaign_id: str, insight_type: Optional[str] = None) -> list[dict]:
    """Get campaign insights, optionally filtered by type."""
    sb = get_supabase()
    if not sb:
        return []
    try:
        q = (
            sb.table("campaign_insights")
            .select("*")
            .eq("campaign_id", campaign_id)
        )
        if insight_type:
            q = q.eq("insight_type", insight_type)
        r = q.order("analyzed_at", desc=True).execute()
        return r.data or []
    except Exception as e:
        logger.warning("Failed to get campaign insights: %s", e)
        return []


def get_insights_summary(campaign_id: str) -> dict:
    """Build an aggregate summary from stored insights for a campaign.

    Returns a dict matching the shape the frontend/analytics expect:
    {
        posts_analyzed: int,
        purchase_intent: { avg_score, total_intent_comments, ... },
        comments_relevance: { avg_relevance_pct, total_relevant, ... },
    }
    """
    rows = get_insights(campaign_id)
    if not rows:
        return {}

    pi_scores = []
    pi_total_intent = 0
    pi_total_analyzed = 0
    cr_pcts = []
    cr_total_relevant = 0
    cr_total_analyzed = 0
    sentiment = {"positive": 0, "neutral": 0, "negative": 0}
    content_ids = set()

    for row in rows:
        data = row.get("data") or {}
        content_ids.add(row.get("content_id"))

        if row["insight_type"] == "purchase_intent":
            score = row.get("score") or data.get("score")
            if score is not None:
                pi_scores.append(float(score))
            pi_total_intent += int(data.get("intent_count", 0))
            pi_total_analyzed += int(data.get("total_comments", 0))

        elif row["insight_type"] == "comments_relevance":
            pct = row.get("score") or data.get("relevance_percentage")
            if pct is not None:
                cr_pcts.append(float(pct))
            cr_total_relevant += int(data.get("relevant_count", 0))
            cr_total_analyzed += int(data.get("total_comments", 0))
            sb = data.get("sentiment_breakdown") or {}
            for key in ("positive", "neutral", "negative"):
                sentiment[key] += int(sb.get(key, 0))

    summary = {
        "posts_analyzed": len(content_ids),
        "purchase_intent": {
            "avg_score": round(sum(pi_scores) / len(pi_scores), 1) if pi_scores else None,
            "total_intent_comments": pi_total_intent,
            "total_comments_analyzed": pi_total_analyzed,
        },
        "comments_relevance": {
            "avg_relevance_pct": round(sum(cr_pcts) / len(cr_pcts), 1) if cr_pcts else None,
            "total_relevant": cr_total_relevant,
            "total_analyzed": cr_total_analyzed,
            "sentiment": sentiment,
        },
    }
    return summary
