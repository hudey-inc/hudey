"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Campaign } from "@/lib/api";
import { getCampaign } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CampaignDetail() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCampaign(id)
      .then(setCampaign)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-stone-500">Loading campaign…</div>;
  }

  if (error || !campaign) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="font-medium">Campaign not found</p>
        <p className="text-sm mt-1">{error || "Could not load campaign."}</p>
        <Link href="/" className="text-sm mt-2 inline-block hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  const result = campaign.result_json;
  const brief = campaign.brief || result?.brief;
  const strategy = campaign.strategy || result?.strategy;

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-stone-500 hover:text-stone-900 mb-4 inline-block"
      >
        ← Campaigns
      </Link>

      <div className="rounded-lg border border-stone-200 bg-white p-6 mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">{campaign.name}</h1>
        <div className="mt-2 flex gap-4 text-sm text-stone-500">
          <span>Status: {campaign.status}</span>
          <span>Created: {formatDate(campaign.created_at)}</span>
          {campaign.completed_at && (
            <span>Completed: {formatDate(campaign.completed_at)}</span>
          )}
        </div>
      </div>

      {brief ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">Brief</h2>
          <pre className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm overflow-x-auto">
            {JSON.stringify(brief, null, 2)}
          </pre>
        </section>
      ) : null}

      {strategy ? (
        <section className="mb-6">
          <h2 className="text-lg font-medium text-stone-800 mb-2">Strategy</h2>
          <pre className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm overflow-x-auto">
            {JSON.stringify(strategy, null, 2)}
          </pre>
        </section>
      ) : null}

      {result ? (
        <section>
          <h2 className="text-lg font-medium text-stone-800 mb-2">
            Result summary
          </h2>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm space-y-2">
            {"creators_count" in result && result.creators_count != null ? (
              <p>Creators: {String(result.creators_count)}</p>
            ) : null}
            {"outreach_sent" in result && result.outreach_sent && typeof result.outreach_sent === "object" ? (
              <p>
                Outreach: {String((result.outreach_sent as { sent_count?: number }).sent_count ?? 0)} sent,{" "}
                {String((result.outreach_sent as { skipped_count?: number }).skipped_count ?? 0)} skipped
              </p>
            ) : null}
            {"payment_summaries" in result && Array.isArray(result.payment_summaries) && result.payment_summaries.length > 0 ? (
              <p>Payments: {result.payment_summaries.length} recorded</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
