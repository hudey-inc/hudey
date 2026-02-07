"""Approval tool - request and check human approval."""

import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Optional

from models.actions import AgentAction, AgentActionType, ToolResult
from models.context import CampaignContext


class ApprovalTool:
    """Handles human-in-the-loop approval requests."""

    action_type = "request_approval"

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path(".tmp")

    def request_approval(
        self,
        context: CampaignContext,
        action: AgentAction,
        approve_all: bool = False,
    ) -> ToolResult:
        """Request human approval for an action. Writes to file and optionally prompts CLI."""
        request_id = f"{context.campaign_id}_{action.type}_{len(context.approval_queue)}"
        action_input = action.input or {}
        request = {
            "request_id": request_id,
            "campaign_id": context.campaign_id,
            "action_type": str(action.type) if hasattr(action.type, "value") else action.type,
            "action_input": action_input,
            "reasoning": action.reasoning,
            "status": "pending",
        }

        # For terms approval, include counter_offer details for review
        if action_input.get("approval_type") == "terms":
            counter = action_input.get("counter_offer") or context.pending_counter_offer or {}
            request["counter_offer"] = counter
            terms = counter.get("proposed_terms", {})
            request["terms_summary"] = {
                "fee_gbp": terms.get("fee_gbp"),
                "deliverables": terms.get("deliverables"),
                "deadline": terms.get("deadline"),
            }

        path = self.output_dir / f"pending_approval_{context.campaign_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(request, indent=2))

        if approve_all:
            return ToolResult(
                success=True,
                output={"approval_granted": True, "request_id": request_id},
            )

        # Interactive prompt
        approval_type = action_input.get("approval_type", "general")
        print(f"\n--- Approval Required ({approval_type}) ---")
        if approval_type == "terms" and request.get("terms_summary"):
            ts = request["terms_summary"]
            print(f"  Fee: £{ts.get('fee_gbp', 'N/A')}")
            print(f"  Deliverables: {ts.get('deliverables', [])}")
            print(f"  Deadline: {ts.get('deadline', 'N/A')}")
        if action.reasoning:
            print(f"Reasoning: {action.reasoning}")
        print("Details written to:", path)
        response = input("Approve? [y/n/modify]: ").strip().lower()

        if response in ("y", "yes"):
            return ToolResult(
                success=True,
                output={"approval_granted": True, "request_id": request_id},
            )
        elif response in ("n", "no"):
            feedback = input("Feedback (optional): ").strip()
            return ToolResult(
                success=True,
                output={"approval_granted": False, "feedback": feedback},
            )
        else:
            feedback = input("Modification notes: ").strip()
            return ToolResult(
                success=True,
                output={
                    "approval_granted": False,
                    "feedback": f"Modify: {feedback}",
                },
            )

    def check_approval_status(self, request_id: str, campaign_id: str) -> str:
        """Read approval response from file. Returns 'approved', 'rejected', or 'pending'."""
        path = self.output_dir / f"pending_approval_{campaign_id}.json"
        if not path.exists():
            return "pending"
        data = json.loads(path.read_text())
        return data.get("status", "pending")

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
        approve_all: bool = False,
    ) -> ToolResult:
        """Execute approval request."""
        return self.request_approval(context, action, approve_all)


class WebApprovalTool(ApprovalTool):
    """Approval tool that writes to Supabase and polls for decisions (web UI flow)."""

    action_type = "request_approval"

    def __init__(self, campaign_db_id: str):
        super().__init__()
        self.campaign_db_id = campaign_db_id

    def _build_payload(self, context: CampaignContext, approval_type: str) -> dict:
        """Build structured payload from context for the frontend renderers."""
        if approval_type == "strategy" and context.strategy:
            return context.strategy.model_dump() if hasattr(context.strategy, "model_dump") else vars(context.strategy)
        if approval_type == "creators" and context.creators:
            return {
                "creators": [
                    c.model_dump() if hasattr(c, "model_dump") else vars(c)
                    for c in context.creators
                ]
            }
        if approval_type == "outreach" and context.outreach_drafts:
            return {"drafts": context.outreach_drafts}
        if approval_type == "terms":
            counter = context.pending_counter_offer or {}
            return counter
        return {"raw": "No structured data available"}

    def request_approval(
        self,
        context: CampaignContext,
        action: AgentAction,
        approve_all: bool = False,
    ) -> ToolResult:
        """Create approval in Supabase and poll until decided."""
        import time

        if approve_all:
            return ToolResult(
                success=True,
                output={"approval_granted": True, "request_id": "auto"},
            )

        action_input = action.input or {}
        approval_type = action_input.get("approval_type", "general")
        subject = action_input.get("subject", f"{approval_type.replace('_', ' ').title()} approval")
        payload = self._build_payload(context, approval_type)

        # Create approval in Supabase
        from backend.db.repositories.approval_repo import create_approval, get_approval
        from backend.db.repositories.campaign_repo import update_campaign

        approval_id = create_approval(
            campaign_id=self.campaign_db_id,
            approval_type=approval_type,
            payload=payload,
            subject=subject,
            reasoning=action.reasoning,
        )

        if not approval_id:
            return ToolResult(
                success=False,
                error="Failed to create approval in database",
            )

        # Update campaign status
        update_campaign(self.campaign_db_id, {
            "status": "awaiting_approval",
            "agent_state": context.state.value,
        })

        # Poll for decision (with retry on transient connection errors)
        consecutive_errors = 0
        while True:
            try:
                row = get_approval(approval_id)
                consecutive_errors = 0  # Reset on success
                if row and row["status"] != "pending":
                    granted = row["status"] == "approved"
                    # Update campaign status back to running
                    if granted:
                        update_campaign(self.campaign_db_id, {"status": "running"})
                    return ToolResult(
                        success=True,
                        output={
                            "approval_granted": granted,
                            "feedback": row.get("feedback"),
                            "request_id": approval_id,
                        },
                    )
            except Exception:
                consecutive_errors += 1
                if consecutive_errors > 20:
                    return ToolResult(
                        success=False,
                        error="Lost connection to database after multiple retries",
                    )
                # Reset Supabase client to get a fresh connection
                try:
                    from backend.db.client import reset_supabase
                    reset_supabase()
                except Exception:
                    pass
                # Back off on errors
                time.sleep(min(5 * consecutive_errors, 30))
                continue
            time.sleep(3)

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
        approve_all: bool = False,
    ) -> ToolResult:
        """Execute approval request via web UI."""
        return self.request_approval(context, action, approve_all)


def main() -> int:
    """CLI for checking approval status."""
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--check", help="Check status of request_id")
    parser.add_argument("--campaign", required=True, help="Campaign ID")
    args = parser.parse_args()

    tool = ApprovalTool()
    status = tool.check_approval_status(args.check or "", args.campaign)
    print(status)
    return 0


if __name__ == "__main__":
    sys.exit(main())
