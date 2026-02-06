"""Agent actions and tool results."""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentActionType(str, Enum):
    """Types of actions the agent can take."""

    GENERATE_STRATEGY = "generate_strategy"
    FIND_CREATORS = "find_creators"
    DRAFT_OUTREACH = "draft_outreach"
    SEND_OUTREACH = "send_outreach"
    COLLECT_RESPONSES = "collect_responses"
    NEGOTIATE_TERMS = "negotiate_terms"
    REQUEST_TERMS_APPROVAL = "request_terms_approval"
    GENERATE_PAYMENT = "generate_payment"
    MONITOR_CAMPAIGN = "monitor_campaign"
    GENERATE_REPORT = "generate_report"
    REQUEST_APPROVAL = "request_approval"
    COMPLETE = "complete"


class AgentAction(BaseModel):
    """Action the agent decides to take."""

    type: AgentActionType = Field(..., description="Action type")
    input: dict[str, Any] = Field(default_factory=dict, description="Action input parameters")
    requires_approval: bool = Field(default=False, description="Whether human approval is required")
    reasoning: Optional[str] = Field(None, description="Agent's reasoning for this action")


class ToolResult(BaseModel):
    """Result from executing a tool."""

    success: bool = Field(..., description="Whether the tool execution succeeded")
    output: Optional[dict[str, Any]] = Field(None, description="Tool output data")
    error: Optional[str] = Field(None, description="Error message if success is False")
