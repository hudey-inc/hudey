"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AggregateOutreach } from "@/lib/api";
import { getAggregateOutreach } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Mail,
  Send,
  Eye,
  ChevronDown,
  Users,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  clicked: { icon: "🔗", color: "text-emerald-600", label: "Clicked" },
  opened: { icon: "👁", color: "text-green-600", label: "Opened" },
  delivered: { icon: "✓✓", color: "text-blue-600", label: "Delivered" },
  sent: { icon: "✓", color: "text-gray-400", label: "Sent" },
  bounced: { icon: "✗", color: "text-red-500", label: "Bounced" },
  complained: { icon: "⚠", color: "text-red-500", label: "Complained" },
};

const ENGAGEMENT_COLORS: Record<string, string> = {
  contacted: "bg-gray-400",
  responded: "bg-blue-500",
  negotiating: "bg-amber-500",
  agreed: "bg-emerald-500",
  declined: "bg-red-500",
};

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Funnel ───────────────────────────────────────────────────

function ResponseFunnel({
  byStatus,
  total,
}: {
  byStatus: Record<string, number>;
  total: number;
}) {
  const stages = [
    { key: "contacted", label: "Contacted", color: "bg-gray-200 text-gray-700" },
    { key: "responded", label: "Responded", color: "bg-blue-100 text-blue-700" },
    { key: "negotiating", label: "Negotiating", color: "bg-amber-100 text-amber-700" },
    { key: "agreed", label: "Agreed", color: "bg-emerald-100 text-emerald-700" },
    { key: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Response Funnel
      </h3>
      <div className="space-y-3">
        {stages.map((stage) => {
          const count = byStatus[stage.key] || 0;
          const width = total > 0 ? Math.max((count / total) * 100, 4) : 4;
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{stage.label}</span>
                <span className="font-medium text-gray-900">
                  {count}{" "}
                  <span className="text-gray-400 font-normal">
                    ({pct(count, total)})
                  </span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ENGAGEMENT_COLORS[stage.key] || "bg-gray-300"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Campaign Breakdown Card ─────────────────────────────────

function CampaignBreakdown({
  item,
}: {
  item: AggregateOutreach["perCampaign"][number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.campaignName}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span>{item.email.total_sent} sent</span>
              <span>{item.engagements.length} creators</span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Email stats */}
          {item.email.total_sent > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                Email Delivery
              </p>
              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-gray-900 font-medium">
                  {item.email.total_sent} sent
                </span>
                {item.email.delivered > 0 && (
                  <span className="text-blue-600">
                    {item.email.delivered} delivered
                  </span>
                )}
                {item.email.opened > 0 && (
                  <span className="text-green-600">
                    {item.email.opened} opened
                  </span>
                )}
                {item.email.clicked > 0 && (
                  <span className="text-emerald-600">
                    {item.email.clicked} clicked
                  </span>
                )}
                {item.email.bounced > 0 && (
                  <span className="text-red-500">
                    {item.email.bounced} bounced
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Per-creator emails */}
          {item.email.per_creator.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-3 py-2">Recipient</th>
                    <th className="px-3 py-2">Creator</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {item.email.per_creator.map((c, i) => {
                    const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.sent;
                    return (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-500 font-mono text-[12px]">
                          {c.recipient || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {c.creator_id || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1.5 ${cfg.color}`}
                          >
                            <span className="text-[12px] font-mono">
                              {cfg.icon}
                            </span>
                            <span className="text-[12px]">{cfg.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Engagement summary */}
          {item.engagements.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                Creator Engagements
              </p>
              <div className="flex items-center gap-3 flex-wrap text-[13px]">
                {Object.entries(
                  item.engagements.reduce(
                    (acc, e) => {
                      acc[e.status] = (acc[e.status] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([status, count]) => (
                  <span key={status} className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${ENGAGEMENT_COLORS[status] || "bg-gray-300"}`}
                    />
                    <span className="text-gray-600">
                      {count} {status}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Creator response threads */}
          {(() => {
            const responded = item.engagements.filter(
              (e) => e.status !== "contacted"
            );
            if (responded.length === 0) return null;
            return (
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Creator Responses ({responded.length})
                </p>
                <div className="space-y-2">
                  {responded.map((eng) => {
                    const statusStyle: Record<
                      string,
                      { bg: string; text: string; dot: string }
                    > = {
                      responded: {
                        bg: "bg-blue-50",
                        text: "text-blue-700",
                        dot: "bg-blue-500",
                      },
                      negotiating: {
                        bg: "bg-amber-50",
                        text: "text-amber-700",
                        dot: "bg-amber-500",
                      },
                      agreed: {
                        bg: "bg-emerald-50",
                        text: "text-emerald-700",
                        dot: "bg-emerald-500",
                      },
                      declined: {
                        bg: "bg-red-50",
                        text: "text-red-700",
                        dot: "bg-red-500",
                      },
                    };
                    const s = statusStyle[eng.status] || statusStyle.responded;
                    const lastMsg =
                      eng.message_history && eng.message_history.length > 0
                        ? eng.message_history[eng.message_history.length - 1]
                        : null;
                    return (
                      <details
                        key={eng.id}
                        className="group rounded-lg border border-gray-100 overflow-hidden"
                      >
                        <summary className="cursor-pointer list-none px-3 py-2.5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-[11px] font-medium text-gray-500">
                                  {(eng.creator_name || eng.creator_id || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {eng.creator_name || eng.creator_id}
                              </span>
                              {eng.platform && (
                                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 capitalize">
                                  {eng.platform}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {eng.response_timestamp && (
                                <span className="text-[10px] text-gray-400 hidden sm:block">
                                  {new Date(
                                    eng.response_timestamp
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}
                              >
                                <span className={`h-1 w-1 rounded-full ${s.dot}`} />
                                {eng.status}
                              </span>
                              <ChevronDown className="w-3 h-3 text-gray-300 transition-transform group-open:rotate-180" />
                            </div>
                          </div>
                          {lastMsg && (
                            <p className="mt-1 ml-8 text-[12px] text-gray-500 line-clamp-1">
                              {lastMsg.from === "brand" ? "You: " : "Creator: "}
                              {lastMsg.body}
                            </p>
                          )}
                        </summary>
                        <div className="border-t border-gray-50 px-3 py-3 space-y-2">
                          {eng.message_history &&
                            eng.message_history.length > 0 && (
                              <div className="space-y-1.5">
                                {eng.message_history.map((msg, mi) => {
                                  const isBrand = msg.from === "brand";
                                  return (
                                    <div
                                      key={mi}
                                      className={`rounded-lg px-3 py-2 text-[12px] ${
                                        isBrand
                                          ? "bg-gray-50 border border-gray-100"
                                          : "bg-blue-50 border border-blue-100"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span
                                          className={`text-[10px] font-medium ${
                                            isBrand ? "text-gray-500" : "text-blue-600"
                                          }`}
                                        >
                                          {isBrand ? "You" : "Creator"}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(msg.timestamp).toLocaleDateString(
                                            "en-GB",
                                            {
                                              day: "numeric",
                                              month: "short",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}
                                        </span>
                                      </div>
                                      <p className="leading-relaxed whitespace-pre-wrap text-gray-700">
                                        {msg.body}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          {eng.latest_proposal &&
                            Object.keys(eng.latest_proposal).length > 0 && (
                              <div className="rounded-lg bg-amber-50 border border-amber-100 p-2.5">
                                <p className="text-[10px] font-medium text-amber-600 uppercase tracking-wider mb-1.5">
                                  Proposed Terms
                                </p>
                                <div className="flex items-center gap-4 text-[12px]">
                                  {(eng.latest_proposal.fee != null ||
                                    eng.latest_proposal.fee_gbp != null) && (
                                    <span className="text-gray-700">
                                      Fee:{" "}
                                      <span className="font-medium">
                                        £
                                        {Number(
                                          eng.latest_proposal.fee ??
                                            eng.latest_proposal.fee_gbp
                                        ).toLocaleString()}
                                      </span>
                                    </span>
                                  )}
                                  {eng.latest_proposal.deliverables && (
                                    <span className="text-gray-700">
                                      {Array.isArray(eng.latest_proposal.deliverables)
                                        ? eng.latest_proposal.deliverables.join(", ")
                                        : String(eng.latest_proposal.deliverables)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          {eng.terms && Object.keys(eng.terms).length > 0 && (
                            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mb-1">
                                Agreed Terms
                              </p>
                              <pre className="text-[11px] text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(eng.terms, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <Link
            href={`/campaigns/${item.campaignId}`}
            className="inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View Campaign →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function OutreachSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
          >
            <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function OutreachPage() {
  const { user, checking } = useRequireAuth();
  const [data, setData] = useState<AggregateOutreach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAggregateOutreach()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Outreach</h1>
        <p className="text-sm text-gray-500 mt-1">
          Email delivery and creator response tracking across all campaigns
        </p>
      </div>

      {loading ? (
        <OutreachSkeleton />
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">
            No outreach data available yet.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Sent"
              value={data.totalSent}
              icon={Send}
              color="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              label="Delivery Rate"
              value={pct(data.totalDelivered, data.totalSent)}
              sub={`${data.totalDelivered} of ${data.totalSent}`}
              icon={Mail}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Open Rate"
              value={pct(data.totalOpened, data.totalSent)}
              sub={`${data.totalOpened} opened`}
              icon={Eye}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Response Rate"
              value={pct(
                (data.engagementsByStatus["responded"] || 0) +
                  (data.engagementsByStatus["negotiating"] || 0) +
                  (data.engagementsByStatus["agreed"] || 0),
                data.totalEngagements
              )}
              sub={`${data.totalEngagements} creators contacted`}
              icon={Users}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Email overview */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Email Delivery Overview
              </h3>
              {data.totalSent === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No emails sent yet
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Visual funnel bars */}
                  {[
                    { label: "Sent", value: data.totalSent, color: "bg-gray-400", total: data.totalSent },
                    { label: "Delivered", value: data.totalDelivered, color: "bg-blue-500", total: data.totalSent },
                    { label: "Opened", value: data.totalOpened, color: "bg-green-500", total: data.totalSent },
                    { label: "Clicked", value: data.totalClicked, color: "bg-emerald-500", total: data.totalSent },
                    { label: "Bounced", value: data.totalBounced, color: "bg-red-500", total: data.totalSent },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{bar.label}</span>
                        <span className="font-medium text-gray-900">
                          {bar.value}{" "}
                          <span className="text-gray-400 font-normal">
                            ({pct(bar.value, bar.total)})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar.color}`}
                          style={{
                            width: `${bar.total > 0 ? Math.max((bar.value / bar.total) * 100, 2) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response funnel */}
            <ResponseFunnel
              byStatus={data.engagementsByStatus}
              total={data.totalEngagements}
            />
          </div>

          {/* Per-campaign breakdown */}
          {data.perCampaign.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                By Campaign
              </h3>
              <div className="space-y-3">
                {data.perCampaign.map((item) => (
                  <CampaignBreakdown key={item.campaignId} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
