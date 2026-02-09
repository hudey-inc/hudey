"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CampaignSummary } from "@/lib/api";
import { listCampaigns } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Target,
  TrendingUp,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Plus,
} from "lucide-react";

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

  return (
    <Link
      href={`/campaigns/${campaign.short_id || campaign.id}`}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all group relative"
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
        <h1 className="text-3xl font-semibold text-gray-900">
          {getGreeting()}
        </h1>
      </div>

      {/* Recent campaigns (card row) */}
      {campaigns.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your Recents</h2>
            <Link
              href="/campaigns/new"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {filter
              ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Campaigns`
              : "All Campaigns"}
          </h2>
          <Link
            href="/campaigns/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
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
          <div className="bg-white rounded-xl border border-gray-200 p-4">
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
