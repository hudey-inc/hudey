"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Campaign, Approval } from "@/lib/api";
import { getCampaign, listApprovals, decideApproval, runCampaign } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Approval payload renderers ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StrategyPayload({ payload }: { payload: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
      {payload.approach && (
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Approach</p>
          <p className="text-stone-900 mt-0.5">{String(payload.approach)}</p>
        </div>
      )}
      {payload.creator_count != null && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Creator Count</p>
          <p className="text-stone-900 mt-0.5">{String(payload.creator_count)}</p>
        </div>
      )}
      {payload.messaging_angle && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Messaging Angle</p>
          <p className="text-stone-900 mt-0.5">{String(payload.messaging_angle)}</p>
        </div>
      )}
      {payload.platform_priority && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Platform Priority</p>
          <p className="text-stone-900 mt-0.5">
            {Array.isArray(payload.platform_priority)
              ? (payload.platform_priority as string[]).join(", ")
              : String(payload.platform_priority)}
          </p>
        </div>
      )}
      {payload.rationale && (
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Rationale</p>
          <p className="text-stone-900 mt-0.5">{String(payload.rationale)}</p>
        </div>
      )}
      {payload.risks && (
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Risks</p>
          <p className="text-stone-900 mt-0.5">{String(payload.risks)}</p>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CreatorsPayload({ payload }: { payload: Record<string, any> }) {
  const creators = (payload.creators || payload) as Record<string, unknown>[];
  if (!Array.isArray(creators)) {
    return <pre className="text-xs text-stone-600 overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs font-medium text-stone-400 uppercase tracking-wide">
            <th className="pb-2 pr-4">Creator</th>
            <th className="pb-2 pr-4">Platform</th>
            <th className="pb-2 pr-4">Followers</th>
            <th className="pb-2">Engagement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {creators.map((c, i) => (
            <tr key={i}>
              <td className="py-2 pr-4 font-medium text-stone-900">
                {String(c.username || c.display_name || `Creator ${i + 1}`)}
              </td>
              <td className="py-2 pr-4 text-stone-600 capitalize">
                {String(c.platform || "—")}
              </td>
              <td className="py-2 pr-4 text-stone-600">
                {c.follower_count != null ? Number(c.follower_count).toLocaleString() : "—"}
              </td>
              <td className="py-2 text-stone-600">
                {c.engagement_rate != null
                  ? `${(Number(c.engagement_rate) * 100).toFixed(1)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OutreachPayload({ payload }: { payload: Record<string, any> }) {
  const drafts = (payload.drafts || payload) as Record<string, unknown>[];
  if (!Array.isArray(drafts)) {
    return <pre className="text-xs text-stone-600 overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
  }
  return (
    <div className="space-y-3">
      {drafts.map((d, i) => (
        <div key={i} className="rounded-lg border border-stone-100 bg-stone-50 p-4">
          <p className="text-xs font-medium text-stone-400 mb-1">
            To: {String(d.creator || d.to || d.username || `Creator ${i + 1}`)}
          </p>
          <p className="text-sm text-stone-900 whitespace-pre-wrap">
            {String(d.message || d.body || d.content || JSON.stringify(d))}
          </p>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TermsPayload({ payload }: { payload: Record<string, any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terms = (payload.proposed_terms || payload.terms || payload) as Record<string, any>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      {terms.fee_gbp != null && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Fee</p>
          <p className="text-stone-900 mt-0.5 text-lg font-semibold">£{Number(terms.fee_gbp).toLocaleString()}</p>
        </div>
      )}
      {terms.deadline && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Deadline</p>
          <p className="text-stone-900 mt-0.5">{String(terms.deadline)}</p>
        </div>
      )}
      {Array.isArray(terms.deliverables) && (
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Deliverables</p>
          <ul className="mt-0.5 space-y-0.5">
            {(terms.deliverables as string[]).map((d, i) => (
              <li key={i} className="text-stone-900">• {d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GenericPayload({ payload }: { payload: Record<string, any> }) {
  return (
    <pre className="text-xs text-stone-600 overflow-x-auto bg-stone-50 rounded-lg p-3">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ApprovalPayload({ type, payload }: { type: string; payload: Record<string, any> }) {
  switch (type) {
    case "strategy":
      return <StrategyPayload payload={payload} />;
    case "creators":
      return <CreatorsPayload payload={payload} />;
    case "outreach":
      return <OutreachPayload payload={payload} />;
    case "terms":
      return <TermsPayload payload={payload} />;
    default:
      return <GenericPayload payload={payload} />;
  }
}

// ── Approval Card ───────────────────────────────────────────

function ApprovalCard({
  approval,
  onDecide,
}: {
  approval: Approval;
  onDecide: (id: string, status: "approved" | "rejected", feedback?: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPending = approval.status === "pending";

  async function handleApprove() {
    setSubmitting(true);
    await onDecide(approval.id, "approved");
    setSubmitting(false);
  }

  async function handleReject() {
    if (!showFeedback) {
      setShowFeedback(true);
      return;
    }
    setSubmitting(true);
    await onDecide(approval.id, "rejected", feedback || undefined);
    setSubmitting(false);
  }

  const borderColor = isPending
    ? "border-blue-200"
    : approval.status === "approved"
    ? "border-green-200"
    : "border-red-200";

  const bgColor = isPending
    ? "bg-blue-50/50"
    : approval.status === "approved"
    ? "bg-green-50/50"
    : "bg-red-50/50";

  const statusBadge = isPending ? (
    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      Pending
    </span>
  ) : approval.status === "approved" ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Approved
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      Rejected
    </span>
  );

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-stone-900">{approval.subject}</h3>
          <p className="text-xs text-stone-400 mt-0.5">{formatDate(approval.created_at)}</p>
        </div>
        {statusBadge}
      </div>

      {approval.reasoning && (
        <p className="text-sm text-stone-600 mb-3 italic">
          &ldquo;{approval.reasoning}&rdquo;
        </p>
      )}

      <div className="mb-4">
        <ApprovalPayload type={approval.approval_type} payload={approval.payload} />
      </div>

      {!isPending && approval.feedback && (
        <div className="rounded-lg bg-white border border-stone-200 p-3 mb-3">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Feedback</p>
          <p className="text-sm text-stone-700">{approval.feedback}</p>
        </div>
      )}

      {!isPending && approval.decided_at && (
        <p className="text-xs text-stone-400">
          Decided: {formatDate(approval.decided_at)}
        </p>
      )}

      {isPending && (
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-stone-200">
          {showFeedback && (
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Why are you rejecting? Any modifications needed?"
              rows={2}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {showFeedback ? "Confirm Reject" : "Reject"}
            </button>
            {showFeedback && (
              <button
                onClick={() => setShowFeedback(false)}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

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

  // Initial load
  useEffect(() => {
    Promise.all([
      getCampaign(id),
      listApprovals(id).catch(() => [] as Approval[]),
    ])
      .then(([c, a]) => {
        setCampaign(c);
        setApprovals(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-poll when campaign is active
  useEffect(() => {
    const isActive = campaign?.status === "running" || campaign?.status === "awaiting_approval";
    if (isActive && !pollingRef.current) {
      pollingRef.current = setInterval(fetchAll, 4000);
    } else if (!isActive && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [campaign?.status, fetchAll]);

  async function handleRun() {
    setStarting(true);
    setRunError(null);
    try {
      await runCampaign(id);
      // Refresh to pick up status change
      fetchAll();
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  async function handleDecide(approvalId: string, status: "approved" | "rejected", feedback?: string) {
    try {
      await decideApproval(approvalId, status, feedback);
      fetchAll();
    } catch {
      // silently fail — could add toast later
    }
  }

  if (loading) {
    return <div className="text-stone-500">Loading campaign…</div>;
  }

  if (error || !campaign) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Campaign not found</p>
        <p className="text-sm mt-1">{error || "Could not load campaign."}</p>
        <Link href="/" className="text-sm mt-2 inline-block hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  const result = campaign.result_json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brief = (campaign.brief || result?.brief) as Record<string, any> | undefined;
  const strategy = campaign.strategy || result?.strategy;

  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const pastApprovals = approvals.filter((a) => a.status !== "pending");

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-900 mb-4 inline-block"
      >
        ← Campaigns
      </Link>

      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">{campaign.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-500">
              <span>Status: {campaign.status}</span>
              <span>Created: {formatDate(campaign.created_at)}</span>
              {campaign.completed_at && (
                <span>Completed: {formatDate(campaign.completed_at)}</span>
              )}
            </div>
          </div>
          {campaign.status === "draft" && (
            <button
              onClick={handleRun}
              disabled={starting}
              className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? "Starting…" : "Run Campaign"}
            </button>
          )}
        </div>

        {/* Running status indicator */}
        {(campaign.status === "running" || campaign.status === "awaiting_approval") && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-blue-800">
              {STATE_LABELS[campaign.agent_state || ""] || campaign.agent_state || "Running…"}
            </span>
          </div>
        )}

        {campaign.status === "completed" && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-800">Campaign completed</span>
          </div>
        )}

        {campaign.status === "failed" && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-800">
              Campaign failed{campaign.agent_state?.startsWith("error:") ? `: ${campaign.agent_state.slice(7)}` : ""}
            </span>
          </div>
        )}

        {runError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {runError}
          </div>
        )}
      </div>

      {/* Pending Approvals — shown prominently */}
      {pendingApprovals.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">
            Action Required
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {pendingApprovals.length}
            </span>
          </h2>
          <div className="space-y-4">
            {pendingApprovals.map((a) => (
              <ApprovalCard key={a.id} approval={a} onDecide={handleDecide} />
            ))}
          </div>
        </section>
      )}

      {brief ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">Brief</h2>
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {brief.brand_name && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Brand</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.brand_name)}</p>
                </div>
              )}
              {brief.industry && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Industry</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.industry)}</p>
                </div>
              )}
              {brief.objective && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Objective</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.objective)}</p>
                </div>
              )}
              {brief.target_audience && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Target Audience</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.target_audience)}</p>
                </div>
              )}
              {brief.key_message && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Key Message</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.key_message)}</p>
                </div>
              )}
              {Array.isArray(brief.platforms) && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Platforms</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(brief.platforms as string[]).map((p) => (
                      <span key={p} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700 capitalize">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(brief.follower_range) && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Follower Range</p>
                  <p className="text-sm text-stone-900 mt-0.5">
                    {Number(brief.follower_range[0]).toLocaleString()} – {Number(brief.follower_range[1]).toLocaleString()}
                  </p>
                </div>
              )}
              {brief.budget_gbp != null && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Budget</p>
                  <p className="text-sm text-stone-900 mt-0.5">£{Number(brief.budget_gbp).toLocaleString()}</p>
                </div>
              )}
              {brief.timeline && (
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Timeline</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.timeline)}</p>
                </div>
              )}
              {Array.isArray(brief.deliverables) && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Deliverables</p>
                  <ul className="mt-1 space-y-0.5">
                    {(brief.deliverables as string[]).map((d, i) => (
                      <li key={i} className="text-sm text-stone-900">• {d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {brief.brand_voice && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Brand Voice</p>
                  <p className="text-sm text-stone-900 mt-0.5">{String(brief.brand_voice)}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {strategy ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">Strategy</h2>
          <pre className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm overflow-x-auto">
            {JSON.stringify(strategy, null, 2)}
          </pre>
        </section>
      ) : null}

      {result ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">
            Result summary
          </h2>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm space-y-2">
            {"creators_count" in result && result.creators_count != null ? (
              <p>Creators: {String(result.creators_count)}</p>
            ) : null}
            {"outreach_sent" in result && result.outreach_sent && typeof result.outreach_sent === "object" ? (
              <p>
                Outreach: {String((result.outreach_sent as { sent_count?: number }).sent_count ?? 0)} sent,{" "}
                {String((result.outreach_sent as { skipped_count?: number }).skipped_count ?? 0)} skipped
              </p>
            ) : null}
            {"payment_summaries" in result && Array.isArray(result.payment_summaries) && result.payment_summaries.length > 0 ? (
              <p>Payments: {result.payment_summaries.length} recorded</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Past Approvals */}
      {pastApprovals.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">Approval History</h2>
          <div className="space-y-3">
            {pastApprovals.map((a) => (
              <ApprovalCard key={a.id} approval={a} onDecide={handleDecide} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
