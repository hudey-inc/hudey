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
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">
        Campaigns
      </h1>

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
                  <div>
                    <span className="font-medium text-stone-900">{c.name}</span>
                    <span className="ml-2 text-xs text-stone-400">
                      {c.short_id || c.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-sm text-stone-500">
                    {formatDate(c.created_at)} · {c.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
