"use client";

import { useEffect, useState } from "react";
import type { CreatorEngagement } from "@/lib/api";
import { getEngagements } from "@/lib/api";
import { Card } from "./section";

// ── Status styling ──────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  contacted: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Contacted" },
  responded: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Responded" },
  negotiating: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Negotiating" },
  agreed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Agreed" },
  declined: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Declined" },
};

function EngagementBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.contacted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 capitalize">
      {platform}
    </span>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Message Thread ──────────────────────────────────────────

function MessageThread({ messages }: { messages: { from: string; body: string; timestamp: string }[] }) {
  if (!messages || messages.length === 0) {
    return <p className="text-[13px] text-gray-400 italic">No messages yet</p>;
  }

  return (
    <div className="space-y-2 mt-2">
      {messages.map((msg, i) => {
        const isBrand = msg.from === "brand";
        return (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-[13px] ${
              isBrand
                ? "bg-gray-50 border border-gray-100"
                : "bg-blue-50 border border-blue-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-medium ${isBrand ? "text-gray-500" : "text-blue-600"}`}>
                {isBrand ? "You" : "Creator"}
              </span>
              <span className="text-[11px] text-gray-400">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <p className={`leading-relaxed whitespace-pre-wrap ${isBrand ? "text-gray-700" : "text-gray-800"}`}>
              {msg.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Proposal Display ────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProposalTerms({ proposal }: { proposal: Record<string, any> }) {
  return (
    <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 p-3">
      <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider mb-2">
        Proposed Terms
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px]">
        {proposal.fee != null && (
          <div>
            <span className="text-gray-400 text-[11px]">Fee</span>
            <p className="text-gray-800 font-medium">
              {typeof proposal.fee === "number" ? `£${proposal.fee.toLocaleString()}` : String(proposal.fee)}
            </p>
          </div>
        )}
        {proposal.deliverables && (
          <div>
            <span className="text-gray-400 text-[11px]">Deliverables</span>
            <p className="text-gray-800">
              {Array.isArray(proposal.deliverables)
                ? proposal.deliverables.join(", ")
                : String(proposal.deliverables)}
            </p>
          </div>
        )}
        {proposal.deadline && (
          <div>
            <span className="text-gray-400 text-[11px]">Deadline</span>
            <p className="text-gray-800">{String(proposal.deadline)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Creator Card ────────────────────────────────────────────

function CreatorCard({ engagement }: { engagement: CreatorEngagement }) {
  return (
    <Card>
      <details className="group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar circle with initial */}
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-[13px] font-medium text-gray-500">
                  {(engagement.creator_name || engagement.creator_id || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {engagement.creator_name || engagement.creator_id}
                  </span>
                  {engagement.platform && <PlatformBadge platform={engagement.platform} />}
                </div>
                {engagement.creator_email && (
                  <p className="text-[11px] text-gray-400 truncate">
                    {engagement.creator_email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <EngagementBadge status={engagement.status} />
              <svg
                className="h-4 w-4 text-gray-300 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </summary>

        <div className="mt-3 pt-3 border-t border-gray-50">
          <MessageThread messages={engagement.message_history || []} />
          {engagement.latest_proposal && Object.keys(engagement.latest_proposal).length > 0 && (
            <ProposalTerms proposal={engagement.latest_proposal} />
          )}
          {engagement.terms && Object.keys(engagement.terms).length > 0 && (
            <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider mb-1">
                Agreed Terms
              </p>
              <pre className="text-[12px] text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(engagement.terms, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </Card>
  );
}

// ── Main Component ──────────────────────────────────────────

export function CreatorEngagements({ campaignId }: { campaignId: string }) {
  const [engagements, setEngagements] = useState<CreatorEngagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEngagements(campaignId)
      .then(setEngagements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return null;
  if (engagements.length === 0) return null;

  // Count by status
  const counts = engagements.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex items-center gap-4 text-[13px] flex-wrap">
        <span className="text-gray-900 font-medium">{engagements.length} creators</span>
        {(counts.contacted || 0) > 0 && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            {counts.contacted} contacted
          </span>
        )}
        {(counts.responded || 0) > 0 && (
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {counts.responded} responded
          </span>
        )}
        {(counts.negotiating || 0) > 0 && (
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {counts.negotiating} negotiating
          </span>
        )}
        {(counts.agreed || 0) > 0 && (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {counts.agreed} agreed
          </span>
        )}
        {(counts.declined || 0) > 0 && (
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {counts.declined} declined
          </span>
        )}
      </div>

      {/* Creator cards */}
      <div className="space-y-2">
        {engagements.map((eng) => (
          <CreatorCard key={eng.id} engagement={eng} />
        ))}
      </div>
    </div>
  );
}
