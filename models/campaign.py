"""Campaign strategy, creator, and engagement models."""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class EngagementStatus(str, Enum):
    """Status of creator engagement in negotiation."""

    CONTACTED = "contacted"
    RESPONDED = "responded"
    NEGOTIATING = "negotiating"
    AGREED = "agreed"
    DECLINED = "declined"


class CreatorEngagement(BaseModel):
    """Tracks negotiation state and message history for a creator."""

    creator_id: str = Field(..., description="Creator ID or username")
    status: EngagementStatus = Field(default=EngagementStatus.CONTACTED)
    latest_proposal: Optional[dict[str, Any]] = Field(
        None,
        description="Latest proposed terms: fee, deliverables, deadline",
    )
    terms: Optional[dict[str, Any]] = Field(
        None,
        description="Agreed financial terms when status is agreed",
    )
    message_history: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Thread of messages (from, to, body, timestamp)",
    )
    response_timestamp: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)


class CampaignStrategy(BaseModel):
    """Agent-generated campaign strategy."""

    approach: str = Field(..., description="Overall campaign approach")
    creator_count: int = Field(..., ge=1, le=100, description="Number of creators to engage")
    messaging_angle: str = Field(..., description="Primary messaging angle")
    platform_priority: list[str] = Field(
        default_factory=list,
        description="Platforms in order of priority",
    )
    rationale: Optional[str] = Field(None, description="Reasoning behind the strategy")
    risks: Optional[list[str]] = Field(None, description="Identified risks or considerations")


class Creator(BaseModel):
    """Creator from discovery results."""

    id: Optional[str] = Field(None, description="External or internal ID")
    external_id: Optional[str] = Field(None, description="Phyllo profile/account ID for content lookup")
    username: str = Field(..., description="Platform username")
    platform: str = Field(..., description="Primary platform")
    display_name: Optional[str] = Field(None, description="Display name")
    follower_count: int = Field(..., ge=0, description="Follower count")
    engagement_rate: Optional[float] = Field(None, ge=0, le=1, description="Engagement rate")
    categories: list[str] = Field(default_factory=list, description="Content categories")
    location: Optional[str] = Field(None, description="Location")
    email: Optional[str] = Field(None, description="Contact email")
    profile_data: Optional[dict] = Field(None, description="Full profile snapshot")
    # InsightIQ enrichment fields
    brand_fit_score: Optional[float] = Field(None, ge=0, le=100, description="Brand fit score (0-100)")
    brand_fit_data: Optional[dict] = Field(None, description="Full brand fit analysis from InsightIQ")
