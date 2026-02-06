#!/usr/bin/env python3
"""
Run campaign - full ReAct loop or single-step strategy.

Usage:
  python tools/run_campaign.py .tmp/sample_brief.json
  python tools/run_campaign.py .tmp/sample_brief.json --single-step
  python tools/run_campaign.py .tmp/sample_brief.json --approve-all
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.brief import CampaignBrief
from models.campaign import CampaignStrategy
from agent.hudey_agent import HudeyAgent


def slugify(text: str) -> str:
    """Create a filesystem-safe slug from text."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _is_responded(eng) -> bool:
    """Check if engagement has responded status."""
    status = getattr(eng, "status", None) if not isinstance(eng, dict) else eng.get("status")
    if status is None:
        return False
    return str(status).endswith("responded") or status == "responded"


def _log_campaign_outcome(context, result: dict, tmp_dir: Path) -> None:
    """Append campaign completion summary to outcomes log."""
    log_dir = tmp_dir / "campaign_outcomes"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "campaign_runs.jsonl"

    record = {
        "campaign_id": context.campaign_id,
        "state": result.get("state"),
        "brand": context.brief.brand_name if context.brief else None,
        "creators_count": result.get("creators_count", 0),
        "engagements_count": len(result.get("engagements", {})),
        "payment_count": len(result.get("payment_summaries", [])),
        "timestamp": datetime.now().isoformat(),
    }
    existing = log_path.read_text() if log_path.exists() else ""
    log_path.write_text(existing + json.dumps(record) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run campaign: full loop or strategy only"
    )
    parser.add_argument(
        "brief_path",
        type=Path,
        help="Path to JSON campaign brief",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        help="Output path for result JSON",
    )
    parser.add_argument(
        "--single-step",
        action="store_true",
        help="Run only strategy generation (brief -> strategy)",
    )
    parser.add_argument(
        "--approve-all",
        action="store_true",
        help="Auto-approve all steps for non-interactive testing",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Single-step only: use mock strategy, skip Claude",
    )
    parser.add_argument(
        "--no-send",
        action="store_true",
        help="Skip actual email sending; simulate send (write to file only)",
    )
    args = parser.parse_args()

    brief_path = args.brief_path
    if not brief_path.exists():
        print(f"Error: Brief file not found: {brief_path}", file=sys.stderr)
        return 1

    try:
        data = json.loads(brief_path.read_text())
        brief = CampaignBrief(**data)
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error loading brief: {e}", file=sys.stderr)
        return 1

    print(f"Loaded brief for: {brief.brand_name}")

    if args.single_step or args.dry_run:
        print("Generating strategy (single-step)...")
        if args.dry_run:
            strategy = CampaignStrategy(
                approach=f"Mock approach for {brief.brand_name}: focus on {brief.platforms[0]} first.",
                creator_count=15,
                messaging_angle=brief.key_message[:100],
                platform_priority=brief.platforms,
                rationale="Dry-run mode: no Claude API call.",
                risks=["Dry-run: strategy is placeholder only."],
            )
        else:
            try:
                agent = HudeyAgent()
                strategy = agent.generate_strategy(brief)
            except ValueError as e:
                print(f"Error: {e}", file=sys.stderr)
                return 1
            except Exception as e:
                print(f"Error calling Claude: {e}", file=sys.stderr)
                return 1

        output_path = args.output or Path(
            ".tmp", f"strategy_{slugify(brief.brand_name)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(strategy.model_dump_json(indent=2))

        print(f"\nStrategy saved to: {output_path.resolve()}")
        print("\n--- Summary ---")
        approach_preview = strategy.approach[:200] + "..." if len(strategy.approach) > 200 else strategy.approach
        msg_preview = strategy.messaging_angle[:150] + "..." if len(strategy.messaging_angle) > 150 else strategy.messaging_angle
        print(f"Approach: {approach_preview}")
        print(f"Creator count: {strategy.creator_count}")
        print(f"Messaging angle: {msg_preview}")
        print(f"Platform priority: {strategy.platform_priority}")
        return 0

    print("Running full campaign loop...")
    try:
        agent = HudeyAgent(no_send=args.no_send)
        context = agent.execute_campaign(brief, approve_all=args.approve_all)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    output_path = args.output or Path(
        ".tmp", f"campaign_result_{context.campaign_id}.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    engagements_ser = {
        k: v.model_dump() if hasattr(v, "model_dump") else v
        for k, v in context.engagements.items()
    }

    tmp_dir = output_path.parent
    payment_files = list(tmp_dir.glob(f"payment_{context.campaign_id}_*.json"))
    payment_summaries = []
    for pf in payment_files:
        try:
            data = json.loads(pf.read_text())
            payment_summaries.append({
                "creator_id": data.get("creator_id"),
                "amount_gbp": data.get("amount_gbp"),
                "reference": data.get("reference"),
            })
        except (json.JSONDecodeError, OSError):
            pass

    result = {
        "campaign_id": context.campaign_id,
        "state": context.state.value,
        "brief": context.brief.model_dump() if context.brief else None,
        "strategy": context.strategy.model_dump() if context.strategy else None,
        "creators_count": len(context.creators),
        "creators": [c.model_dump() for c in context.creators],
        "outreach_drafts_count": len(context.outreach_drafts),
        "outreach_sent": context.outreach_sent,
        "engagements": engagements_ser,
        "pending_counter_offer": context.pending_counter_offer,
        "payment_summaries": payment_summaries,
        "monitor_updates": context.monitor_updates,
        "report": context.report,
    }
    output_path.write_text(json.dumps(result, indent=2))

    _log_campaign_outcome(context, result, tmp_dir)

    try:
        from backend.db.client import get_supabase
        if get_supabase():
            from backend.db.repositories.campaign_repo import save_campaign_result
            save_campaign_result(context.campaign_id, result)
    except Exception:
        pass

    print(f"\nCampaign complete. State: {context.state.value}")
    print(f"Result saved to: {output_path.resolve()}")
    if context.strategy:
        print(f"Strategy: {context.strategy.creator_count} creators, {context.strategy.platform_priority}")
    if context.creators:
        print(f"Creators found: {len(context.creators)}")
    if context.outreach_drafts:
        print(f"Outreach drafts: {len(context.outreach_drafts)}")
    if context.outreach_sent:
        s = context.outreach_sent
        print(f"Outreach sent: {s.get('sent_count', 0)} sent, {s.get('skipped_count', 0)} skipped" + (" (simulated)" if s.get("simulated") else ""))
    if context.engagements:
        responded = sum(1 for e in context.engagements.values() if _is_responded(e))
        print(f"Negotiation: {len(context.engagements)} engagement(s), {responded} responded")
    if context.pending_counter_offer:
        terms = context.pending_counter_offer.get("proposed_terms", {})
        print(f"Pending terms: £{terms.get('fee_gbp', 'N/A')} — {terms.get('deliverables', [])}")
    if payment_summaries:
        for ps in payment_summaries:
            print(f"Payment: £{ps.get('amount_gbp')} for {ps.get('creator_id')} (ref: {ps.get('reference')})")
    if context.monitor_updates:
        posted = sum(1 for u in context.monitor_updates if u.get("posted"))
        print(f"Monitor: {posted}/{len(context.monitor_updates)} posts detected.")
    if context.report:
        metrics = context.report.get("metrics", {})
        print(f"Report metrics: {metrics.get('likes', 0)} likes, {metrics.get('comments', 0)} comments.")
        insights = context.report.get("insights", {})
        summary = insights.get("executive_summary", [])
        if summary:
            print("Executive summary:")
            for bullet in summary:
                print(f"- {bullet}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
