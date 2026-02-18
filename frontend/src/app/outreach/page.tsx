"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { AggregateOutreach, CreatorEngagement } from "@/lib/api";
import { getAggregateOutreach, replyToCreator, updateEngagementStatus } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Inbox,
  Mail,
  CheckCircle2,
  Star,
  Search,
  MessageSquare,
  XCircle,
  Loader2,
  Sparkles,
  Plus,
  Pencil,
  Copy,
  Bot,
  Reply,
  ExternalLink,
  Archive,
  Trash2,
  Paperclip,
  Tag,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type TabKey = "inbox" | "sent" | "sequences" | "templates" | "analytics";
type FilterKey = "all" | "unread" | "starred" | "important";

type Template = {
  id: number;
  name: string;
  category: string;
  subject: string;
  preview: string;
  body: string;
  uses: number;
  responseRate: number;
  lastUsed: string;
  favorite: boolean;
};

// Derived inbox message from real creator engagement data
type InboxMessage = {
  id: string;
  creatorName: string;
  creatorEmail?: string;
  creatorId: string;
  platform?: string;
  campaignId: string;
  campaignName: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  starred: boolean;
  important: boolean;
  labels: string[];
  status: string;
  engagement: CreatorEngagement;
  aiSuggestion: string | null;
};

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  responded: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Responded" },
  negotiating: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Negotiating" },
  agreed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Agreed" },
  declined: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Declined" },
  contacted: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "Contacted" },
};

const ENGAGEMENT_COLORS: Record<string, string> = {
  contacted: "bg-gray-400",
  responded: "bg-blue-500",
  negotiating: "bg-amber-500",
  agreed: "bg-emerald-500",
  declined: "bg-red-500",
};

// ── Build inbox messages from real data ──────────────────────

function buildInboxMessages(data: AggregateOutreach): InboxMessage[] {
  const messages: InboxMessage[] = [];

  for (const campaign of data.perCampaign) {
    for (const eng of campaign.engagements) {
      if (eng.status === "contacted") continue; // Skip non-responders

      const lastMsg = eng.message_history?.length > 0
        ? eng.message_history[eng.message_history.length - 1]
        : null;
      const lastCreatorMsg = eng.message_history?.filter(m => m.from !== "brand").pop();

      const isRecent = eng.updated_at
        ? Date.now() - new Date(eng.updated_at).getTime() < 48 * 60 * 60 * 1000
        : false;

      // Determine AI suggestion based on status
      let aiSuggestion: string | null = null;
      if (eng.status === "responded") {
        aiSuggestion = `Review ${eng.creator_name || "creator"}'s response and consider a counter-offer`;
      } else if (eng.status === "negotiating" && eng.latest_proposal) {
        const fee = eng.latest_proposal.fee_gbp || eng.latest_proposal.fee;
        aiSuggestion = fee
          ? `Counter-offer around £${Math.round(Number(fee) * 0.85).toLocaleString()} with performance bonus`
          : "Generate an AI counter-offer to move negotiation forward";
      }

      messages.push({
        id: eng.id,
        creatorName: eng.creator_name || eng.creator_id,
        creatorEmail: eng.creator_email,
        creatorId: eng.creator_id,
        platform: eng.platform,
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        subject: lastCreatorMsg
          ? `Re: ${campaign.campaignName}`
          : `${campaign.campaignName} — ${eng.creator_name || eng.creator_id}`,
        preview: lastMsg?.body || "No messages yet",
        timestamp: eng.updated_at || eng.created_at,
        unread: isRecent && lastMsg?.from !== "brand",
        starred: eng.status === "agreed",
        important: eng.status === "negotiating" || eng.status === "responded",
        labels: [eng.status, ...(eng.platform ? [eng.platform] : [])],
        status: eng.status,
        engagement: eng,
        aiSuggestion,
      });
    }
  }

  // Sort by most recent first
  messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return messages;
}

// ── Reply Composer ───────────────────────────────────────────

function ReplyComposer({
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
    <div className="p-6 border-t border-gray-200">
      <div className="flex gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write your reply..."
          rows={3}
          className="flex-1 text-sm px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F4538] focus:ring-1 focus:ring-[#2F4538]/20 outline-none transition-colors resize-none"
          disabled={sending}
        />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="px-6 py-2.5 bg-[#2F4538] hover:bg-[#1f2f26] disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
          Reply
        </button>
        <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

// ── Status Actions ──────────────────────────────────────────

function StatusActions({
  campaignId,
  creatorId,
  currentStatus,
  onUpdated,
}: {
  campaignId: string;
  creatorId: string;
  currentStatus: string;
  onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    setUpdating(newStatus);
    try {
      await updateEngagementStatus(campaignId, creatorId, newStatus);
      onUpdated();
    } catch {
      // retry
    } finally {
      setUpdating(null);
    }
  }

  if (currentStatus === "contacted") return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {currentStatus !== "agreed" && (
        <button
          onClick={() => handleStatusChange("agreed")}
          disabled={updating !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          {updating === "agreed" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Mark Agreed
        </button>
      )}
      {currentStatus !== "declined" && (
        <button
          onClick={() => handleStatusChange("declined")}
          disabled={updating !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {updating === "declined" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Mark Declined
        </button>
      )}
      {currentStatus !== "negotiating" && currentStatus !== "contacted" && (
        <button
          onClick={() => handleStatusChange("negotiating")}
          disabled={updating !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          {updating === "negotiating" ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
          Negotiating
        </button>
      )}
    </div>
  );
}

// ── Sequence templates ───────────────────────────────────────

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 1,
    name: "Initial Outreach — Product Launch",
    category: "outreach",
    subject: "Partnership Opportunity: {{campaign_name}}",
    preview: "Hi {{first_name}}, I came across your content and love your style...",
    body: "Hi {{first_name}},\n\nI came across your content and love your style. We're launching {{campaign_name}} and think you'd be a perfect fit.\n\nWould you be interested in collaborating? We'd love to discuss the details.\n\nBest,\n{{brand_name}}",
    uses: 142,
    responseRate: 28,
    lastUsed: "2 hours ago",
    favorite: true,
  },
  {
    id: 2,
    name: "Follow-up #1",
    category: "follow-up",
    subject: "Re: Partnership Opportunity",
    preview: "Hi {{first_name}}, I wanted to follow up on my previous message...",
    body: "Hi {{first_name}},\n\nI wanted to follow up on my previous message about {{campaign_name}}. I think your audience would really resonate with this campaign.\n\nWould you have time for a quick chat this week?\n\nBest,\n{{brand_name}}",
    uses: 89,
    responseRate: 22,
    lastUsed: "1 day ago",
    favorite: false,
  },
  {
    id: 3,
    name: "Negotiation Counter-Offer",
    category: "negotiation",
    subject: "Re: {{subject}}",
    preview: "Thanks for your interest! Based on the campaign scope...",
    body: "Thanks for your interest! Based on the campaign scope, we'd like to propose the following:\n\n- Fee: {{proposed_fee}}\n- Deliverables: {{deliverables}}\n- Timeline: {{timeline}}\n\nLet me know your thoughts!\n\nBest,\n{{brand_name}}",
    uses: 56,
    responseRate: 35,
    lastUsed: "3 days ago",
    favorite: true,
  },
  {
    id: 4,
    name: "Contract & Next Steps",
    category: "closing",
    subject: "Excited to Work Together!",
    preview: "Great! I'm attaching the contract and campaign details...",
    body: "Great! I'm attaching the contract and campaign details for your review.\n\nKey details:\n- Campaign: {{campaign_name}}\n- Fee: {{agreed_fee}}\n- Deliverables: {{deliverables}}\n- Deadline: {{deadline}}\n\nPlease review and sign at your earliest convenience.\n\nBest,\n{{brand_name}}",
    uses: 103,
    responseRate: 92,
    lastUsed: "5 hours ago",
    favorite: false,
  },
];

const TEMPLATE_STORAGE_KEY = "hudey-outreach-templates";

function loadTemplates(): Template[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_TEMPLATES;
}

function saveTemplates(templates: Template[]) {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch { /* ignore */ }
}

// ── Template Editor Modal ────────────────────────────────────

function TemplateEditorModal({
  template,
  onSave,
  onClose,
}: {
  template: Template | null; // null = create new
  onSave: (t: Template) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [category, setCategory] = useState(template?.category || "outreach");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;
    onSave({
      id: template?.id || Date.now(),
      name: name.trim(),
      category,
      subject: subject.trim(),
      preview: body.trim().slice(0, 80) + (body.trim().length > 80 ? "..." : ""),
      body: body.trim(),
      uses: template?.uses || 0,
      responseRate: template?.responseRate || 0,
      lastUsed: template?.lastUsed || "Never",
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
              placeholder="e.g. Initial Outreach — Product Launch"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent bg-white"
            >
              <option value="outreach">Outreach</option>
              <option value="follow-up">Follow-up</option>
              <option value="negotiation">Negotiation</option>
              <option value="closing">Closing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Partnership Opportunity: {{campaign_name}}"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your template message here... Use {{variables}} for dynamic content."
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Available variables: {"{{first_name}}"}, {"{{campaign_name}}"}, {"{{brand_name}}"}, {"{{proposed_fee}}"}, {"{{deliverables}}"}
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

// ── Loading Skeleton ─────────────────────────────────────────

function OutreachSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="h-96 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="lg:col-span-2 h-96 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function OutreachPage() {
  const { user, checking } = useRequireAuth();
  const [data, setData] = useState<AggregateOutreach | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTab, setSelectedTab] = useState<TabKey>("inbox");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>(() => loadTemplates());
  const [editingTemplate, setEditingTemplate] = useState<Template | null | "new">(null); // null=closed, "new"=create, Template=edit

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getAggregateOutreach()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  const handleDataChange = useCallback(() => {
    setTimeout(() => setRefreshKey((k) => k + 1), 500);
  }, []);

  function handleSaveTemplate(t: Template) {
    setTemplates((prev) => {
      const exists = prev.find((p) => p.id === t.id);
      const next = exists ? prev.map((p) => (p.id === t.id ? t : p)) : [...prev, t];
      saveTemplates(next);
      return next;
    });
    setEditingTemplate(null);
  }

  function handleDeleteTemplate(id: number) {
    setTemplates((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveTemplates(next);
      return next;
    });
  }

  function handleDuplicateTemplate(t: Template) {
    const copy: Template = { ...t, id: Date.now(), name: `${t.name} (Copy)`, uses: 0, responseRate: 0, lastUsed: "Never" };
    setTemplates((prev) => {
      const next = [...prev, copy];
      saveTemplates(next);
      return next;
    });
  }

  function handleToggleFavorite(id: number) {
    setTemplates((prev) => {
      const next = prev.map((t) => t.id === id ? { ...t, favorite: !t.favorite } : t);
      saveTemplates(next);
      return next;
    });
  }

  // Build inbox messages from real data (memoized)
  const inboxMessages = useMemo(() => (data ? buildInboxMessages(data) : []), [data]);
  const selectedMessage = useMemo(
    () => inboxMessages.find((m) => m.id === selectedMessageId) || null,
    [inboxMessages, selectedMessageId]
  );

  // Apply filters (memoized)
  const filteredMessages = useMemo(() => {
    let msgs = inboxMessages;
    if (selectedFilter === "unread") msgs = msgs.filter((m) => m.unread);
    else if (selectedFilter === "starred") msgs = msgs.filter((m) => m.starred);
    else if (selectedFilter === "important") msgs = msgs.filter((m) => m.important);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      msgs = msgs.filter((msg) =>
        msg.creatorName.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.preview.toLowerCase().includes(q) ||
        msg.campaignName.toLowerCase().includes(q)
      );
    }
    return msgs;
  }, [inboxMessages, selectedFilter, searchQuery]);

  // Compute quick stats from real data (memoized)
  const { totalSent, totalResponses, responseRate, openRate, unreadCount } = useMemo(() => {
    const sent = data?.totalSent || 0;
    const responses = data
      ? (data.engagementsByStatus["responded"] || 0) +
        (data.engagementsByStatus["negotiating"] || 0) +
        (data.engagementsByStatus["agreed"] || 0)
      : 0;
    const rRate = data && data.totalEngagements > 0
      ? Math.round((responses / data.totalEngagements) * 100)
      : 0;
    const oRate = data && data.totalSent > 0
      ? Math.round((data.totalOpened / data.totalSent) * 100)
      : 0;
    const unread = inboxMessages.filter((m) => m.unread).length;
    return { totalSent: sent, totalResponses: responses, responseRate: rRate, openRate: oRate, unreadCount: unread };
  }, [data, inboxMessages]);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "inbox", label: "Inbox", count: unreadCount },
    { key: "sent", label: "Sent" },
    { key: "sequences", label: "Sequences" },
    { key: "templates", label: "Templates" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Outreach</h1>
              <p className="text-gray-500 text-sm mt-1">Manage all your influencer communications</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
                <div className="text-[10px] sm:text-xs text-blue-700 font-medium mb-1">Inbox</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{unreadCount}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
                <div className="text-[10px] sm:text-xs text-green-700 font-medium mb-1">Response Rate</div>
                <div className="text-xl sm:text-2xl font-bold text-green-900">{responseRate}%</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
                <div className="text-[10px] sm:text-xs text-purple-700 font-medium mb-1">Open Rate</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-900">{openRate}%</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4 border border-orange-200">
                <div className="text-[10px] sm:text-xs text-orange-700 font-medium mb-1">Total Sent</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-900">{totalSent}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 sm:gap-6 border-b border-gray-200 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  selectedTab === tab.key
                    ? "text-[#2F4538]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 inline-flex items-center justify-center font-semibold">
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
        <OutreachSkeleton />
      ) : !data ? (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No outreach data yet</p>
            <p className="text-[13px] text-gray-400 mt-1">
              Outreach data will appear after you send campaign emails.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* ─── Inbox Tab ─────────────────────────────────── */}
          {selectedTab === "inbox" && (
            <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "calc(100vh - 300px)" }}>
              {/* Message List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Search and Filters */}
                  <div className="p-4 border-b border-gray-200 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F4538] focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["all", "unread", "starred", "important"] as FilterKey[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedFilter === filter
                              ? "bg-[#2F4538] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="divide-y divide-gray-200 max-h-[calc(100vh-420px)] overflow-y-auto">
                    {filteredMessages.length === 0 ? (
                      <div className="p-8 text-center">
                        <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No messages match your filter</p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <button
                          key={message.id}
                          onClick={() => setSelectedMessageId(message.id)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            message.unread ? "bg-blue-50/50" : ""
                          } ${selectedMessageId === message.id ? "border-l-4 border-[#2F4538] bg-gray-50" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F4538] to-[#D16B42] flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                {message.creatorName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`font-semibold text-sm truncate ${message.unread ? "text-gray-900" : "text-gray-700"}`}>
                                    {message.creatorName}
                                  </span>
                                  {message.starred && (
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeAgo(message.timestamp)}</span>
                              </div>
                              {message.platform && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs text-gray-500 capitalize">{message.platform}</span>
                                  {message.creatorEmail && (
                                    <span className="text-xs text-gray-400">• {message.creatorEmail}</span>
                                  )}
                                </div>
                              )}
                              <div className={`text-sm mb-1 truncate ${message.unread ? "font-medium text-gray-900" : "text-gray-600"}`}>
                                {message.subject}
                              </div>
                              <div className="text-xs text-gray-500 line-clamp-2">
                                {message.preview}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {message.labels.slice(0, 2).map((label, index) => (
                                  <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Message Detail */}
              <div className="lg:col-span-2">
                {selectedMessage ? (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Message Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2F4538] to-[#D16B42] flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-white">
                              {selectedMessage.creatorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{selectedMessage.creatorName}</h3>
                              {selectedMessage.starred && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {selectedMessage.creatorEmail || selectedMessage.creatorId}
                              {selectedMessage.platform && ` • ${selectedMessage.platform}`}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{formatTime(selectedMessage.timestamp)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Star className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Archive className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xl font-semibold text-gray-900 mb-2">{selectedMessage.subject}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {selectedMessage.campaignName}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[selectedMessage.status]?.bg || "bg-gray-50"} ${STATUS_STYLES[selectedMessage.status]?.text || "text-gray-600"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[selectedMessage.status]?.dot || "bg-gray-400"}`} />
                          {STATUS_STYLES[selectedMessage.status]?.label || selectedMessage.status}
                        </span>
                      </div>
                    </div>

                    {/* Message Thread */}
                    <div className="p-6 border-b border-gray-200 max-h-[400px] overflow-y-auto">
                      {selectedMessage.engagement.message_history?.length > 0 ? (
                        <div className="space-y-3">
                          {selectedMessage.engagement.message_history.map((msg, i) => {
                            const isBrand = msg.from === "brand";
                            return (
                              <div
                                key={i}
                                className={`rounded-lg px-4 py-3 text-sm ${
                                  isBrand
                                    ? "bg-gray-50 border border-gray-100"
                                    : "bg-blue-50 border border-blue-100"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium ${isBrand ? "text-gray-500" : "text-blue-600"}`}>
                                    {isBrand ? "Hudey AI" : selectedMessage.creatorName}
                                  </span>
                                  <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap text-gray-700">{msg.body}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic text-center py-8">No messages in this thread yet</p>
                      )}
                    </div>

                    {/* Proposed / Agreed Terms */}
                    {selectedMessage.engagement.latest_proposal &&
                      Object.keys(selectedMessage.engagement.latest_proposal).length > 0 && (
                        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Latest Proposal</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            {(selectedMessage.engagement.latest_proposal.fee_gbp || selectedMessage.engagement.latest_proposal.fee) && (
                              <span className="text-gray-700">
                                Fee: <strong>£{Number(selectedMessage.engagement.latest_proposal.fee_gbp || selectedMessage.engagement.latest_proposal.fee).toLocaleString()}</strong>
                              </span>
                            )}
                            {selectedMessage.engagement.latest_proposal.deliverables && (
                              <span className="text-gray-600">
                                {Array.isArray(selectedMessage.engagement.latest_proposal.deliverables)
                                  ? selectedMessage.engagement.latest_proposal.deliverables.join(", ")
                                  : String(selectedMessage.engagement.latest_proposal.deliverables)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* AI Suggestion */}
                    {selectedMessage.aiSuggestion && (
                      <div className="p-6 bg-gradient-to-br from-[#E8DCC8]/30 to-[#E8DCC8]/10 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2F4538] to-[#1f2f26] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-[#D16B42]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                              AI Suggestion
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                High Confidence
                              </span>
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">{selectedMessage.aiSuggestion}</p>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/negotiator`}
                                className="px-4 py-2 bg-[#2F4538] hover:bg-[#1f2f26] text-white rounded-lg font-medium text-sm transition-colors"
                              >
                                Open in Negotiator
                              </Link>
                              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white font-medium text-sm transition-colors">
                                Write Custom Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <StatusActions
                        campaignId={selectedMessage.campaignId}
                        creatorId={selectedMessage.creatorId}
                        currentStatus={selectedMessage.status}
                        onUpdated={handleDataChange}
                      />
                    </div>

                    {/* Reply Composer */}
                    {selectedMessage.status !== "declined" && selectedMessage.status !== "agreed" && (
                      <ReplyComposer
                        campaignId={selectedMessage.campaignId}
                        creatorId={selectedMessage.creatorId}
                        onSent={handleDataChange}
                      />
                    )}

                    {/* Quick Actions */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                      <div className="flex gap-3">
                        <Link
                          href={`/campaigns/${selectedMessage.campaignId}`}
                          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-white font-medium text-sm transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Campaign
                        </Link>
                        <Link
                          href="/negotiator"
                          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-white font-medium text-sm transition-colors flex items-center gap-2"
                        >
                          <Bot className="w-4 h-4" />
                          AI Negotiator
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 h-full flex items-center justify-center p-12">
                    <div className="text-center">
                      <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No message selected</h3>
                      <p className="text-gray-500">Select a message from the list to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Sent Tab ──────────────────────────────────── */}
          {selectedTab === "sent" && (
            <div className="space-y-6">
              {/* Email Delivery Overview */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Email Delivery Overview</h2>
                  {data.totalSent === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No emails sent yet</p>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { label: "Sent", value: data.totalSent, color: "bg-gray-400", total: data.totalSent },
                        { label: "Delivered", value: data.totalDelivered, color: "bg-blue-500", total: data.totalSent },
                        { label: "Opened", value: data.totalOpened, color: "bg-green-500", total: data.totalSent },
                        { label: "Clicked", value: data.totalClicked, color: "bg-emerald-500", total: data.totalSent },
                        { label: "Bounced", value: data.totalBounced, color: "bg-red-500", total: data.totalSent },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{bar.label}</span>
                            <span className="font-medium text-gray-900">
                              {bar.value} <span className="text-gray-400 font-normal">({pct(bar.value, bar.total)})</span>
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${bar.color}`}
                              style={{ width: `${bar.total > 0 ? Math.max((bar.value / bar.total) * 100, 2) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Response Funnel */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Response Funnel</h2>
                  <div className="space-y-4">
                    {[
                      { key: "contacted", label: "Contacted", color: "bg-gray-400" },
                      { key: "responded", label: "Responded", color: "bg-blue-500" },
                      { key: "negotiating", label: "Negotiating", color: "bg-amber-500" },
                      { key: "agreed", label: "Agreed", color: "bg-emerald-500" },
                      { key: "declined", label: "Declined", color: "bg-red-500" },
                    ].map((stage) => {
                      const count = data.engagementsByStatus[stage.key] || 0;
                      const total = data.totalEngagements;
                      const width = total > 0 ? Math.max((count / total) * 100, 4) : 4;
                      return (
                        <div key={stage.key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{stage.label}</span>
                            <span className="font-medium text-gray-900">
                              {count} <span className="text-gray-400 font-normal">({pct(count, total)})</span>
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${stage.color}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Per-campaign breakdown */}
              {data.perCampaign.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">By Campaign</h2>
                  <div className="space-y-3">
                    {data.perCampaign.map((item) => (
                      <div key={item.campaignId} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 bg-[#E8DCC8]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Mail className="w-4 h-4 text-[#2F4538]" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/campaigns/${item.campaignId}`}
                                className="text-sm font-semibold text-gray-900 hover:text-[#2F4538] transition-colors truncate block"
                              >
                                {item.campaignName}
                              </Link>
                            </div>
                          </div>
                          <Link
                            href={`/campaigns/${item.campaignId}`}
                            className="text-sm text-[#2F4538] hover:text-[#1f2f26] font-medium flex-shrink-0"
                          >
                            View Campaign →
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="p-2.5 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-0.5">Sent</div>
                            <div className="text-lg font-bold text-gray-900">{item.email.total_sent}</div>
                          </div>
                          <div className="p-2.5 bg-blue-50 rounded-lg">
                            <div className="text-xs text-blue-600 mb-0.5">Delivered</div>
                            <div className="text-lg font-bold text-blue-900">{item.email.delivered}</div>
                          </div>
                          <div className="p-2.5 bg-green-50 rounded-lg">
                            <div className="text-xs text-green-600 mb-0.5">Opened</div>
                            <div className="text-lg font-bold text-green-900">{item.email.opened}</div>
                          </div>
                          <div className="p-2.5 bg-emerald-50 rounded-lg">
                            <div className="text-xs text-emerald-600 mb-0.5">Clicked</div>
                            <div className="text-lg font-bold text-emerald-900">{item.email.clicked}</div>
                          </div>
                          <div className="p-2.5 bg-purple-50 rounded-lg">
                            <div className="text-xs text-purple-600 mb-0.5">Creators</div>
                            <div className="text-lg font-bold text-purple-900">{item.engagements.length}</div>
                          </div>
                        </div>
                        {/* Engagement status dots */}
                        {item.engagements.length > 0 && (
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
                            {Object.entries(
                              item.engagements.reduce((acc, e) => {
                                acc[e.status] = (acc[e.status] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([status, count]) => (
                              <span key={status} className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${ENGAGEMENT_COLORS[status] || "bg-gray-300"}`} />
                                {count} {status}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Sequences Tab ─────────────────────────────── */}
          {selectedTab === "sequences" && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="w-16 h-16 rounded-2xl bg-[#2F4538]/10 flex items-center justify-center mb-5">
                <Mail className="w-8 h-8 text-[#2F4538]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sequences Coming Soon</h2>
              <p className="text-sm text-gray-500 max-w-md text-center leading-relaxed">
                Automated multi-step follow-up sequences for influencer outreach.
                Set triggers, delays, and conditions to nurture creator relationships on autopilot.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                In Development
              </span>
            </div>
          )}

          {/* ─── Templates Tab ─────────────────────────────── */}
          {selectedTab === "templates" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Message Templates</h2>
                  <p className="text-sm text-gray-500 mt-1">Pre-built templates for different outreach scenarios</p>
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
                  <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No templates yet</p>
                  <p className="text-sm text-gray-400 mt-1 mb-4">Create your first outreach template to get started</p>
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
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {template.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Subject:</div>
                        <div className="text-sm font-medium text-gray-900 mb-3">{template.subject}</div>
                        <div className="text-xs text-gray-500 mb-1">Preview:</div>
                        <div className="text-sm text-gray-700">{template.preview}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-gray-900">{template.uses}</div>
                          <div className="text-xs text-gray-500">Uses</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-900">{template.responseRate}%</div>
                          <div className="text-xs text-green-700">Response</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs font-semibold text-gray-900">Last Used</div>
                          <div className="text-xs text-gray-500">{template.lastUsed}</div>
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
                <TemplateEditorModal
                  template={editingTemplate === "new" ? null : editingTemplate}
                  onSave={handleSaveTemplate}
                  onClose={() => setEditingTemplate(null)}
                />
              )}
            </div>
          )}

          {/* ─── Analytics Tab ─────────────────────────────── */}
          {selectedTab === "analytics" && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Sent</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{data.totalSent}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Responses</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{totalResponses}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Response Rate</div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">{responseRate}%</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Open Rate</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">{openRate}%</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Delivered</div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{data.totalDelivered}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                  <div className="text-sm text-gray-500 mb-1">Bounced</div>
                  <div className="text-2xl sm:text-3xl font-bold text-red-500">{data.totalBounced}</div>
                </div>
              </div>

              {/* Platform + Campaign Performance */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Campaign */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Performance by Campaign</h2>
                  <div className="space-y-4">
                    {data.perCampaign.map((campaign) => {
                      const rate = campaign.email.total_sent > 0
                        ? Math.round((campaign.email.opened / campaign.email.total_sent) * 100)
                        : 0;
                      return (
                        <div key={campaign.campaignId}>
                          <div className="flex items-center justify-between mb-2">
                            <Link
                              href={`/campaigns/${campaign.campaignId}`}
                              className="font-medium text-gray-900 hover:text-[#2F4538] transition-colors truncate"
                            >
                              {campaign.campaignName}
                            </Link>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-gray-900">{campaign.email.total_sent} sent</div>
                              <div className="text-xs text-green-600">{rate}% opened</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-[#2F4538] h-2 rounded-full transition-all" style={{ width: `${rate}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performing */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Templates</h2>
                  <div className="space-y-4">
                    {[...templates].sort((a, b) => b.responseRate - a.responseRate).map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 mb-1 truncate">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.uses} uses</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-green-600">{template.responseRate}%</div>
                          <div className="text-xs text-gray-500">Response Rate</div>
                        </div>
                      </div>
                    ))}
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
