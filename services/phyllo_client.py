"""Phyllo API client for creator discovery and content monitoring."""

import os
from typing import Any, Optional

import requests
from requests.auth import HTTPBasicAuth

# Phyllo API endpoints - confirm from https://docs.getphyllo.com/docs/api-reference/api/ref
DEFAULT_BASE_URL = "https://api.getphyllo.com/v1"


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
        except (requests.RequestException, ValueError):
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
        except (requests.RequestException, ValueError):
            return None

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
        Phyllo endpoint: POST /v1/social/creator-profile/search (confirm from docs)
        """
        if not self.is_configured:
            return []

        # Map our platform names to Phyllo's expected values
        platform_map = {"instagram": "instagram", "tiktok": "tiktok", "youtube": "youtube"}
        phyllo_platforms = [
            platform_map.get(p.lower(), p) for p in platforms
        ] if platforms else ["instagram", "tiktok"]

        body: dict[str, Any] = {
            "platforms": phyllo_platforms,
            "follower_count": {"min": follower_min, "max": follower_max},
            "limit": min(limit, 50),
        }
        if categories:
            body["categories"] = categories
        if locations:
            body["locations"] = locations

        resp = self._post("/social/creator-profile/search", body)
        if not resp:
            return []

        # Phyllo may return { "data": [...], "next_cursor": "..." } or direct array
        data = resp.get("data", resp) if isinstance(resp, dict) else resp
        if isinstance(data, list):
            return data[:limit]
        return []

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
