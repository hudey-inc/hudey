"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Campaign, Approval } from "@/lib/api";
import { getCampaign, listApprovals, decideApproval, runCampaign } from "@/lib/api";
import {
  StatusBadge,
  StepProgress,
  Section,
  Card,
  CampaignReport,
  BriefSection,
  PendingApprovalCard,
  PastApprovalRow,
  EmailTracking,
} from "@/components/campaign";

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATE_LABELS: Record<string, string> = {
  brief_received: "Starting…",
  strategy_draft: "Generating strategy…",
  awaiting_brief_approval: "Awaiting strategy approval",
  creator_discovery: "Discovering creators…",
  awaiting_creator_approval: "Awaiting creator approval",
  outreach_draft: "Drafting outreach…",
  awaiting_outreach_approval: "Awaiting outreach approval",
  outreach_in_prog: "Sending outreach…",
  negotiation: "Negotiating with creators…",
  awaiting_terms_approval: "Awaiting terms approval",
  payment_pending: "Processing payments…",
  campaign_active: "Monitoring campaign…",
  completed: "Completed",
};

// ── Strategy inline display (for strategy section) ──────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StrategySection({ strategy }: { strategy: Record<string, any> }) {
  return (
    <Card>
      <div className="space-y-4 text-sm">
        {strategy.approach && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Approach</p>
            <p className="text-stone-800 leading-relaxed">{String(strategy.approach)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {strategy.creator_count != null && (
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <p className="text-xl font-semibold text-stone-900">{String(strategy.creator_count)}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Creators</p>
            </div>
          )}
          {strategy.platform_priority && (
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <div className="flex justify-center gap-1.5 flex-wrap">
                {(Array.isArray(strategy.platform_priority)
                  ? (strategy.platform_priority as string[])
                  : [String(strategy.platform_priority)]
                ).map((p) => (
                  <span key={p} className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600 capitalize">
                    {p}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5">Platforms</p>
            </div>
          )}
          {strategy.budget_per_creator && (
            <div className="rounded-lg bg-stone-50 p-3 text-center">
              <p className="text-xl font-semibold text-stone-900">£{Number(strategy.budget_per_creator).toLocaleString()}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Per Creator</p>
            </div>
          )}
        </div>

        {strategy.messaging_angle && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Messaging Angle</p>
            <p className="text-stone-800 leading-relaxed">{String(strategy.messaging_angle)}</p>
          </div>
        )}

        {strategy.rationale && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Rationale</p>
            <p className="text-stone-600 leading-relaxed">{String(strategy.rationale)}</p>
          </div>
        )}

        {strategy.risks && (
          <div>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Risks</p>
            {Array.isArray(strategy.risks) ? (
              <ul className="space-y-1.5">
                {(strategy.risks as string[]).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-stone-600 text-[13px]">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-600 text-[13px]">{String(strategy.risks)}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function CampaignDetail() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      getCampaign(id),
      listApprovals(id).catch(() => [] as Approval[]),
    ]).then(([c, a]) => {
      if (c) setCampaign(c);
      setApprovals(a);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    Promise.all([
      getCampaign(id),
      listApprovals(id).catch(() => [] as Approval[]),
    ])
      .then(([c, a]) => { setCampaign(c); setApprovals(a); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const isActive = campaign?.status === "running" || campaign?.status === "awaiting_approval";
    if (isActive && !pollingRef.current) {
      pollingRef.current = setInterval(fetchAll, 4000);
    } else if (!isActive && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [campaign?.status, fetchAll]);

  async function handleRun() {
    setStarting(true); setRunError(null);
    try { await runCampaign(id); fetchAll(); }
    catch (err) { setRunError(err instanceof Error ? err.message : "Failed to start"); }
    finally { setStarting(false); }
  }

  async function handleDecide(approvalId: string, status: "approved" | "rejected", feedback?: string) {
    try { await decideApproval(approvalId, status, feedback); fetchAll(); } catch { /* noop */ }
  }

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        <p className="font-medium text-sm">Campaign not found</p>
        <p className="text-[13px] mt-1">{error || "Could not load campaign."}</p>
        <Link href="/" className="text-[13px] mt-3 inline-block text-amber-700 hover:underline">← Back to campaigns</Link>
      </div>
    );
  }

  // ── Data extraction ──

  const result = campaign.result_json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brief = (campaign.brief || result?.brief) as Record<string, any> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strategy = (campaign.strategy || result?.strategy) as Record<string, any> | undefined;
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const pastApprovals = approvals.filter((a) => a.status !== "pending");
  const isRunning = campaign.status === "running" || campaign.status === "awaiting_approval";
  const isCompleted = campaign.status === "completed";
  const isFailed = campaign.status === "failed";
  const isDraft = campaign.status === "draft";

  return (
    <div>
      {/* ── Back link ── */}
      <Link href="/" className="inline-flex items-center gap-1 text-[13px] text-stone-400 hover:text-stone-700 transition-colors mb-6">
        <span>←</span> Campaigns
      </Link>

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-stone-900 truncate">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={campaign.status} />
              <span className="text-[11px] text-stone-400">Created {formatDate(campaign.created_at)}</span>
              {campaign.completed_at && (
                <span className="text-[11px] text-stone-400">Completed {formatDate(campaign.completed_at)}</span>
              )}
            </div>
          </div>
          {(isDraft || isFailed) && (
            <button
              onClick={handleRun}
              disabled={starting}
              className="flex-shrink-0 rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? "Starting…" : isFailed ? "Retry" : "Run Campaign"}
            </button>
          )}
        </div>

        {/* Progress bar for active campaigns */}
        {(isRunning || isCompleted) && (
          <div className="mt-5">
            <StepProgress agentState={campaign.agent_state} status={campaign.status} />
          </div>
        )}

        {/* Running state label */}
        {isRunning && campaign.agent_state && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[13px] text-blue-700">
              {STATE_LABELS[campaign.agent_state] || campaign.agent_state}
            </span>
          </div>
        )}

        {/* Failed message */}
        {isFailed && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-[13px] text-red-700">
              Campaign failed{campaign.agent_state?.startsWith("error:") ? `: ${campaign.agent_state.slice(7)}` : ""}
            </span>
          </div>
        )}

        {runError && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-700">
            {runError}
          </div>
        )}
      </div>

      {/* ── Pending Approvals ── */}
      {pendingApprovals.length > 0 && (
        <Section
          title="Action Required"
          badge={
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {pendingApprovals.length}
            </span>
          }
        >
          <div className="space-y-4">
            {pendingApprovals.map((a) => (
              <PendingApprovalCard key={a.id} approval={a} onDecide={handleDecide} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Campaign Report (completed campaigns) ── */}
      {result && isCompleted && (
        <Section title="Report">
          <CampaignReport result={result} />
        </Section>
      )}

      {/* ── Email Delivery Tracking ── */}
      {isCompleted && (
        <Section title="Email Delivery">
          <EmailTracking campaignId={id} />
        </Section>
      )}

      {/* ── Brief ── */}
      {brief && (
        <Section title="Brief">
          <BriefSection brief={brief} />
        </Section>
      )}

      {/* ── Strategy ── */}
      {strategy && typeof strategy === "object" && (
        <Section title="Strategy">
          <StrategySection strategy={strategy} />
        </Section>
      )}

      {/* ── In-progress result (running campaigns) ── */}
      {result && !isCompleted && (
        <Section title="Progress">
          <CampaignReport result={result} />
        </Section>
      )}

      {/* ── Approval History ── */}
      {pastApprovals.length > 0 && (
        <Section title="Approval History">
          <Card className="divide-y divide-stone-50">
            {pastApprovals.map((a) => (
              <PastApprovalRow key={a.id} approval={a} />
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}
