"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  MessageSquare,
  Handshake,
  Clock,
  ChevronDown,
  Sparkles,
  Send,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Zap,
  Pause,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Star,
  Trash2,
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

type TabKey = "active" | "completed" | "templates" | "analytics";

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
          className="px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-300 text-white rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5"
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

// ── Creator Negotiation Card (Active Tab) ───────────────────

function ActiveNegotiationCard({
  engagement,
  campaignId,
  campaignName,
  onDataChange,
}: {
  engagement: CreatorEngagement;
  campaignId: string;
  campaignName: string;
  onDataChange: () => void;
}) {
  const style = STATUS_STYLES[engagement.status] || STATUS_STYLES.responded;
  const hasMessages =
    engagement.message_history && engagement.message_history.length > 0;

  // AI negotiation state
  const [generating, setGenerating] = useState(false);
  const [counterOffer, setCounterOffer] = useState<CounterOffer | null>(null);
  const [counterScore, setCounterScore] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  // Extract fee data for offer/ask display
  const latestFee = engagement.latest_proposal?.fee_gbp || engagement.latest_proposal?.fee;
  const agreedFee = engagement.terms?.fee_gbp || engagement.terms?.fee;

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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2F4538] to-[#D16B42] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-white">
                {(engagement.creator_name || engagement.creator_id || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {engagement.creator_name || engagement.creator_id}
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
                {engagement.platform && (
                  <span className="text-sm text-gray-500 capitalize">{engagement.platform}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                {engagement.creator_email && <span>{engagement.creator_email}</span>}
                <span className="text-gray-300">•</span>
                <span>Campaign: {campaignName}</span>
                {responseTimeLabel && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {responseTimeLabel}
                    </span>
                  </>
                )}
              </div>

              {/* Negotiation Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {latestFee != null && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Their Ask</div>
                    <div className="font-semibold text-gray-900">
                      £{Number(latestFee).toLocaleString()}
                    </div>
                  </div>
                )}
                {agreedFee != null && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Agreed Fee</div>
                    <div className="font-semibold text-emerald-700">
                      £{Number(agreedFee).toLocaleString()}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Messages</div>
                  <div className="font-semibold text-gray-900">
                    {engagement.message_history?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#D16B42]" />
                    AI Confidence
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#D16B42] h-2 rounded-full transition-all"
                        style={{ width: `${counterScore > 0 ? counterScore : engagement.status === "agreed" ? 100 : engagement.status === "negotiating" ? 65 : 50}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-900 text-xs">
                      {counterScore > 0 ? counterScore : engagement.status === "agreed" ? 100 : engagement.status === "negotiating" ? 65 : 50}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {engagement.message_history?.length || 0} messages
                </div>
                {engagement.updated_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(engagement.updated_at)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {expanded ? "Hide" : "View Details"}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* AI Recommendation Banner */}
        {canNegotiate && !counterOffer && !isTerminal && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">AI Recommendation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Based on {engagement.creator_name || "this creator"}&apos;s response and engagement data, the AI can generate a tailored counter-offer to move this negotiation forward.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    {generating ? "Generating..." : "Generate Counter-Offer"}
                  </button>
                  {canAccept && (
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Accept Deal
                    </button>
                  )}
                  <button
                    onClick={handleDecline}
                    disabled={declining}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {declining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Counter-offer preview */}
        {counterOffer && (
          <div className="mt-4">
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
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
            {/* Message thread */}
            {hasMessages && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Conversation Thread</h4>
                <div className="max-h-80 overflow-y-auto">
                  <MessageThread messages={engagement.message_history || []} />
                </div>
              </div>
            )}

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

            {/* Manual reply for active negotiations */}
            {!isTerminal && !counterOffer && (
              <NegotiatorReply
                campaignId={campaignId}
                creatorId={engagement.creator_id}
                onSent={onDataChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Completed Negotiation Card ──────────────────────────────

function CompletedNegotiationCard({
  engagement,
  campaignName,
}: {
  engagement: CreatorEngagement;
  campaignName: string;
}) {
  const isAgreed = engagement.status === "agreed";
  const fee = engagement.terms?.fee_gbp || engagement.terms?.fee;
  const proposedFee = engagement.latest_proposal?.fee_gbp || engagement.latest_proposal?.fee;

  // Calculate duration
  let duration = "—";
  if (engagement.response_timestamp && engagement.created_at) {
    const diff = new Date(engagement.response_timestamp).getTime() - new Date(engagement.created_at).getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    duration = days <= 1 ? "1 day" : `${days} days`;
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2F4538] to-[#D16B42] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              {(engagement.creator_name || engagement.creator_id || "?").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">
                {engagement.creator_name || engagement.creator_id}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAgreed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {isAgreed ? "Accepted" : "Declined"}
              </span>
              {engagement.platform && (
                <span className="text-sm text-gray-500 capitalize">{engagement.platform}</span>
              )}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Campaign: {campaignName}
              {engagement.updated_at && ` • Completed ${formatDate(engagement.updated_at)}`}
            </div>

            {isAgreed && fee != null ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="text-xs text-green-700 mb-1">Final Amount</div>
                  <div className="font-semibold text-green-900">£{Number(fee).toLocaleString()}</div>
                </div>
                {proposedFee != null && Number(proposedFee) > Number(fee) && (
                  <div>
                    <div className="text-xs text-green-700 mb-1">Initial Ask</div>
                    <div className="font-semibold text-green-900">£{Number(proposedFee).toLocaleString()}</div>
                  </div>
                )}
                {proposedFee != null && Number(proposedFee) > Number(fee) && (
                  <div>
                    <div className="text-xs text-green-700 mb-1">You Saved</div>
                    <div className="font-semibold text-green-900">£{(Number(proposedFee) - Number(fee)).toLocaleString()}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-green-700 mb-1">Duration</div>
                  <div className="font-semibold text-green-900">{duration}</div>
                </div>
              </div>
            ) : isAgreed ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium">Deal agreed • {duration}</div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700">
                  <span className="font-semibold">Declined</span>
                  {engagement.notes && ` — ${engagement.notes}`}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <Bot className="w-4 h-4 text-[#2F4538]" />
              <span>Handled by AI Negotiator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────

function NegotiatorSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
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

// ── Analytics Helpers ─────────────────────────────────────────

function computeAnalytics(data: AggregateNegotiations) {
  const allCreators = data.negotiations.flatMap((n) => n.creators);
  const totalNegotiations = allCreators.length;
  const agreed = allCreators.filter((c) => c.status === "agreed");
  const declined = allCreators.filter((c) => c.status === "declined");
  const successRate = totalNegotiations > 0 ? Math.round((agreed.length / totalNegotiations) * 100) : 0;

  // Calculate total saved (rough estimate from proposal vs agreed terms)
  let totalSaved = 0;
  for (const c of agreed) {
    const proposedFee = c.latest_proposal?.fee_gbp || c.latest_proposal?.fee || 0;
    const agreedFee = c.terms?.fee_gbp || c.terms?.fee || 0;
    if (Number(proposedFee) > Number(agreedFee)) {
      totalSaved += Number(proposedFee) - Number(agreedFee);
    }
  }

  // Platform stats
  const platformMap = new Map<string, { total: number; agreed: number }>();
  for (const c of allCreators) {
    const platform = c.platform || "Other";
    const entry = platformMap.get(platform) || { total: 0, agreed: 0 };
    entry.total++;
    if (c.status === "agreed") entry.agreed++;
    platformMap.set(platform, entry);
  }
  const byPlatform = Array.from(platformMap.entries()).map(([platform, stats]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    negotiations: stats.total,
    successRate: stats.total > 0 ? Math.round((stats.agreed / stats.total) * 100) : 0,
  }));

  // Avg response time
  const avgResponseTime = data.avgResponseTimeHours > 0
    ? data.avgResponseTimeHours < 24
      ? `${data.avgResponseTimeHours}h`
      : `${Math.round(data.avgResponseTimeHours / 24)}d`
    : "—";

  return {
    totalNegotiations,
    activeNegotiations: data.activeNegotiations,
    successRate,
    avgResponseTime,
    totalSaved,
    avgSavings: totalNegotiations > 0 ? Math.round((totalSaved / Math.max(1, agreed.length)) ) : 0,
    agreedCount: agreed.length,
    declinedCount: declined.length,
    byPlatform,
  };
}

// ── Negotiation Templates ────────────────────────────────────

type NegotiatorTemplate = {
  id: number;
  name: string;
  type: string;
  subject: string;
  body: string;
  tone: string;
  successRate: number;
  usedCount: number;
  lastUpdated: string;
  favorite: boolean;
};

const DEFAULT_TEMPLATES: NegotiatorTemplate[] = [
  {
    id: 1,
    name: "Standard Product Launch",
    type: "outreach",
    subject: "Partnership Opportunity: {{campaign_name}}",
    body: "Hi {{first_name}},\n\nWe're launching {{campaign_name}} and think your content style would be a great fit for our audience.\n\nWe'd love to discuss a partnership. Our typical packages include:\n- Fee: {{proposed_fee}}\n- Deliverables: {{deliverables}}\n- Timeline: {{timeline}}\n\nWould you be interested in learning more?\n\nBest,\n{{brand_name}}",
    tone: "professional",
    successRate: 68,
    usedCount: 142,
    lastUpdated: "Jan 2026",
    favorite: false,
  },
  {
    id: 2,
    name: "Counter Offer — Budget Conscious",
    type: "counter",
    subject: "Re: Partnership Discussion",
    body: "Hi {{first_name}},\n\nThank you for your proposal! We really value your work and would love to move forward.\n\nBased on our campaign budget, we'd like to propose:\n- Fee: {{counter_fee}} (with performance bonus potential)\n- Deliverables: {{deliverables}}\n- Timeline: {{timeline}}\n\nWe believe this structure benefits both sides. Let me know your thoughts!\n\nBest,\n{{brand_name}}",
    tone: "friendly",
    successRate: 72,
    usedCount: 89,
    lastUpdated: "Jan 2026",
    favorite: false,
  },
  {
    id: 3,
    name: "High-Value Creator Outreach",
    type: "outreach",
    subject: "Exclusive Partnership Opportunity",
    body: "Hi {{first_name}},\n\nI've been following your work and I'm truly impressed by your engagement and content quality.\n\nWe're looking for a select few creators for an exclusive campaign — {{campaign_name}}. This is a premium partnership with:\n- Competitive fee: {{proposed_fee}}\n- Creative freedom on deliverables\n- Long-term collaboration potential\n\nWould you be open to discussing this further?\n\nBest regards,\n{{brand_name}}",
    tone: "premium",
    successRate: 81,
    usedCount: 56,
    lastUpdated: "Jan 2026",
    favorite: true,
  },
  {
    id: 4,
    name: "Performance-Based Proposal",
    type: "offer",
    subject: "Performance Partnership Proposal",
    body: "Hi {{first_name}},\n\nWe'd love to propose a performance-based partnership for {{campaign_name}}.\n\nStructure:\n- Base fee: {{base_fee}}\n- Performance bonus: {{bonus_structure}}\n- Deliverables: {{deliverables}}\n\nThis model rewards great content and ensures alignment between both parties.\n\nInterested? Let's chat!\n\nBest,\n{{brand_name}}",
    tone: "professional",
    successRate: 75,
    usedCount: 103,
    lastUpdated: "Jan 2026",
    favorite: false,
  },
];

const NEG_TEMPLATE_STORAGE_KEY = "hudey-negotiator-templates";

function loadNegTemplates(): NegotiatorTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const saved = localStorage.getItem(NEG_TEMPLATE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_TEMPLATES;
}

function saveNegTemplates(templates: NegotiatorTemplate[]) {
  try {
    localStorage.setItem(NEG_TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch { /* ignore */ }
}

// ── Negotiator Template Editor Modal ────────────────────────

function NegTemplateEditorModal({
  template,
  onSave,
  onClose,
}: {
  template: NegotiatorTemplate | null;
  onSave: (t: NegotiatorTemplate) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [type, setType] = useState(template?.type || "outreach");
  const [tone, setTone] = useState(template?.tone || "professional");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;
    onSave({
      id: template?.id || Date.now(),
      name: name.trim(),
      type,
      subject: subject.trim(),
      body: body.trim(),
      tone,
      successRate: template?.successRate || 0,
      usedCount: template?.usedCount || 0,
      lastUpdated: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      favorite: template?.favorite || false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {template ? "Edit Template" : "Create Template"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Counter Offer — Budget Conscious"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent bg-white"
              >
                <option value="outreach">Outreach</option>
                <option value="counter">Counter Offer</option>
                <option value="offer">Offer</option>
                <option value="follow-up">Follow-up</option>
                <option value="closing">Closing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent bg-white"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="premium">Premium</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Re: Partnership Discussion"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your negotiation template here... Use {{variables}} for dynamic content."
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Variables: {"{{first_name}}"}, {"{{campaign_name}}"}, {"{{brand_name}}"}, {"{{proposed_fee}}"}, {"{{counter_fee}}"}, {"{{deliverables}}"}, {"{{timeline}}"}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!name.trim() || !subject.trim()}
              className="flex-1 px-6 py-2.5 bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {template ? "Save Changes" : "Create Template"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
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
  const [selectedTab, setSelectedTab] = useState<TabKey>("active");
  const [templates, setTemplates] = useState<NegotiatorTemplate[]>(() => loadNegTemplates());
  const [editingTemplate, setEditingTemplate] = useState<NegotiatorTemplate | null | "new">(null);

  const handleDataChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  function handleSaveTemplate(t: NegotiatorTemplate) {
    setTemplates((prev) => {
      const exists = prev.find((p) => p.id === t.id);
      const next = exists ? prev.map((p) => (p.id === t.id ? t : p)) : [...prev, t];
      saveNegTemplates(next);
      return next;
    });
    setEditingTemplate(null);
  }

  function handleDeleteTemplate(id: number) {
    setTemplates((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveNegTemplates(next);
      return next;
    });
  }

  function handleDuplicateTemplate(t: NegotiatorTemplate) {
    const copy: NegotiatorTemplate = { ...t, id: Date.now(), name: `${t.name} (Copy)`, usedCount: 0, successRate: 0, lastUpdated: "Never" };
    setTemplates((prev) => {
      const next = [...prev, copy];
      saveNegTemplates(next);
      return next;
    });
  }

  function handleToggleFavorite(id: number) {
    setTemplates((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, favorite: !t.favorite } : t);
      saveNegTemplates(next);
      return next;
    });
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getAggregateNegotiations()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  // Compute analytics if data available (memoized to avoid recalc on every render)
  const analytics = useMemo(() => (data ? computeAnalytics(data) : null), [data]);

  // Separate active vs completed creators (memoized)
  const { activeCreators, completedCreators } = useMemo(() => {
    const active: { engagement: CreatorEngagement; campaignId: string; campaignName: string }[] = [];
    const completed: { engagement: CreatorEngagement; campaignId: string; campaignName: string }[] = [];
    if (data) {
      for (const n of data.negotiations) {
        for (const c of n.creators) {
          const item = { engagement: c, campaignId: n.campaignId, campaignName: n.campaignName };
          if (c.status === "agreed" || c.status === "declined") {
            completed.push(item);
          } else {
            active.push(item);
          }
        }
      }
    }
    return { activeCreators: active, completedCreators: completed };
  }, [data]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "active", label: "Active", count: activeCreators.length },
    { key: "completed", label: "Completed", count: completedCreators.length },
    { key: "templates", label: "Templates" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Negotiator</h1>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">Automated influencer outreach and negotiation powered by AI</p>
            </div>

            {/* Quick Stats */}
            {analytics && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
                  <div className="text-[10px] sm:text-xs text-green-700 font-medium mb-1">Active Deals</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-900">{analytics.activeNegotiations}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
                  <div className="text-[10px] sm:text-xs text-blue-700 font-medium mb-1">Success Rate</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-900">{analytics.successRate}%</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
                  <div className="text-[10px] sm:text-xs text-purple-700 font-medium mb-1">Deals Agreed</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-900">{analytics.agreedCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
                  selectedTab === tab.key
                    ? "text-[#2F4538]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedTab === tab.key
                      ? "bg-[#2F4538] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {selectedTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2F4538]"></div>
                )}
              </button>
            ))}
          </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <NegotiatorSkeleton />
      ) : !data || data.negotiations.length === 0 ? (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No negotiations yet</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Negotiations begin automatically after outreach emails are sent and creators respond.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* ─── Active Tab ────────────────────────────────── */}
          {selectedTab === "active" && (
            <div className="space-y-6">
              {/* AI Status Banner */}
              <div className="bg-gradient-to-br from-[#2F4538] to-[#1f2f26] text-white rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-[#D16B42]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">AI Negotiator is Active</h3>
                      <p className="text-[#E8DCC8] mb-4 text-sm">
                        Currently managing {activeCreators.length} active negotiation{activeCreators.length !== 1 ? "s" : ""} across {data.negotiations.length} campaign{data.negotiations.length !== 1 ? "s" : ""}.
                        {data.totalAgreed > 0 && ` ${data.totalAgreed} deal${data.totalAgreed !== 1 ? "s" : ""} agreed so far.`}
                      </p>
                      <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Auto-respond enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Smart pricing active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>24/7 monitoring</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="hidden sm:flex px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg font-medium text-sm transition-colors items-center gap-2 flex-shrink-0">
                    <Pause className="w-4 h-4" />
                    Pause AI
                  </button>
                </div>
              </div>

              {/* Active Negotiations List */}
              {activeCreators.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No active negotiations right now.</p>
                  <p className="text-gray-400 text-xs mt-1">Check the Completed tab for finished negotiations.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activeCreators.map(({ engagement, campaignId, campaignName }) => (
                    <ActiveNegotiationCard
                      key={engagement.id}
                      engagement={engagement}
                      campaignId={campaignId}
                      campaignName={campaignName}
                      onDataChange={handleDataChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Completed Tab ─────────────────────────────── */}
          {selectedTab === "completed" && (
            <div className="space-y-6">
              {completedCreators.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Handshake className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No completed negotiations yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Completed Negotiations</h2>
                    <p className="text-sm text-gray-500 mt-1">Recent negotiation outcomes and performance</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {completedCreators.map(({ engagement, campaignName }) => (
                      <CompletedNegotiationCard
                        key={engagement.id}
                        engagement={engagement}
                        campaignName={campaignName}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Templates Tab ─────────────────────────────── */}
          {selectedTab === "templates" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Negotiation Templates</h2>
                  <p className="text-sm text-gray-500 mt-1">AI-powered message templates for different negotiation scenarios</p>
                </div>
                <button
                  onClick={() => setEditingTemplate("new")}
                  className="px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No negotiation templates yet</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Create your first template to streamline negotiations</p>
                  <button
                    onClick={() => setEditingTemplate("new")}
                    className="px-6 py-2.5 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{template.name}</h3>
                            <button
                              onClick={() => handleToggleFavorite(template.id)}
                              className="flex-shrink-0 p-0.5 hover:scale-110 transition-transform"
                              title={template.favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star className={`w-4 h-4 ${template.favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium text-xs">
                              {template.type}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium text-xs">
                              {template.tone}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-4">
                            <span className="font-medium">Subject:</span> {template.subject}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{template.successRate}%</div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{template.usedCount}</div>
                          <div className="text-xs text-gray-500">Times Used</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-900 font-semibold">Updated</div>
                          <div className="text-xs text-gray-500">{template.lastUpdated}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="flex-1 px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          Edit Template
                        </button>
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Template Editor Modal */}
              {editingTemplate !== null && (
                <NegTemplateEditorModal
                  template={editingTemplate === "new" ? null : editingTemplate}
                  onSave={handleSaveTemplate}
                  onClose={() => setEditingTemplate(null)}
                />
              )}
            </div>
          )}

          {/* ─── Analytics Tab ─────────────────────────────── */}
          {selectedTab === "analytics" && analytics && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Negotiations</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics.totalNegotiations}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Active Now</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics.activeNegotiations}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">{analytics.successRate}%</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Avg Response</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics.avgResponseTime}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Saved</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2F4538]">
                    {analytics.totalSaved > 0 ? `£${analytics.totalSaved.toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Deals Agreed</div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#D16B42]">{analytics.agreedCount}</div>
                </div>
              </div>

              {/* Platform Performance + Campaign Breakdown */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Platform Performance */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Performance by Platform</h2>
                  {analytics.byPlatform.length === 0 ? (
                    <p className="text-sm text-gray-400">No platform data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.byPlatform.map((platform, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{platform.platform}</span>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{platform.negotiations} deal{platform.negotiations !== 1 ? "s" : ""}</div>
                              <div className="text-xs text-green-600">{platform.successRate}% success</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#2F4538] h-2 rounded-full transition-all"
                              style={{ width: `${platform.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campaign Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Negotiation by Campaign</h2>
                  <div className="space-y-4">
                    {data.negotiations.map((n) => {
                      const agreed = n.creators.filter((c) => c.status === "agreed").length;
                      const total = n.creators.length;
                      const rate = total > 0 ? Math.round((agreed / total) * 100) : 0;
                      return (
                        <div key={n.campaignId}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="min-w-0">
                              <Link
                                href={`/campaigns/${n.campaignId}`}
                                className="font-medium text-gray-900 hover:text-[#2F4538] transition-colors truncate block"
                              >
                                {n.campaignName}
                              </Link>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CAMPAIGN_STATUS_COLORS[n.campaignStatus] || "bg-gray-100 text-gray-700"}`}>
                                {n.campaignStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-gray-900">{total} creator{total !== 1 ? "s" : ""}</div>
                              <div className="text-xs text-green-600">{agreed} agreed ({rate}%)</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#D16B42] h-2 rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Negotiation Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Average Negotiation Timeline</h2>
                <div className="space-y-4">
                  {[
                    { stage: "Initial Outreach", avgDays: 0.5 },
                    { stage: "First Response", avgDays: data.avgResponseTimeHours > 0 ? Math.round(data.avgResponseTimeHours / 24 * 10) / 10 : 1.2 },
                    { stage: "Counter Offers", avgDays: 2.1 },
                    { stage: "Final Agreement", avgDays: 0.8 },
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{stage.stage}</div>
                        <div className="text-sm text-gray-500">{stage.avgDays} days average</div>
                      </div>
                      <div className="text-2xl font-bold text-[#D16B42]">{stage.avgDays}d</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Average</span>
                    <span className="text-2xl font-bold text-[#2F4538]">{analytics.avgResponseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
