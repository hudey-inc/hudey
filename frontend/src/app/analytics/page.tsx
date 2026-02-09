"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AggregateAnalytics } from "@/lib/api";
import { getAggregateAnalytics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Target,
  Users,
  TrendingUp,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Constants ────────────────────────────────────────────────

const STATUS_CHART_COLORS: Record<string, string> = {
  running: "#22c55e",
  awaiting_approval: "#a855f7",
  completed: "#6b7280",
  draft: "#f59e0b",
  failed: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  awaiting_approval: "Awaiting Approval",
  completed: "Completed",
  draft: "Draft",
  failed: "Failed",
};

const ENGAGEMENT_CHART_COLORS: Record<string, string> = {
  contacted: "#9ca3af",
  responded: "#3b82f6",
  negotiating: "#f59e0b",
  agreed: "#10b981",
  declined: "#ef4444",
};

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

// ── Campaign Status Donut ───────────────────────────────────

function StatusDonut({ byStatus }: { byStatus: Record<string, number> }) {
  const data = Object.entries(byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_CHART_COLORS[status] || "#9ca3af",
  }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Campaign Status
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-gray-600">{d.name}</span>
              <span className="font-medium text-gray-900 ml-auto">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Engagement Funnel Chart ─────────────────────────────────

function EngagementFunnel({
  analytics,
}: {
  analytics: AggregateAnalytics;
}) {
  // Build funnel data from perCampaign engagements
  const stages = ["contacted", "responded", "negotiating", "agreed", "declined"];
  const totals: Record<string, number> = {};
  for (const campaign of analytics.perCampaign) {
    // contacted = total creators
    totals["contacted"] = (totals["contacted"] || 0) + campaign.creators;
    totals["responded"] = (totals["responded"] || 0) + campaign.responded;
    totals["agreed"] = (totals["agreed"] || 0) + campaign.agreed;
  }
  // Negotiating = responded - agreed (approximately)
  totals["negotiating"] =
    Math.max(0, (totals["responded"] || 0) - (totals["agreed"] || 0));
  totals["declined"] = analytics.totalDeclined;

  const data = stages.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: totals[s] || 0,
    color: ENGAGEMENT_CHART_COLORS[s] || "#9ca3af",
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Engagement Funnel
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Email Performance Bar Chart ─────────────────────────────

function EmailPerformance({
  emailStats,
}: {
  emailStats: AggregateAnalytics["emailStats"];
}) {
  const data = [
    { name: "Delivery", value: emailStats.deliveryRate, color: "#3b82f6" },
    { name: "Open", value: emailStats.openRate, color: "#22c55e" },
    { name: "Click", value: emailStats.clickRate, color: "#10b981" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Email Performance
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        {emailStats.totalSent} total emails sent
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#6b7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Campaign Table ──────────────────────────────────────────

type SortKey = "name" | "status" | "creators" | "responded" | "agreed" | "emailsSent" | "openRate";

function CampaignTable({
  campaigns,
}: {
  campaigns: AggregateAnalytics["perCampaign"];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("creators");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = [...campaigns].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  const STATUS_BADGE_COLORS: Record<string, string> = {
    running: "bg-green-100 text-green-700",
    awaiting_approval: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-700",
    draft: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">
          Campaign Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600"
                onClick={() => handleSort("name")}
              >
                Campaign
                <SortIcon col="name" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon col="status" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600 text-right"
                onClick={() => handleSort("creators")}
              >
                Creators
                <SortIcon col="creators" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600 text-right"
                onClick={() => handleSort("responded")}
              >
                Responded
                <SortIcon col="responded" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600 text-right"
                onClick={() => handleSort("agreed")}
              >
                Agreed
                <SortIcon col="agreed" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600 text-right"
                onClick={() => handleSort("emailsSent")}
              >
                Emails
                <SortIcon col="emailsSent" />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-600 text-right"
                onClick={() => handleSort("openRate")}
              >
                Open Rate
                <SortIcon col="openRate" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="text-gray-900 font-medium hover:text-indigo-600 transition-colors"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      STATUS_BADGE_COLORS[c.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {c.creators}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {c.responded}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {c.agreed}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {c.emailsSent}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`${
                      c.openRate > 50
                        ? "text-green-600"
                        : c.openRate > 20
                        ? "text-amber-600"
                        : "text-gray-400"
                    }`}
                  >
                    {c.openRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function AnalyticsSkeleton() {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, checking } = useRequireAuth();
  const [data, setData] = useState<AggregateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAggregateAnalytics()
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
        <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Campaign performance and engagement statistics
        </p>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">
            No analytics data available yet.
          </p>
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Campaigns"
              value={data.totalCampaigns}
              icon={Target}
              color="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              label="Creators Contacted"
              value={data.totalCreatorsContacted}
              icon={Users}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Conversion Rate"
              value={`${data.conversionRate}%`}
              sub={`${data.totalAgreed} agreed of ${data.totalCreatorsContacted}`}
              icon={TrendingUp}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Email Open Rate"
              value={`${data.emailStats.openRate}%`}
              sub={`${data.emailStats.totalSent} emails sent`}
              icon={Mail}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <StatusDonut byStatus={data.byStatus} />
            <EngagementFunnel analytics={data} />
          </div>

          {/* Email performance */}
          {data.emailStats.totalSent > 0 && (
            <div className="mb-8">
              <EmailPerformance emailStats={data.emailStats} />
            </div>
          )}

          {/* Campaign table */}
          {data.perCampaign.length > 0 && (
            <CampaignTable campaigns={data.perCampaign} />
          )}
        </>
      )}
    </div>
  );
}
