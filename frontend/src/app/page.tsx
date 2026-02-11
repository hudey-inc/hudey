"use client";

import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CampaignSummary, AggregateMetrics } from "@/lib/api";
import { listCampaigns, getAggregateMetrics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Target,
  BarChart3,
  ChevronRight,
  Plus,
  Users,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  MessageSquare,
  Handshake,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "running": return 50;
    case "awaiting_approval": return 65;
    case "completed": return 100;
    default: return 0;
  }
}

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  awaiting_approval: "Awaiting Approval",
  completed: "Completed",
  draft: "Draft",
  failed: "Failed",
};

const STATUS_BADGE: Record<string, string> = {
  running: "bg-green-100 text-green-700",
  awaiting_approval: "bg-purple-100 text-purple-700",
  completed: "bg-blue-100 text-blue-700",
  draft: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

// ── Metric Card ─────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  chartData,
  chartColor,
  chartType = "line",
  icon: Icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend: string;
  trendUp: boolean;
  chartData: number[];
  chartColor: string;
  chartType?: "line" | "area";
  icon: React.ElementType;
  iconBg: string;
}) {
  const data = chartData.map((v, i) => ({ value: v, idx: i }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      <div className="h-14 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#grad-${title.replace(/\s/g, "")})`}
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="w-14 h-5 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
          <div className="h-8 bg-gray-100 rounded w-16 mb-3" />
          <div className="h-14 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

function DashboardMetrics() {
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAggregateMetrics()
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MetricsSkeleton />;
  if (!metrics) return null;

  const calcTrend = (arr: number[]): { value: string; up: boolean } => {
    const recent = arr.slice(-3).reduce((a, b) => a + b, 0);
    const older = arr.slice(0, 3).reduce((a, b) => a + b, 0);
    if (older === 0) return { value: recent > 0 ? `+${recent}` : "—", up: recent > 0 };
    const pct = Math.round(((recent - older) / older) * 100);
    return { value: `${pct >= 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
  };

  const outreachTrend = calcTrend(metrics.outreachTrend);
  const responseTrend = calcTrend(metrics.responseTrend);
  const totalDeals = metrics.dealProgress.agreed + metrics.dealProgress.negotiating;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <MetricCard
        title="Active Outreach"
        value={metrics.activeOutreach}
        subtitle={`${metrics.dealProgress.contacted} creators contacted`}
        trend={outreachTrend.value}
        trendUp={outreachTrend.up}
        chartData={metrics.outreachTrend}
        chartColor="#2F4538"
        icon={Send}
        iconBg="bg-[#2F4538]"
      />
      <MetricCard
        title="Weekly Responses"
        value={metrics.weeklyResponses}
        subtitle={`${metrics.dealProgress.responded} total responded`}
        trend={responseTrend.value}
        trendUp={responseTrend.up}
        chartData={metrics.responseTrend}
        chartColor="#D16B42"
        icon={MessageSquare}
        iconBg="bg-[#D16B42]"
      />
      <MetricCard
        title="Deal Progress"
        value={totalDeals}
        subtitle={
          metrics.dealProgress.agreed > 0
            ? `${metrics.dealProgress.agreed} agreed, ${metrics.dealProgress.negotiating} negotiating`
            : `${metrics.dealProgress.negotiating} negotiating`
        }
        trend={
          metrics.dealProgress.agreed > 0
            ? `${metrics.dealProgress.agreed} closed`
            : "—"
        }
        trendUp={metrics.dealProgress.agreed > 0}
        chartData={[
          metrics.dealProgress.contacted,
          metrics.dealProgress.responded,
          metrics.dealProgress.negotiating,
          metrics.dealProgress.agreed,
        ]}
        chartColor="#6366f1"
        chartType="area"
        icon={Handshake}
        iconBg="bg-indigo-500"
      />
    </div>
  );
}

// ── Recent Campaign Card ────────────────────────────────────

function CampaignCard({
  campaign,
  index,
}: {
  campaign: CampaignSummary;
  index: number;
}) {
  const statusStyle = STATUS_BADGE[campaign.status] || STATUS_BADGE.draft;
  const label = STATUS_LABELS[campaign.status] || campaign.status;
  const progress = getProgressPercent(campaign.status);

  return (
    <Link
      href={`/campaigns/${campaign.short_id || campaign.id}`}
      className="min-w-[220px] sm:min-w-[260px] bg-white rounded-xl p-5 border border-gray-200 hover:border-[#2F4538]/30 hover:shadow-lg transition-all text-left group relative overflow-hidden"
    >
      {/* Progress indicator */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#2F4538] to-[#D16B42] transition-all rounded-b"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-1">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusStyle}`}>
          {label}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#2F4538] transition-colors" />
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#2F4538] transition-colors">
          {campaign.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {campaign.short_id || campaign.id.slice(0, 8)} &middot; {formatDate(campaign.created_at)}
        </p>
      </div>

      {/* Mini decorative bar */}
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 rounded flex-1"
            style={{
              backgroundColor: `hsl(${160 + index * 30 + i * 15}, 40%, ${85 - i * 5}%)`,
              height: `${16 + Math.random() * 12}px`,
            }}
          />
        ))}
      </div>
    </Link>
  );
}

// ── Campaign List Row ───────────────────────────────────────

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const statusStyle = STATUS_BADGE[campaign.status] || STATUS_BADGE.draft;
  const label = STATUS_LABELS[campaign.status] || campaign.status;
  const progress = getProgressPercent(campaign.status);

  return (
    <Link
      href={`/campaigns/${campaign.short_id || campaign.id}`}
      className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-all group relative overflow-hidden"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-lg flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 truncate">
              {campaign.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusStyle}`}>
              {label}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {campaign.short_id || campaign.id.slice(0, 8)} &middot; {formatDate(campaign.created_at)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#2F4538] to-[#D16B42] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}

// ── Quick Action Cards ──────────────────────────────────────

function QuickActions() {
  const actions = [
    { href: "/campaigns/new", icon: Plus, label: "New Campaign", desc: "Launch a new influencer campaign", bg: "bg-[#2F4538]" },
    { href: "/outreach", icon: Send, label: "Outreach", desc: "Manage creator communications", bg: "bg-[#D16B42]" },
    { href: "/negotiator", icon: Sparkles, label: "AI Negotiator", desc: "Automate deal negotiations", bg: "bg-indigo-500" },
    { href: "/analytics", icon: BarChart3, label: "Analytics", desc: "View performance insights", bg: "bg-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
        >
          <div className={`w-9 h-9 sm:w-10 sm:h-10 ${a.bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            <a.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="font-semibold text-sm text-gray-900 mb-0.5">{a.label}</div>
          <div className="text-xs text-gray-500 hidden sm:block">{a.desc}</div>
        </Link>
      ))}
    </div>
  );
}

// ── Deal Progress Summary ───────────────────────────────────

function DealProgressSummary({ metrics }: { metrics: AggregateMetrics }) {
  const stages = [
    { key: "contacted", label: "Contacted", count: metrics.dealProgress.contacted, icon: Users, color: "text-gray-500", bg: "bg-gray-100" },
    { key: "responded", label: "Responded", count: metrics.dealProgress.responded, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-100" },
    { key: "negotiating", label: "Negotiating", count: metrics.dealProgress.negotiating, icon: Handshake, color: "text-amber-500", bg: "bg-amber-100" },
    { key: "agreed", label: "Agreed", count: metrics.dealProgress.agreed, icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
    { key: "declined", label: "Declined", count: metrics.dealProgress.declined, icon: Target, color: "text-red-500", bg: "bg-red-100" },
  ];

  const total = Object.values(metrics.dealProgress).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">Deal Pipeline</h3>
        <Link href="/analytics" className="text-xs text-gray-500 hover:text-[#2F4538] transition-colors flex items-center gap-1">
          View details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No deals in pipeline yet.</p>
      ) : (
        <div className="space-y-3">
          {stages.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            const Icon = s.icon;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 ${s.bg} rounded flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                    </div>
                    <span className="text-sm text-gray-700">{s.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                    <span className="text-xs text-gray-500 ml-1.5">{pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user, checking } = useRequireAuth();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user || fetched.current) return;
    fetched.current = true;
    Promise.all([
      listCampaigns(),
      getAggregateMetrics(),
    ])
      .then(([c, m]) => {
        setCampaigns(c);
        setMetrics(m);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [user]);

  // Filter campaigns (memoized — must be before early returns)
  const filteredCampaigns = useMemo(() => campaigns.filter((c) => {
    if (!filter) return true;
    if (filter === "active") return c.status === "running" || c.status === "awaiting_approval";
    if (filter === "completed") return c.status === "completed";
    if (filter === "draft") return c.status === "draft";
    return true;
  }), [campaigns, filter]);

  const activeCampaigns = useMemo(() => campaigns.filter(
    (c) => c.status === "running" || c.status === "awaiting_approval"
  ), [campaigns]);

  if (checking || (!user && loading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        <p className="font-medium text-sm">Could not reach API</p>
        <p className="text-[13px] mt-1">{error}</p>
        <p className="text-[13px] mt-2">
          Ensure the backend is running and{" "}
          <code className="bg-amber-100 px-1 rounded text-[12px]">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          points to it.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-6 sm:-mx-8 sm:-mt-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-8 py-5 sm:py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{getGreeting()}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {campaigns.length === 0
                ? "Get started by creating your first campaign"
                : `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? "s" : ""} running`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Quick Actions */}
        <QuickActions />

        {/* Metrics */}
        {loading ? <MetricsSkeleton /> : <DashboardMetrics />}

        {/* Recent Campaigns (horizontal scroll row) */}
        {campaigns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Campaigns</h2>
              <Link
                href="/?filter=active"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#2F4538] transition-colors"
              >
                <span>See All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {campaigns.slice(0, 6).map((c, i) => (
                <CampaignCard key={c.id} campaign={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Two-column grid: Active Campaigns + Deal Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Campaigns */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">
                {filter
                  ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Campaigns`
                  : "All Campaigns"}
              </h3>
              <Link
                href="/campaigns/new"
                className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Campaign</span>
              </Link>
            </div>

            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No campaigns yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click <span className="font-medium text-gray-600">New Campaign</span> to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[420px] overflow-y-auto">
                {filteredCampaigns.map((c) => (
                  <CampaignRow key={c.id} campaign={c} />
                ))}
              </div>
            )}
          </div>

          {/* Deal Pipeline */}
          {metrics ? (
            <DealProgressSummary metrics={metrics} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-28 mb-5" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <div className="h-4 bg-gray-100 rounded w-20" />
                    <div className="h-4 bg-gray-100 rounded w-10" />
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
