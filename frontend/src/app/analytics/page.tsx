"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AggregateAnalytics } from "@/lib/api";
import { getAggregateAnalytics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Download,
  Filter,
  Target,
  Award,
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
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type TabKey = "overview" | "campaigns" | "influencers" | "roi" | "engagement";

// ── Static demo data (for tabs without API coverage) ─────────

const PERFORMANCE_DATA = [
  { date: "Jan", reach: 8200000, engagement: 584000, spend: 185000, conversions: 5200 },
  { date: "Feb", reach: 9800000, engagement: 686000, spend: 215000, conversions: 6100 },
  { date: "Mar", reach: 10500000, engagement: 735000, spend: 242000, conversions: 6800 },
  { date: "Apr", reach: 11200000, engagement: 784000, spend: 268000, conversions: 7400 },
  { date: "May", reach: 11800000, engagement: 826000, spend: 275000, conversions: 7900 },
  { date: "Jun", reach: 12400000, engagement: 892000, spend: 284500, conversions: 8420 },
];

const PLATFORM_BREAKDOWN = [
  { platform: "Instagram", campaigns: 7, influencers: 28, reach: 6800000, engagement: 544000, engagementRate: 8.0, spend: 142000, conversions: 4850, roi: 410 },
  { platform: "YouTube", campaigns: 4, influencers: 16, reach: 4200000, engagement: 294000, engagementRate: 7.0, spend: 118000, conversions: 2980, roi: 365 },
  { platform: "TikTok", campaigns: 1, influencers: 4, reach: 1400000, engagement: 98000, engagementRate: 7.0, spend: 24500, conversions: 590, roi: 340 },
];

const TOP_INFLUENCERS = [
  { id: 1, name: "Sarah Mitchell", handle: "@sarahmstyle", platform: "instagram", followers: 450000, totalReach: 1200000, totalEngagement: 96000, engagementRate: 8.0, conversions: 1240, roi: 485, campaigns: 3, totalSpent: 22500, initials: "SM", color: "from-pink-400 to-rose-500" },
  { id: 2, name: "Marcus Chen", handle: "@marcusfitness", platform: "youtube", followers: 890000, totalReach: 2400000, totalEngagement: 168000, engagementRate: 7.0, conversions: 2100, roi: 520, campaigns: 2, totalSpent: 38000, initials: "MC", color: "from-blue-400 to-indigo-500" },
  { id: 3, name: "Jessica Park", handle: "@jessicaparkstyle", platform: "instagram", followers: 620000, totalReach: 1800000, totalEngagement: 144000, engagementRate: 8.0, conversions: 1680, roi: 445, campaigns: 4, totalSpent: 28000, initials: "JP", color: "from-violet-400 to-purple-500" },
  { id: 4, name: "David Kim", handle: "@davidkimfitness", platform: "youtube", followers: 1200000, totalReach: 3200000, totalEngagement: 224000, engagementRate: 7.0, conversions: 2800, roi: 510, campaigns: 2, totalSpent: 45000, initials: "DK", color: "from-emerald-400 to-teal-500" },
  { id: 5, name: "Emma Rodriguez", handle: "@emmalifestyle", platform: "instagram", followers: 280000, totalReach: 840000, totalEngagement: 67200, engagementRate: 8.0, conversions: 920, roi: 380, campaigns: 2, totalSpent: 16000, initials: "ER", color: "from-amber-400 to-orange-500" },
];

const ENGAGEMENT_METRICS = {
  likes: 624800,
  comments: 89200,
  shares: 67400,
  saves: 45600,
  clicks: 65000,
  byType: [
    { type: "Likes", count: 624800, percentage: 70 },
    { type: "Comments", count: 89200, percentage: 10 },
    { type: "Shares", count: 67400, percentage: 7.5 },
    { type: "Saves", count: 45600, percentage: 5.1 },
    { type: "Clicks", count: 65000, percentage: 7.3 },
  ],
};

const ROI_DATA = {
  totalInvestment: 284500,
  totalRevenue: 1095325,
  totalProfit: 810825,
  averageROI: 385,
  byCampaign: [
    { campaign: "Summer Collection", investment: 68400, revenue: 287280, roi: 420 },
    { campaign: "Fitness Product", investment: 98500, revenue: 379325, roi: 385 },
    { campaign: "Tech Review", investment: 42100, revenue: 103145, roi: 245 },
    { campaign: "Winter Sale", investment: 65000, revenue: 202800, roi: 312 },
  ],
  byMonth: [
    { month: "Jan", investment: 185000, revenue: 648000, roi: 350 },
    { month: "Feb", investment: 215000, revenue: 795500, roi: 370 },
    { month: "Mar", investment: 242000, revenue: 895800, roi: 370 },
    { month: "Apr", investment: 268000, revenue: 989200, roi: 369 },
    { month: "May", investment: 275000, revenue: 1045000, roi: 380 },
    { month: "Jun", investment: 284500, revenue: 1095325, roi: 385 },
  ],
};

const DEMOGRAPHICS = {
  ageGroups: [
    { range: "18-24", percentage: 28 },
    { range: "25-34", percentage: 42 },
    { range: "35-44", percentage: 18 },
    { range: "45-54", percentage: 8 },
    { range: "55+", percentage: 4 },
  ],
  topLocations: [
    { location: "United States", percentage: 45 },
    { location: "United Kingdom", percentage: 18 },
    { location: "Canada", percentage: 12 },
    { location: "Australia", percentage: 8 },
    { location: "Germany", percentage: 6 },
    { location: "Others", percentage: 11 },
  ],
};

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

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
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
  const [data, setData] = useState<AggregateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabKey>("overview");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    if (!user) return;
    setRefreshing(true);
    getAggregateAnalytics()
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
    { key: "influencers", label: "Influencers" },
    { key: "roi", label: "ROI" },
    { key: "engagement", label: "Engagement" },
  ];

  return (
    <div className="-mx-4 -mt-6 sm:-mx-8 sm:-mt-8">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-8 py-4 sm:py-5">
          {/* Top bar: controls */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 mb-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Title row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive performance insights and metrics</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide -mb-px">
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
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        {loading ? (
          <AnalyticsSkeleton />
        ) : !data ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No analytics data available yet.</p>
            <p className="text-xs text-gray-400 mt-1">Run a campaign to start seeing metrics here.</p>
          </div>
        ) : (
          <>
            {/* ════════════════════ OVERVIEW TAB ════════════════════ */}
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Key Metrics (from real API data) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                        {data.responseRate}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Creators Contacted</div>
                    <div className="text-3xl font-bold text-gray-900">{data.totalCreatorsContacted}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                        {data.conversionRate}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Deals Agreed</div>
                    <div className="text-3xl font-bold text-gray-900">{data.totalAgreed}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      {data.totalCampaigns > 0 && (
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          {Math.round((Object.entries(data.byStatus).find(([k]) => k === "running")?.[1] || 0) / data.totalCampaigns * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Campaigns</div>
                    <div className="text-3xl font-bold text-gray-900">{data.totalCampaigns}</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-orange-600" />
                      </div>
                      {data.emailStats.openRate > 0 && (
                        <div className={`flex items-center gap-1 text-sm font-semibold ${data.emailStats.openRate >= 20 ? "text-green-600" : "text-red-600"}`}>
                          {data.emailStats.openRate >= 20 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {data.emailStats.openRate}%
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Email Open Rate</div>
                    <div className="text-3xl font-bold text-gray-900">{data.emailStats.openRate}%</div>
                  </div>
                </div>

                {/* Secondary Metrics (from real API data) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Emails Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{data.emailStats.totalSent}</div>
                    <div className="text-xs text-gray-500 mt-1">Delivery rate: {data.emailStats.deliveryRate}%</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <MousePointerClick className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Click Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{data.emailStats.clickRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Of emails sent</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Declined</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{data.totalDeclined}</div>
                    <div className="text-xs text-gray-500 mt-1">Creators declined</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Response Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{data.responseRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Of creators contacted</div>
                  </div>
                </div>

                {/* Campaign Status Breakdown */}
                {Object.keys(data.byStatus).length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Campaign Status</h2>
                    <div className="space-y-4">
                      {Object.entries(data.byStatus).map(([status, count]) => {
                        const pct = data.totalCampaigns > 0 ? Math.round((count / data.totalCampaigns) * 100) : 0;
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

                {/* Performance Trends (static demo) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Performance Trends</h2>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-[#2F4538] text-white rounded-lg text-xs font-medium">Reach</span>
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Engagement</span>
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hidden sm:inline-block">Conversions</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {PERFORMANCE_DATA.map((d, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 w-12">{d.date}</span>
                          <div className="flex items-center gap-4 sm:gap-6 text-gray-600 text-xs sm:text-sm">
                            <span>{formatNumber(d.reach)} reach</span>
                            <span className="hidden sm:inline">{formatNumber(d.engagement)} engagement</span>
                            <span>${formatNumber(d.spend)} spent</span>
                          </div>
                        </div>
                        <div className="h-10 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex items-end">
                          <div
                            className="bg-gradient-to-t from-[#2F4538] to-[#D16B42] w-full transition-all"
                            style={{ height: `${(d.reach / 12400000) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Breakdown (static demo) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Performance</h2>
                  <div className="space-y-6">
                    {PLATFORM_BREAKDOWN.map((p, i) => {
                      const Icon = getPlatformIcon(p.platform);
                      return (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <span className="font-semibold text-gray-900">{p.platform}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{p.roi}% ROI</div>
                              <div className="text-xs text-gray-500">{p.campaigns} campaigns</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Reach</div>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{formatNumber(p.reach)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Engagement</div>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{formatNumber(p.engagement)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Eng. Rate</div>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{p.engagementRate}%</div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="text-xs text-gray-500 mb-1">Spend</div>
                              <div className="font-semibold text-gray-900">${formatNumber(p.spend)}</div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="text-xs text-gray-500 mb-1">Conversions</div>
                              <div className="font-semibold text-gray-900">{formatNumber(p.conversions)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ CAMPAIGNS TAB ═══════════════════ */}
            {selectedTab === "campaigns" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Campaign Performance</h2>
                    <p className="text-sm text-gray-600 mt-1">Detailed metrics for all campaigns</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Report</span>
                  </button>
                </div>

                {data.perCampaign.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                    <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No campaigns yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {data.perCampaign.map((campaign) => {
                      const responseRate = campaign.creators > 0
                        ? Math.round((campaign.responded / campaign.creators) * 100)
                        : 0;
                      const agreedRate = campaign.creators > 0
                        ? Math.round((campaign.agreed / campaign.creators) * 100)
                        : 0;
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

                          {/* Progress bar (responded / total) */}
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ INFLUENCERS TAB ═════════════════ */}
            {selectedTab === "influencers" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Influencer Performance</h2>
                    <p className="text-sm text-gray-600 mt-1">Top performing influencers and their metrics</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Report</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Influencer</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Platform</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Reach</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Engagement</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Eng. Rate</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Conversions</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">ROI</th>
                          <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Total Spend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {TOP_INFLUENCERS.map((inf) => {
                          const Icon = getPlatformIcon(inf.platform);
                          return (
                            <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${inf.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                    {inf.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{inf.name}</div>
                                    <div className="text-sm text-gray-500 truncate">{inf.handle}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{formatNumber(inf.followers)}</span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">{formatNumber(inf.totalReach)}</td>
                              <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900 hidden md:table-cell">{formatNumber(inf.totalEngagement)}</td>
                              <td className="px-4 sm:px-6 py-4 text-right hidden lg:table-cell">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  {inf.engagementRate}%
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900 hidden lg:table-cell">{formatNumber(inf.conversions)}</td>
                              <td className="px-4 sm:px-6 py-4 text-right">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                  {inf.roi}%
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900 hidden md:table-cell">${formatNumber(inf.totalSpent)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ ROI TAB ═════════════════════════ */}
            {selectedTab === "roi" && (
              <div className="space-y-6">
                {/* ROI Overview cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">${formatNumber(ROI_DATA.totalInvestment)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">${formatNumber(ROI_DATA.totalRevenue)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Profit</div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">${formatNumber(ROI_DATA.totalProfit)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="text-sm text-gray-600 mb-1">Average ROI</div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">{ROI_DATA.averageROI}%</div>
                  </div>
                </div>

                {/* ROI by Campaign */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">ROI by Campaign</h2>
                  <div className="space-y-4">
                    {ROI_DATA.byCampaign.map((c, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900">{c.campaign}</span>
                          <span className="text-2xl font-bold text-purple-600">{c.roi}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Investment</div>
                            <div className="font-semibold text-gray-900">${formatNumber(c.investment)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Revenue</div>
                            <div className="font-semibold text-green-600">${formatNumber(c.revenue)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Profit</div>
                            <div className="font-semibold text-blue-600">${formatNumber(c.revenue - c.investment)}</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-2 rounded-full transition-all"
                            style={{ width: `${(c.roi / 420) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROI Trend Over Time */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">ROI Trend Over Time</h2>
                  <div className="space-y-4">
                    {ROI_DATA.byMonth.map((d, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 w-12">{d.month}</span>
                          <div className="flex items-center gap-4 sm:gap-6 text-gray-600 text-xs sm:text-sm">
                            <span>${formatNumber(d.investment)} invested</span>
                            <span>${formatNumber(d.revenue)} revenue</span>
                            <span className="font-semibold text-purple-600">{d.roi}% ROI</span>
                          </div>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                            style={{ width: `${(d.roi / 385) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ ENGAGEMENT TAB ══════════════════ */}
            {selectedTab === "engagement" && (
              <div className="space-y-6">
                {/* Engagement Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-gray-600">Likes</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(ENGAGEMENT_METRICS.likes)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-600">Comments</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(ENGAGEMENT_METRICS.comments)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Share2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-600">Shares</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(ENGAGEMENT_METRICS.shares)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-gray-600">Saves</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(ENGAGEMENT_METRICS.saves)}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MousePointerClick className="w-5 h-5 text-purple-500" />
                      <span className="text-sm text-gray-600">Clicks</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(ENGAGEMENT_METRICS.clicks)}</div>
                  </div>
                </div>

                {/* Engagement Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Breakdown</h2>
                  <div className="space-y-4">
                    {ENGAGEMENT_METRICS.byType.map((t, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{t.type}</span>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{formatNumber(t.count)}</span>
                            <span className="text-xs text-gray-500 ml-2">{t.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-[#2F4538] to-[#D16B42] h-3 rounded-full transition-all"
                            style={{ width: `${t.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Audience Age Distribution</h2>
                    <div className="space-y-4">
                      {DEMOGRAPHICS.ageGroups.map((g, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{g.range}</span>
                            <span className="font-semibold text-gray-900">{g.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${g.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Top Locations</h2>
                    <div className="space-y-4">
                      {DEMOGRAPHICS.topLocations.map((l, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{l.location}</span>
                            </div>
                            <span className="font-semibold text-gray-900">{l.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${l.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
