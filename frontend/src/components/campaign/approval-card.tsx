"use client";

import { useState } from "react";
import type { Approval } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Payload renderers ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StrategyPayload({ payload }: { payload: Record<string, any> }) {
  return (
    <div className="space-y-4 text-sm">
      {payload.approach && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Approach</p>
          <p className="text-stone-800 leading-relaxed">{String(payload.approach)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {payload.creator_count != null && (
          <div className="rounded-lg bg-stone-50 p-3 text-center">
            <p className="text-xl font-semibold text-stone-900">{String(payload.creator_count)}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Creators</p>
          </div>
        )}
        {payload.platform_priority && (
          <div className="rounded-lg bg-stone-50 p-3 text-center">
            <div className="flex justify-center gap-1.5 flex-wrap">
              {(Array.isArray(payload.platform_priority)
                ? (payload.platform_priority as string[])
                : [String(payload.platform_priority)]
              ).map((p) => (
                <span key={p} className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600 capitalize">
                  {p}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5">Platforms</p>
          </div>
        )}
        {payload.budget_per_creator && (
          <div className="rounded-lg bg-stone-50 p-3 text-center">
            <p className="text-xl font-semibold text-stone-900">£{Number(payload.budget_per_creator).toLocaleString()}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Per Creator</p>
          </div>
        )}
      </div>

      {payload.messaging_angle && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Messaging Angle</p>
          <p className="text-stone-800 leading-relaxed">{String(payload.messaging_angle)}</p>
        </div>
      )}

      {payload.rationale && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Rationale</p>
          <p className="text-stone-600 leading-relaxed">{String(payload.rationale)}</p>
        </div>
      )}

      {payload.risks && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Risks</p>
          {Array.isArray(payload.risks) ? (
            <ul className="space-y-1.5">
              {(payload.risks as string[]).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-stone-600 text-[13px]">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone-600 text-[13px]">{String(payload.risks)}</p>
          )}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CreatorsPayload({ payload }: { payload: Record<string, any> }) {
  const creators = (payload.creators || payload) as Record<string, unknown>[];
  if (!Array.isArray(creators)) {
    return <pre className="text-xs text-stone-500 overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-medium text-stone-400 uppercase tracking-wider">
            <th className="pb-2 pr-4 pl-1">Creator</th>
            <th className="pb-2 pr-4">Platform</th>
            <th className="pb-2 pr-4">Followers</th>
            <th className="pb-2">Engagement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {creators.map((c, i) => (
            <tr key={i} className="hover:bg-stone-50/50">
              <td className="py-2.5 pr-4 pl-1 font-medium text-stone-900 text-[13px]">
                {String(c.username || c.display_name || `Creator ${i + 1}`)}
              </td>
              <td className="py-2.5 pr-4 text-stone-500 capitalize text-[13px]">
                {String(c.platform || "—")}
              </td>
              <td className="py-2.5 pr-4 text-stone-500 tabular-nums text-[13px]">
                {c.follower_count != null ? Number(c.follower_count).toLocaleString() : "—"}
              </td>
              <td className="py-2.5 text-stone-500 tabular-nums text-[13px]">
                {c.engagement_rate != null ? `${(Number(c.engagement_rate) * 100).toFixed(1)}%` : "—"}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drafts = (payload.drafts || payload) as Record<string, any>[];
  if (!Array.isArray(drafts)) {
    return <pre className="text-xs text-stone-500 overflow-x-auto">{JSON.stringify(payload, null, 2)}</pre>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getName = (d: Record<string, any>) => {
    if (typeof d.creator === "object" && d.creator) {
      return String(d.creator.display_name || d.creator.username || "Creator");
    }
    return String(d.creator || d.to || d.username || "Creator");
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-stone-400 font-medium">{drafts.length} outreach emails</p>
      {drafts.map((d, i) => (
        <details key={i} className="rounded-lg border border-stone-100 group">
          <summary className="flex items-center gap-3 cursor-pointer px-4 py-3 hover:bg-stone-50/50 transition-colors rounded-lg">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-bold text-stone-500">
              {getName(d).charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-stone-900 truncate">{getName(d)}</p>
              <p className="text-[11px] text-stone-400 truncate">{d.subject ? String(d.subject) : "No subject"}</p>
            </div>
            <span className="text-[10px] text-stone-300 group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <div className="px-4 pb-4 border-t border-stone-50">
            {d.subject && (
              <div className="mt-3 mb-2">
                <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Subject</p>
                <p className="text-[13px] font-medium text-stone-900 mt-0.5">{String(d.subject)}</p>
              </div>
            )}
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Message</p>
            <p className="text-[13px] text-stone-600 whitespace-pre-wrap leading-relaxed">
              {String(d.message || d.body || d.content || JSON.stringify(d))}
            </p>
          </div>
        </details>
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
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Fee</p>
          <p className="text-stone-900 mt-0.5 text-lg font-semibold">£{Number(terms.fee_gbp).toLocaleString()}</p>
        </div>
      )}
      {terms.deadline && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Deadline</p>
          <p className="text-stone-900 mt-0.5">{String(terms.deadline)}</p>
        </div>
      )}
      {Array.isArray(terms.deliverables) && (
        <div>
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Deliverables</p>
          <ul className="mt-0.5 space-y-0.5">
            {(terms.deliverables as string[]).map((d, i) => (
              <li key={i} className="text-stone-900 text-[13px]">• {d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      return (
        <pre className="text-xs text-stone-500 overflow-x-auto bg-stone-50 rounded-lg p-3">
          {JSON.stringify(payload, null, 2)}
        </pre>
      );
  }
}

// ── Pending approval (full card with actions) ─────────────

export function PendingApprovalCard({
  approval,
  onDecide,
}: {
  approval: Approval;
  onDecide: (id: string, status: "approved" | "rejected", feedback?: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    setSubmitting(true);
    await onDecide(approval.id, "approved");
    setSubmitting(false);
  }

  async function handleReject() {
    if (!showFeedback) { setShowFeedback(true); return; }
    setSubmitting(true);
    await onDecide(approval.id, "rejected", feedback || undefined);
    setSubmitting(false);
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-white p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-medium text-stone-900 text-sm">{approval.subject}</h3>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
          Needs review
        </span>
      </div>
      <p className="text-[11px] text-stone-400 mb-4">{formatDate(approval.created_at)}</p>

      {approval.reasoning && (
        <p className="text-[13px] text-stone-500 mb-4 italic leading-relaxed">
          &ldquo;{approval.reasoning}&rdquo;
        </p>
      )}

      <div className="mb-5">
        <ApprovalPayload type={approval.approval_type} payload={approval.payload} />
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-stone-100">
        {showFeedback && (
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback or modifications needed…"
            rows={2}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "…" : "Approve"}
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="rounded-lg border border-stone-200 bg-white px-5 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {showFeedback ? "Confirm Reject" : "Reject"}
          </button>
          {showFeedback && (
            <button onClick={() => setShowFeedback(false)} className="text-sm text-stone-400 hover:text-stone-600 ml-1">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Past approval (compact, collapsed) ────────────────────

export function PastApprovalRow({ approval }: { approval: Approval }) {
  const isApproved = approval.status === "approved";
  return (
    <details className="group">
      <summary className="flex items-center gap-3 cursor-pointer py-3 px-1 hover:bg-stone-50/50 rounded-lg transition-colors">
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
            isApproved ? "bg-emerald-400" : "bg-red-400"
          }`}
        />
        <span className="text-[13px] text-stone-700 flex-1">{approval.subject}</span>
        <span className={`text-[11px] font-medium ${isApproved ? "text-emerald-600" : "text-red-500"}`}>
          {isApproved ? "Approved" : "Rejected"}
        </span>
        <span className="text-[11px] text-stone-300">{formatDate(approval.created_at)}</span>
        <span className="text-[10px] text-stone-300 group-open:rotate-90 transition-transform">▶</span>
      </summary>
      <div className="pl-6 pb-3">
        {approval.reasoning && (
          <p className="text-[12px] text-stone-400 italic mb-2">&ldquo;{approval.reasoning}&rdquo;</p>
        )}
        {approval.feedback && (
          <div className="rounded-lg bg-stone-50 p-3 mb-2">
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-1">Feedback</p>
            <p className="text-[13px] text-stone-600">{approval.feedback}</p>
          </div>
        )}
        <ApprovalPayload type={approval.approval_type} payload={approval.payload} />
      </div>
    </details>
  );
}
