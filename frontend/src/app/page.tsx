"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CampaignSummary, AggregateMetrics } from "@/lib/api";
import { listCampaigns, getAggregateMetrics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Target,
  TrendingUp,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Plus,
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  running: { bg: "bg-green-100", text: "text-green-700" },
  awaiting_approval: { bg: "bg-purple-100", text: "text-purple-700" },
  completed: { bg: "bg-gray-100", text: "text-gray-700" },
  draft: { bg: "bg-amber-100", text: "text-amber-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
};

const CAMPAIGN_ICONS = [Target, TrendingUp, MessageCircle, BarChart3];
const CARD_COLORS = [
  { bg: "bg-purple-100", icon: "text-purple-600" },
  { bg: "bg-amber-100", icon: "text-amber-600" },
  { bg: "bg-blue-100", icon: "text-blue-600" },
  { bg: "bg-indigo-100", icon: "text-indigo-600" },
  { bg: "bg-emerald-100", icon: "text-emerald-600" },
];

// ── Mini decorative chart SVGs ──────────────────────────────

function MiniChart({ variant }: { variant: number }) {
  const charts = [
    <svg key="line" viewBox="0 0 80 48" className="w-full h-full">
      <path
        d="M 0 40 Q 20 25, 40 30 T 80 15"
        stroke="#a78bfa"
        strokeWidth="2"
        fill="none"
      />
    </svg>,
    <svg key="growth" viewBox="0 0 80 48" className="w-full h-full">
      <path
        d="M 0 45 L 20 35 L 40 30 L 60 20 L 80 10"
        stroke="#8b5cf6"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 0 45 L 20 40 L 40 38 L 60 33 L 80 25"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
      />
    </svg>,
    <svg key="wave" viewBox="0 0 80 48" className="w-full h-full">
      <path
        d="M 0 30 Q 20 10, 40 25 T 80 20"
        stroke="#6366f1"
        strokeWidth="2"
        fill="none"
      />
    </svg>,
  ];
  return (
    <div className="w-20 h-12">{charts[variant % charts.length]}</div>
  );
}

// ── Metric Card with Recharts ───────────────────────────────

function MetricCard({
  title,
  value,
  trend,
  trendUp,
  chartData,
  chartColor,
  chartType = "line",
}: {
  title: string;
  value: number;
  trend: string;
  trendUp: boolean;
  chartData: number[];
  chartColor: string;
  chartType?: "line" | "area";
}) {
  const data = chartData.map((v, i) => ({ value: v, idx: i }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{title}</p>
        {trend && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              trendUp
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <p className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">{value}</p>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse"
        >
          <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-100 rounded w-16 mb-4" />
          <div className="h-16 bg-gray-50 rounded" />
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

  // Calculate trend percentages from trend arrays
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricCard
        title="Active Outreach"
        value={metrics.activeOutreach}
        trend={outreachTrend.value}
        trendUp={outreachTrend.up}
        chartData={metrics.outreachTrend}
        chartColor="#6366f1"
      />
      <MetricCard
        title="Weekly Responses"
        value={metrics.weeklyResponses}
        trend={responseTrend.value}
        trendUp={responseTrend.up}
        chartData={metrics.responseTrend}
        chartColor="#8b5cf6"
      />
      <MetricCard
        title="Deal Progress"
        value={totalDeals}
        trend={
          metrics.dealProgress.agreed > 0
            ? `${metrics.dealProgress.agreed} agreed`
            : "—"
        }
        trendUp={metrics.dealProgress.agreed > 0}
        chartData={[
          metrics.dealProgress.contacted,
          metrics.dealProgress.responded,
          metrics.dealProgress.negotiating,
          metrics.dealProgress.agreed,
        ]}
        chartColor="#f97316"
        chartType="area"
      />
    </div>
  );
}

// ── Campaign Card (top row) ─────────────────────────────────

function CampaignCard({
  campaign,
  index,
}: {
  campaign: CampaignSummary;
  index: number;
}) {
  const IconComp = CAMPAIGN_ICONS[index % CAMPAIGN_ICONS.length];
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <Link
      href={`/campaigns/${campaign.short_id || campaign.id}`}
      className="min-w-[200px] bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:scale-[1.03] transition-all text-left group"
    >
      <div className="mb-8">
        <div className="flex gap-2 mb-2">
          <div className="w-6 h-2 bg-purple-300 rounded-full" />
          <div className="w-6 h-2 bg-pink-300 rounded-full" />
        </div>
        <MiniChart variant={index} />
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`${colors.bg} p-1.5 rounded group-hover:scale-110 transition-transform`}
        >
          <IconComp className={`w-3.5 h-3.5 ${colors.icon}`} />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">
          {campaign.name}
        </span>
      </div>
    </Link>
  );
}

// ── Campaign List Row ───────────────────────────────────────

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const statusStyle = STATUS_COLORS[campaign.status] || STATUS_COLORS.draft;
  const label = campaign.status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const progress = getProgressPercent(campaign.status);

  return (
    <Link
      href={`/campaigns/${campaign.short_id || campaign.id}`}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all group relative overflow-hidden"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-sm group-hover:border-indigo-300 transition-colors flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900 truncate">
              {campaign.name}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
            >
              {label}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {campaign.short_id || campaign.id.slice(0, 8)} &middot;{" "}
            {formatDate(campaign.created_at)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all rounded-br"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user || fetched.current) return;
    fetched.current = true;
    listCampaigns()
      .then(setCampaigns)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [user]);

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

  // Filter campaigns based on sidebar filter
  const filteredCampaigns = campaigns.filter((c) => {
    if (!filter) return true;
    if (filter === "active")
      return c.status === "running" || c.status === "awaiting_approval";
    if (filter === "completed") return c.status === "completed";
    if (filter === "draft") return c.status === "draft";
    return true;
  });

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          {getGreeting()}
        </h1>
      </div>

      {/* Dashboard Metrics */}
      <DashboardMetrics />

      {/* Recent campaigns (card row) */}
      {campaigns.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Your Recents</h2>
            <Link
              href="/campaigns/new"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <span>See All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {campaigns.slice(0, 5).map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Campaign list */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate">
            {filter
              ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Campaigns`
              : "All Campaigns"}
          </h2>
          <Link
            href="/campaigns/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 sm:px-4 flex items-center gap-2 text-sm font-medium transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500 text-sm">No campaigns yet.</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Click{" "}
              <span className="font-medium text-gray-600">New Campaign</span>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-2 sm:p-4">
            <div className="space-y-1">
              {filteredCampaigns.map((c) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
