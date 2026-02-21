"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createCampaign, listTemplates, getTemplate, createCampaignFromTemplate, listContracts } from "@/lib/api";
import type { CampaignTemplate, ContractTemplate } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { INDUSTRY_OPTIONS } from "@/lib/constants";
import {
  ArrowLeft,
  Bookmark,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  Target,
  Building2,
  Megaphone,
  Users,
  ClipboardList,
  AlertCircle,
  Clock,
  Check,
} from "lucide-react";

const PLATFORM_OPTIONS = ["Instagram", "TikTok", "YouTube", "Twitter/X"];

// ── Draft autosave helpers ────────────────────────────────────

const DRAFT_KEY = "hudey-campaign-draft";
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface DraftData {
  brandName: string;
  industry: string;
  brandValues: string;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  brandVoice: string;
  platforms: string[];
  minFollowers: string;
  maxFollowers: string;
  budgetGbp: string;
  deliverables: string;
  timeline: string;
  selectedContractId: string;
  _ts: number;
}

function saveDraft(data: Omit<DraftData, "_ts">) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, _ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function loadDraft(): DraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    if (data._ts && Date.now() - data._ts > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Skeleton ──────────────────────────────────────────────────

function NewCampaignSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto animate-pulse">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg" />
            <div>
              <div className="h-6 bg-gray-100 rounded w-44 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-56" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-100 rounded-lg w-20" />
            <div className="h-9 bg-gray-100 rounded-lg w-32" />
          </div>
        </div>
        {/* Template area */}
        <div className="h-36 bg-gray-100 rounded-xl mb-6" />
        {/* Card skeletons */}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
            <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

function NewCampaignInner() {
  const { checking } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Template picker state
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [appliedTemplate, setAppliedTemplate] = useState<CampaignTemplate | null>(null);

  // Contract state
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [selectedContractId, setSelectedContractId] = useState("");

  // Form state
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [brandValues, setBrandValues] = useState("");
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

  // Draft autosave state
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const draftReady = useRef(false); // prevents autosave before user decides on draft

  // Check for saved draft on mount
  useEffect(() => {
    if (templateIdParam) {
      // Template param takes priority — skip draft restore
      draftReady.current = true;
      return;
    }
    const saved = loadDraft();
    if (saved && (saved.brandName || saved.objective || saved.targetAudience || saved.keyMessage)) {
      setDraftData(saved);
    } else {
      draftReady.current = true;
    }
  }, [templateIdParam]);

  const restoreDraft = useCallback((d: DraftData) => {
    setBrandName(d.brandName || "");
    setIndustry(d.industry || "");
    setBrandValues(d.brandValues || "");
    setObjective(d.objective || "");
    setTargetAudience(d.targetAudience || "");
    setKeyMessage(d.keyMessage || "");
    setBrandVoice(d.brandVoice || "");
    setPlatforms(d.platforms || []);
    setMinFollowers(d.minFollowers || "");
    setMaxFollowers(d.maxFollowers || "");
    setBudgetGbp(d.budgetGbp || "");
    setDeliverables(d.deliverables || "");
    setTimeline(d.timeline || "");
    setSelectedContractId(d.selectedContractId || "");
    setDraftData(null);
    draftReady.current = true;
  }, []);

  function discardDraft() {
    clearDraft();
    setDraftData(null);
    draftReady.current = true;
  }

  // Debounced autosave — 1s after any field change
  useEffect(() => {
    if (!draftReady.current) return;
    const hasContent = brandName || objective || targetAudience || keyMessage || deliverables;
    if (!hasContent) return;

    const timer = setTimeout(() => {
      saveDraft({
        brandName, industry, brandValues, objective, targetAudience,
        keyMessage, brandVoice, platforms, minFollowers, maxFollowers,
        budgetGbp, deliverables, timeline, selectedContractId,
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [brandName, industry, brandValues, objective, targetAudience, keyMessage, brandVoice, platforms, minFollowers, maxFollowers, budgetGbp, deliverables, timeline, selectedContractId]);

  // Load templates and contracts on mount
  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
    listContracts().then(setContractTemplates).catch(() => {});
  }, []);

  // If ?template=id is in URL, auto-apply that template
  useEffect(() => {
    if (templateIdParam && !appliedTemplate) {
      getTemplate(templateIdParam).then((t) => {
        if (t) applyTemplate(t);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdParam]);

  function applyTemplate(t: CampaignTemplate) {
    setAppliedTemplate(t);
    clearDraft();
    setDraftData(null);
    draftReady.current = true;
    const b = t.brief || {};
    setBrandName((b.brand_name as string) || "");
    setIndustry((b.industry as string) || "");
    setBrandValues((b.brand_values as string) || "");
    setObjective((b.objective as string) || "");
    setTargetAudience((b.target_audience as string) || "");
    setKeyMessage((b.key_message as string) || "");
    setBrandVoice((b.brand_voice as string) || "");
    // Platforms
    const plats = (b.platforms as string[]) || [];
    setPlatforms(
      plats.map((p) => {
        const lower = p.toLowerCase();
        return PLATFORM_OPTIONS.find((o) => o.toLowerCase() === lower || o.toLowerCase().replace("/", "") === lower) || p;
      })
    );
    // Follower range
    const range = (b.follower_range as number[]) || [];
    if (range[0] !== undefined) setMinFollowers(String(range[0]));
    if (range[1] !== undefined) setMaxFollowers(String(range[1]));
    // Budget
    if (b.budget_gbp !== undefined) setBudgetGbp(String(b.budget_gbp));
    // Deliverables
    const dels = (b.deliverables as string[]) || [];
    if (Array.isArray(dels)) setDeliverables(dels.join("\n"));
    // Timeline
    if (b.timeline) setTimeline(b.timeline as string);
    setFieldErrors({});
  }

  function clearTemplate() {
    setAppliedTemplate(null);
    setBrandName("");
    setIndustry("");
    setBrandValues("");
    setObjective("");
    setTargetAudience("");
    setKeyMessage("");
    setBrandVoice("");
    setPlatforms([]);
    setMinFollowers("");
    setMaxFollowers("");
    setBudgetGbp("");
    setDeliverables("");
    setTimeline("");
  }

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
        ...(brandValues.trim() && { brand_values: brandValues.trim() }),
        ...(brandVoice.trim() && { brand_voice: brandVoice.trim() }),
      };

      const { id } = await createCampaign({
        name: brandName.trim(),
        brief,
        ...(selectedContractId && { contract_template_id: selectedContractId }),
      });
      clearDraft();
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickCreate(template: CampaignTemplate) {
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await createCampaignFromTemplate(template.id, {
        name: template.name,
      });
      clearDraft();
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create from template");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538]/20 focus:border-[#2F4538] transition-colors";
  const labelClass = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5";
  const errorClass = "text-xs text-red-600 mt-1";

  if (checking) {
    return <NewCampaignSkeleton />;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2F4538]/10 flex items-center justify-center">
                <Target className="w-4.5 h-4.5 text-[#2F4538]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create Campaign
                </h1>
                <p className="text-xs text-gray-400">
                  Set up your brief and let AI handle the rest
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Autosave indicator */}
            <span
              className={`hidden sm:flex items-center gap-1 text-xs text-gray-400 transition-opacity duration-500 ${draftSaved ? "opacity-100" : "opacity-0"}`}
            >
              <Check className="w-3 h-3" aria-hidden="true" />
              Draft saved
            </span>
            <Link
              href="/campaigns"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="campaign-form"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#2F4538] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#243a2d] transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating\u2026" : "Create Campaign"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ── Draft Restore Banner ── */}
        {draftData && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-amber-800 flex-1">
              You have an unsaved draft from <span className="font-medium">{timeAgo(draftData._ts)}</span>
            </span>
            <button
              onClick={discardDraft}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => restoreDraft(draftData)}
              className="text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Restore draft
            </button>
          </div>
        )}

        {/* ── Template Quick-Start ── */}
        {!appliedTemplate && templates.length > 0 && (
          <div className="mb-6 rounded-xl border border-[#2F4538]/20 bg-gradient-to-r from-[#2F4538]/5 to-transparent p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#D16B42]" />
              <h2 className="text-sm font-semibold text-gray-900">Quick Start from Template</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-[#2F4538]/40 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bookmark className="w-4 h-4 text-[#2F4538] flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                    </div>
                    {t.usage_count > 0 && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{t.usage_count}x used</span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyTemplate(t)}
                      className="flex-1 text-xs text-[#2F4538] font-medium hover:underline"
                    >
                      Customise
                    </button>
                    <button
                      onClick={() => handleQuickCreate(t)}
                      disabled={submitting}
                      className="flex items-center gap-1 text-xs font-medium text-white bg-[#2F4538] px-3 py-1 rounded-md hover:bg-[#2F4538]/90 transition-colors disabled:opacity-50"
                    >
                      Quick Create <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!loadingTemplates && templates.length === 0 && (
              <p className="text-xs text-gray-400">No templates saved yet. Complete a campaign and save it as a template.</p>
            )}
          </div>
        )}

        {/* Applied template banner */}
        {appliedTemplate && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#2F4538]/30 bg-[#2F4538]/5 px-4 py-3">
            <Bookmark className="w-4 h-4 text-[#2F4538] flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1">
              Using template: <span className="font-medium text-gray-900">{appliedTemplate.name}</span>
            </span>
            <button
              onClick={clearTemplate}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Clear template"
            >
              <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        )}

        <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-900">Brand Details</h2>
            </div>
            <div className="p-5 sm:p-6">
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
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className={labelClass}>Brand Values</label>
                <textarea
                  value={brandValues}
                  onChange={(e) => setBrandValues(e.target.value)}
                  placeholder="e.g. Sustainability, ethical sourcing, cruelty-free, carbon-neutral"
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Campaign Brief */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-900">Campaign Brief</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-900">Creator Requirements</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className={labelClass}>Platforms *</label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Select platforms">
                  {PLATFORM_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      aria-pressed={platforms.includes(p)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        platforms.includes(p)
                          ? "border-[#2F4538] bg-[#2F4538] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#2F4538]/50 hover:bg-[#2F4538]/5"
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-900">Deliverables & Timeline</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
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

          {/* Contract */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-900">Contract</h2>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-500 mb-4">
                Attach a clickwrap contract that creators must accept when terms are agreed
              </p>
              {contractTemplates.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">No contract required</option>
                    {contractTemplates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (v{c.version}, {c.clauses.length} clauses)
                      </option>
                    ))}
                  </select>
                  {selectedContractId && (
                    <Link
                      href={`/contracts/${selectedContractId}`}
                      className="text-xs text-[#2F4538] hover:underline"
                    >
                      View contract
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/contracts/new"
                  className="text-sm text-[#2F4538] hover:underline"
                >
                  Create your first contract template
                </Link>
              )}
            </div>
          </div>

          {/* Actions (mobile) */}
          <div className="flex items-center justify-end gap-3 sm:hidden">
            <Link
              href="/campaigns"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2F4538] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#243a2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating\u2026" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCampaign() {
  return (
    <Suspense fallback={<NewCampaignSkeleton />}>
      <NewCampaignInner />
    </Suspense>
  );
}
