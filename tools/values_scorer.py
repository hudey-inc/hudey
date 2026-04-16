"""Values scorer — Claude-powered content analysis for Layer 4.

Given a creator's recent posts and a brand's values list, return:
  - score (0-100): how strongly the creator's content reflects those values
  - evidence (list[str]): short quoted snippets from posts backing the score

This is Hudey's proprietary signal — nothing else in the stack looks at
actual post captions to verify a creator's claimed values. It's the core
of the "values-vetting" USP.

Design notes
------------
- Async-friendly: the orchestrator runs several of these concurrently, so we
  use `anthropic.AsyncAnthropic` rather than blocking calls.
- Graceful degrade: if no API key or the model errors, we return `(0, [])`
  so the orchestrator can still produce a result set (just unscored).
- Token-conservative: cap content to the first ~20 posts × ~500 chars each.
  Long-tail posts don't change the signal much and they blow the prompt up.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_MAX_POSTS_IN_PROMPT = 20
_MAX_CHARS_PER_POST = 500
_SCORE_MODEL = "claude-sonnet-4-5"
_MAX_TOKENS = 512  # response is small JSON, this is plenty

_PROMPT_TEMPLATE = """You are a brand-safety analyst for sustainable/ethical brands.

Analyse the creator's recent posts below and rate how strongly their content
reflects the brand's stated values.

Brand values (what the brand stands for):
{values_list}

{profile_hint_block}
Creator's recent posts:
{posts_block}

Return a JSON object:
{{
  "score": <integer 0-100>,
  "evidence": [<up to 5 short quoted snippets from posts that support the score>]
}}

Guidance for scoring:
  - 80-100: values clearly + consistently expressed in content
  - 50-79:  partial / occasional alignment
  - 20-49:  weak or indirect alignment
  - 0-19:   no alignment, or active contradiction (e.g. greenwashing flags,
            fast-fashion cross-posts for a sustainable brand)

Return ONLY the JSON object, no other text.
"""


async def score_creator_content(
    posts: list[dict],
    brand_values: list[str],
    *,
    profile_hint: str = "",
) -> tuple[float, list[str]]:
    """Score a creator's posts against brand values.

    Returns (score 0-100, up to 5 evidence snippets). Returns (0, []) if
    the Anthropic API key is missing, if the model errors, or if posts
    are empty — the orchestrator treats these as "unscored, keep flowing".
    """
    if not posts or not brand_values:
        return 0.0, []

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not api_key:
        logger.debug("values_scorer: ANTHROPIC_API_KEY not set, returning zero")
        return 0.0, []

    prompt = _build_prompt(posts, brand_values, profile_hint)

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        logger.warning("values_scorer: anthropic SDK not importable")
        return 0.0, []

    try:
        client = AsyncAnthropic(api_key=api_key)
        resp = await client.messages.create(
            model=_SCORE_MODEL,
            max_tokens=_MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.warning("values_scorer: LLM call failed: %s", e)
        return 0.0, []

    try:
        text = resp.content[0].text.strip()
    except (AttributeError, IndexError) as e:
        logger.warning("values_scorer: unexpected response shape: %s", e)
        return 0.0, []

    return _parse_score(text)


# ─── Helpers ────────────────────────────────────────────────


def _build_prompt(
    posts: list[dict], brand_values: list[str], profile_hint: str,
) -> str:
    posts_text = _format_posts(posts[:_MAX_POSTS_IN_PROMPT])
    values_text = "\n".join(f"  - {v}" for v in brand_values)

    hint_block = ""
    if profile_hint:
        # Bio often says the quiet part out loud (e.g. "🌱 sustainable skincare").
        # Worth feeding to the model as a soft signal.
        hint_block = f"Creator bio hint: {profile_hint.strip()[:300]}\n\n"

    return _PROMPT_TEMPLATE.format(
        values_list=values_text,
        profile_hint_block=hint_block,
        posts_block=posts_text,
    )


def _format_posts(posts: list[dict]) -> str:
    """Condense a list of post dicts into a plain-text block for the prompt."""
    lines = []
    for i, post in enumerate(posts, start=1):
        caption = _extract_caption(post)
        if not caption:
            continue
        caption = caption[:_MAX_CHARS_PER_POST].replace("\n", " ")
        lines.append(f"[{i}] {caption}")
    return "\n".join(lines) or "(no post captions available)"


def _extract_caption(post: dict) -> Optional[str]:
    """Pull a caption out of post dicts from any of our providers."""
    for key in ("caption", "text", "description", "title"):
        val = post.get(key)
        if isinstance(val, str) and val.strip():
            return val
    # IG posts sometimes nest under `edge_media_to_caption.edges[0].node.text`
    edges = post.get("edge_media_to_caption")
    if isinstance(edges, dict):
        items = edges.get("edges") or []
        if items and isinstance(items[0], dict):
            node = items[0].get("node") or {}
            text = node.get("text")
            if isinstance(text, str) and text.strip():
                return text
    return None


def _parse_score(text: str) -> tuple[float, list[str]]:
    """Parse the model's JSON response. Tolerant of code fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.warning("values_scorer: JSON parse failed: %s — text=%r", e, text[:200])
        return 0.0, []

    raw_score = data.get("score")
    if isinstance(raw_score, (int, float)):
        score = max(0.0, min(100.0, float(raw_score)))
    else:
        score = 0.0

    evidence_raw = data.get("evidence") or []
    evidence = [str(x) for x in evidence_raw if isinstance(x, (str, int, float))][:5]
    return score, evidence
