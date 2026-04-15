"""Pydantic request schemas for all API routes.

Replaces untyped `body: dict` parameters with validated models.
Every field has sensible defaults and constraints so bad data never
reaches Supabase or downstream services.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# Defensive size caps on free-form dict fields (brief, strategy, proposed_terms,
# terms). These are paid-downstream and/or persisted to Supabase, so we reject
# pathological payloads (deeply nested dicts, megabyte JSON blobs) before they
# hit any of those paths. Generous limits — real briefs are a few KB.
_MAX_DICT_JSON_BYTES = 64 * 1024      # 64 KB serialized
_MAX_DICT_DEPTH = 8                   # reject billion-laughs style nesting
_SHORT_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")


def _json_depth(value: Any, _seen: int = 0) -> int:
    """Return the deepest nesting level within a JSON-serializable value."""
    if _seen > _MAX_DICT_DEPTH:
        return _seen
    if isinstance(value, dict):
        return 1 + max((_json_depth(v, _seen + 1) for v in value.values()), default=0)
    if isinstance(value, list):
        return 1 + max((_json_depth(v, _seen + 1) for v in value), default=0)
    return 0


def _validate_dict_payload(v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Reject dicts that are too big or too deeply nested."""
    if v is None:
        return v
    if _json_depth(v) > _MAX_DICT_DEPTH:
        raise ValueError(f"payload nested more than {_MAX_DICT_DEPTH} levels deep")
    # Serialize once to enforce a byte cap; also catches non-JSON-able values.
    try:
        serialized = json.dumps(v, default=str)
    except (TypeError, ValueError) as e:
        raise ValueError(f"payload is not JSON-serializable: {e}")
    if len(serialized.encode("utf-8")) > _MAX_DICT_JSON_BYTES:
        raise ValueError(
            f"payload exceeds max size of {_MAX_DICT_JSON_BYTES // 1024} KB"
        )
    return v


# ── Campaigns ────────────────────────────────────────────────


class CreateCampaignRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    brief: Optional[Dict[str, Any]] = None
    strategy: Optional[Dict[str, Any]] = None
    # short_id appears in URLs — restrict to URL-safe chars and reasonable length.
    short_id: Optional[str] = Field(default=None, max_length=64)
    contract_template_id: Optional[str] = Field(default=None, max_length=64)

    @field_validator("short_id")
    @classmethod
    def _valid_short_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not _SHORT_ID_PATTERN.match(v):
            raise ValueError(
                "short_id must start with alphanumeric and contain only "
                "letters, digits, underscore, or hyphen (max 64 chars)"
            )
        return v

    @field_validator("brief", "strategy")
    @classmethod
    def _bounded_dict(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)


class ReplyToCreatorRequest(BaseModel):
    creator_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=10_000)


class GenerateCounterOfferRequest(BaseModel):
    creator_id: str = Field(..., min_length=1, max_length=64)


class SendCounterOfferRequest(BaseModel):
    creator_id: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=10_000)
    subject: Optional[str] = Field(default=None, max_length=500)
    proposed_terms: Optional[Dict[str, Any]] = None

    @field_validator("proposed_terms")
    @classmethod
    def _bounded_terms(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)


class AcceptTermsRequest(BaseModel):
    creator_id: str = Field(..., min_length=1, max_length=64)
    terms: Optional[Dict[str, Any]] = None
    contract_accepted: Optional[bool] = None
    send_confirmation: bool = True
    user_agent: Optional[str] = Field(default=None, max_length=500)

    @field_validator("terms")
    @classmethod
    def _bounded_terms(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)


class UpdateEngagementStatusRequest(BaseModel):
    status: Literal["contacted", "responded", "negotiating", "agreed", "declined"]
    terms: Optional[Dict[str, Any]] = None
    latest_proposal: Optional[Dict[str, Any]] = None

    @field_validator("terms", "latest_proposal")
    @classmethod
    def _bounded_dicts(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)


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
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default="", max_length=2000)
    brief: Optional[Dict[str, Any]] = None
    strategy: Optional[Dict[str, Any]] = None
    campaign_id: Optional[str] = Field(default=None, max_length=64)

    @field_validator("brief", "strategy")
    @classmethod
    def _bounded_dict(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)

    @model_validator(mode="after")
    def brief_or_campaign(self) -> "CreateTemplateRequest":
        if not self.brief and not self.campaign_id:
            raise ValueError("Either brief or campaign_id is required")
        return self


class CreateCampaignFromTemplateRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    brief_overrides: Optional[Dict[str, Any]] = None

    @field_validator("brief_overrides")
    @classmethod
    def _bounded_overrides(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return _validate_dict_payload(v)
