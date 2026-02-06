"""Payment tool - generate payment instructions from agreed terms (placeholder)."""

import json
import sys
from pathlib import Path
from typing import Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.actions import AgentAction, AgentActionType, ToolResult
from models.context import CampaignContext
from tools.base import BaseTool


def generate_payment_instructions(
    campaign_id: str,
    creator_id: str,
    terms: dict[str, Any],
) -> dict[str, Any]:
    """
    Generate payment instructions from agreed terms.

    Placeholder implementation - outputs instructions for manual processing.
    Future: integrate with Stripe, Wise, or bank transfer APIs.

    Args:
        campaign_id: Campaign identifier
        creator_id: Creator identifier
        terms: Dict with fee_gbp, deliverables, deadline

    Returns:
        Payment instructions (reference, amount, payee, notes)
    """
    fee = terms.get("fee_gbp", 0)
    deliverables = terms.get("deliverables", [])
    reference = f"HUD-{campaign_id}-{creator_id}"[:30]

    return {
        "campaign_id": campaign_id,
        "creator_id": creator_id,
        "amount_gbp": fee,
        "reference": reference,
        "payee": creator_id,
        "deliverables": deliverables,
        "notes": f"Creator payment for campaign {campaign_id}",
        "status": "pending",
        "instructions": (
            f"Transfer £{fee} to creator {creator_id}. "
            f"Use reference: {reference}. "
            f"Deliverables: {', '.join(str(d) for d in deliverables)}."
        ),
    }


class PaymentsTool(BaseTool):
    """Generate payment instructions from agreed terms."""

    action_type = "generate_payment"

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")

    def can_handle(self, action_type: str) -> bool:
        return action_type == AgentActionType.GENERATE_PAYMENT.value

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Generate payment instructions from pending counter offer or action input."""
        action_input = action.input or {}
        terms = action_input.get("terms")
        creator_id = (
            action_input.get("creator_id")
            or getattr(context, "pending_creator_id", None)
            or (next(iter(context.engagements), None) if context.engagements else None)
        )

        if not terms and context.pending_counter_offer:
            terms = context.pending_counter_offer.get("proposed_terms", {})

        if not terms:
            return ToolResult(
                success=False,
                error="No terms provided; need terms or pending_counter_offer",
            )

        creator_id = str(creator_id) if creator_id else "unknown"

        instructions = generate_payment_instructions(
            context.campaign_id,
            str(creator_id),
            terms,
        )

        path = self.output_dir / f"payment_{context.campaign_id}_{creator_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(instructions, indent=2))

        return ToolResult(
            success=True,
            output={
                "payment_instructions": instructions,
                "payment_path": str(path),
                "state": "campaign_active",
            },
        )
