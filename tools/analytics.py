"""Analytics tool - aggregate metrics and generate campaign report."""

import json
import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from anthropic import Anthropic
from dotenv import load_dotenv

from models.actions import AgentAction, AgentActionType, ToolResult
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

REPORT_PROMPT = """You are Hudey, an AI marketing analyst. Generate a campaign report with:
1. Executive summary (3 bullet points)
2. What worked well (3 bullets)
3. What could improve (3 bullets)
4. ROI/impact snapshot
5. Recommendations (3 bullets)
6. Purchase intent summary (if data available)
7. Comments relevance summary (if data available)

Campaign brief:
{brief_json}

Strategy summary:
{strategy_json}

Aggregated metrics:
{metrics_json}

Campaign insights (purchase intent & comments relevance):
{insights_json}

Return JSON:
{{
  "executive_summary": [],
  "highlights": [],
  "improvements": [],
  "roi": "",
  "recommendations": [],
  "purchase_intent_summary": "",
  "comments_relevance_summary": ""
}}

Return ONLY the JSON object."""


class AnalyticsTool(BaseTool):
    """Aggregate metrics and ask Claude for insights."""

    action_type = AgentActionType.GENERATE_REPORT.value

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")
        self._client = None

    def can_handle(self, action_type: str) -> bool:
        return action_type == self.action_type

    def _get_client(self) -> Optional[Anthropic]:
        if self._client is None and os.getenv("ANTHROPIC_API_KEY"):
            self._client = Anthropic()
        return self._client

    def _aggregate_metrics(self, context: CampaignContext) -> dict:
        updates = context.monitor_updates or []
        total_posts = sum(1 for u in updates if u.get("posted"))
        totals = {"likes": 0, "comments": 0, "shares": 0, "saves": 0}
        for u in updates:
            if not u.get("posted"):
                continue
            metrics = u.get("metrics", {})
            for key in totals:
                totals[key] += metrics.get(key, 0)

        return {
            "creators_total": len(context.creators),
            "posts_live": total_posts,
            "likes": totals["likes"],
            "comments": totals["comments"],
            "shares": totals["shares"],
            "saves": totals["saves"],
        }

    def _generate_insights(self, context: CampaignContext, metrics: dict) -> dict:
        client = self._get_client()
        if not client:
            return {
                "executive_summary": ["Campaign completed (mock insights)."],
                "highlights": ["LLM disabled."],
                "improvements": ["Enable ANTHROPIC_API_KEY for insights."],
                "roi": "N/A",
                "recommendations": ["Collect real metrics for analysis."],
            }

        # Load campaign insights if available
        insights_path = self.output_dir / f"campaign_insights_{context.campaign_id}.json"
        insights_data = {}
        if insights_path.exists():
            try:
                insights_data = json.loads(insights_path.read_text()).get("summary", {})
            except Exception:
                pass

        prompt = REPORT_PROMPT.format(
            brief_json=context.brief.model_dump_json(indent=2) if context.brief else "{}",
            strategy_json=context.strategy.model_dump_json(indent=2) if context.strategy else "{}",
            metrics_json=json.dumps(metrics, indent=2),
            insights_json=json.dumps(insights_data, indent=2) if insights_data else "No insights data available",
        )
        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try extracting JSON object from response
            import re
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return {
                "executive_summary": ["Campaign completed."],
                "highlights": ["Report generation encountered a formatting issue."],
                "improvements": ["Review raw metrics for details."],
                "roi": "See metrics above",
                "recommendations": ["Re-run report for full analysis."],
            }

    def _run_campaign_insights(self, context: CampaignContext) -> dict:
        """Run Purchase Intent + Comments Relevance via campaign_insights tool."""
        try:
            from tools.campaign_insights import CampaignInsightsTool
            tool = CampaignInsightsTool(output_dir=self.output_dir)
            product_name = context.brief.brand_name if context.brief else "Product"
            product_desc = context.brief.key_message if context.brief else ""
            results = tool.analyze_campaign_posts(
                context=context,
                product_name=product_name,
                product_description=product_desc,
            )
            return tool._build_summary(results)
        except Exception:
            return {}

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        metrics = self._aggregate_metrics(context)

        # Run campaign insights (purchase intent + comments relevance)
        campaign_insights = self._run_campaign_insights(context)

        insights = self._generate_insights(context, metrics)

        report = {
            "metrics": metrics,
            "insights": insights,
            "campaign_insights": campaign_insights,
        }
        path = self.output_dir / f"campaign_report_{context.campaign_id}.json"
        path.write_text(json.dumps(report, indent=2))

        return ToolResult(
            success=True,
            output={
                "report": report,
                "report_path": str(path),
                "state": "completed",
            },
        )
