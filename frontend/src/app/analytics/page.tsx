"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import type { FullAnalytics } from "@/lib/api";
import { getFullAnalytics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Download,
  Filter,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Youtube,
  MoreVertical,
  RefreshCw,
  MousePointerClick,
  Globe,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  Handshake,
  ChevronDown,
  X,
  FileDown,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  PieChart,
} from "lucide-react";
import { generateAnalyticsPdf } from "@/lib/pdf/pdf-analytics";

// ── Types ────────────────────────────────────────────────────

type TabKey = "overview" | "campaigns" | "creators" | "email" | "engagement" | "content";

// ── Helpers ──────────────────────────────────────────────────

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

const ENGAGEMENT_STATUS_LABELS: Record<string, string> = {
  contacted: "Contacted",
  responded: "Responded",
  negotiating: "Negotiating",
  agreed: "Agreed",
  declined: "Declined",
};

const ENGAGEMENT_STATUS_BADGE: Record<string, string> = {
  contacted: "bg-gray-100 text-gray-700",
  responded: "bg-blue-100 text-blue-700",
  negotiating: "bg-amber-100 text-amber-700",
  agreed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

const AVATAR_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-fuchsia-400 to-pink-500",
  "from-lime-400 to-green-500",
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return Instagram;
    case "youtube":
      return Youtube;
    default:
      return Globe;
  }
}

// ── CSV Export ───────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTab(tab: TabKey, data: FullAnalytics, campaignFilter: string) {
  const filtered = campaignFilter === "all"
    ? data
    : {
        ...data,
        perCampaign: data.perCampaign.filter((c) => c.id === campaignFilter),
        allCreators: data.allCreators.filter((c) => c.campaignId === campaignFilter),
        emailBreakdown: data.emailBreakdown.filter((e) => e.campaignId === campaignFilter),
      };

  const ts = new Date().toISOString().slice(0, 10);

  switch (tab) {
    case "overview":
      downloadCSV(`analytics-overview-${ts}.csv`,
        ["Metric", "Value"],
        [
          ["Total Campaigns", String(filtered.totalCampaigns)],
          ["Creators Contacted", String(filtered.totalCreatorsContacted)],
          ["Deals Agreed", String(filtered.totalAgreed)],
          ["Declined", String(filtered.totalDeclined)],
          ["Response Rate", `${filtered.responseRate}%`],
          ["Conversion Rate", `${filtered.conversionRate}%`],
          ["Emails Sent", String(filtered.emailStats.totalSent)],
          ["Email Open Rate", `${filtered.emailStats.openRate}%`],
          ["Email Click Rate", `${filtered.emailStats.clickRate}%`],
          ["Email Delivery Rate", `${filtered.emailStats.deliveryRate}%`],
        ]
      );
      break;

    case "campaigns":
      downloadCSV(`analytics-campaigns-${ts}.csv`,
        ["Campaign", "Status", "Creators", "Responded", "Agreed", "Emails Sent", "Open Rate"],
        filtered.perCampaign.map((c) => [
          c.name, c.status, String(c.creators), String(c.responded),
          String(c.agreed), String(c.emailsSent), `${c.openRate}%`,
        ])
      );
      break;

    case "creators":
      downloadCSV(`analytics-creators-${ts}.csv`,
        ["Name", "Email", "Platform", "Campaign", "Status", "Response Time (h)", "Proposed Fee (£)"],
        filtered.allCreators.map((c) => [
          c.name, c.email, c.platform, c.campaignName, c.status,
          c.responseTimeHours !== null ? String(c.responseTimeHours) : "",
          c.feeGbp !== null ? String(c.feeGbp) : "",
        ])
      );
      break;

    case "email":
      downloadCSV(`analytics-email-${ts}.csv`,
        ["Campaign", "Sent", "Delivered", "Opened", "Clicked", "Bounced"],
        filtered.emailBreakdown.map((e) => [
          e.campaignName, String(e.sent), String(e.delivered),
          String(e.opened), String(e.clicked), String(e.bounced),
        ])
      );
      break;

    case "engagement":
      downloadCSV(`analytics-engagement-${ts}.csv`,
        ["Status", "Count", "Percentage"],
        Object.entries(filtered.engagementFunnel).map(([status, count]) => [
          status, String(count),
          filtered.totalCreatorsContacted > 0
            ? `${Math.round((count / filtered.totalCreatorsContacted) * 100)}%`
            : "0%",
        ])
      );
      break;

    case "content":
      downloadCSV(`analytics-content-${ts}.csv`,
        ["Campaign", "Posts Live", "Likes", "Comments", "Shares", "Saves", "Compliance"],
        (filtered.contentPerformance?.perCampaign || []).map((c) => [
          c.campaignName, String(c.postsLive), String(c.likes),
          String(c.comments), String(c.shares), String(c.saves),
          `${c.complianceScore}%`,
        ])
      );
      break;
  }
}

// ── Loading Skeleton ─────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg" />
              <div className="w-12 h-4 bg-gray-100 rounded" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-20 mb-2" />
            <div className="h-8 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, checking } = useRequireAuth();
  const [data, setData] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabKey>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Derive filtered data from campaignFilter (memoized)
  const filteredData: FullAnalytics | null = useMemo(() => {
    if (!data) return null;
    if (campaignFilter === "all") return data;
    const pc = data.perCampaign.filter((c) => c.id === campaignFilter);
    const creators = data.allCreators.filter((c) => c.campaignId === campaignFilter);
    const emails = data.emailBreakdown.filter((e) => e.campaignId === campaignFilter);
    const totalContacted = creators.length;
    const totalAgreed = creators.filter((c) => c.agreed).length;
    const totalDeclined = creators.filter((c) => c.status === "declined").length;
    const totalResponded = creators.filter((c) => c.responded).length;
    const funnel: Record<string, number> = {};
    for (const c of creators) funnel[c.status] = (funnel[c.status] || 0) + 1;
    const emailTotals = emails.reduce(
      (acc, e) => ({
        sent: acc.sent + e.sent,
        delivered: acc.delivered + e.delivered,
        opened: acc.opened + e.opened,
        clicked: acc.clicked + e.clicked,
        bounced: acc.bounced + e.bounced,
      }),
      { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 }
    );
    const platMap: Record<string, { creators: number; responded: number; agreed: number; declined: number }> = {};
    for (const c of creators) {
      const p = c.platform || "unknown";
      if (!platMap[p]) platMap[p] = { creators: 0, responded: 0, agreed: 0, declined: 0 };
      platMap[p].creators++;
      if (c.responded) platMap[p].responded++;
      if (c.agreed) platMap[p].agreed++;
      if (c.status === "declined") platMap[p].declined++;
    }
    return {
      ...data,
      totalCampaigns: pc.length,
      byStatus: pc.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>),
      totalCreatorsContacted: totalContacted,
      totalAgreed,
      totalDeclined,
      responseRate: totalContacted > 0 ? Math.round((totalResponded / totalContacted) * 100) : 0,
      conversionRate: totalContacted > 0 ? Math.round((totalAgreed / totalContacted) * 100) : 0,
      emailStats: {
        totalSent: emailTotals.sent,
        deliveryRate: emailTotals.sent > 0 ? Math.round((emailTotals.delivered / emailTotals.sent) * 100) : 0,
        openRate: emailTotals.sent > 0 ? Math.round((emailTotals.opened / emailTotals.sent) * 100) : 0,
        clickRate: emailTotals.sent > 0 ? Math.round((emailTotals.clicked / emailTotals.sent) * 100) : 0,
      },
      perCampaign: pc,
      emailBreakdown: emails,
      allCreators: creators,
      engagementFunnel: funnel,
      negotiationStats: {
        activeNegotiations: funnel["negotiating"] || 0,
        avgResponseTimeHours: (() => {
          const times = creators.filter((c) => c.responseTimeHours !== null).map((c) => c.responseTimeHours!);
          return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
        })(),
      },
      platformBreakdown: Object.entries(platMap).map(([platform, s]) => ({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        ...s,
        responseRate: s.creators > 0 ? Math.round((s.responded / s.creators) * 100) : 0,
      })).sort((a, b) => b.creators - a.creators),
      contentPerformance: (() => {
        const filtContent = data.contentPerformance.perCampaign.filter((c) => c.campaignId === campaignFilter);
        return {
          totalPostsLive: filtContent.reduce((a, c) => a + c.postsLive, 0),
          totalLikes: filtContent.reduce((a, c) => a + c.likes, 0),
          totalComments: filtContent.reduce((a, c) => a + c.comments, 0),
          totalShares: filtContent.reduce((a, c) => a + c.shares, 0),
          totalSaves: filtContent.reduce((a, c) => a + c.saves, 0),
          avgComplianceScore: filtContent.filter((c) => c.postsLive > 0).length > 0
            ? Math.round(filtContent.filter((c) => c.postsLive > 0).reduce((a, c) => a + c.complianceScore, 0) / filtContent.filter((c) => c.postsLive > 0).length * 10) / 10
            : 0,
          totalComplianceIssues: filtContent.reduce((a, c) => a + c.complianceIssues, 0),
          totalFullyCompliant: data.contentPerformance.totalFullyCompliant, // approximate
          perCampaign: filtContent,
        };
      })(),
      budgetTracking: (() => {
        const filtBudget = data.budgetTracking.perCampaign.filter((c) => c.campaignId === campaignFilter);
        const tb = filtBudget.reduce((a, c) => a + c.budget, 0);
        const tf = filtBudget.reduce((a, c) => a + c.agreedFees, 0);
        const ta = filtBudget.reduce((a, c) => a + c.creatorsAgreed, 0);
        const te = filtBudget.reduce((a, c) => a + c.totalEngagements, 0);
        return {
          totalBudget: tb,
          totalAgreedFees: tf,
          avgCostPerCreator: ta > 0 ? Math.round(tf / ta) : 0,
          avgCostPerEngagement: te > 0 ? Math.round((tf / te) * 100) / 100 : 0,
          perCampaign: filtBudget,
        };
      })(),
    };
  }, [data, campaignFilter]);

  const handleExport = useCallback(() => {
    if (!data) return;
    exportTab(selectedTab, data, campaignFilter);
  }, [data, selectedTab, campaignFilter]);

  const [exportingPdf, setExportingPdf] = useState(false);
  const handleExportPdf = useCallback(async () => {
    if (!data) return;
    setExportingPdf(true);
    try {
      await generateAnalyticsPdf(data, campaignFilter);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  }, [data, campaignFilter]);

  const fetchData = () => {
    if (!user) return;
    setRefreshing(true);
    getFullAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: "Campaigns" },
    { key: "content", label: "Content" },
    { key: "creators", label: "Creators" },
    { key: "email", label: "Email" },
    { key: "engagement", label: "Engagement" },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6">
          {/* Title + controls */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Performance insights from your campaigns</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
            {/* Campaign Filter */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`px-3 sm:px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  campaignFilter !== "all"
                    ? "border-[#2F4538] bg-[#2F4538]/5 text-[#2F4538]"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {campaignFilter === "all"
                    ? "All Campaigns"
                    : data?.perCampaign.find((c) => c.id === campaignFilter)?.name || "Filter"}
                </span>
                {campaignFilter !== "all" ? (
                  <X
                    className="w-3.5 h-3.5 ml-1 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCampaignFilter("all");
                      setFilterOpen(false);
                    }}
                  />
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                )}
              </button>

              {filterOpen && data && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setCampaignFilter("all"); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      campaignFilter === "all"
                        ? "bg-[#2F4538]/5 text-[#2F4538] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    All Campaigns
                  </button>
                  {data.perCampaign.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCampaignFilter(c.id); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        campaignFilter === c.id
                          ? "bg-[#2F4538]/5 text-[#2F4538] font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{c.creators} creators</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExport}
              disabled={!data}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={!data || exportingPdf}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">{exportingPdf ? "Exporting\u2026" : "PDF"}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

          {/* Tabs */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide border-b border-gray-200 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`pb-3 px-1 font-medium text-sm whitespace-nowrap transition-colors relative ${
                  selectedTab === tab.key
                    ? "text-[#2F4538]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {selectedTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F4538] rounded-full" />
                )}
              </button>
            ))}
          </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="mt-6">
        {loading ? (
          <AnalyticsSkeleton />
        ) : !filteredData ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No analytics data available yet.</p>
            <p className="text-xs text-gray-400 mt-1">Run a campaign to start seeing metrics here.</p>
          </div>
        ) : (
          <>
            {/* Campaign filter active indicator */}
            {campaignFilter !== "all" && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-[#2F4538]/5 border border-[#2F4538]/20 rounded-lg text-sm">
                <Filter className="w-4 h-4 text-[#2F4538]" />
                <span className="text-gray-700">
                  Filtered to: <span className="font-medium text-[#2F4538]">{data?.perCampaign.find((c) => c.id === campaignFilter)?.name}</span>
                </span>
                <button
                  onClick={() => setCampaignFilter("all")}
                  className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      {filteredData.responseRate > 0 && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          {filteredData.responseRate}% response
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Creators Contacted</div>
                    <div className="text-3xl font-bold text-gray-900">{filteredData.totalCreatorsContacted}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      {filteredData.conversionRate > 0 && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          {filteredData.conversionRate}% conversion
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Deals Agreed</div>
                    <div className="text-3xl font-bold text-gray-900">{filteredData.totalAgreed}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      {filteredData.totalCampaigns > 0 && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          {filteredData.byStatus["running"] || 0} active
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Campaigns</div>
                    <div className="text-3xl font-bold text-gray-900">{filteredData.totalCampaigns}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-orange-600" />
                      </div>
                      {filteredData.emailStats.openRate > 0 && (
                        <div className={`flex items-center gap-1 text-sm font-semibold ${filteredData.emailStats.openRate >= 20 ? "text-green-600" : "text-red-600"}`}>
                          {filteredData.emailStats.openRate >= 20 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {filteredData.emailStats.openRate}% open
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Emails Sent</div>
                    <div className="text-3xl font-bold text-gray-900">{filteredData.emailStats.totalSent}</div>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Email Open Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.openRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Delivery: {filteredData.emailStats.deliveryRate}%</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <MousePointerClick className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Click Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.clickRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Of emails sent</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Declined</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.totalDeclined}</div>
                    <div className="text-xs text-gray-500 mt-1">Creators declined</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {filteredData.negotiationStats.avgResponseTimeHours > 0
                        ? `${filteredData.negotiationStats.avgResponseTimeHours}h`
                        : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{filteredData.negotiationStats.activeNegotiations} active negotiations</div>
                  </div>
                </div>

                {/* Content & Budget Snapshot */}
                {(filteredData.contentPerformance.totalPostsLive > 0 || filteredData.budgetTracking.totalBudget > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredData.contentPerformance.totalPostsLive > 0 && (
                      <>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            <span className="text-sm text-gray-600">Total Engagements</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {(filteredData.contentPerformance.totalLikes +
                              filteredData.contentPerformance.totalComments +
                              filteredData.contentPerformance.totalShares +
                              filteredData.contentPerformance.totalSaves).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{filteredData.contentPerformance.totalPostsLive} posts live</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-gray-600">Compliance Score</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.avgComplianceScore}%</div>
                          <div className="text-xs text-gray-500 mt-1">{filteredData.contentPerformance.totalFullyCompliant} fully compliant</div>
                        </div>
                      </>
                    )}
                    {filteredData.budgetTracking.totalBudget > 0 && (
                      <>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-gray-600">Budget</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            £{filteredData.budgetTracking.totalBudget.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            £{filteredData.budgetTracking.totalAgreedFees.toLocaleString()} agreed
                          </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            <span className="text-sm text-gray-600">Cost / Creator</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {filteredData.budgetTracking.avgCostPerCreator > 0
                              ? `£${filteredData.budgetTracking.avgCostPerCreator.toLocaleString()}`
                              : "—"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{filteredData.totalAgreed} creators agreed</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Campaign Status Breakdown */}
                {Object.keys(filteredData.byStatus).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Campaign Status</h2>
                    <div className="space-y-4">
                      {Object.entries(filteredData.byStatus).map(([status, count]) => {
                        const pct = filteredData.totalCampaigns > 0 ? Math.round((count / filteredData.totalCampaigns) * 100) : 0;
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status] || "bg-gray-100 text-gray-700"}`}>
                                  {STATUS_LABELS[status] || status}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-gray-900">{count}</span>
                                <span className="text-xs text-gray-500 ml-2">{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-2.5 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Platform Breakdown (real data) */}
                {filteredData.platformBreakdown.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Breakdown</h2>
                    <div className="space-y-6">
                      {filteredData.platformBreakdown.map((p, i) => {
                        const Icon = getPlatformIcon(p.platform);
                        return (
                          <div key={i} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-gray-600" />
                                <span className="font-semibold text-gray-900">{p.platform}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">{p.responseRate}% response</div>
                                <div className="text-xs text-gray-500">{p.creators} creators</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Creators</div>
                                <div className="font-semibold text-gray-900">{p.creators}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Responded</div>
                                <div className="font-semibold text-gray-900">{p.responded}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Agreed</div>
                                <div className="font-semibold text-green-600">{p.agreed}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Declined</div>
                                <div className="font-semibold text-red-600">{p.declined}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ CAMPAIGNS TAB ═══════════════════ */}
            {selectedTab === "campaigns" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Campaign Performance</h2>
                    <p className="text-sm text-gray-600 mt-1">Detailed metrics for all your campaigns</p>
                  </div>
                </div>

                {filteredData.perCampaign.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No campaigns yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredData.perCampaign.map((campaign) => {
                      const responseRate = campaign.creators > 0
                        ? Math.round((campaign.responded / campaign.creators) * 100)
                        : 0;
                      const agreedRate = campaign.creators > 0
                        ? Math.round((campaign.agreed / campaign.creators) * 100)
                        : 0;
                      // Find matching email breakdown
                      const emailData = filteredData.emailBreakdown.find((e) => e.campaignId === campaign.id);
                      return (
                        <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <Link
                                  href={`/campaigns/${campaign.id}`}
                                  className="text-lg font-bold text-gray-900 hover:text-[#2F4538] transition-colors truncate"
                                >
                                  {campaign.name}
                                </Link>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[campaign.status] || "bg-gray-100 text-gray-700"}`}>
                                  {STATUS_LABELS[campaign.status] || campaign.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                <span>{campaign.creators} creators</span>
                                <span>•</span>
                                <span>{campaign.emailsSent} emails sent</span>
                                <span>•</span>
                                <span className={`font-semibold ${responseRate >= 50 ? "text-green-600" : responseRate >= 20 ? "text-blue-600" : "text-gray-600"}`}>
                                  {responseRate}% response rate
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-400" />
                            </Link>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">Response Progress</span>
                              <span className="font-semibold text-gray-900">
                                {campaign.responded} of {campaign.creators} responded
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-2 rounded-full transition-all"
                                style={{ width: `${responseRate}%` }}
                              />
                            </div>
                          </div>

                          {/* Metrics grid */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                              <div className="text-xs text-blue-700 mb-1">Creators</div>
                              <div className="text-lg sm:text-xl font-bold text-blue-900">{campaign.creators}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                              <div className="text-xs text-green-700 mb-1">Responded</div>
                              <div className="text-lg sm:text-xl font-bold text-green-900">{campaign.responded}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg">
                              <div className="text-xs text-emerald-700 mb-1">Agreed</div>
                              <div className="text-lg sm:text-xl font-bold text-emerald-900">{campaign.agreed}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                              <div className="text-xs text-orange-700 mb-1">Emails Sent</div>
                              <div className="text-lg sm:text-xl font-bold text-orange-900">{campaign.emailsSent}</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                              <div className="text-xs text-purple-700 mb-1">Open Rate</div>
                              <div className="text-lg sm:text-xl font-bold text-purple-900">{campaign.openRate}%</div>
                            </div>
                            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Conversion</div>
                              <div className="text-lg sm:text-xl font-bold text-gray-900">{agreedRate}%</div>
                            </div>
                          </div>

                          {/* Email delivery breakdown if available */}
                          {emailData && emailData.sent > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="text-xs font-medium text-gray-500 uppercase mb-3">Email Delivery</div>
                              <div className="grid grid-cols-5 gap-2 text-center">
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{emailData.sent}</div>
                                  <div className="text-[10px] text-gray-500">Sent</div>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-green-600">{emailData.delivered}</div>
                                  <div className="text-[10px] text-gray-500">Delivered</div>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-blue-600">{emailData.opened}</div>
                                  <div className="text-[10px] text-gray-500">Opened</div>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-purple-600">{emailData.clicked}</div>
                                  <div className="text-[10px] text-gray-500">Clicked</div>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-red-600">{emailData.bounced}</div>
                                  <div className="text-[10px] text-gray-500">Bounced</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ CREATORS TAB ════════════════════ */}
            {selectedTab === "creators" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Creator Overview</h2>
                    <p className="text-sm text-gray-600 mt-1">All creators contacted across your campaigns</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filteredData.allCreators.length} total creators
                  </div>
                </div>

                {filteredData.allCreators.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No creators contacted yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Creator</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Platform</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Campaign</th>
                            <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Response Time</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Proposed Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredData.allCreators.map((creator, idx) => {
                            const Icon = getPlatformIcon(creator.platform);
                            return (
                              <tr key={`${creator.id}-${creator.campaignId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(creator.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                      {getInitials(creator.name)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 truncate">{creator.name}</div>
                                      {creator.email && (
                                        <div className="text-sm text-gray-500 truncate">{creator.email}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 capitalize">{creator.platform}</span>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                  <Link
                                    href={`/campaigns/${creator.campaignId}`}
                                    className="text-sm text-gray-700 hover:text-[#2F4538] transition-colors truncate block max-w-[200px]"
                                  >
                                    {creator.campaignName}
                                  </Link>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ENGAGEMENT_STATUS_BADGE[creator.status] || "bg-gray-100 text-gray-700"}`}>
                                    {ENGAGEMENT_STATUS_LABELS[creator.status] || creator.status}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right text-sm text-gray-700 hidden lg:table-cell">
                                  {creator.responseTimeHours !== null
                                    ? `${creator.responseTimeHours}h`
                                    : "—"}
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-gray-900 hidden lg:table-cell">
                                  {creator.feeGbp !== null ? `£${creator.feeGbp.toLocaleString()}` : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ EMAIL TAB ═══════════════════════ */}
            {selectedTab === "email" && (
              <div className="space-y-6">
                {/* Email overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Send className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.totalSent}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Delivery Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.deliveryRate}%</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600">Open Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.openRate}%</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <MousePointerClick className="w-5 h-5 text-orange-500" />
                      <span className="text-sm text-gray-600">Click Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.emailStats.clickRate}%</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-gray-600">Response Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.responseRate}%</div>
                  </div>
                </div>

                {/* Per-campaign email breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Email Performance by Campaign</h2>
                  {filteredData.emailBreakdown.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No email data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredData.emailBreakdown
                        .filter((e) => e.sent > 0)
                        .map((e, i) => {
                          const deliveryPct = e.sent > 0 ? Math.round((e.delivered / e.sent) * 100) : 0;
                          const openPct = e.sent > 0 ? Math.round((e.opened / e.sent) * 100) : 0;
                          const clickPct = e.sent > 0 ? Math.round((e.clicked / e.sent) * 100) : 0;
                          return (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <Link
                                  href={`/campaigns/${e.campaignId}`}
                                  className="font-semibold text-gray-900 hover:text-[#2F4538] transition-colors"
                                >
                                  {e.campaignName}
                                </Link>
                                <span className="text-sm text-gray-500">{e.sent} sent</span>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Delivered</span>
                                    <span className="font-semibold text-gray-900">{e.delivered} ({deliveryPct}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${deliveryPct}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Opened</span>
                                    <span className="font-semibold text-gray-900">{e.opened} ({openPct}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${openPct}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Clicked</span>
                                    <span className="font-semibold text-gray-900">{e.clicked} ({clickPct}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${clickPct}%` }} />
                                  </div>
                                </div>
                                {e.bounced > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-gray-600">Bounced</span>
                                      <span className="font-semibold text-red-600">{e.bounced}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${Math.round((e.bounced / e.sent) * 100)}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════ ENGAGEMENT TAB ══════════════════ */}
            {selectedTab === "engagement" && (
              <div className="space-y-6">
                {/* Engagement funnel cards */}
                {(() => {
                  const funnel = filteredData.engagementFunnel;
                  const total = filteredData.totalCreatorsContacted;
                  const statuses = [
                    { key: "contacted", label: "Contacted", icon: Send, color: "text-gray-500" },
                    { key: "responded", label: "Responded", icon: MessageSquare, color: "text-blue-500" },
                    { key: "negotiating", label: "Negotiating", icon: Handshake, color: "text-amber-500" },
                    { key: "agreed", label: "Agreed", icon: CheckCircle, color: "text-green-500" },
                    { key: "declined", label: "Declined", icon: XCircle, color: "text-red-500" },
                  ];
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {statuses.map((s) => {
                        const count = funnel[s.key] || 0;
                        const Icon = s.icon;
                        return (
                          <div key={s.key} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-2">
                              <Icon className={`w-5 h-5 ${s.color}`} />
                              <span className="text-sm text-gray-600">{s.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{count}</div>
                            {total > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round((count / total) * 100)}% of contacted
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Engagement Funnel Bars */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Funnel</h2>
                  {filteredData.totalCreatorsContacted === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6">No engagement data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { key: "contacted", label: "Contacted", color: "from-gray-400 to-gray-500" },
                        { key: "responded", label: "Responded", color: "from-blue-400 to-blue-500" },
                        { key: "negotiating", label: "Negotiating", color: "from-amber-400 to-amber-500" },
                        { key: "agreed", label: "Agreed", color: "from-green-400 to-green-500" },
                        { key: "declined", label: "Declined", color: "from-red-400 to-red-500" },
                      ].map((s) => {
                        const count = filteredData.engagementFunnel[s.key] || 0;
                        const pct = filteredData.totalCreatorsContacted > 0
                          ? Math.round((count / filteredData.totalCreatorsContacted) * 100)
                          : 0;
                        return (
                          <div key={s.key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{s.label}</span>
                              <div className="text-right">
                                <span className="font-semibold text-gray-900">{count}</span>
                                <span className="text-xs text-gray-500 ml-2">{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className={`bg-gradient-to-r ${s.color} h-3 rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Per-campaign engagement breakdown */}
                {filteredData.perCampaign.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement by Campaign</h2>
                    <div className="space-y-4">
                      {filteredData.perCampaign
                        .filter((c) => c.creators > 0)
                        .map((c) => {
                          const respPct = c.creators > 0 ? Math.round((c.responded / c.creators) * 100) : 0;
                          const agrPct = c.creators > 0 ? Math.round((c.agreed / c.creators) * 100) : 0;
                          return (
                            <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <Link
                                  href={`/campaigns/${c.id}`}
                                  className="font-semibold text-gray-900 hover:text-[#2F4538] transition-colors"
                                >
                                  {c.name}
                                </Link>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[c.status] || "bg-gray-100 text-gray-700"}`}>
                                  {STATUS_LABELS[c.status] || c.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Contacted</div>
                                  <div className="font-semibold text-gray-900">{c.creators}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Responded</div>
                                  <div className="font-semibold text-blue-600">{c.responded}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Agreed</div>
                                  <div className="font-semibold text-green-600">{c.agreed}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Conversion</div>
                                  <div className="font-semibold text-purple-600">{agrPct}%</div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-2 rounded-full transition-all"
                                  style={{ width: `${respPct}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{respPct}% response rate</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ CONTENT TAB ══════════════════════ */}
            {selectedTab === "content" && (
              <div className="space-y-6">
                {/* Content Performance Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Posts Live</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.totalPostsLive}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-gray-600">Likes</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.totalLikes.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Comments</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.totalComments.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Share2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Shares</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.totalShares.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Bookmark className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600">Saves</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.totalSaves.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-gray-600">Compliance</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{filteredData.contentPerformance.avgComplianceScore}%</div>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Compliance Overview</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-gray-700">Fully Compliant</span>
                        </div>
                        <span className="font-bold text-green-600">{filteredData.contentPerformance.totalFullyCompliant}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <span className="text-sm text-gray-700">With Issues</span>
                        </div>
                        <span className="font-bold text-amber-600">{filteredData.contentPerformance.totalComplianceIssues}</span>
                      </div>
                      {filteredData.contentPerformance.totalPostsLive > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Overall Compliance</span>
                            <span className="font-semibold">{filteredData.contentPerformance.avgComplianceScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                filteredData.contentPerformance.avgComplianceScore >= 80
                                  ? "bg-green-500"
                                  : filteredData.contentPerformance.avgComplianceScore >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${filteredData.contentPerformance.avgComplianceScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ROI Summary Card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Budget & ROI</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Budget</span>
                        <span className="font-bold text-gray-900">
                          {filteredData.budgetTracking.totalBudget > 0
                            ? `£${filteredData.budgetTracking.totalBudget.toLocaleString()}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Agreed Fees</span>
                        <span className="font-bold text-gray-900">
                          {filteredData.budgetTracking.totalAgreedFees > 0
                            ? `£${filteredData.budgetTracking.totalAgreedFees.toLocaleString()}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cost per Creator</span>
                        <span className="font-bold text-gray-900">
                          {filteredData.budgetTracking.avgCostPerCreator > 0
                            ? `£${filteredData.budgetTracking.avgCostPerCreator.toLocaleString()}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cost per Engagement</span>
                        <span className="font-bold text-gray-900">
                          {filteredData.budgetTracking.avgCostPerEngagement > 0
                            ? `£${filteredData.budgetTracking.avgCostPerEngagement.toFixed(2)}`
                            : "—"}
                        </span>
                      </div>
                      {filteredData.budgetTracking.totalBudget > 0 && filteredData.budgetTracking.totalAgreedFees > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Budget Used</span>
                            <span className="font-semibold">
                              {Math.round((filteredData.budgetTracking.totalAgreedFees / filteredData.budgetTracking.totalBudget) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                filteredData.budgetTracking.totalAgreedFees <= filteredData.budgetTracking.totalBudget
                                  ? "bg-gradient-to-r from-[#2F4538] to-[#D16B42]"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((filteredData.budgetTracking.totalAgreedFees / filteredData.budgetTracking.totalBudget) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-Campaign Content Breakdown */}
                {filteredData.contentPerformance.perCampaign.filter((c) => c.postsLive > 0).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Content by Campaign</h2>
                    <div className="space-y-4">
                      {filteredData.contentPerformance.perCampaign
                        .filter((c) => c.postsLive > 0)
                        .sort((a, b) => b.likes - a.likes)
                        .map((c, i) => {
                          const totalEng = c.likes + c.comments + c.shares + c.saves;
                          return (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <Link
                                  href={`/campaigns/${c.campaignId}`}
                                  className="font-semibold text-gray-900 hover:text-[#2F4538] transition-colors"
                                >
                                  {c.campaignName}
                                </Link>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-500">{c.postsLive} posts</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    c.complianceScore >= 80
                                      ? "bg-green-100 text-green-700"
                                      : c.complianceScore >= 50
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                  }`}>
                                    {c.complianceScore}% compliant
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="flex items-center gap-2">
                                  <Heart className="w-4 h-4 text-red-400" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{c.likes.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Likes</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{c.comments.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Comments</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Share2 className="w-4 h-4 text-green-400" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{c.shares.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Shares</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Bookmark className="w-4 h-4 text-purple-400" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{c.saves.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Saves</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{totalEng.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500">Total</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {filteredData.contentPerformance.totalPostsLive === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No content performance data yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Content metrics appear after campaigns reach the monitoring phase.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
