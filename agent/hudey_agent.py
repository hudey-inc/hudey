"""Hudey AI Agent - Claude-powered campaign orchestration."""

import json
import logging
import os
import re
from pathlib import Path

logger = logging.getLogger(__name__)

from anthropic import Anthropic
from dotenv import load_dotenv

from models.actions import AgentAction, AgentActionType, ToolResult
from models.brief import CampaignBrief
from models.campaign import CampaignStrategy
from models.campaign import EngagementStatus
from models.context import CampaignContext, CampaignState

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


STRATEGY_PROMPT = """You are Hudey, an AI marketing agent that runs influencer campaigns for brands.

Given the following campaign brief, create a strategic plan for the influencer campaign.

BRIEF:
{brief_json}

Respond with a JSON object matching this exact schema (no extra fields):
{{
  "approach": "2-3 sentence overall approach to this campaign",
  "creator_count": <number between 5 and 50>,
  "messaging_angle": "primary messaging angle for creator outreach",
  "platform_priority": ["platform1", "platform2", ...],
  "rationale": "brief reasoning for your strategy",
  "risks": ["risk1", "risk2"]
}}

Return ONLY the JSON object, no other text."""


REASON_PROMPT = """You are Hudey, an AI agent running an influencer campaign.

Current state: {state}
Context summary: {context_summary}

Available actions based on state:
- brief_received: generate_strategy (no approval)
- strategy_draft: request_approval (approval required for strategy)
- creator_discovery: request_approval (approval required for creator list)
- outreach_draft: request_approval (approval required for outreach)
- After approvals: find_creators, draft_outreach, or complete

Return a JSON object:
{{
  "type": "generate_strategy" | "find_creators" | "draft_outreach" | "request_approval" | "complete",
  "input": {{}},
  "requires_approval": false,
  "reasoning": "brief reasoning"
}}

Return ONLY the JSON object."""


def _parse_json_response(text: str) -> dict:
    """Extract and parse JSON from Claude response, with fallback extraction."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract the first JSON object from the text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        logger.warning("Failed to parse JSON from Claude response: %s", text[:300])
        raise


class HudeyAgent:
    """Claude-powered agent for influencer campaign orchestration."""

    def __init__(self, no_send: bool = False):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY not set. Add it to .env (copy from .env.example)."
            )
        self.client = Anthropic(api_key=api_key)
        self.no_send = no_send
        self._init_tools()

    def _init_tools(self) -> None:
        """Register tools."""
        from tools.analytics import AnalyticsTool
        from tools.approval import ApprovalTool
        from tools.campaign_monitor import CampaignMonitorTool
        from tools.creator_discovery import CreatorDiscoveryTool
        from tools.negotiation import NegotiationTool
        from tools.outreach import OutreachTool
        from tools.payments import PaymentsTool

        self.creator_discovery = CreatorDiscoveryTool()
        self.monitor = CampaignMonitorTool()
        self.analytics = AnalyticsTool()
        self.negotiation = NegotiationTool()
        self.outreach = OutreachTool(no_send=self.no_send)
        self.payments = PaymentsTool()
        self.approval = ApprovalTool()
        self.tool_map = {
            AgentActionType.GENERATE_STRATEGY: None,  # Handled by agent
            AgentActionType.FIND_CREATORS: self.creator_discovery,
            AgentActionType.DRAFT_OUTREACH: self.outreach,
            AgentActionType.SEND_OUTREACH: self.outreach,
            AgentActionType.COLLECT_RESPONSES: self.negotiation,
            AgentActionType.NEGOTIATE_TERMS: self.negotiation,
            AgentActionType.REQUEST_TERMS_APPROVAL: self.approval,
            AgentActionType.GENERATE_PAYMENT: self.payments,
            AgentActionType.MONITOR_CAMPAIGN: self.monitor,
            AgentActionType.GENERATE_REPORT: self.analytics,
            AgentActionType.REQUEST_APPROVAL: self.approval,
            AgentActionType.COMPLETE: None,
        }

    def generate_strategy(self, brief: CampaignBrief) -> CampaignStrategy:
        """
        Generate a campaign strategy from a brief using Claude.
        Kept for backward compatibility and single-step use.
        """
        brief_json = brief.model_dump_json(indent=2)
        prompt = STRATEGY_PROMPT.format(brief_json=brief_json)

        message = self.client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        text = message.content[0].text
        data = _parse_json_response(text)
        return CampaignStrategy(**data)

    def reason(self, context: CampaignContext) -> AgentAction:
        """Decide next action based on context. Uses deterministic state machine for reliability."""
        state = context.state

        if state == CampaignState.BRIEF_RECEIVED:
            return AgentAction(
                type=AgentActionType.GENERATE_STRATEGY,
                input={},
                requires_approval=False,
                reasoning="Generate campaign strategy from brief.",
            )
        if state == CampaignState.STRATEGY_DRAFT:
            return AgentAction(
                type=AgentActionType.REQUEST_APPROVAL,
                input={"approval_type": "strategy", "subject": "Campaign strategy"},
                requires_approval=True,
                reasoning="Strategy ready; request human approval.",
            )
        if state == CampaignState.AWAITING_BRIEF_APPROVAL:
            return AgentAction(
                type=AgentActionType.FIND_CREATORS,
                input={},
                requires_approval=False,
                reasoning="Approval granted; discover creators.",
            )
        if state == CampaignState.CREATOR_DISCOVERY:
            if not context.creators:
                return AgentAction(
                    type=AgentActionType.FIND_CREATORS,
                    input={},
                    requires_approval=False,
                    reasoning="Discover and rank creators.",
                )
            return AgentAction(
                type=AgentActionType.REQUEST_APPROVAL,
                input={"approval_type": "creators", "subject": "Creator shortlist"},
                requires_approval=True,
                reasoning="Creators found; request approval.",
            )
        if state == CampaignState.AWAITING_CREATOR_APPROVAL:
            return AgentAction(
                type=AgentActionType.DRAFT_OUTREACH,
                input={},
                requires_approval=False,
                reasoning="Approval granted; draft outreach.",
            )
        if state == CampaignState.OUTREACH_DRAFT:
            if not context.outreach_drafts:
                return AgentAction(
                    type=AgentActionType.DRAFT_OUTREACH,
                    input={},
                    requires_approval=False,
                    reasoning="Draft personalized outreach messages.",
                )
            return AgentAction(
                type=AgentActionType.REQUEST_APPROVAL,
                input={"approval_type": "outreach", "subject": "Outreach drafts"},
                requires_approval=True,
                reasoning="Outreach drafted; request approval.",
            )
        if state == CampaignState.OUTREACH_IN_PROG:
            return AgentAction(
                type=AgentActionType.SEND_OUTREACH,
                input={},
                requires_approval=False,
                reasoning="Send approved outreach emails to creators.",
            )
        if state == CampaignState.NEGOTIATION:
            if not context.engagements:
                return AgentAction(
                    type=AgentActionType.COLLECT_RESPONSES,
                    input={},
                    requires_approval=False,
                    reasoning="Collect creator responses from webhooks/disk.",
                )
            responded = [
                cid for cid, eng in context.engagements.items()
                if (hasattr(eng, "status") and eng.status == EngagementStatus.RESPONDED)
                or (isinstance(eng, dict) and eng.get("status") == "responded")
            ]
            if responded:
                return AgentAction(
                    type=AgentActionType.NEGOTIATE_TERMS,
                    input={"creator_id": responded[0]},
                    requires_approval=False,
                    reasoning="Compose counter offer for responding creator.",
                )
            return AgentAction(
                type=AgentActionType.COLLECT_RESPONSES,
                input={},
                requires_approval=False,
                reasoning="No responded engagements; proceed to campaign active.",
            )
        if state == CampaignState.AWAITING_TERMS_APPROVAL:
            return AgentAction(
                type=AgentActionType.REQUEST_TERMS_APPROVAL,
                input={
                    "approval_type": "terms",
                    "subject": "Counter offer terms",
                    "counter_offer": context.pending_counter_offer or {},
                },
                requires_approval=True,
                reasoning="Request human approval for proposed terms.",
            )
        if state == CampaignState.PAYMENT_PENDING:
            return AgentAction(
                type=AgentActionType.GENERATE_PAYMENT,
                input={
                    "creator_id": context.pending_creator_id,
                    "terms": (context.pending_counter_offer or {}).get("proposed_terms"),
                },
                requires_approval=False,
                reasoning="Generate payment instructions from agreed terms.",
            )
        if state == CampaignState.CAMPAIGN_ACTIVE:
            if not context.monitor_updates:
                return AgentAction(
                    type=AgentActionType.MONITOR_CAMPAIGN,
                    input={},
                    requires_approval=False,
                    reasoning="Monitor creator posts and collect metrics.",
                )
            if not context.report:
                return AgentAction(
                    type=AgentActionType.GENERATE_REPORT,
                    input={},
                    requires_approval=False,
                    reasoning="Generate final analytics report.",
                )
            return AgentAction(
                type=AgentActionType.COMPLETE,
                input={},
                requires_approval=False,
                reasoning="Report completed.",
            )
        if state == CampaignState.AWAITING_OUTREACH_APPROVAL:
            return AgentAction(
                type=AgentActionType.REQUEST_APPROVAL,
                input={"approval_type": "outreach", "subject": "Outreach drafts"},
                requires_approval=True,
                reasoning="Outreach drafted; request approval.",
            )

        return AgentAction(
            type=AgentActionType.COMPLETE,
            input={},
            requires_approval=False,
            reasoning="No further actions.",
        )

    def execute_action(
        self,
        action: AgentAction,
        context: CampaignContext,
        approve_all: bool = False,
    ) -> ToolResult:
        """Execute an action and return the result."""
        if action.type == AgentActionType.GENERATE_STRATEGY:
            strategy = self.generate_strategy(context.brief)
            return ToolResult(
                success=True,
                output={"strategy": strategy.model_dump()},
            )

        if action.type == AgentActionType.COMPLETE:
            return ToolResult(
                success=True,
                output={"complete": True, "state": CampaignState.COMPLETED.value},
            )

        if action.type in (AgentActionType.REQUEST_APPROVAL, AgentActionType.REQUEST_TERMS_APPROVAL):
            return self.approval.execute(context, action, approve_all)

        tool = self.tool_map.get(action.type)
        if tool:
            return tool.execute(context, action)

        return ToolResult(success=False, error=f"Unknown action: {action.type}")

    def execute_campaign(
        self,
        brief: CampaignBrief,
        approve_all: bool = False,
        on_step: callable = None,
    ) -> CampaignContext:
        """Run the full campaign loop: reason -> approve (if needed) -> execute -> update -> learn."""
        context = CampaignContext.from_brief(brief)

        while not context.is_complete:
            next_action = self.reason(context)

            if next_action.requires_approval:
                self._set_awaiting_approval(context)
                if on_step:
                    on_step(context)
                result = self.execute_action(next_action, context, approve_all)
                context.update(result)
                if on_step:
                    on_step(context)
                if not result.output.get("approval_granted", True):
                    self.update_memory(context, result)
                    continue
                next_action = self.reason(context)

            result = self.execute_action(next_action, context, approve_all)
            context.update(result)
            if on_step:
                on_step(context)
            self.update_memory(context, result)

        return context

    def _set_awaiting_approval(self, context: CampaignContext) -> None:
        """Set state to awaiting approval before request_approval runs."""
        if context.state == CampaignState.STRATEGY_DRAFT:
            context.state = CampaignState.AWAITING_BRIEF_APPROVAL
        elif context.state == CampaignState.CREATOR_DISCOVERY:
            context.state = CampaignState.AWAITING_CREATOR_APPROVAL
        elif context.state == CampaignState.OUTREACH_DRAFT:
            context.state = CampaignState.AWAITING_OUTREACH_APPROVAL

    def update_memory(self, context: CampaignContext, result: ToolResult) -> None:
        """Append outcome to outcomes.jsonl; if DB configured, log to agent_actions."""
        outcomes_dir = Path(".tmp/campaign_outcomes")
        outcomes_dir.mkdir(parents=True, exist_ok=True)
        path = outcomes_dir / "outcomes.jsonl"

        record = {
            "campaign_id": context.campaign_id,
            "step": context.state.value,
            "action_type": "step",
            "input_summary": str(context.brief.brand_name if context.brief else ""),
            "output_summary": "success" if result.success else result.error or "failed",
            "success": result.success,
            "timestamp": __import__("datetime").datetime.now().isoformat(),
        }
        existing = path.read_text() if path.exists() else ""
        path.write_text(existing + json.dumps(record) + "\n")

        try:
            from backend.db.client import get_supabase
            if get_supabase():
                from backend.db.repositories.agent_actions_repo import log_action
                log_action(
                    context.campaign_id,
                    action_type=record["action_type"],
                    action_input={"step": record["step"], "input_summary": record["input_summary"]},
                    action_output={"output_summary": record["output_summary"], "success": record["success"]},
                    reasoning=None,
                )
        except Exception:
            pass
