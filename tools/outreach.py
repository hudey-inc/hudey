"""Outreach tool - draft and send personalized creator messages."""

import json
import os
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from anthropic import Anthropic
from dotenv import load_dotenv

from models.actions import AgentAction, AgentActionType, ToolResult
from models.campaign import Creator
from models.context import CampaignContext
from tools.base import BaseTool

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


OUTREACH_PROMPT = """Write a personalized outreach message for this creator.

Creator: {username} ({display_name})
Platform: {platform}
Followers: {follower_count}
Categories: {categories}

Brand: {brand_name}
Campaign objective: {objective}
Key message: {key_message}
Deliverables: {deliverables}
Budget context: £{budget_gbp}

Requirements:
- Reference their content style or categories
- Keep under 150 words
- Clear CTA to reply with interest
- Professional but warm tone
- No generic "I love your content" - be specific

Return a JSON object with:
{{ "subject": "email subject line", "body": "email body text" }}

Return ONLY the JSON object, no other text."""


class OutreachTool(BaseTool):
    """Draft and send personalized outreach messages for creators."""

    action_type = "draft_outreach"

    def __init__(self, output_dir: Optional[Path] = None, no_send: bool = False):
        self.output_dir = output_dir or Path(".tmp")
        self._client = None
        self.no_send = no_send

    def _get_client(self) -> Optional[Anthropic]:
        if self._client is None and os.getenv("ANTHROPIC_API_KEY"):
            self._client = Anthropic()
        return self._client

    def _log_message_ids(self, campaign_id: str, messages: list[dict]) -> None:
        """Persist message_id -> campaign_id, creator_id for response routing."""
        mapping_path = self.output_dir / "outreach_message_ids.json"
        mapping_path.parent.mkdir(parents=True, exist_ok=True)
        existing = {}
        if mapping_path.exists():
            try:
                existing = json.loads(mapping_path.read_text())
            except json.JSONDecodeError:
                pass
        for m in messages:
            mid = m.get("message_id")
            if mid:
                existing[mid] = {
                    "campaign_id": campaign_id,
                    "creator_id": m.get("creator_id", ""),
                    "email": m.get("email", ""),
                }
        mapping_path.write_text(json.dumps(existing, indent=2))

    def draft_outreach_batch(
        self,
        creators: list[Creator],
        context: CampaignContext,
    ) -> list[dict]:
        """Generate personalized outreach drafts for each creator."""
        if not context.brief or not context.strategy:
            return []

        drafts = []
        client = self._get_client()

        for creator in creators:
            prompt = OUTREACH_PROMPT.format(
                username=creator.username,
                display_name=creator.display_name or creator.username,
                platform=creator.platform,
                follower_count=creator.follower_count,
                categories=", ".join(creator.categories or ["general"]),
                brand_name=context.brief.brand_name,
                objective=context.brief.objective,
                key_message=context.brief.key_message,
                deliverables=", ".join(context.brief.deliverables),
                budget_gbp=context.brief.budget_gbp,
            )

            if client:
                try:
                    msg = client.messages.create(
                        model="claude-sonnet-4-5",
                        max_tokens=512,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    text = msg.content[0].text.strip()
                    if text.startswith("```"):
                        lines = text.split("\n")
                        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
                    data = json.loads(text)
                except Exception:
                    data = {"subject": "Partnership opportunity", "body": "Hi, we'd love to collaborate..."}
            else:
                data = {
                    "subject": f"Partnership with {context.brief.brand_name}",
                    "body": f"Hi {creator.display_name or creator.username}, we're reaching out about a campaign.",
                }

            drafts.append({
                "creator": creator.model_dump(),
                "subject": data.get("subject", ""),
                "body": data.get("body", ""),
            })

        return drafts

    def send_outreach_batch(
        self,
        context: CampaignContext,
    ) -> ToolResult:
        """Send approved outreach drafts via Resend. Simulates if no API key."""
        drafts = context.outreach_drafts
        if not drafts:
            drafts_path = self.output_dir / f"outreach_drafts_{context.campaign_id}.json"
            if drafts_path.exists():
                drafts = json.loads(drafts_path.read_text())
        if not drafts:
            return ToolResult(success=False, error="No outreach drafts to send")

        api_key = os.getenv("RESEND_API_KEY")
        from_email = os.getenv("OUTREACH_FROM_EMAIL", "Hudey <onboarding@resend.dev>")
        simulate = not api_key or self.no_send

        sent_count = 0
        skipped_count = 0
        failed = []
        sent_to = []
        messages = []  # [{email, message_id, creator_id}]

        for draft in drafts:
            creator = draft.get("creator", {})
            creator_id = (
                creator.get("id") or creator.get("username", "")
                if isinstance(creator, dict)
                else getattr(creator, "id", None) or getattr(creator, "username", "")
            )
            email = creator.get("email") if isinstance(creator, dict) else getattr(creator, "email", None)
            if not email or not str(email).strip():
                skipped_count += 1
                continue

            subject = draft.get("subject", "")
            body = draft.get("body", "")
            html_body = body.replace("\n", "<br>") if body else ""

            if simulate:
                message_id = f"sim_{context.campaign_id}_{creator_id}"
                sent_count += 1
                sent_to.append(email)
                messages.append({"email": email, "message_id": message_id, "creator_id": str(creator_id)})
                continue

            try:
                import resend
                resend.api_key = api_key
                resp = resend.Emails.send({
                    "from": from_email,
                    "to": [email],
                    "subject": subject,
                    "html": html_body,
                })
                msg_id = resp.get("id", "") if isinstance(resp, dict) else getattr(resp, "id", "")
                sent_count += 1
                sent_to.append(email)
                messages.append({"email": email, "message_id": msg_id, "creator_id": str(creator_id)})
            except Exception as e:
                failed.append({"email": email, "error": str(e)})

        summary = {
            "sent_count": sent_count,
            "skipped_count": skipped_count,
            "failed": failed,
            "sent_to": sent_to,
            "messages": messages,
            "simulated": simulate,
        }

        self._log_message_ids(context.campaign_id, messages)

        path = self.output_dir / f"outreach_sent_{context.campaign_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(summary, indent=2))

        return ToolResult(
            success=True,
            output={
                "outreach_sent": summary,
                "sent_path": str(path),
                "state": "negotiation",
            },
        )

    def can_handle(self, action_type: str) -> bool:
        return action_type in (
            AgentActionType.DRAFT_OUTREACH.value,
            AgentActionType.SEND_OUTREACH.value,
        )

    def execute(
        self,
        context: CampaignContext,
        action: AgentAction,
    ) -> ToolResult:
        """Execute outreach: draft or send based on action type."""
        if action.type == AgentActionType.SEND_OUTREACH:
            return self.send_outreach_batch(context)

        if not context.creators:
            return ToolResult(success=False, error="No creators to outreach")

        drafts = self.draft_outreach_batch(context.creators, context)

        path = self.output_dir / f"outreach_drafts_{context.campaign_id}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(drafts, indent=2))

        return ToolResult(
            success=True,
            output={
                "outreach_drafts": drafts,
                "drafts_path": str(path),
            },
        )
