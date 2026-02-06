# Campaign Workflow

**Purpose:** Run an influencer marketing campaign from brief to completion, with human approval at each critical step.

## Objective

Execute a full campaign: receive brief → generate strategy → discover creators → draft outreach → send → negotiate → monitor → report. The agent handles execution; humans approve before irreversible actions.

## Required Inputs

- **Campaign brief (JSON):** Valid `CampaignBrief` with brand_name, objective, target_audience, platforms, follower_range, budget_gbp, deliverables, key_message, timeline
- **Approval responses:** Human approves strategy, creator list, outreach messages, and terms at each checkpoint

## Tools to Use

| Step | Tool | Purpose |
|------|------|---------|
| Intake | `tools/intake_brief.py` | Validate and load brief from JSON |
| Strategy | `agent/hudey_agent.py` (HudeyAgent.generate_strategy) | Generate campaign strategy from brief |
| Discovery | `tools/creator_discovery.py` | Find and rank creators via Phyllo Creator Search API (falls back to mock if `PHYLLO_API_KEY` unset) |
| Outreach | `tools/outreach.py` | Draft and send personalized messages (Phase 3) |
| Monitor | `tools/campaign_monitor.py` | Track content and metrics via Phyllo Public Content API (falls back to mock if `PHYLLO_API_KEY` unset or no `external_id`) |
| Analytics | `tools/analytics.py` | Generate reports (Phase 4) |
| Approval | `tools/approval.py` | Request and check human approval (Phase 3) |

## State Machine

```
BRIEF_RECEIVED → STRATEGY_DRAFT → AWAITING_BRIEF_APPROVAL →
CREATOR_DISCOVERY → AWAITING_CREATOR_APPROVAL →
OUTREACH_DRAFT → AWAITING_OUTREACH_APPROVAL →
OUTREACH_IN_PROG → NEGOTIATION → AWAITING_TERMS_APPROVAL →
CAMPAIGN_ACTIVE → COMPLETED
```

## Steps (Phase 1 scope: Brief → Strategy)

1. **Load brief:** Run `tools/intake_brief.py <brief.json>` or load from `.tmp/`
2. **Generate strategy:** Call `HudeyAgent.generate_strategy(brief)` → CampaignStrategy
3. **Save strategy:** Write to `.tmp/strategy_{id}.json`
4. **Approval checkpoint:** Human reviews strategy; approve to continue or reject with feedback
5. *(Phase 2+)* Creator discovery, outreach, monitoring, reporting

## Expected Outputs

- **Phase 1:** `CampaignStrategy` JSON with approach, creator_count, messaging_angle, platform_priority, rationale, risks
- **Phase 2+:** Creator shortlist, outreach drafts, campaign report

## Phyllo Integration

**Creator Discovery** and **Campaign Monitor** use Phyllo APIs when `PHYLLO_API_KEY` is set in `.env`:

- **Discovery:** Phyllo Creator Search API (`POST /v1/social/creator-profile/search`) — search 250M+ creators by platform, followers, categories, locations
- **Monitoring:** Phyllo Public Content API — fetch post-level metrics (likes, comments, shares) for creators with `external_id` (set when discovery returns Phyllo results)

**Fallback:** When `PHYLLO_API_KEY` is unset, discovery loads from `.tmp/mock_creators.json` and monitoring generates mock metrics. No API calls are made.

## Backend & Supabase

The FastAPI backend and Supabase are **optional**. The CLI and tools work without them (file-based data in `.tmp/`). When configured, the API enables web-based workflows and persistence.

**Environment (optional):** Add to `.env` (see `.env.example`):

- `SUPABASE_URL` — project URL (e.g. `https://your-project.supabase.co`)
- `SUPABASE_SERVICE_KEY` — service role key (for server-side access)

**Schema:** Run `backend/db/schema.sql` in the Supabase SQL editor (Dashboard → SQL Editor) to create tables: `brands`, `campaigns`, `creators`, `campaign_assignments`, `agent_actions`, `campaign_reports`.

**Run the API:**

- From project root: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`
- Or: `python tools/run_server.py`

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/api/campaigns/{id}` | Get campaign (UUID or short_id) |
| POST | `/api/campaigns` | Create campaign (body: `brief`, optional `strategy`, `name`, `short_id`) |
| PUT | `/api/campaigns/{id}` | Update campaign |
| POST | `/webhooks/creator-response` | Ingest creator reply (body: `body`, optional `message_id`, `from_email`, `timestamp`) |
| POST | `/api/approvals/creator-response` | Alias for creator-response |
| GET | `/api/approvals/status` | Approvals health |
| GET | `/api/campaigns` | List campaigns (newest first) |

When Supabase is configured, the agent logs actions to `agent_actions` and `run_campaign` saves the final result to `campaigns.result_json` (creating a campaign by `short_id` if it wasn’t created via the API).

**Frontend (Next.js):** The `frontend/` app displays campaigns and campaign details. Run with `cd frontend && npm run dev`. Set `NEXT_PUBLIC_API_URL` in `.env.local` to your Railway backend URL (or `http://localhost:8000` for local development). Deploy to Vercel when ready.

## Edge Cases

- **Invalid brief:** intake_brief.py returns validation error; fix JSON and retry
- **Missing ANTHROPIC_API_KEY:** Agent raises; add key to .env
- **Claude API failure:** Retry once; if persistent, check API status and key
- **Rejected approval:** Agent handles feedback; human can modify brief/strategy and re-run
- **Empty creator results:** Widen criteria (follower range, categories) and re-run discovery
- **Phyllo rate limits:** Reduce discovery `max_results` or add retry/backoff; check Phyllo dashboard for usage
- **Phyllo 401/403:** Verify `PHYLLO_API_KEY` and required Phyllo plan/features (Creator Search, Public Content)
