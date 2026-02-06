"""Campaign context and state machine."""

import uuid
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional

from pydantic import BaseModel, Field

from models.brief import CampaignBrief, CreatorCriteria

if TYPE_CHECKING:
    from models.actions import ToolResult
from models.campaign import CampaignStrategy, Creator, CreatorEngagement


class CampaignState(str, Enum):
    """Campaign workflow states."""

    BRIEF_RECEIVED = "brief_received"
    STRATEGY_DRAFT = "strategy_draft"
    AWAITING_BRIEF_APPROVAL = "awaiting_brief_approval"
    CREATOR_DISCOVERY = "creator_discovery"
    AWAITING_CREATOR_APPROVAL = "awaiting_creator_approval"
    OUTREACH_DRAFT = "outreach_draft"
    AWAITING_OUTREACH_APPROVAL = "awaiting_outreach_approval"
    OUTREACH_IN_PROG = "outreach_in_prog"
    NEGOTIATION = "negotiation"
    AWAITING_TERMS_APPROVAL = "awaiting_terms_approval"
    PAYMENT_PENDING = "payment_pending"
    CAMPAIGN_ACTIVE = "campaign_active"
    COMPLETED = "completed"


class CampaignContext(BaseModel):
    """Holds campaign state and data through the workflow."""

    campaign_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    brief: Optional[CampaignBrief] = None
    strategy: Optional[CampaignStrategy] = None
    creators: list[Creator] = Field(default_factory=list)
    creator_criteria: Optional[CreatorCriteria] = None
    outreach_drafts: list[dict[str, Any]] = Field(default_factory=list)
    outreach_sent: Optional[dict[str, Any]] = None
    engagements: dict[str, CreatorEngagement] = Field(
        default_factory=dict,
        description="Creator ID -> engagement state for negotiation",
    )
    pending_counter_offer: Optional[dict[str, Any]] = Field(
        None,
        description="Counter offer awaiting terms approval",
    )
    pending_creator_id: Optional[str] = Field(
        None,
        description="Creator ID for pending counter offer / payment",
    )
    monitor_updates: list[dict[str, Any]] = Field(default_factory=list)
    report: Optional[dict[str, Any]] = None
    state: CampaignState = Field(default=CampaignState.BRIEF_RECEIVED)
    approval_queue: list[dict[str, Any]] = Field(default_factory=list)
    history: list[dict[str, Any]] = Field(default_factory=list)

    model_config = {"arbitrary_types_allowed": True}

    @property
    def is_complete(self) -> bool:
        """True when campaign has reached COMPLETED state."""
        return self.state == CampaignState.COMPLETED

    @classmethod
    def from_brief(cls, brief: CampaignBrief) -> "CampaignContext":
        """Create context from a campaign brief."""
        return cls(
            brief=brief,
            state=CampaignState.BRIEF_RECEIVED,
        )

    def update(self, result: "ToolResult") -> None:
        """Apply tool result and advance state."""
        if not result.success:
            return

        output = result.output or {}

        if "strategy" in output:
            from models.campaign import CampaignStrategy

            s = output["strategy"]
            self.strategy = CampaignStrategy(**s) if isinstance(s, dict) else s
            self.state = CampaignState.STRATEGY_DRAFT
        elif "creators" in output:
            self.creators = [
                Creator(**c) if isinstance(c, dict) else c
                for c in output["creators"]
            ]
            if "creator_criteria" in output:
                from models.brief import CreatorCriteria

                cr = output["creator_criteria"]
                self.creator_criteria = (
                    CreatorCriteria(**cr) if isinstance(cr, dict) else cr
                )
            self.state = CampaignState.CREATOR_DISCOVERY
        elif "outreach_drafts" in output:
            self.outreach_drafts = output["outreach_drafts"]
            self.state = CampaignState.OUTREACH_DRAFT
        elif "outreach_sent" in output:
            self.outreach_sent = output["outreach_sent"]
            if output.get("state"):
                self.state = CampaignState(output["state"])
            else:
                self.state = CampaignState.OUTREACH_IN_PROG
        elif "engagements" in output:
            raw = output["engagements"]
            self.engagements = {
                k: CreatorEngagement(**v) if isinstance(v, dict) else v
                for k, v in raw.items()
            }
            if output.get("state"):
                self.state = CampaignState(output["state"])
            else:
                self.state = CampaignState.NEGOTIATION
        elif "counter_offer" in output:
            self.pending_counter_offer = output["counter_offer"]
            self.pending_creator_id = output.get("creator_id")
            self.state = CampaignState.AWAITING_TERMS_APPROVAL
        elif "payment_instructions" in output:
            if output.get("state"):
                self.state = CampaignState(output["state"])
            else:
                self.state = CampaignState.CAMPAIGN_ACTIVE
        elif "monitor_updates" in output:
            self.monitor_updates = output["monitor_updates"]
            if output.get("state"):
                self.state = CampaignState(output["state"])
            else:
                self.state = CampaignState.CAMPAIGN_ACTIVE
        elif "report" in output:
            self.report = output["report"]
            self.state = CampaignState.COMPLETED
        elif "approval_granted" in output:
            if output.get("approval_granted"):
                self._advance_after_approval()
            else:
                self._handle_rejection(output.get("feedback", ""))
        elif "state" in output:
            self.state = CampaignState(output["state"])
        elif "complete" in output and output["complete"]:
            self.state = CampaignState.COMPLETED

        self.history.append({"state": self.state, "output_keys": list(output.keys())})

    def _advance_after_approval(self) -> None:
        """Move to next state after human approval."""
        transitions = {
            CampaignState.AWAITING_BRIEF_APPROVAL: CampaignState.CREATOR_DISCOVERY,
            CampaignState.AWAITING_CREATOR_APPROVAL: CampaignState.OUTREACH_DRAFT,
            CampaignState.AWAITING_OUTREACH_APPROVAL: CampaignState.OUTREACH_IN_PROG,
            CampaignState.AWAITING_TERMS_APPROVAL: CampaignState.PAYMENT_PENDING,
        }
        self.state = transitions.get(self.state, self.state)

    def _handle_rejection(self, feedback: str) -> None:
        """Handle approval rejection - revert to previous editable state."""
        revert = {
            CampaignState.AWAITING_BRIEF_APPROVAL: CampaignState.STRATEGY_DRAFT,
            CampaignState.AWAITING_CREATOR_APPROVAL: CampaignState.CREATOR_DISCOVERY,
            CampaignState.AWAITING_OUTREACH_APPROVAL: CampaignState.OUTREACH_DRAFT,
            CampaignState.AWAITING_TERMS_APPROVAL: CampaignState.NEGOTIATION,
        }
        self.state = revert.get(self.state, self.state)
        if feedback:
            self.history.append({"rejection_feedback": feedback})
