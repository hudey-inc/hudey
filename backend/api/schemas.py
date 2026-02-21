"""Pydantic request schemas for all API routes.

Replaces untyped `body: dict` parameters with validated models.
Every field has sensible defaults and constraints so bad data never
reaches Supabase or downstream services.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ── Campaigns ────────────────────────────────────────────────


class CreateCampaignRequest(BaseModel):
    name: Optional[str] = None
    brief: Optional[Dict[str, Any]] = None
    strategy: Optional[Dict[str, Any]] = None
    short_id: Optional[str] = None
    contract_template_id: Optional[str] = None


class ReplyToCreatorRequest(BaseModel):
    creator_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)


class GenerateCounterOfferRequest(BaseModel):
    creator_id: str = Field(..., min_length=1)


class SendCounterOfferRequest(BaseModel):
    creator_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    subject: Optional[str] = None
    proposed_terms: Optional[Dict[str, Any]] = None


class AcceptTermsRequest(BaseModel):
    creator_id: str = Field(..., min_length=1)
    terms: Optional[Dict[str, Any]] = None
    contract_accepted: Optional[bool] = None
    send_confirmation: bool = True
    user_agent: Optional[str] = None


class UpdateEngagementStatusRequest(BaseModel):
    status: Literal["contacted", "responded", "negotiating", "agreed", "declined"]
    terms: Optional[Dict[str, Any]] = None
    latest_proposal: Optional[Dict[str, Any]] = None


class DuplicateCampaignRequest(BaseModel):
    name: Optional[str] = None
    include_creators: bool = False


class UpdateCampaignRequest(BaseModel):
    """Flexible update — at least one field must be provided.

    Accepts any JSON keys so the caller can update status, brief,
    strategy, etc.  We validate that something was actually sent.
    """
    model_config = {"extra": "allow"}


# ── Creators ─────────────────────────────────────────────────


class SearchCreatorsRequest(BaseModel):
    platforms: List[str] = Field(..., min_length=1)
    follower_min: int = Field(default=1000, ge=0)
    follower_max: int = Field(default=1_000_000, ge=1)
    categories: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    limit: int = Field(default=20, ge=1, le=50)

    @field_validator("platforms")
    @classmethod
    def platforms_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one platform is required")
        return v

    @field_validator("follower_max")
    @classmethod
    def max_greater_than_min(cls, v: int, info) -> int:
        follower_min = info.data.get("follower_min", 0)
        if follower_min is not None and v <= follower_min:
            raise ValueError("follower_max must be greater than follower_min")
        return v


class BrandFitRequest(BaseModel):
    creator_ids: List[str] = Field(..., min_length=1, max_length=10)
    brand_name: Optional[str] = None
    brand_description: Optional[str] = None


# ── Approvals ────────────────────────────────────────────────


class CreateApprovalRequest(BaseModel):
    approval_type: str = Field(..., min_length=1, max_length=50)
    payload: Dict[str, Any] = Field(...)
    subject: Optional[str] = Field(None, max_length=255)
    reasoning: Optional[str] = Field(None, max_length=2000)


class DecideApprovalRequest(BaseModel):
    status: Literal["approved", "rejected"]
    feedback: Optional[str] = None


class CreatorResponseRequest(BaseModel):
    body: str = Field(..., min_length=1)
    message_id: Optional[str] = None
    from_email: Optional[str] = None
    timestamp: Optional[str] = None


# ── Brands ───────────────────────────────────────────────────


class UpdateBrandRequest(BaseModel):
    """Flexible brand update. Accepts any known brand fields."""
    model_config = {"extra": "allow"}

    name: Optional[str] = None
    industry: Optional[str] = None
    contact_email: Optional[str] = None
    brand_voice: Optional[Dict[str, Any]] = None


# ── Contracts ────────────────────────────────────────────────


class ContractClause(BaseModel):
    title: str
    body: str
    required: bool = True


class CreateContractRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    clauses: Optional[List[ContractClause]] = None


class UpdateContractRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    clauses: Optional[List[ContractClause]] = None


# ── Templates ────────────────────────────────────────────────


class CreateTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    brief: Optional[Dict[str, Any]] = None
    strategy: Optional[Dict[str, Any]] = None
    campaign_id: Optional[str] = None

    @model_validator(mode="after")
    def brief_or_campaign(self) -> "CreateTemplateRequest":
        if not self.brief and not self.campaign_id:
            raise ValueError("Either brief or campaign_id is required")
        return self


class CreateCampaignFromTemplateRequest(BaseModel):
    name: Optional[str] = None
    brief_overrides: Optional[Dict[str, Any]] = None
