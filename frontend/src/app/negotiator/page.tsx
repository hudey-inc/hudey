"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AggregateNegotiations, CreatorEngagement, CounterOffer } from "@/lib/api";
import {
  getAggregateNegotiations,
  generateCounterOffer,
  sendCounterOffer,
  acceptTerms,
  replyToCreator,
  updateEngagementStatus,
} from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Bot,
  MessageCircle,
  Handshake,
  XCircle,
  Clock,
  ChevronDown,
  Sparkles,
  Send,
  CheckCircle2,
  Loader2,
  Pencil,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  responded: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Responded",
  },
  negotiating: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Negotiating",
  },
  agreed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    label: "Agreed",
  },
  declined: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Declined",
  },
};

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  running: "bg-green-100 text-green-700",
  awaiting_approval: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-700",
  draft: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Message Thread ──────────────────────────────────────────

function MessageThread({
  messages,
}: {
  messages: { from: string; body: string; timestamp: string }[];
}) {
  if (!messages || messages.length === 0) {
    return (
      <p className="text-[13px] text-gray-400 italic">No messages yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => {
        const isBrand = msg.from === "brand";
        return (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-[13px] ${
              isBrand
                ? "bg-gray-50 border border-gray-100"
                : "bg-blue-50 border border-blue-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-medium ${
                  isBrand ? "text-gray-500" : "text-blue-600"
                }`}
              >
                {isBrand ? "Hudey AI" : "Creator"}
              </span>
              <span className="text-[11px] text-gray-400">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <p
              className={`leading-relaxed whitespace-pre-wrap ${
                isBrand ? "text-gray-700" : "text-gray-800"
              }`}
            >
              {msg.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Proposal Terms Display ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProposalCard({ proposal, label, variant }: { proposal: Record<string, any>; label: string; variant: "amber" | "emerald" }) {
  const colors = variant === "amber"
    ? { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" }
    : { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" };

  return (
    <div className={`rounded-lg ${colors.bg} border ${colors.border} p-3`}>
      <p className={`text-[11px] font-medium ${colors.text} uppercase tracking-wider mb-2`}>
        {label}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px]">
        {proposal.fee != null && (
          <div>
            <span className="text-gray-400 text-[11px]">Fee</span>
            <p className="text-gray-800 font-medium">
              {typeof proposal.fee === "number"
                ? `£${proposal.fee.toLocaleString()}`
                : String(proposal.fee)}
            </p>
          </div>
        )}
        {proposal.fee_gbp != null && (
          <div>
            <span className="text-gray-400 text-[11px]">Fee</span>
            <p className="text-gray-800 font-medium">
              £{Number(proposal.fee_gbp).toLocaleString()}
            </p>
          </div>
        )}
        {proposal.deliverables && (
          <div>
            <span className="text-gray-400 text-[11px]">Deliverables</span>
            <p className="text-gray-800">
              {Array.isArray(proposal.deliverables)
                ? proposal.deliverables.join(", ")
                : String(proposal.deliverables)}
            </p>
          </div>
        )}
        {proposal.deadline && (
          <div>
            <span className="text-gray-400 text-[11px]">Deadline</span>
            <p className="text-gray-800">{String(proposal.deadline)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Counter-Offer Preview ───────────────────────────────────

function CounterOfferPreview({
  offer,
  score,
  campaignId,
  creatorId,
  onSent,
  onCancel,
}: {
  offer: CounterOffer;
  score: number;
  campaignId: string;
  creatorId: string;
  onSent: () => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(offer.subject);
  const [body, setBody] = useState(offer.body);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);

  const scoreColor =
    score >= 70 ? "text-emerald-600 bg-emerald-50" :
    score >= 40 ? "text-amber-600 bg-amber-50" :
    "text-red-600 bg-red-50";

  async function handleSend() {
    setSending(true);
    try {
      await sendCounterOffer(campaignId, creatorId, {
        subject,
        message: body,
        proposed_terms: offer.proposed_terms,
      });
      onSent();
    } catch {
      // User can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-900">AI Counter-Offer Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}>
            Score: {score}/100
          </span>
          <button
            onClick={() => setEditing(!editing)}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            {editing ? "Preview" : "Edit"}
          </button>
        </div>
      </div>

      {/* Proposed terms summary */}
      {offer.proposed_terms && (
        <div className="flex items-center gap-3 text-[12px] flex-wrap">
          {offer.proposed_terms.fee_gbp != null && (
            <span className="bg-white border border-indigo-100 rounded-md px-2 py-1 text-gray-700">
              💰 £{Number(offer.proposed_terms.fee_gbp).toLocaleString()}
            </span>
          )}
          {offer.proposed_terms.deliverables && offer.proposed_terms.deliverables.length > 0 && (
            <span className="bg-white border border-indigo-100 rounded-md px-2 py-1 text-gray-700">
              📋 {offer.proposed_terms.deliverables.join(", ")}
            </span>
          )}
          {offer.proposed_terms.deadline && (
            <span className="bg-white border border-indigo-100 rounded-md px-2 py-1 text-gray-700">
              📅 {offer.proposed_terms.deadline}
            </span>
          )}
        </div>
      )}

      {/* Subject */}
      {editing ? (
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
          placeholder="Subject line"
        />
      ) : (
        <p className="text-[12px] text-gray-500">Subject: {subject}</p>
      )}

      {/* Body */}
      {editing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none resize-y"
        />
      ) : (
        <div className="text-[12px] text-gray-700 bg-white rounded-lg border border-gray-100 p-3 whitespace-pre-wrap leading-relaxed">
          {body}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send Counter-Offer
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Inline Reply ─────────────────────────────────────────────

function NegotiatorReply({
  campaignId,
  creatorId,
  onSent,
}: {
  campaignId: string;
  creatorId: string;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await replyToCreator(campaignId, creatorId, text.trim());
      setText("");
      onSent();
    } catch {
      // retry
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a manual reply..."
        className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none transition-colors"
        disabled={sending}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
      >
        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      </button>
    </div>
  );
}

// ── Creator Negotiation Card ────────────────────────────────

function CreatorNegotiationCard({
  engagement,
  campaignId,
  onDataChange,
}: {
  engagement: CreatorEngagement;
  campaignId: string;
  onDataChange: () => void;
}) {
  const style = STATUS_STYLES[engagement.status] || STATUS_STYLES.responded;
  const hasMessages =
    engagement.message_history && engagement.message_history.length > 0;
  const latestMessage = hasMessages
    ? engagement.message_history[engagement.message_history.length - 1]
    : null;

  // AI negotiation state
  const [generating, setGenerating] = useState(false);
  const [counterOffer, setCounterOffer] = useState<CounterOffer | null>(null);
  const [counterScore, setCounterScore] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  // Response time
  let responseTimeLabel = "";
  if (engagement.response_timestamp && engagement.created_at) {
    const diff =
      new Date(engagement.response_timestamp).getTime() -
      new Date(engagement.created_at).getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours < 24) {
      responseTimeLabel = `${hours}h response`;
    } else {
      responseTimeLabel = `${Math.round(hours / 24)}d response`;
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateCounterOffer(campaignId, engagement.creator_id);
      setCounterOffer(result.counter_offer);
      setCounterScore(result.score);
    } catch {
      // retry
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept() {
    setAccepting(true);
    try {
      const terms = engagement.latest_proposal || engagement.terms || {};
      await acceptTerms(campaignId, engagement.creator_id, terms);
      onDataChange();
    } catch {
      // retry
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await updateEngagementStatus(campaignId, engagement.creator_id, "declined");
      onDataChange();
    } catch {
      // retry
    } finally {
      setDeclining(false);
    }
  }

  const canNegotiate = engagement.status === "responded" || engagement.status === "negotiating";
  const canAccept = engagement.status === "negotiating" || engagement.status === "responded";
  const isTerminal = engagement.status === "agreed" || engagement.status === "declined";

  return (
    <details className="group rounded-lg border border-gray-200 bg-white overflow-hidden">
      <summary className="cursor-pointer list-none p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-[13px] font-medium text-gray-500">
                {(
                  engagement.creator_name ||
                  engagement.creator_id ||
                  "?"
                )
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {engagement.creator_name || engagement.creator_id}
                </span>
                {engagement.platform && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 capitalize">
                    {engagement.platform}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {engagement.creator_email && (
                  <span className="text-[11px] text-gray-400 truncate">
                    {engagement.creator_email}
                  </span>
                )}
                {responseTimeLabel && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {responseTimeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {latestMessage && (
              <span className="text-[11px] text-gray-400 hidden sm:block">
                {formatTime(latestMessage.timestamp)}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-300 transition-transform group-open:rotate-180" />
          </div>
        </div>

        {/* Message preview */}
        {latestMessage && (
          <div className="mt-2 ml-11 text-[13px] text-gray-500 line-clamp-2">
            <span className="font-medium">
              {latestMessage.from === "brand" ? "Hudey AI: " : "Creator: "}
            </span>
            {latestMessage.body}
          </div>
        )}
      </summary>

      <div className="border-t border-gray-100 p-4 space-y-3">
        {/* Message thread */}
        <MessageThread messages={engagement.message_history || []} />

        {/* Proposed terms */}
        {engagement.latest_proposal &&
          Object.keys(engagement.latest_proposal).length > 0 && (
            <ProposalCard
              proposal={engagement.latest_proposal}
              label="Latest Proposal"
              variant="amber"
            />
          )}

        {/* Agreed terms */}
        {engagement.terms &&
          Object.keys(engagement.terms).length > 0 && (
            <ProposalCard
              proposal={engagement.terms}
              label="Agreed Terms"
              variant="emerald"
            />
          )}

        {/* AI Counter-offer preview */}
        {counterOffer && (
          <CounterOfferPreview
            offer={counterOffer}
            score={counterScore}
            campaignId={campaignId}
            creatorId={engagement.creator_id}
            onSent={() => {
              setCounterOffer(null);
              onDataChange();
            }}
            onCancel={() => setCounterOffer(null)}
          />
        )}

        {/* Action buttons for active negotiations */}
        {!isTerminal && !counterOffer && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
            {canNegotiate && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {generating ? "Generating..." : "AI Counter-Offer"}
              </button>
            )}
            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
              >
                {accepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Accept Deal
              </button>
            )}
            {canNegotiate && (
              <button
                onClick={handleDecline}
                disabled={declining}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
              >
                {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Decline
              </button>
            )}
          </div>
        )}

        {/* Manual reply for active negotiations */}
        {!isTerminal && !counterOffer && (
          <NegotiatorReply
            campaignId={campaignId}
            creatorId={engagement.creator_id}
            onSent={onDataChange}
          />
        )}

        {/* Message count */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          <span>
            {engagement.message_history?.length || 0} messages in thread
          </span>
          {engagement.response_timestamp && (
            <span>
              First response: {formatDate(engagement.response_timestamp)}
            </span>
          )}
        </div>
      </div>
    </details>
  );
}

// ── Campaign Negotiation Group ──────────────────────────────

function CampaignNegotiationGroup({
  campaignId,
  campaignName,
  campaignStatus,
  creators,
  onDataChange,
}: {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  creators: CreatorEngagement[];
  onDataChange: () => void;
}) {
  const statusColor =
    CAMPAIGN_STATUS_COLORS[campaignStatus] || "bg-gray-100 text-gray-700";
  const statusLabel = campaignStatus
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Group by status
  const negotiating = creators.filter((c) => c.status === "negotiating");
  const agreed = creators.filter((c) => c.status === "agreed");
  const responded = creators.filter((c) => c.status === "responded");
  const declined = creators.filter((c) => c.status === "declined");

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/campaigns/${campaignId}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
            >
              {campaignName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor}`}>
                {statusLabel}
              </span>
              <span className="text-[11px] text-gray-400">
                {creators.length} creator{creators.length !== 1 ? "s" : ""} in
                negotiation
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Negotiating (most important first) */}
        {negotiating.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider mb-2">
              Active Negotiations ({negotiating.length})
            </p>
            <div className="space-y-2">
              {negotiating.map((c) => (
                <CreatorNegotiationCard key={c.id} engagement={c} campaignId={campaignId} onDataChange={onDataChange} />
              ))}
            </div>
          </div>
        )}

        {/* Responded (awaiting negotiation) */}
        {responded.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-2">
              Responded ({responded.length})
            </p>
            <div className="space-y-2">
              {responded.map((c) => (
                <CreatorNegotiationCard key={c.id} engagement={c} campaignId={campaignId} onDataChange={onDataChange} />
              ))}
            </div>
          </div>
        )}

        {/* Agreed */}
        {agreed.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider mb-2">
              Deals Agreed ({agreed.length})
            </p>
            <div className="space-y-2">
              {agreed.map((c) => (
                <CreatorNegotiationCard key={c.id} engagement={c} campaignId={campaignId} onDataChange={onDataChange} />
              ))}
            </div>
          </div>
        )}

        {/* Declined */}
        {declined.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-red-600 uppercase tracking-wider mb-2">
              Declined ({declined.length})
            </p>
            <div className="space-y-2">
              {declined.map((c) => (
                <CreatorNegotiationCard key={c.id} engagement={c} campaignId={campaignId} onDataChange={onDataChange} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function NegotiatorSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
          >
            <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function NegotiatorPage() {
  const { user, checking } = useRequireAuth();
  const [data, setData] = useState<AggregateNegotiations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDataChange() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getAggregateNegotiations()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-semibold text-gray-900">
            AI Negotiator
          </h1>
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
            NEW
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Track AI-powered creator negotiations and deal progress across
          campaigns
        </p>
      </div>

      {loading ? (
        <NegotiatorSkeleton />
      ) : !data || data.negotiations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">
            No negotiations yet
          </p>
          <p className="text-[13px] text-gray-400 mt-1">
            Negotiations begin automatically after outreach emails are sent and
            creators respond.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active Negotiations"
              value={data.activeNegotiations}
              icon={MessageCircle}
              color="bg-amber-50 text-amber-600"
            />
            <StatCard
              label="Deals Agreed"
              value={data.totalAgreed}
              icon={Handshake}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Declined"
              value={data.totalDeclined}
              icon={XCircle}
              color="bg-red-50 text-red-600"
            />
            <StatCard
              label="Avg Response Time"
              value={
                data.avgResponseTimeHours > 0
                  ? data.avgResponseTimeHours < 24
                    ? `${data.avgResponseTimeHours}h`
                    : `${Math.round(data.avgResponseTimeHours / 24)}d`
                  : "—"
              }
              sub={data.avgResponseTimeHours > 0 ? "from first outreach" : ""}
              icon={Clock}
              color="bg-blue-50 text-blue-600"
            />
          </div>

          {/* Negotiation groups by campaign */}
          <div className="space-y-6">
            {data.negotiations.map((n) => (
              <CampaignNegotiationGroup
                key={n.campaignId}
                campaignId={n.campaignId}
                campaignName={n.campaignName}
                campaignStatus={n.campaignStatus}
                creators={n.creators}
                onDataChange={handleDataChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
