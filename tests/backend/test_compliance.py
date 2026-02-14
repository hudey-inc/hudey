"""Tests for compliance verification logic in campaign_monitor.py."""

import pytest
from unittest.mock import MagicMock

from tools.campaign_monitor import (
    _check_compliance,
    _extract_required_hashtags,
    _extract_required_mentions,
    build_monitor_summary,
)


class TestCheckCompliance:
    """Test the _check_compliance function."""

    def test_fully_compliant_post(self):
        post = {"caption": "Check out #ad #mybrand @mybrand amazing product!"}
        result = _check_compliance(
            post,
            required_hashtags=["#ad", "#mybrand"],
            required_mentions=["@mybrand"],
            deliverables=[],
        )
        assert result["hashtags_ok"] is True
        assert result["mentions_ok"] is True
        assert result["compliance_score"] == 100.0
        assert result["issues"] == []

    def test_missing_disclosure_hashtag(self):
        post = {"caption": "Love this product! #mybrand @mybrand"}
        result = _check_compliance(
            post,
            required_hashtags=["#ad", "#mybrand"],
            required_mentions=["@mybrand"],
            deliverables=[],
        )
        assert result["hashtags_ok"] is False
        assert "Missing ad disclosure hashtag" in result["issues"][0]
        assert result["compliance_score"] < 100

    def test_missing_brand_mention(self):
        post = {"caption": "#ad #sponsored great stuff"}
        result = _check_compliance(
            post,
            required_hashtags=["#ad"],
            required_mentions=["@testbrand"],
            deliverables=[],
        )
        assert result["mentions_ok"] is False
        assert any("Missing mentions" in i for i in result["issues"])

    def test_empty_caption(self):
        post = {"caption": ""}
        result = _check_compliance(
            post,
            required_hashtags=["#ad"],
            required_mentions=["@brand"],
            deliverables=[],
        )
        assert result["hashtags_ok"] is False
        assert result["mentions_ok"] is False
        assert len(result["issues"]) >= 2

    def test_no_requirements(self):
        post = {"caption": "Just a regular post"}
        result = _check_compliance(post, [], [], [])
        # No disclosure required, no mentions required
        # hashtags_ok = has_disclosure(False) and no brand tags = False
        assert result["mentions_ok"] is True
        assert result["deliverables_met"] is True

    def test_alternative_disclosure_tags(self):
        """#sponsored should also satisfy disclosure requirement."""
        post = {"caption": "#sponsored #mybrand @mybrand cool product"}
        result = _check_compliance(
            post,
            required_hashtags=["#ad", "#sponsored", "#mybrand"],
            required_mentions=["@mybrand"],
            deliverables=[],
        )
        assert result["hashtags_ok"] is True

    def test_case_insensitive_matching(self):
        post = {"caption": "#AD #MyBrand @MyBrand Love it!"}
        result = _check_compliance(
            post,
            required_hashtags=["#ad", "#mybrand"],
            required_mentions=["@mybrand"],
            deliverables=[],
        )
        assert result["hashtags_ok"] is True
        assert result["mentions_ok"] is True


class TestExtractRequired:
    """Test hashtag/mention extraction from brief."""

    def _make_context(self, brand_name="TestBrand", key_message=""):
        ctx = MagicMock()
        ctx.brief = MagicMock()
        ctx.brief.brand_name = brand_name
        ctx.brief.key_message = key_message
        ctx.brief.deliverables = []
        return ctx

    def test_extract_hashtags_includes_disclosure(self):
        ctx = self._make_context("Acme")
        tags = _extract_required_hashtags(ctx)
        assert "#ad" in tags
        assert "#sponsored" in tags
        assert "#partnership" in tags

    def test_extract_hashtags_includes_brand(self):
        ctx = self._make_context("My Cool Brand")
        tags = _extract_required_hashtags(ctx)
        assert "#mycoolbrand" in tags

    def test_extract_hashtags_from_key_message(self):
        ctx = self._make_context("Test", "Use our product #summervibes #freshstart")
        tags = _extract_required_hashtags(ctx)
        assert "#summervibes" in tags
        assert "#freshstart" in tags

    def test_extract_mentions(self):
        ctx = self._make_context("TestBrand")
        mentions = _extract_required_mentions(ctx)
        assert "@testbrand" in mentions

    def test_extract_no_brief(self):
        ctx = MagicMock()
        ctx.brief = None
        assert _extract_required_hashtags(ctx) == []
        assert _extract_required_mentions(ctx) == []


class TestBuildMonitorSummary:
    """Test the build_monitor_summary aggregation function."""

    def test_basic_summary(self):
        updates = [
            {
                "creator": {"username": "alice"},
                "posted": True,
                "metrics": {"likes": 100, "comments": 10, "shares": 5, "saves": 3},
                "compliance": {"compliance_score": 100, "issues": []},
            },
            {
                "creator": {"username": "bob"},
                "posted": True,
                "metrics": {"likes": 200, "comments": 20, "shares": 10, "saves": 7},
                "compliance": {"compliance_score": 66.7, "issues": ["Missing mention"]},
            },
        ]
        s = build_monitor_summary(updates)
        assert s["total_creators"] == 2
        assert s["posts_live"] == 2
        assert s["total_likes"] == 300
        assert s["total_comments"] == 30
        assert s["fully_compliant"] == 1
        assert s["compliance_issues"] == 1

    def test_empty_updates(self):
        s = build_monitor_summary([])
        assert s["posts_live"] == 0
        assert s["total_likes"] == 0
        assert s["avg_compliance_score"] == 0

    def test_unposted_creators(self):
        updates = [
            {
                "creator": {"username": "alice"},
                "posted": False,
                "metrics": {"likes": 0, "comments": 0, "shares": 0, "saves": 0},
                "compliance": {"compliance_score": 0, "issues": []},
            },
        ]
        s = build_monitor_summary(updates)
        assert s["total_creators"] == 1
        assert s["posts_live"] == 0
        assert s["total_likes"] == 0
