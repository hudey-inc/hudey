"""Campaign brief and creator criteria models."""

from typing import Optional

from pydantic import BaseModel, Field


class CampaignBrief(BaseModel):
    """Input brief for an influencer marketing campaign."""

    brand_name: str = Field(..., description="Name of the brand")
    objective: str = Field(..., description="Campaign objective")
    target_audience: str = Field(..., description="Target audience description")
    platforms: list[str] = Field(..., description="Social platforms (e.g. instagram, tiktok)")
    follower_range: tuple[int, int] = Field(
        ...,
        description="(min_followers, max_followers) for creator selection",
    )
    budget_gbp: float = Field(..., ge=0, description="Budget in GBP")
    deliverables: list[str] = Field(..., description="Expected deliverables")
    key_message: str = Field(..., description="Key message for the campaign")
    timeline: str = Field(..., description="Campaign timeline description")
    industry: Optional[str] = Field(None, description="Brand industry")
    brand_values: Optional[str] = Field(None, description="Brand values (e.g. sustainability, ethical sourcing)")
    brand_voice: Optional[str] = Field(None, description="Brand voice guidelines")


class CreatorCriteria(BaseModel):
    """Criteria for creator discovery, derived from a campaign brief."""

    platforms: list[str] = Field(..., description="Platforms to search")
    follower_range: tuple[int, int] = Field(
        ...,
        description="(min_followers, max_followers)",
    )
    categories: list[str] = Field(default_factory=list, description="Creator categories")
    locations: list[str] = Field(default_factory=list, description="Geographic locations")
    min_engagement: Optional[float] = Field(None, ge=0, le=1, description="Minimum engagement rate")
    max_results: int = Field(default=20, ge=1, le=100, description="Max creators to return")
    campaign_type: Optional[str] = Field(None, description="Type of campaign")
    brand_name: Optional[str] = Field(None, description="Brand name for context")
    target_audience: Optional[str] = Field(None, description="Target audience for context")
    key_message: Optional[str] = Field(None, description="Key message for context")
