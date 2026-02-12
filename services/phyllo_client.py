"""InsightIQ (formerly Phyllo) API client for creator discovery, content monitoring, and insights."""

import logging
import os
import time
from typing import Any, Optional

import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)

# InsightIQ (formerly Phyllo) API - https://docs.insightiq.ai
DEFAULT_BASE_URL = "https://api.insightiq.ai/v1"


class PhylloClient:
    """Client for Phyllo Creator Search and Public Content APIs."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        raw_key = (api_key or os.getenv("PHYLLO_API_KEY") or "").strip()
        cid = (client_id or os.getenv("PHYLLO_CLIENT_ID") or "").strip()
        csec = (client_secret or os.getenv("PHYLLO_CLIENT_SECRET") or "").strip()
        self.api_key = raw_key or None
        self.client_id = cid or None
        self.client_secret = csec or None
        self.base_url = (base_url or os.getenv("PHYLLO_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")

    @property
    def is_configured(self) -> bool:
        """True if we have credentials (Basic Auth or Bearer)."""
        return bool(
            (self.client_id and self.client_secret)
            or self.api_key
        )

    def _auth(self) -> Optional[HTTPBasicAuth]:
        if self.client_id and self.client_secret:
            return HTTPBasicAuth(self.client_id, self.client_secret)
        return None

    def _headers(self) -> dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key and not self._auth():
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    def _get(self, path: str, params: Optional[dict] = None) -> Optional[dict]:
        if not self.is_configured:
            return None
        try:
            r = requests.get(
                f"{self.base_url}{path}",
                auth=self._auth(),
                headers=self._headers(),
                params=params,
                timeout=30,
            )
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            logger.warning("InsightIQ GET %s failed: %s", path, e)
            return None
        except ValueError:
            return None

    def _post(self, path: str, body: dict) -> Optional[dict]:
        if not self.is_configured:
            return None
        try:
            r = requests.post(
                f"{self.base_url}{path}",
                auth=self._auth(),
                headers=self._headers(),
                json=body,
                timeout=30,
            )
            r.raise_for_status()
            return r.json()
        except requests.RequestException as e:
            logger.warning("InsightIQ POST %s failed: %s", path, e)
            if hasattr(e, "response") and e.response is not None:
                logger.warning("Response body: %s", e.response.text[:500])
            return None
        except ValueError:
            return None

    # InsightIQ work_platform_id mapping
    PLATFORM_IDS: dict[str, str] = {
        "instagram": "9bb8913b-ddd9-430b-a66a-d74d846e6c66",
        "tiktok": "de55aeec-0dc8-4119-bf90-16b3d1f0c987",
        "youtube": "14d9ddf5-51c6-415e-bde6-f8ed36ad7054",
        "x": "7645460a-96e0-4192-a3ce-a1fc30641f72",
        "twitter": "7645460a-96e0-4192-a3ce-a1fc30641f72",
        "twitch": "e4de6c01-5b78-4fc0-a651-24f44134457b",
        "facebook": "ad2fec62-2987-40a0-89fb-23485972598c",
        "snapchat": "ee3c8d7a-3207-4f56-945f-f942b34c96e1",
    }

    def search_creators(
        self,
        platforms: list[str],
        follower_min: int,
        follower_max: int,
        categories: Optional[list[str]] = None,
        locations: Optional[list[str]] = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Search creators matching criteria.

        Returns list of raw creator dicts, or empty list on failure.
        InsightIQ endpoint: POST /v1/social/creators/profiles/search
        """
        if not self.is_configured:
            return []

        # Resolve platform names to InsightIQ work_platform_ids
        resolved = [
            self.PLATFORM_IDS.get(p.lower().strip())
            for p in (platforms or ["instagram"])
        ]
        # Default to Instagram if no valid platform found
        platform_ids = [pid for pid in resolved if pid]
        if not platform_ids:
            platform_ids = [self.PLATFORM_IDS["instagram"]]

        all_results: list[dict[str, Any]] = []
        per_platform_limit = max(limit // len(platform_ids), 5)

        for platform_id in platform_ids:
            body: dict[str, Any] = {
                "work_platform_id": platform_id,
                "sort_by": {"field": "FOLLOWER_COUNT", "order": "DESCENDING"},
                "follower_count": {"min": follower_min, "max": follower_max},
                "limit": min(per_platform_limit, 50),
            }
            if categories:
                body["topic_relevance"] = categories
            if locations:
                body["creator_locations"] = locations

            resp = self._post("/social/creators/profiles/search", body)
            if resp:
                data = resp.get("data", resp) if isinstance(resp, dict) else resp
                if isinstance(data, list):
                    all_results.extend(data)

        return all_results[:limit]

    def get_creator_content(
        self,
        creator_id: str,
        platform: str,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Get content/posts for a creator with engagement metrics.

        Returns list of post dicts with likes, comments, shares, url, etc.
        Phyllo Public Content API - endpoint format may vary (e.g. profiles/{id}/content).
        """
        if not self.is_configured or not creator_id:
            return []

        # Phyllo may use profile_id or account_id - try common patterns
        path = f"/social/profiles/{creator_id}/content"
        resp = self._get(path, params={"limit": limit})
        if not resp:
            # Alternate: engagements endpoint
            path = f"/social/profiles/{creator_id}/engagements"
            resp = self._get(path, params={"limit": limit})

        if not resp:
            return []

        data = resp.get("data", resp) if isinstance(resp, dict) else resp
        if isinstance(data, list):
            return data[:limit]
        return []

    # ── Async job helpers ───────────────────────────────────────

    def _poll_job(self, job_id: str, path_prefix: str, max_wait: int = 60) -> Optional[dict]:
        """Poll an async InsightIQ job until complete or timeout.

        InsightIQ analysis endpoints (brand fit, purchase intent, comments relevance)
        are async: POST creates a job, GET retrieves results when ready.
        """
        elapsed = 0
        interval = 3
        while elapsed < max_wait:
            resp = self._get(f"{path_prefix}/{job_id}")
            if resp:
                status = resp.get("status", "").upper()
                if status in ("COMPLETED", "SUCCESS", "DONE"):
                    return resp
                if status in ("FAILED", "ERROR"):
                    logger.warning("InsightIQ job %s failed: %s", job_id, resp)
                    return None
            time.sleep(interval)
            elapsed += interval
            interval = min(interval * 1.5, 10)  # Back off
        logger.warning("InsightIQ job %s timed out after %ds", job_id, max_wait)
        return None

    # ── Brand Fit Analysis ──────────────────────────────────────

    def create_brand_fit(
        self,
        creator_id: str,
        brand_name: str,
        brand_description: str,
        work_platform_id: Optional[str] = None,
    ) -> Optional[dict]:
        """Create a brand fit analysis request.

        Evaluates compatibility between a creator's content/audience and
        a brand's tone, aesthetics, and interest areas.

        InsightIQ endpoint: POST /v1/social/creators/brand-fit
        Returns the job/analysis object or None on failure.
        """
        if not self.is_configured or not creator_id:
            return None
        if "sandbox" in self.base_url:
            return None

        body: dict[str, Any] = {
            "creator_identifier": creator_id,
            "brand_name": brand_name,
            "brand_description": brand_description,
        }
        if work_platform_id:
            body["work_platform_id"] = work_platform_id

        return self._post("/social/creators/brand-fit", body)

    def get_brand_fit(self, analysis_id: str) -> Optional[dict]:
        """Get brand fit analysis results.

        InsightIQ endpoint: GET /v1/social/creators/brand-fit/{id}
        """
        if not self.is_configured:
            return None
        return self._get(f"/social/creators/brand-fit/{analysis_id}")

    def analyze_brand_fit(
        self,
        creator_id: str,
        brand_name: str,
        brand_description: str,
        work_platform_id: Optional[str] = None,
        max_wait: int = 60,
    ) -> Optional[dict]:
        """Create and poll brand fit analysis (convenience method).

        Returns completed analysis or None.
        """
        resp = self.create_brand_fit(creator_id, brand_name, brand_description, work_platform_id)
        if not resp:
            return None
        job_id = resp.get("id") or resp.get("analysis_id") or resp.get("request_id")
        if not job_id:
            # Response might be synchronous
            return resp
        return self._poll_job(job_id, "/social/creators/brand-fit", max_wait)

    # ── Purchase Intent Analysis ────────────────────────────────

    def create_purchase_intent(
        self,
        content_id: str,
        product_name: str,
        product_description: str = "",
    ) -> Optional[dict]:
        """Create a purchase intent analysis on post comments.

        Checks if creator's audience shows interest in buying the promoted
        product/service based on comment analysis.

        InsightIQ endpoint: POST /v1/social/creators/comments/purchase-intent
        """
        if not self.is_configured or not content_id:
            return None
        if "sandbox" in self.base_url:
            return None

        body: dict[str, Any] = {
            "content_id": content_id,
            "product_name": product_name,
        }
        if product_description:
            body["product_description"] = product_description

        return self._post("/social/creators/comments/purchase-intent", body)

    def get_purchase_intent(self, analysis_id: str) -> Optional[dict]:
        """Get purchase intent analysis results.

        InsightIQ endpoint: GET /v1/social/creators/comments/purchase-intent/{id}
        """
        if not self.is_configured:
            return None
        return self._get(f"/social/creators/comments/purchase-intent/{analysis_id}")

    def analyze_purchase_intent(
        self,
        content_id: str,
        product_name: str,
        product_description: str = "",
        max_wait: int = 60,
    ) -> Optional[dict]:
        """Create and poll purchase intent analysis (convenience method)."""
        resp = self.create_purchase_intent(content_id, product_name, product_description)
        if not resp:
            return None
        job_id = resp.get("id") or resp.get("analysis_id") or resp.get("request_id")
        if not job_id:
            return resp
        return self._poll_job(job_id, "/social/creators/comments/purchase-intent", max_wait)

    # ── Comments Relevance Analysis ─────────────────────────────

    def create_comments_relevance(
        self,
        content_id: str,
        product_name: str,
        product_description: str = "",
    ) -> Optional[dict]:
        """Create a comments relevance analysis.

        Identifies comments on a post that are relevant to the
        product/service being promoted, filtering out noise.

        InsightIQ endpoint: POST /v1/social/creators/comments/relevance
        """
        if not self.is_configured or not content_id:
            return None
        if "sandbox" in self.base_url:
            return None

        body: dict[str, Any] = {
            "content_id": content_id,
            "product_name": product_name,
        }
        if product_description:
            body["product_description"] = product_description

        return self._post("/social/creators/comments/relevance", body)

    def get_comments_relevance(self, analysis_id: str) -> Optional[dict]:
        """Get comments relevance analysis results.

        InsightIQ endpoint: GET /v1/social/creators/comments/relevance/{id}
        """
        if not self.is_configured:
            return None
        return self._get(f"/social/creators/comments/relevance/{analysis_id}")

    def analyze_comments_relevance(
        self,
        content_id: str,
        product_name: str,
        product_description: str = "",
        max_wait: int = 60,
    ) -> Optional[dict]:
        """Create and poll comments relevance analysis (convenience method)."""
        resp = self.create_comments_relevance(content_id, product_name, product_description)
        if not resp:
            return None
        job_id = resp.get("id") or resp.get("analysis_id") or resp.get("request_id")
        if not job_id:
            return resp
        return self._poll_job(job_id, "/social/creators/comments/relevance", max_wait)
