"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CampaignSummary } from "@/lib/api";
import { listCampaigns, getAggregateAnalytics } from "@/lib/api";
import type { AggregateAnalytics } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { SkeletonStatGrid, SkeletonListCard } from "@/components/skeleton";
import {
  Target,
  Search,
  LayoutGrid,
  List,
  Plus,
  ArrowRight,
  Users,
  Clock,
  ChevronRight,
  Bot,
  MessageSquare,
  Sparkles,
  Play,
  Send,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type FilterStatus = "all" | "active" | "completed" | "draft" | "failed";
type ViewMode = "grid" | "list";

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProgressPercent(status: string): number {
  switch (status) {
    case "running":
      return 50;
    case "awaiting_approval":
      return 65;
    case "completed":
      return 100;
    default:
      return 0;
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

const CARD_COLORS = [
  "#2F4538",
  "#D16B42",
  "#8B5CF6",
  "#10B981",
  "#EC4899",
  "#6366F1",
  "#F59E0B",
  "#06B6D4",
];

function getAIStatusLabel(status: string) {
  switch (status) {
    case "running":
      return "AI Outreach Active";
    case "awaiting_approval":
      return "Awaiting Approval";
    case "completed":
      return "Completed";
    case "draft":
      return "Draft";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function getAIIcon(status: string) {
  switch (status) {
    case "running":
      return Bot;
    case "awaiting_approval":
      return MessageSquare;
    case "completed":
      return Target;
    case "draft":
      return Sparkles;
    default:
      return Target;
  }
}

// ── Loading Skeleton ─────────────────────────────────────────

function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonStatGrid count={4} />
      <SkeletonListCard rows={4} />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function CampaignsPage() {
  return (
    <Suspense>
      <CampaignsContent />
    </Suspense>
  );
}

function CampaignsContent() {
  const { user, checking } = useRequireAuth();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterStatus) || "all";
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [analytics, setAnalytics] = useState<AggregateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    if (!user || fetched.current) return;
    fetched.current = true;
    Promise.all([listCampaigns(), getAggregateAnalytics()])
      .then(([c, a]) => {
        setCampaigns(c);
        setAnalytics(a);
      })
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

  // Filter + search
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.short_id || c.id).toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case "active":
        return c.status === "running" || c.status === "awaiting_approval";
      case "completed":
        return c.status === "completed";
      case "draft":
        return c.status === "draft";
      case "failed":
        return c.status === "failed";
      default:
        return true;
    }
  });

  // Stats
  const activeCount = campaigns.filter(
    (c) => c.status === "running" || c.status === "awaiting_approval"
  ).length;
  const completedCount = campaigns.filter(
    (c) => c.status === "completed"
  ).length;
  const draftCount = campaigns.filter((c) => c.status === "draft").length;

  // Per-campaign analytics lookup
  const perCampaignMap = new Map(
    (analytics?.perCampaign || []).map((pc) => [pc.id, pc])
  );

  const stats = [
    {
      label: "Total Campaigns",
      value: campaigns.length,
      change: `${activeCount} active`,
      icon: Target,
      iconBg: "bg-[#2F4538]",
    },
    {
      label: "Active Campaigns",
      value: activeCount,
      change: `${completedCount} completed`,
      icon: Play,
      iconBg: "bg-green-500",
    },
    {
      label: "Creators Contacted",
      value: analytics?.totalCreatorsContacted || 0,
      change: `${analytics?.totalAgreed || 0} agreed`,
      icon: Users,
      iconBg: "bg-[#D16B42]",
    },
    {
      label: "Emails Sent",
      value: analytics?.emailStats.totalSent || 0,
      change: `${analytics?.emailStats.openRate || 0}% open rate`,
      icon: Send,
      iconBg: "bg-[#2F4538]",
    },
  ];

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: "All Campaigns", value: "all", count: campaigns.length },
    { label: "Active", value: "active", count: activeCount },
    { label: "Completed", value: "completed", count: completedCount },
    { label: "Draft", value: "draft", count: draftCount },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Campaigns
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track all your influencer campaigns
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="px-3 py-2 sm:px-4 bg-[#2F4538] hover:bg-[#243a2d] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Campaign</span>
            </Link>
          </div>

          {/* Search + View toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-all bg-white"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="space-y-6 sm:space-y-8">
        {loading ? (
          <CampaignsSkeleton />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {stat.label}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.change}</div>
                  </div>
                );
              })}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    filterStatus === tab.value
                      ? "bg-[#2F4538] text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Campaigns List / Grid */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchQuery
                    ? "No campaigns match your search."
                    : "No campaigns yet."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? (
                    "Try a different search term."
                  ) : (
                    <>
                      Click{" "}
                      <span className="font-medium text-gray-600">
                        New Campaign
                      </span>{" "}
                      to get started.
                    </>
                  )}
                </p>
              </div>
            ) : viewMode === "list" ? (
              /* ── List View ──────────────────────────────────── */
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filteredCampaigns.map((campaign, index) => {
                  const pc = perCampaignMap.get(campaign.id);
                  const AIIcon = getAIIcon(campaign.status);
                  const progress = getProgressPercent(campaign.status);
                  const cardColor =
                    CARD_COLORS[index % CARD_COLORS.length];

                  return (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.short_id || campaign.id}`}
                      className={`w-full p-4 sm:p-6 hover:bg-gray-50 transition-colors text-left flex items-center gap-4 sm:gap-6 ${
                        index !== filteredCampaigns.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      {/* Campaign Icon */}
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: cardColor }}
                      >
                        {campaign.name.substring(0, 2).toUpperCase()}
                      </div>

                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {campaign.name}
                          </h3>
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {campaign.short_id || campaign.id.slice(0, 8)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              STATUS_BADGE[campaign.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUS_LABELS[campaign.status] || campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(campaign.created_at)}</span>
                          </div>
                          {pc && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>{pc.creators} creators</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Status (desktop) */}
                      <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg flex-shrink-0">
                        <AIIcon className="w-4 h-4 text-[#2F4538]" />
                        <span className="text-xs text-gray-700 font-medium">
                          {getAIStatusLabel(campaign.status)}
                        </span>
                      </div>

                      {/* Stats (desktop) */}
                      {pc && (
                        <div className="hidden lg:grid grid-cols-3 gap-4 sm:gap-6 flex-shrink-0">
                          <div>
                            <div className="text-xs text-gray-500">
                              Creators
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {pc.creators}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Responded
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {pc.responded}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              Agreed
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              {pc.agreed}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Progress */}
                      {progress > 0 && (
                        <div className="w-24 sm:w-32 flex-shrink-0 hidden sm:block">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: cardColor,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* ── Grid View ──────────────────────────────────── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCampaigns.map((campaign, index) => {
                  const pc = perCampaignMap.get(campaign.id);
                  const AIIcon = getAIIcon(campaign.status);
                  const progress = getProgressPercent(campaign.status);
                  const cardColor =
                    CARD_COLORS[index % CARD_COLORS.length];

                  return (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.short_id || campaign.id}`}
                      className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:border-gray-300 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: cardColor }}
                          >
                            {campaign.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-semibold ${
                              STATUS_BADGE[campaign.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUS_LABELS[campaign.status] || campaign.status}
                          </span>
                        </div>

                        {/* Campaign Name */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#2F4538] transition-colors">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {campaign.short_id || campaign.id.slice(0, 8)}
                          </p>
                        </div>

                        {/* AI Status */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <AIIcon className="w-4 h-4 text-[#2F4538]" />
                          <span className="text-xs text-gray-700 font-medium">
                            {getAIStatusLabel(campaign.status)}
                          </span>
                        </div>

                        {/* Stats Grid */}
                        {pc ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <div className="text-xs text-gray-500">
                                Creators
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {pc.creators}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Responded
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {pc.responded}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Agreed
                              </div>
                              <div className="text-sm font-semibold text-green-600">
                                {pc.agreed}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            No engagement data yet
                          </div>
                        )}

                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: cardColor,
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">
                              {formatDate(campaign.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#2F4538] font-medium">
                            <span className="text-xs">View Details</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
