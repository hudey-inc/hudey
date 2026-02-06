"""Negotiation tool - summarize threads, compose counter offers, score proposals."""

import json
import os
import sys
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from anthropic import Anthropic
from dotenv import load_dotenv

from models.actions import AgentAction, AgentActionType, ToolResult
from models.campaign import CreatorEngagement, EngagementStatus
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


COUNTER_OFFER_PROMPT = """You are negotiating on behalf of a brand with a creator for an influencer campaign.

CAMPAIGN CONTEXT:
- Brand: {brand_name}
- Budget: £{budget_gbp}
- Deliverables: {deliverables}
- Key message: {key_message}

MESSAGE THREAD SUMMARY:
{thread_summary}

CREATOR'S LATEST MESSAGE:
{latest_message}

The creator has responded. Draft a professional counter-offer that:
1. Acknowledges their response
2. Proposes concrete terms (fee in GBP, deliverables, timeline) within budget
3. Is warm but professional
4. Invites them to confirm or suggest adjustments

Return a JSON object:
{{
  "subject": "email subject line",
  "body": "email body text (2-4 short paragraphs)",
  "proposed_terms": {{
    "fee_gbp": <number>,
    "deliverables": ["item1", "item2"],
    "deadline": "e.g. 2 weeks from acceptance"
  }}
}}

Return ONLY the JSON object."""


def summarize_thread(engagement: CreatorEngagement) -> str:
    """
    Summarize the message history into a concise thread summary.

    Args:
        engagement: CreatorEngagement with message_history

    Returns:
        Human-readable summary of the thread
    """
    history = engagement.message_history or []
    if not history:
        return "No messages yet."

    parts = []
    for m in history:
        role = m.get("from", "unknown")
        body = (m.get("body") or "").strip()
        ts = m.get("timestamp", "")
        if body:
            parts.append(f"[{role}] {body}")
    return "\n".join(parts) if parts else "No message content."


def score_offer(proposal: dict[str, Any], context: CampaignContext) -> int:
    """
    Score a proposal (0-100) based on budget fit, deliverables, and feasibility.

    Args:
        proposal: Dict with fee_gbp, deliverables, deadline
        context: Campaign context for budget and brief

    Returns:
        Score 0-100
    """
    score = 50  # Base score
    budget = context.brief.budget_gbp if context.brief else 0
    fee = proposal.get("fee_gbp")
    if isinstance(fee, (int, float)) and budget > 0:
        pct = (fee / budget) * 100
        if pct <= 80:
            score += 25
        elif pct <= 100:
            score += 10
        else:
            score -= 30
    deliverables = proposal.get("deliverables")
    if deliverables and isinstance(deliverables, list) and len(deliverables) >= 1:
        score += 15
    if proposal.get("deadline"):
        score += 10
    return max(0, min(100, score))


class NegotiationTool(BaseTool):
    """Summarize threads, compose counter offers, and score proposals."""

    action_type = "negotiate_terms"

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")
        self._client = None

    def _get_client(self) -> Optional[Anthropic]:
        if self._client is None and os.getenv("ANTHROPIC_API_KEY"):
            self._client = Anthropic()
        return self._client

    def compose_counter_offer(
        self,
        engagement: CreatorEngagement,
        context: CampaignContext,
    ) -> dict[str, Any]:
        """
        Draft a counter-offer using Claude based on thread and campaign context.

        Returns:
            Dict with subject, body, proposed_terms
        """
        thread_summary = summarize_thread(engagement)
        latest = ""
        for m in reversed(engagement.message_history or []):
            if m.get("from") == "creator":
                latest = m.get("body", "")
                break

        if not context.brief:
            return {
                "subject": "Re: Partnership opportunity",
                "body": "Thank you for your interest. We'd like to discuss terms.",
                "proposed_terms": {"fee_gbp": 0, "deliverables": [], "deadline": ""},
            }

        prompt = COUNTER_OFFER_PROMPT.format(
            brand_name=context.brief.brand_name,
            budget_gbp=context.brief.budget_gbp,
            deliverables=", ".join(context.brief.deliverables),
            key_message=context.brief.key_message,
            thread_summary=thread_summary or "No prior messages.",
            latest_message=latest or "Creator expressed interest.",
        )

        client = self._get_client()
        if client:
            try:
                msg = client.messages.create(
                    model="claude-sonnet-4-5",
                    max_tokens=1024,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = msg.content[0].text.strip()
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
                return json.loads(text)
            except Exception:
                pass

        # Fallback
        fee = int(context.brief.budget_gbp / 5)
        return {
            "subject": f"Re: Partnership with {context.brief.brand_name}",
            "body": f"Thanks for your interest. We'd like to offer £{fee} for the agreed deliverables.",
            "proposed_terms": {
                "fee_gbp": context.brief.budget_gbp / 5,
                "deliverables": list(context.brief.deliverables),
                "deadline": "2 weeks from acceptance",
            },
        }

    def collect_responses(self, context: CampaignContext) -> ToolResult:
        """Load engagements from disk (from response router / webhooks)."""
        from services.response_router import _load_engagements, _default_tmp

        tmp = _default_tmp()
        raw = _load_engagements(tmp, context.campaign_id)
        engagements = {
            cid: CreatorEngagement(**data) if isinstance(data, dict) else data
            for cid, data in raw.items()
        }
        responded = [
            cid for cid, eng in engagements.items()
            if (hasattr(eng, "status") and eng.status == EngagementStatus.RESPONDED)
            or (isinstance(eng, dict) and eng.get("status") == "responded")
        ]
        next_state = "negotiation" if responded else "campaign_active"
        return ToolResult(
            success=True,
            output={
                "engagements": {k: v.model_dump() if hasattr(v, "model_dump") else v for k, v in engagements.items()},
                "state": next_state,
            },
        )

    def can_handle(self, action_type: str) -> bool:
        return action_type in (
            AgentActionType.COLLECT_RESPONSES.value,
            AgentActionType.NEGOTIATE_TERMS.value,
        )

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Execute negotiation: collect responses or compose counter offer."""
        if action.type == AgentActionType.COLLECT_RESPONSES:
            return self.collect_responses(context)

        creator_id = (action.input or {}).get("creator_id")
        if not creator_id:
            return ToolResult(
                success=False,
                error="creator_id required in action input",
            )

        engagements = getattr(context, "engagements", None) or {}
        eng = engagements.get(creator_id)
        if not eng:
            from pathlib import Path
            from services.response_router import _load_engagements, _default_tmp
            raw = _load_engagements(_default_tmp(), context.campaign_id)
            eng_data = raw.get(creator_id)
            if eng_data:
                eng = CreatorEngagement(**eng_data)
        if not eng:
            return ToolResult(
                success=False,
                error=f"No engagement found for creator {creator_id}",
            )

        if isinstance(eng, dict):
            eng = CreatorEngagement(**eng)

        counter = self.compose_counter_offer(eng, context)
        proposal = counter.get("proposed_terms", {})
        score = score_offer(proposal, context)

        path = self.output_dir / f"counter_offer_{context.campaign_id}_{creator_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(counter, indent=2))

        return ToolResult(
            success=True,
            output={
                "counter_offer": counter,
                "score": score,
                "creator_id": creator_id,
                "counter_path": str(path),
            },
        )
