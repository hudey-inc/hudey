"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCampaign } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";

const PLATFORM_OPTIONS = ["Instagram", "TikTok", "YouTube", "Twitter/X"];

export default function NewCampaign() {
  const { checking } = useRequireAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [budgetGbp, setBudgetGbp] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!brandName.trim()) errors.brandName = "Required";
    if (!objective.trim()) errors.objective = "Required";
    if (!targetAudience.trim()) errors.targetAudience = "Required";
    if (!keyMessage.trim()) errors.keyMessage = "Required";
    if (platforms.length === 0) errors.platforms = "Select at least one platform";
    if (!minFollowers || Number(minFollowers) < 0) errors.minFollowers = "Enter a valid number";
    if (!maxFollowers || Number(maxFollowers) < 0) errors.maxFollowers = "Enter a valid number";
    if (minFollowers && maxFollowers && Number(minFollowers) > Number(maxFollowers)) {
      errors.maxFollowers = "Must be greater than min";
    }
    if (!budgetGbp || Number(budgetGbp) < 0) errors.budgetGbp = "Enter a valid budget";
    if (!deliverables.trim()) errors.deliverables = "Required";
    if (!timeline.trim()) errors.timeline = "Required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const brief = {
        brand_name: brandName.trim(),
        objective: objective.trim(),
        target_audience: targetAudience.trim(),
        platforms: platforms.map((p) => p.toLowerCase()),
        follower_range: [Number(minFollowers), Number(maxFollowers)],
        budget_gbp: Number(budgetGbp),
        deliverables: deliverables
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
        key_message: keyMessage.trim(),
        timeline: timeline.trim(),
        ...(industry.trim() && { industry: industry.trim() }),
        ...(brandVoice.trim() && { brand_voice: brandVoice.trim() }),
      };

      const { id } = await createCampaign({ name: brandName.trim(), brief });
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const errorClass = "text-xs text-red-600 mt-1";

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← Campaigns
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-6">
        Create Campaign
      </h1>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 mb-6">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Brand Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Co"
                className={inputClass}
              />
              {fieldErrors.brandName && <p className={errorClass}>{fieldErrors.brandName}</p>}
            </div>
            <div>
              <label className={labelClass}>Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fashion, Tech, Food"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Campaign Brief */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Brief</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Objective *</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What do you want this campaign to achieve?"
                rows={2}
                className={inputClass}
              />
              {fieldErrors.objective && <p className={errorClass}>{fieldErrors.objective}</p>}
            </div>
            <div>
              <label className={labelClass}>Target Audience *</label>
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Describe your ideal audience (demographics, interests, etc.)"
                rows={2}
                className={inputClass}
              />
              {fieldErrors.targetAudience && <p className={errorClass}>{fieldErrors.targetAudience}</p>}
            </div>
            <div>
              <label className={labelClass}>Key Message *</label>
              <textarea
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                placeholder="The core message creators should communicate"
                rows={2}
                className={inputClass}
              />
              {fieldErrors.keyMessage && <p className={errorClass}>{fieldErrors.keyMessage}</p>}
            </div>
            <div>
              <label className={labelClass}>Brand Voice</label>
              <textarea
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                placeholder="Tone and style guidelines (optional)"
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Creator Requirements */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Creator Requirements</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Platforms *</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      platforms.includes(p)
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-500 hover:bg-indigo-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {fieldErrors.platforms && <p className={errorClass}>{fieldErrors.platforms}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Min Followers *</label>
                <input
                  type="number"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                  placeholder="e.g. 10000"
                  min={0}
                  className={inputClass}
                />
                {fieldErrors.minFollowers && <p className={errorClass}>{fieldErrors.minFollowers}</p>}
              </div>
              <div>
                <label className={labelClass}>Max Followers *</label>
                <input
                  type="number"
                  value={maxFollowers}
                  onChange={(e) => setMaxFollowers(e.target.value)}
                  placeholder="e.g. 500000"
                  min={0}
                  className={inputClass}
                />
                {fieldErrors.maxFollowers && <p className={errorClass}>{fieldErrors.maxFollowers}</p>}
              </div>
            </div>
            <div className="sm:w-1/2">
              <label className={labelClass}>Budget (GBP) *</label>
              <input
                type="number"
                value={budgetGbp}
                onChange={(e) => setBudgetGbp(e.target.value)}
                placeholder="e.g. 5000"
                min={0}
                className={inputClass}
              />
              {fieldErrors.budgetGbp && <p className={errorClass}>{fieldErrors.budgetGbp}</p>}
            </div>
          </div>
        </div>

        {/* Deliverables & Timeline */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Deliverables & Timeline</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Deliverables *</label>
              <textarea
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder={"One deliverable per line, e.g.:\n1x Instagram Reel\n2x Instagram Stories\n1x TikTok video"}
                rows={4}
                className={inputClass}
              />
              {fieldErrors.deliverables && <p className={errorClass}>{fieldErrors.deliverables}</p>}
            </div>
            <div>
              <label className={labelClass}>Timeline *</label>
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 4 weeks, starting March 2025"
                className={inputClass}
              />
              {fieldErrors.timeline && <p className={errorClass}>{fieldErrors.timeline}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}
