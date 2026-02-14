"""Analytics API routes — aggregated dashboard data in a single call."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from backend.auth.current_brand import get_current_brand

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def analytics_dashboard(brand: dict = Depends(get_current_brand)):
    """Return all analytics data in one response.

    Replaces the N+2 frontend pattern (listCampaigns → per-campaign
    email + engagements + campaign detail + monitor) with a single
    backend query that aggregates everything server-side.
    """
    from backend.db.repositories.campaign_repo import list_campaigns, get_campaign
    from backend.db.repositories.email_event_repo import get_delivery_summary
    from backend.db.repositories.engagement_repo import get_engagements
    from backend.db.repositories.monitor_repo import get_monitor_summary

    brand_id = brand["id"]
    campaigns = list_campaigns(brand_id=brand_id)

    # Aggregation accumulators
    by_status: dict[str, int] = {}
    total_sent = 0
    total_delivered = 0
    total_opened = 0
    total_clicked = 0
    total_bounced = 0
    total_contacted = 0
    total_agreed = 0
    total_declined = 0
    total_responded = 0
    engagement_funnel: dict[str, int] = {}
    platform_map: dict[str, dict] = {}
    response_times: list[float] = []

    # Content performance
    total_posts_live = 0
    cp_total_likes = 0
    cp_total_comments = 0
    cp_total_shares = 0
    cp_total_saves = 0
    total_compliance_issues = 0
    total_fully_compliant = 0
    compliance_scores: list[float] = []

    # Budget tracking
    total_budget = 0.0
    overall_agreed_fees = 0.0

    # Per-campaign breakdown lists
    per_campaign = []
    email_breakdown = []
    all_creators = []
    content_per_campaign = []
    budget_per_campaign = []

    for c in campaigns:
        cid = c["id"]
        cname = c.get("name", "Campaign")
        cstatus = c.get("status", "draft")

        by_status[cstatus] = by_status.get(cstatus, 0) + 1

        # Fetch per-campaign data (server-side, no network overhead)
        try:
            email = get_delivery_summary(cid)
        except Exception:
            email = {"total_sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "per_creator": []}

        try:
            engagements = get_engagements(cid)
        except Exception:
            engagements = []

        try:
            campaign_detail = get_campaign(cid, brand_id=brand_id)
        except Exception:
            campaign_detail = None

        try:
            monitor = get_monitor_summary(cid)
        except Exception:
            monitor = {}

        # Email totals
        total_sent += email.get("total_sent", 0)
        total_delivered += email.get("delivered", 0)
        total_opened += email.get("opened", 0)
        total_clicked += email.get("clicked", 0)
        total_bounced += email.get("bounced", 0)

        email_breakdown.append({
            "campaignId": cid,
            "campaignName": cname,
            "sent": email.get("total_sent", 0),
            "delivered": email.get("delivered", 0),
            "opened": email.get("opened", 0),
            "clicked": email.get("clicked", 0),
            "bounced": email.get("bounced", 0),
        })

        # Engagement stats
        total_contacted += len(engagements)
        responded = sum(1 for e in engagements if e.get("status") != "contacted")
        agreed = sum(1 for e in engagements if e.get("status") == "agreed")
        declined = sum(1 for e in engagements if e.get("status") == "declined")
        total_agreed += agreed
        total_declined += declined
        total_responded += responded

        e_sent = email.get("total_sent", 0)
        per_campaign.append({
            "id": cid,
            "name": cname,
            "status": cstatus,
            "creators": len(engagements),
            "responded": responded,
            "agreed": agreed,
            "emailsSent": e_sent,
            "openRate": round((email.get("opened", 0) / e_sent) * 100) if e_sent > 0 else 0,
        })

        # Process each engagement
        for e in engagements:
            e_status = e.get("status", "contacted")
            engagement_funnel[e_status] = engagement_funnel.get(e_status, 0) + 1

            # Platform breakdown
            plat = (e.get("platform") or "unknown").lower()
            if plat not in platform_map:
                platform_map[plat] = {"creators": 0, "responded": 0, "agreed": 0, "declined": 0}
            platform_map[plat]["creators"] += 1
            if e_status != "contacted":
                platform_map[plat]["responded"] += 1
            if e_status == "agreed":
                platform_map[plat]["agreed"] += 1
            if e_status == "declined":
                platform_map[plat]["declined"] += 1

            # Response time
            response_time_hours = None
            rt = e.get("response_timestamp")
            ca = e.get("created_at")
            if rt and ca:
                try:
                    from datetime import datetime
                    rt_dt = datetime.fromisoformat(rt.replace("Z", "+00:00"))
                    ca_dt = datetime.fromisoformat(ca.replace("Z", "+00:00"))
                    diff = (rt_dt - ca_dt).total_seconds()
                    if diff > 0:
                        response_time_hours = round(diff / 3600, 1)
                        response_times.append(response_time_hours)
                except Exception:
                    pass

            # Fee from terms or proposal
            fee_gbp = None
            terms = e.get("terms") or {}
            proposal = e.get("latest_proposal") or {}
            if isinstance(terms, dict) and isinstance(terms.get("fee_gbp"), (int, float)):
                fee_gbp = terms["fee_gbp"]
            elif isinstance(proposal, dict) and isinstance(proposal.get("fee_gbp"), (int, float)):
                fee_gbp = proposal["fee_gbp"]

            all_creators.append({
                "id": e.get("creator_id", ""),
                "name": e.get("creator_name") or e.get("creator_id", ""),
                "email": e.get("creator_email", ""),
                "platform": plat,
                "status": e_status,
                "campaignId": cid,
                "campaignName": cname,
                "responded": e_status != "contacted",
                "agreed": e_status == "agreed",
                "responseTimeHours": response_time_hours,
                "hasProposal": bool(e.get("latest_proposal")),
                "feeGbp": fee_gbp,
            })

        # Content performance from monitoring
        ms = monitor or {}
        c_posts = ms.get("posts_live", 0)
        c_likes = ms.get("total_likes", 0)
        c_comments = ms.get("total_comments", 0)
        c_shares = ms.get("total_shares", 0)
        c_saves = ms.get("total_saves", 0)
        c_score = ms.get("avg_compliance_score", 0)
        c_issues = ms.get("compliance_issues", 0)

        total_posts_live += c_posts
        cp_total_likes += c_likes
        cp_total_comments += c_comments
        cp_total_shares += c_shares
        cp_total_saves += c_saves
        total_compliance_issues += c_issues
        total_fully_compliant += ms.get("fully_compliant", 0)
        if c_posts > 0:
            compliance_scores.append(c_score)

        content_per_campaign.append({
            "campaignId": cid,
            "campaignName": cname,
            "postsLive": c_posts,
            "likes": c_likes,
            "comments": c_comments,
            "shares": c_shares,
            "saves": c_saves,
            "complianceScore": c_score,
            "complianceIssues": c_issues,
        })

        # Budget tracking
        brief = {}
        if campaign_detail and isinstance(campaign_detail.get("brief"), dict):
            brief = campaign_detail["brief"]
        budget = brief.get("budget_gbp", 0)
        if not isinstance(budget, (int, float)):
            budget = 0
        total_budget += budget

        campaign_fees = sum(
            (e.get("terms") or {}).get("fee_gbp", 0)
            if isinstance((e.get("terms") or {}).get("fee_gbp"), (int, float))
            else (e.get("latest_proposal") or {}).get("fee_gbp", 0)
            if isinstance((e.get("latest_proposal") or {}).get("fee_gbp"), (int, float))
            else 0
            for e in engagements
            if e.get("status") == "agreed"
        )
        overall_agreed_fees += campaign_fees
        total_eng = c_likes + c_comments + c_shares + c_saves

        budget_per_campaign.append({
            "campaignId": cid,
            "campaignName": cname,
            "budget": budget,
            "agreedFees": campaign_fees,
            "creatorsAgreed": agreed,
            "totalEngagements": total_eng,
        })

    # Build platform breakdown
    platform_breakdown = sorted(
        [
            {
                "platform": plat[0].upper() + plat[1:],
                **stats,
                "responseRate": round((stats["responded"] / stats["creators"]) * 100) if stats["creators"] > 0 else 0,
            }
            for plat, stats in platform_map.items()
        ],
        key=lambda x: x["creators"],
        reverse=True,
    )

    avg_response_time = (
        round(sum(response_times) / len(response_times))
        if response_times
        else 0
    )

    avg_compliance_score = (
        round(sum(compliance_scores) / len(compliance_scores) * 10) / 10
        if compliance_scores
        else 0
    )

    total_eng_all = cp_total_likes + cp_total_comments + cp_total_shares + cp_total_saves

    return {
        "totalCampaigns": len(campaigns),
        "byStatus": by_status,
        "totalCreatorsContacted": total_contacted,
        "totalAgreed": total_agreed,
        "totalDeclined": total_declined,
        "responseRate": round((total_responded / total_contacted) * 100) if total_contacted > 0 else 0,
        "conversionRate": round((total_agreed / total_contacted) * 100) if total_contacted > 0 else 0,
        "emailStats": {
            "totalSent": total_sent,
            "deliveryRate": round((total_delivered / total_sent) * 100) if total_sent > 0 else 0,
            "openRate": round((total_opened / total_sent) * 100) if total_sent > 0 else 0,
            "clickRate": round((total_clicked / total_sent) * 100) if total_sent > 0 else 0,
        },
        "perCampaign": per_campaign,
        "emailBreakdown": email_breakdown,
        "allCreators": all_creators,
        "engagementFunnel": engagement_funnel,
        "negotiationStats": {
            "activeNegotiations": engagement_funnel.get("negotiating", 0),
            "avgResponseTimeHours": avg_response_time,
        },
        "platformBreakdown": platform_breakdown,
        "contentPerformance": {
            "totalPostsLive": total_posts_live,
            "totalLikes": cp_total_likes,
            "totalComments": cp_total_comments,
            "totalShares": cp_total_shares,
            "totalSaves": cp_total_saves,
            "avgComplianceScore": avg_compliance_score,
            "totalComplianceIssues": total_compliance_issues,
            "totalFullyCompliant": total_fully_compliant,
            "perCampaign": content_per_campaign,
        },
        "budgetTracking": {
            "totalBudget": total_budget,
            "totalAgreedFees": overall_agreed_fees,
            "avgCostPerCreator": round(overall_agreed_fees / total_agreed) if total_agreed > 0 else 0,
            "avgCostPerEngagement": round((overall_agreed_fees / total_eng_all) * 100) / 100 if total_eng_all > 0 else 0,
            "perCampaign": budget_per_campaign,
        },
    }
