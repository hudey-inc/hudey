"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CampaignSummary } from "@/lib/api";
import { listCampaigns } from "@/lib/api";
import { StatusBadge } from "@/components/campaign";
import { useRequireAuth } from "@/lib/useRequireAuth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const { user, checking } = useRequireAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listCampaigns()
      .then(setCampaigns)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user]);

  if (checking || (!user && loading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
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
          <code className="bg-amber-100 px-1 rounded text-[12px]">NEXT_PUBLIC_API_URL</code>{" "}
          points to it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-stone-900">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-stone-100 bg-white p-10 text-center">
          <p className="text-stone-500 text-sm">No campaigns yet.</p>
          <p className="text-[13px] text-stone-400 mt-1">
            Click <span className="font-medium text-stone-600">New Campaign</span> to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-100 bg-white divide-y divide-stone-50">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.short_id || c.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="min-w-0 mr-4">
                <p className="font-medium text-stone-900 text-sm truncate">{c.name}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{c.short_id || c.id.slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-stone-400 hidden sm:block">{formatDate(c.created_at)}</span>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
