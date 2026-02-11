"use client";

import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CampaignSummary, AggregateMetrics, CreatorEngagement, EmailDeliverySummary } from "@/lib/api";
import { listCampaigns, getAggregateMetrics, getCampaign, getEngagements, getEmailEvents } from "@/lib/api";
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
  X,
  DollarSign,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
  chartLabels,
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
  chartLabels?: string[];
  icon: React.ElementType;
  iconBg: string;
}) {
  const gradientId = `grad-${title.replace(/\s/g, "")}`;
  const data = chartData.map((v, i) => ({
    value: v,
    name: chartLabels?.[i] ?? `${i + 1}`,
  }));

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg">
        <p className="font-medium">{payload[0].value}</p>
        {label && <p className="text-gray-400 text-[10px]">{label}</p>}
      </div>
    );
  };

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
      <div className="h-24 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                dy={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={30}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: chartColor, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                dy={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                width={30}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: chartColor, stroke: "#fff", strokeWidth: 2 }}
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
          <div className="h-24 bg-gray-50 rounded" />
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

  // Generate last 7 day labels (Mon, Tue, ...)
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <MetricCard
        title="Active Outreach"
        value={metrics.activeOutreach}
        subtitle={`${metrics.dealProgress.contacted} creators contacted`}
        trend={outreachTrend.value}
        trendUp={outreachTrend.up}
        chartData={metrics.outreachTrend}
        chartLabels={dayLabels}
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
        chartLabels={dayLabels}
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
        chartLabels={["Contacted", "Responded", "Negotiating", "Agreed"]}
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
  onClick,
}: {
  campaign: CampaignSummary;
  index: number;
  onClick?: () => void;
}) {
  const statusStyle = STATUS_BADGE[campaign.status] || STATUS_BADGE.draft;
  const label = STATUS_LABELS[campaign.status] || campaign.status;
  const progress = getProgressPercent(campaign.status);

  return (
    <button
      onClick={onClick}
      className="min-w-[220px] sm:min-w-[260px] bg-white rounded-xl p-5 border border-gray-200 hover:border-[#2F4538]/30 hover:shadow-lg transition-all text-left group relative overflow-hidden cursor-pointer"
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
    </button>
  );
}

// ── Campaign List Row ───────────────────────────────────────

function CampaignRow({ campaign, onClick }: { campaign: CampaignSummary; onClick?: () => void }) {
  const statusStyle = STATUS_BADGE[campaign.status] || STATUS_BADGE.draft;
  const label = STATUS_LABELS[campaign.status] || campaign.status;
  const progress = getProgressPercent(campaign.status);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-all group relative overflow-hidden cursor-pointer"
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
    </button>
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

// ── Campaign Detail Modal ────────────────────────────────────

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: CampaignSummary;
  onClose: () => void;
}) {
  const [engagements, setEngagements] = useState<CreatorEngagement[]>([]);
  const [emailData, setEmailData] = useState<EmailDeliverySummary | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getEngagements(campaign.id),
      getEmailEvents(campaign.id),
      getCampaign(campaign.id),
    ]).then(([eng, email, full]) => {
      if (cancelled) return;
      setEngagements(eng);
      setEmailData(email);
      if (full?.brief) {
        const b = full.brief as Record<string, unknown>;
        if (b.budget_gbp) setBudget(Number(b.budget_gbp));
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [campaign.id]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Compute stats
  const totalCreators = engagements.length;
  const responded = engagements.filter((e) => e.status !== "contacted").length;
  const progressPct = campaign.status === "completed" ? 100
    : totalCreators > 0 ? Math.round((responded / totalCreators) * 100)
    : 0;

  // Build recent activity from engagements
  const recentActivity = useMemo(() => {
    const activities: { icon: React.ElementType; text: string; time: string; color: string }[] = [];

    // Group recent status changes
    const now = Date.now();
    const recentResponded = engagements.filter(
      (e) => e.response_timestamp && now - new Date(e.response_timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const recentAgreed = engagements.filter(
      (e) => e.status === "agreed" && e.updated_at && now - new Date(e.updated_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const recentNegotiating = engagements.filter(
      (e) => e.status === "negotiating" && e.updated_at && now - new Date(e.updated_at).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentResponded.length > 0) {
      const latest = recentResponded.sort((a, b) =>
        new Date(b.response_timestamp!).getTime() - new Date(a.response_timestamp!).getTime()
      )[0];
      const hoursAgo = Math.round((now - new Date(latest.response_timestamp!).getTime()) / (1000 * 60 * 60));
      activities.push({
        icon: MessageSquare,
        text: `${recentResponded.length} new influencer response${recentResponded.length !== 1 ? "s" : ""} received`,
        time: hoursAgo < 24 ? `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago` : `${Math.round(hoursAgo / 24)}d ago`,
        color: "bg-blue-100 text-blue-600",
      });
    }

    if (recentNegotiating.length > 0) {
      const latest = recentNegotiating.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      const hoursAgo = Math.round((now - new Date(latest.updated_at).getTime()) / (1000 * 60 * 60));
      activities.push({
        icon: Handshake,
        text: `${recentNegotiating.length} influencer${recentNegotiating.length !== 1 ? "s" : ""} entered negotiation stage`,
        time: hoursAgo < 24 ? `${hoursAgo} hour${hoursAgo !== 1 ? "s" : ""} ago` : `${Math.round(hoursAgo / 24)}d ago`,
        color: "bg-amber-100 text-amber-600",
      });
    }

    if (recentAgreed.length > 0) {
      activities.push({
        icon: CheckCircle,
        text: `${recentAgreed.length} deal${recentAgreed.length !== 1 ? "s" : ""} agreed`,
        time: "This week",
        color: "bg-green-100 text-green-600",
      });
    }

    if (progressPct >= 50 && campaign.status === "running") {
      activities.push({
        icon: TrendingUp,
        text: `Campaign milestone: ${progressPct}% completion reached`,
        time: "Recently",
        color: "bg-purple-100 text-purple-600",
      });
    }

    // If no recent activity
    if (activities.length === 0) {
      activities.push({
        icon: Calendar,
        text: "Campaign created",
        time: formatDate(campaign.created_at),
        color: "bg-gray-100 text-gray-600",
      });
    }

    return activities;
  }, [engagements, campaign, progressPct]);

  // Build funnel chart data for the performance overview
  const funnelData = useMemo(() => {
    const contacted = engagements.filter((e) => e.status === "contacted").length;
    const respondedN = engagements.filter((e) => e.status === "responded").length;
    const negotiatingN = engagements.filter((e) => e.status === "negotiating").length;
    const agreedN = engagements.filter((e) => e.status === "agreed").length;
    const declinedN = engagements.filter((e) => e.status === "declined").length;
    return [
      { stage: "Contacted", count: contacted + respondedN + negotiatingN + agreedN + declinedN },
      { stage: "Responded", count: respondedN + negotiatingN + agreedN },
      { stage: "Negotiating", count: negotiatingN + agreedN },
      { stage: "Agreed", count: agreedN },
    ];
  }, [engagements]);

  const statusLabel = STATUS_LABELS[campaign.status] || campaign.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <p className="text-sm text-gray-500">Campaign Details & Analytics</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5 truncate pr-4">{campaign.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Status</span>
                </div>
                <p className="text-sm font-bold text-green-900">{statusLabel}</p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">Budget</span>
                </div>
                <p className="text-sm font-bold text-blue-900">
                  {budget ? `£${budget.toLocaleString()}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">Influencers</span>
                </div>
                <p className="text-sm font-bold text-purple-900">{totalCreators}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Progress</span>
                </div>
                <p className="text-sm font-bold text-amber-900">{progressPct}%</p>
              </div>
            </div>

            {/* Performance Overview - Funnel Chart */}
            {totalCreators > 0 && (
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Performance Overview</h3>
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "13px",
                        }}
                      />
                      <defs>
                        <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2F4538" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2F4538" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#2F4538"
                        strokeWidth={2}
                        fill="url(#funnelGrad)"
                        dot={{ r: 4, fill: "#2F4538", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Email Stats Summary */}
            {emailData && emailData.total_sent > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{emailData.total_sent}</p>
                  <p className="text-[11px] text-gray-500">Sent</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{emailData.delivered}</p>
                  <p className="text-[11px] text-gray-500">Delivered</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{emailData.opened}</p>
                  <p className="text-[11px] text-gray-500">Opened</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{emailData.clicked}</p>
                  <p className="text-[11px] text-gray-500">Clicked</p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, i) => {
                  const Icon = activity.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/analytics"
                onClick={onClose}
                className="bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-xl py-3.5 text-sm font-semibold text-center transition-colors"
              >
                View Full Analytics
              </Link>
              <Link
                href={`/campaigns/${campaign.short_id || campaign.id}`}
                onClick={onClose}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl py-3.5 text-sm font-semibold text-center transition-colors"
              >
                Manage Campaign
              </Link>
            </div>
          </div>
        )}
      </div>
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
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSummary | null>(null);
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
                <CampaignCard key={c.id} campaign={c} index={i} onClick={() => setSelectedCampaign(c)} />
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
                  <CampaignRow key={c.id} campaign={c} onClick={() => setSelectedCampaign(c)} />
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

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}
