"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Campaign, Approval, EmailDeliverySummary } from "@/lib/api";
import {
  getCampaign,
  listApprovals,
  decideApproval,
  runCampaign,
  deleteCampaign,
  getEngagements,
  getEmailEvents,
} from "@/lib/api";
import {
  ArrowLeft,
  Users,
  Heart,
  MessageCircle,
  Target,
  Calendar,
  MoreVertical,
  Play,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Trash2,
  Loader2,
  Mail,
} from "lucide-react";
import {
  StepProgress,
  CampaignReport,
  PendingApprovalCard,
  PastApprovalRow,
  EmailTracking,
  CreatorEngagements,
} from "@/components/campaign";
import { useRequireAuth } from "@/lib/useRequireAuth";

// ── Helpers ──────────────────────────────────────────────────

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATE_LABELS: Record<string, string> = {
  brief_received: "Starting\u2026",
  strategy_draft: "Generating strategy\u2026",
  awaiting_brief_approval: "Awaiting strategy approval",
  creator_discovery: "Discovering creators\u2026",
  awaiting_creator_approval: "Awaiting creator approval",
  outreach_draft: "Drafting outreach\u2026",
  awaiting_outreach_approval: "Awaiting outreach approval",
  outreach_in_prog: "Sending outreach\u2026",
  negotiation: "Negotiating with creators\u2026",
  awaiting_terms_approval: "Awaiting terms approval",
  payment_pending: "Processing payments\u2026",
  campaign_active: "Monitoring campaign\u2026",
  completed: "Completed",
};

type DetailTab = "overview" | "influencers" | "content" | "insights";

const DEFAULT_EMAIL_SUMMARY: EmailDeliverySummary = {
  total_sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, per_creator: [],
};

// ── Main Page ────────────────────────────────────────────────

export default function CampaignDetail() {
  const { user, checking } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<DetailTab>("overview");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [engagements, setEngagements] = useState<any[]>([]);
  const [emailSummary, setEmailSummary] = useState<EmailDeliverySummary>(DEFAULT_EMAIL_SUMMARY);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(() => {
    Promise.all([
      getCampaign(id),
      listApprovals(id).catch(() => [] as Approval[]),
      getEngagements(id).catch(() => []),
      getEmailEvents(id).catch(() => DEFAULT_EMAIL_SUMMARY),
    ]).then(([c, a, eng, ev]) => {
      if (c) setCampaign(c);
      setApprovals(a);
      setEngagements(eng);
      setEmailSummary(ev);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCampaign(id),
      listApprovals(id).catch(() => [] as Approval[]),
      getEngagements(id).catch(() => []),
      getEmailEvents(id).catch(() => DEFAULT_EMAIL_SUMMARY),
    ])
      .then(([c, a, eng, ev]) => {
        setCampaign(c);
        setApprovals(a);
        setEngagements(eng);
        setEmailSummary(ev);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    const isActive = campaign?.status === "running" || campaign?.status === "awaiting_approval";
    if (isActive && !pollingRef.current) {
      pollingRef.current = setInterval(fetchAll, 4000);
    } else if (!isActive && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [campaign?.status, fetchAll]);

  async function handleRun() {
    setStarting(true); setRunError(null);
    try { await runCampaign(id); fetchAll(); }
    catch (err) { setRunError(err instanceof Error ? err.message : "Failed to start"); }
    finally { setStarting(false); }
  }

  async function handleDecide(approvalId: string, status: "approved" | "rejected", feedback?: string) {
    try { await decideApproval(approvalId, status, feedback); fetchAll(); } catch { /* noop */ }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCampaign(id);
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  // ── Loading / Error states ──

  if (checking || (loading && !error)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 max-w-md w-full">
          <p className="font-medium text-sm text-amber-800">Campaign not found</p>
          <p className="text-[13px] mt-1 text-amber-700">{error || "Could not load campaign."}</p>
          <Link href="/" className="text-[13px] mt-3 inline-flex items-center gap-1 text-amber-700 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  // ── Data extraction ──

  const result = campaign.result_json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brief = (campaign.brief || result?.brief) as Record<string, any> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strategy = (campaign.strategy || result?.strategy) as Record<string, any> | undefined;
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const pastApprovals = approvals.filter((a) => a.status !== "pending");
  const isRunning = campaign.status === "running" || campaign.status === "awaiting_approval";
  const isCompleted = campaign.status === "completed";
  const isFailed = campaign.status === "failed";
  const isDraft = campaign.status === "draft";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportObj = (result?.report || {}) as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics = (result?.metrics || reportObj.metrics || {}) as Record<string, any>;
  const budgetGBP = brief?.budget_gbp ? Number(brief.budget_gbp) : 0;

  // Compute dynamic stats from engagements + email summary
  const totalCreators = engagements.length;
  const respondedCount = engagements.filter((e: { status: string }) => e.status !== "contacted").length;
  const agreedCount = engagements.filter((e: { status: string }) => e.status === "agreed").length;
  const emailsSent = emailSummary.total_sent;
  const emailsDelivered = emailSummary.delivered;
  const deliveryRate = emailsSent > 0 ? Math.round((emailsDelivered / emailsSent) * 100) : 0;
  const responseRate = totalCreators > 0 ? Math.round((respondedCount / totalCreators) * 100) : 0;

  // Campaign status helpers
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-700";
      case "awaiting_approval": return "bg-purple-100 text-purple-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-amber-100 text-amber-700";
    }
  };

  // Engagement performance helper
  const getPerformanceColor = (status: string) => {
    switch (status) {
      case "agreed": return "text-green-600";
      case "negotiating": return "text-blue-600";
      case "responded": return "text-purple-600";
      case "declined": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const overviewMetrics = [
    {
      label: "Creators Contacted",
      value: totalCreators.toString(),
      change: totalCreators > 0 ? `${totalCreators} total` : "None yet",
      trend: "up" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Response Rate",
      value: responseRate > 0 ? `${responseRate}%` : "\u2014",
      change: respondedCount > 0 ? `${respondedCount} responded` : "No responses",
      trend: "up" as const,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      label: "Emails Delivered",
      value: emailsDelivered.toString(),
      change: deliveryRate > 0 ? `${deliveryRate}% delivery` : "No sends",
      trend: "up" as const,
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Deals Agreed",
      value: agreedCount.toString(),
      change: agreedCount > 0 ? `${Math.round((agreedCount / Math.max(totalCreators, 1)) * 100)}% conversion` : "None yet",
      trend: "up" as const,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  // Add report metrics if available
  if (metrics.likes > 0) {
    overviewMetrics.push({
      label: "Total Likes",
      value: Number(metrics.likes).toLocaleString(),
      change: "+organic",
      trend: "up" as const,
      icon: Heart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    });
  }
  if (metrics.comments > 0) {
    overviewMetrics.push({
      label: "Comments",
      value: Number(metrics.comments).toLocaleString(),
      change: "engagement",
      trend: "up" as const,
      icon: MessageCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    });
  }

  // ── Determine available tabs ──
  const tabs: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
  ];
  if (totalCreators > 0) {
    tabs.push({ key: "influencers", label: "Influencers" });
  }
  if (result) {
    tabs.push({ key: "insights", label: "Insights" });
  }

  return (
    <div className="-mx-4 -mt-6 sm:-mx-8 sm:-mt-8">
      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Row — Back + Actions */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {(isDraft || isFailed) && (
                <button
                  onClick={handleRun}
                  disabled={starting}
                  className="px-3 sm:px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">{starting ? "Starting\u2026" : isFailed ? "Retry" : "Run Campaign"}</span>
                </button>
              )}
              {isRunning && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Running</span>
                </div>
              )}
              {!isRunning && (
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {showMoreMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Campaign
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Title + Meta */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  {campaign.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(campaign.status)}`}>
                  {campaign.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatShortDate(campaign.created_at)}</span>
                </div>
                {campaign.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Completed {formatShortDate(campaign.completed_at)}</span>
                  </div>
                )}
                {brief?.objective && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>{String(brief.objective)}</span>
                  </div>
                )}
              </div>

              {/* Running state label */}
              {isRunning && campaign.agent_state && (
                <div className="mt-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#2F4538] animate-spin" />
                  <span className="text-sm text-[#2F4538] font-medium">
                    {STATE_LABELS[campaign.agent_state] || campaign.agent_state}
                  </span>
                </div>
              )}
            </div>

            {/* Budget Card */}
            {budgetGBP > 0 && (
              <div className="bg-gradient-to-br from-[#2F4538] to-[#1f2f26] text-white rounded-xl p-5 sm:p-6 min-w-[240px] sm:min-w-[280px] flex-shrink-0">
                <div className="text-sm opacity-90 mb-1">Campaign Budget</div>
                <div className="text-2xl sm:text-3xl font-bold mb-3">\u00a3{budgetGBP.toLocaleString()}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Creators</span>
                    <span className="font-semibold">{totalCreators}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-[#D16B42] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(responseRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Response Rate</span>
                    <span className="font-semibold">{responseRate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar for active campaigns */}
          {(isRunning || isCompleted) && (
            <div className="mt-5">
              <StepProgress agentState={campaign.agent_state} status={campaign.status} />
            </div>
          )}

          {/* Failed message */}
          {isFailed && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">
                Campaign failed{campaign.agent_state?.startsWith("error:") ? `: ${campaign.agent_state.slice(7)}` : ""}
              </span>
            </div>
          )}

          {runError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              {runError}
            </div>
          )}

          {/* ── Tab Navigation ── */}
          <div className="flex gap-4 sm:gap-6 mt-6 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`pb-3 px-1 font-medium text-sm transition-colors relative whitespace-nowrap ${
                  selectedTab === tab.key
                    ? "text-[#2F4538]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {selectedTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F4538]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Pending Approvals (always visible at top) ── */}
        {pendingApprovals.length > 0 && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Action Required</h2>
                <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-xs font-semibold">
                  {pendingApprovals.length}
                </span>
              </div>
              <div className="space-y-4">
                {pendingApprovals.map((a) => (
                  <PendingApprovalCard key={a.id} approval={a} onDecide={handleDecide} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Overview Tab ── */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {overviewMetrics.slice(0, 6).map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${metric.color}`} />
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                        <span className="text-xs">{metric.change}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">{metric.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Response Funnel */}
            {totalCreators > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Response Funnel</h2>
                <div className="space-y-3">
                  {[
                    { label: "Contacted", count: totalCreators, color: "bg-blue-500" },
                    { label: "Responded", count: respondedCount, color: "bg-purple-500" },
                    { label: "Negotiating", count: engagements.filter((e: { status: string }) => e.status === "negotiating").length, color: "bg-[#D16B42]" },
                    { label: "Agreed", count: agreedCount, color: "bg-green-500" },
                    { label: "Declined", count: engagements.filter((e: { status: string }) => e.status === "declined").length, color: "bg-red-400" },
                  ].map((stage) => (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-900 text-sm">{stage.label}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">{stage.count}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {totalCreators > 0 ? `${Math.round((stage.count / totalCreators) * 100)}%` : "0%"}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`${stage.color} h-3 rounded-full transition-all`}
                          style={{ width: `${totalCreators > 0 ? (stage.count / totalCreators) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two Column Layout: Brief + Strategy */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Brief */}
              {brief && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Brief</h2>
                  <div className="space-y-3 text-sm">
                    {brief.brand_name && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Brand</span>
                        <p className="text-gray-900 font-medium mt-0.5">{String(brief.brand_name)}</p>
                      </div>
                    )}
                    {brief.industry && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Industry</span>
                        <p className="text-gray-900 mt-0.5">{String(brief.industry)}</p>
                      </div>
                    )}
                    {brief.target_audience && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Target Audience</span>
                        <p className="text-gray-700 mt-0.5 leading-relaxed">{String(brief.target_audience)}</p>
                      </div>
                    )}
                    {brief.key_message && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Key Message</span>
                        <p className="text-gray-700 mt-0.5 leading-relaxed">{String(brief.key_message)}</p>
                      </div>
                    )}
                    {Array.isArray(brief.platforms) && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Platforms</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(brief.platforms as string[]).map((p) => (
                            <span key={p} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {brief.budget_gbp != null && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Budget</span>
                        <p className="text-gray-900 font-semibold mt-0.5">\u00a3{Number(brief.budget_gbp).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Strategy */}
              {strategy && typeof strategy === "object" && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Strategy</h2>
                  <div className="space-y-3 text-sm">
                    {strategy.approach && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Approach</span>
                        <p className="text-gray-700 mt-0.5 leading-relaxed">{String(strategy.approach)}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      {strategy.creator_count != null && (
                        <div className="rounded-lg bg-gray-50 p-3 text-center">
                          <p className="text-xl font-semibold text-gray-900">{String(strategy.creator_count)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Creators</p>
                        </div>
                      )}
                      {strategy.budget_per_creator && (
                        <div className="rounded-lg bg-gray-50 p-3 text-center">
                          <p className="text-xl font-semibold text-gray-900">\u00a3{Number(strategy.budget_per_creator).toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Per Creator</p>
                        </div>
                      )}
                      {strategy.platform_priority && (
                        <div className="rounded-lg bg-gray-50 p-3 text-center">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {(Array.isArray(strategy.platform_priority)
                              ? (strategy.platform_priority as string[])
                              : [String(strategy.platform_priority)]
                            ).map((p) => (
                              <span key={p} className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 capitalize">
                                {p}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">Platforms</p>
                        </div>
                      )}
                    </div>
                    {strategy.messaging_angle && (
                      <div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Messaging</span>
                        <p className="text-gray-700 mt-0.5 leading-relaxed">{String(strategy.messaging_angle)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Email Delivery */}
            {(isRunning || isCompleted) && emailsSent > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Email Delivery</h2>
                <EmailTracking campaignId={id} />
              </div>
            )}

            {/* Approval History */}
            {pastApprovals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Approval History</h2>
                <div className="divide-y divide-gray-100">
                  {pastApprovals.map((a) => (
                    <PastApprovalRow key={a.id} approval={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Influencers Tab ── */}
        {selectedTab === "influencers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Campaign Creators</h2>
                <p className="text-sm text-gray-600 mt-1">{totalCreators} creators engaged in this campaign</p>
              </div>

              <div className="divide-y divide-gray-200">
                {engagements.map((creator: {
                  id: string;
                  creator_name: string;
                  creator_handle?: string;
                  platform?: string;
                  status: string;
                  latest_message?: string;
                  messages?: { role: string; body: string; timestamp: string }[];
                  proposed_fee?: number;
                }) => (
                  <div key={creator.id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#2F4538] to-[#D16B42] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {creator.creator_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">{creator.creator_name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              creator.status === "agreed" ? "bg-green-100 text-green-700" :
                              creator.status === "negotiating" ? "bg-blue-100 text-blue-700" :
                              creator.status === "responded" ? "bg-purple-100 text-purple-700" :
                              creator.status === "declined" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {creator.status.charAt(0).toUpperCase() + creator.status.slice(1)}
                            </span>
                            {creator.creator_handle && (
                              <span className="text-sm text-gray-500">{creator.creator_handle}</span>
                            )}
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Platform</div>
                              <div className="font-medium text-gray-900 text-sm capitalize">{creator.platform || "Email"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Messages</div>
                              <div className="font-medium text-gray-900 text-sm">{creator.messages?.length || 0}</div>
                            </div>
                            {creator.proposed_fee != null && (
                              <div>
                                <div className="text-xs text-gray-500 mb-0.5">Proposed Fee</div>
                                <div className="font-medium text-gray-900 text-sm">\u00a3{Number(creator.proposed_fee).toLocaleString()}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-gray-500 mb-0.5">Performance</div>
                              <div className={`font-semibold text-sm ${getPerformanceColor(creator.status)}`}>
                                {creator.status === "agreed" ? "Excellent" :
                                 creator.status === "negotiating" ? "In Progress" :
                                 creator.status === "responded" ? "Good" :
                                 creator.status === "declined" ? "Lost" : "Pending"}
                              </div>
                            </div>
                          </div>

                          {/* Latest message preview */}
                          {creator.latest_message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Latest Message</div>
                              <p className="text-sm text-gray-700 line-clamp-2">{creator.latest_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Creator Engagements Component */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Creator Responses</h2>
              <CreatorEngagements campaignId={id} />
            </div>
          </div>
        )}

        {/* ── Insights Tab ── */}
        {selectedTab === "insights" && result && (
          <div className="space-y-6">
            {/* AI Insights Hero */}
            <div className="bg-gradient-to-br from-[#2F4538] to-[#1f2f26] text-white rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#D16B42]" />
                <h2 className="text-xl sm:text-2xl font-bold">Campaign Report</h2>
              </div>
              <p className="text-[#E8DCC8] text-base sm:text-lg mb-6">
                AI-generated analysis of your campaign performance, creator engagement, and recommendations for future campaigns.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{totalCreators}</div>
                  <div className="text-sm text-[#E8DCC8]">Creators</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{responseRate}%</div>
                  <div className="text-sm text-[#E8DCC8]">Response Rate</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{agreedCount}</div>
                  <div className="text-sm text-[#E8DCC8]">Deals Agreed</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{emailsSent}</div>
                  <div className="text-sm text-[#E8DCC8]">Emails Sent</div>
                </div>
              </div>
            </div>

            {/* Full Campaign Report */}
            <CampaignReport result={result} />
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete Campaign</h3>
                <p className="text-[13px] text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete <span className="font-medium text-gray-900">{campaign.name}</span>?
            </p>
            <p className="text-[12px] text-gray-400 mb-5">
              All associated data including approvals, emails, and engagement records will be removed.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting\u2026" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
