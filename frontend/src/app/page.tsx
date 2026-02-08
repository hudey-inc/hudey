"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CampaignSummary } from "@/lib/api";
import { listCampaigns } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  running: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  awaiting_approval: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  failed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const isAnimated = status === "running" || status === "awaiting_approval";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${isAnimated ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-stone-500">Loading campaigns…</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Could not reach API</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-2">
          Ensure the backend is running and{" "}
          <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code>{" "}
          points to it (e.g. your Railway URL).
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">
          Campaigns
        </h1>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800 transition-colors"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-500">
          <p>No campaigns yet.</p>
          <p className="text-sm mt-2">
            Create campaigns via the API or CLI. Campaigns from{" "}
            <code className="bg-stone-100 px-1 rounded">run_campaign</code> will
            appear here when Supabase is configured.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/campaigns/${c.short_id || c.id}`}
                className="block px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 mr-4">
                    <span className="font-medium text-stone-900">{c.name}</span>
                    <span className="ml-2 text-xs text-stone-400">
                      {c.short_id || c.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-stone-400">{formatDate(c.created_at)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
