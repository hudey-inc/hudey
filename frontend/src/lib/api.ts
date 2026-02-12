import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Auth-aware fetch wrapper ─────────────────────────────────

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();

  // Try getSession first (reads from storage, fast)
  let token: string | undefined;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {
    // ignore
  }

  // If no token from getSession, try getUser to force a refresh
  if (!token) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
    } catch {
      // ignore
    }
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

// ── Types ────────────────────────────────────────────────────

export type Brand = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  brand_voice: Record<string, unknown> | null;
  contact_email: string | null;
  created_at: string;
};

export type BrandUpdate = {
  name?: string;
  industry?: string;
  contact_email?: string;
  brand_voice?: Record<string, unknown>;
};

export type CampaignSummary = {
  id: string;
  short_id?: string;
  name: string;
  status: string;
  created_at: string;
};

export type Campaign = CampaignSummary & {
  brief?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
  result_json?: Record<string, unknown>;
  agent_state?: string;
  completed_at?: string;
};

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const res = await authFetch(`${API_URL}/api/campaigns`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch campaigns (${res.status})`);
  }
  return res.json();
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const res = await authFetch(`${API_URL}/api/campaigns/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch campaign (${res.status})`);
  }
  return res.json();
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean }> {
  const res = await authFetch(`${API_URL}/api/campaigns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to delete campaign (${res.status})`);
  }
  return res.json();
}

// ── Brand ─────────────────────────────────────────────────────

export async function getBrand(): Promise<Brand> {
  const res = await authFetch(`${API_URL}/api/brands/me`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch brand (${res.status})`);
  }
  return res.json();
}

export async function updateBrand(updates: BrandUpdate): Promise<Brand> {
  const res = await authFetch(`${API_URL}/api/brands/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update brand (${res.status})`);
  }
  return res.json();
}

// ── Approvals ─────────────────────────────────────────────────

export type Approval = {
  id: string;
  campaign_id: string;
  approval_type: string;
  subject: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  reasoning?: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  created_at: string;
  decided_at?: string;
};

export async function listApprovals(campaignId: string): Promise<Approval[]> {
  const res = await authFetch(
    `${API_URL}/api/campaigns/${campaignId}/approvals`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch approvals (${res.status})`);
  }
  return res.json();
}

export async function decideApproval(
  approvalId: string,
  status: "approved" | "rejected",
  feedback?: string
): Promise<{ ok: boolean }> {
  const res = await authFetch(`${API_URL}/api/approvals/${approvalId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit decision");
  }
  return res.json();
}

// ── Run Campaign ──────────────────────────────────────────────

export async function runCampaign(
  campaignId: string
): Promise<{ ok: boolean }> {
  const res = await authFetch(
    `${API_URL}/api/campaigns/${campaignId}/run`,
    { method: "POST" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to start campaign");
  }
  return res.json();
}

// ── Email Tracking ───────────────────────────────────────────

export type EmailDeliverySummary = {
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  per_creator: {
    creator_id: string;
    email_id: string;
    recipient: string;
    status: string;
    events: { event_type: string; created_at: string }[];
  }[];
};

export async function getEmailEvents(
  campaignId: string
): Promise<EmailDeliverySummary> {
  const res = await authFetch(
    `${API_URL}/api/campaigns/${campaignId}/email-events`
  );
  if (!res.ok)
    return {
      total_sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      per_creator: [],
    };
  return res.json();
}

// ── Creator Engagements ──────────────────────────────────────

export type CreatorEngagement = {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator_name?: string;
  creator_email?: string;
  platform?: string;
  status: "contacted" | "responded" | "negotiating" | "agreed" | "declined";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latest_proposal?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  terms?: Record<string, any>;
  message_history: { from: string; body: string; timestamp: string }[];
  response_timestamp?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export async function getEngagements(
  campaignId: string
): Promise<CreatorEngagement[]> {
  const res = await authFetch(
    `${API_URL}/api/campaigns/${campaignId}/engagements`
  );
  if (!res.ok) return [];
  return res.json();
}

// ── Reply & Status ───────────────────────────────────────────

export async function replyToCreator(
  campaignId: string,
  creatorId: string,
  message: string
): Promise<{ ok: boolean; email_id?: string; message: { from: string; body: string; timestamp: string }; status: string }> {
  const res = await authFetch(`${API_URL}/api/campaigns/${campaignId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creator_id: creatorId, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send reply");
  }
  return res.json();
}

export async function updateEngagementStatus(
  campaignId: string,
  creatorId: string,
  status: string,
  extras?: { terms?: Record<string, unknown>; latest_proposal?: Record<string, unknown> }
): Promise<{ ok: boolean; status: string }> {
  const res = await authFetch(
    `${API_URL}/api/campaigns/${campaignId}/engagements/${creatorId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extras }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update status");
  }
  return res.json();
}

// ── Negotiation ──────────────────────────────────────────────

export type CounterOffer = {
  subject: string;
  body: string;
  proposed_terms: {
    fee_gbp?: number;
    deliverables?: string[];
    deadline?: string;
  };
};

export async function generateCounterOffer(
  campaignId: string,
  creatorId: string
): Promise<{ ok: boolean; counter_offer: CounterOffer; score: number; creator_id: string }> {
  const res = await authFetch(`${API_URL}/api/campaigns/${campaignId}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creator_id: creatorId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate counter-offer");
  }
  return res.json();
}

export async function sendCounterOffer(
  campaignId: string,
  creatorId: string,
  offer: { subject: string; message: string; proposed_terms: Record<string, unknown> }
): Promise<{ ok: boolean; status: string }> {
  const res = await authFetch(`${API_URL}/api/campaigns/${campaignId}/send-counter-offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creator_id: creatorId, ...offer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send counter-offer");
  }
  return res.json();
}

export async function acceptTerms(
  campaignId: string,
  creatorId: string,
  terms?: Record<string, unknown>
): Promise<{ ok: boolean; status: string; terms: Record<string, unknown> }> {
  const res = await authFetch(`${API_URL}/api/campaigns/${campaignId}/accept-terms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creator_id: creatorId, terms }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to accept terms");
  }
  return res.json();
}

// ── Campaigns ─────────────────────────────────────────────────

export async function createCampaign(body: {
  brief?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
  name?: string;
  short_id?: string;
}): Promise<{ id: string }> {
  const res = await authFetch(`${API_URL}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create campaign");
  }
  return res.json();
}

// ── Aggregate Data Helpers ──────────────────────────────────────

export type AggregateMetrics = {
  activeOutreach: number;
  weeklyResponses: number;
  dealProgress: {
    agreed: number;
    negotiating: number;
    contacted: number;
    declined: number;
    responded: number;
  };
  outreachTrend: number[];
  responseTrend: number[];
};

export async function getAggregateMetrics(): Promise<AggregateMetrics> {
  const campaigns = await listCampaigns();

  const activeOutreach = campaigns.filter(
    (c) => c.status === "running" || c.status === "awaiting_approval"
  ).length;

  // Fetch engagements for all campaigns in parallel
  const engagementResults = await Promise.allSettled(
    campaigns.map((c) => getEngagements(c.id))
  );

  const allEngagements: CreatorEngagement[] = [];
  for (const r of engagementResults) {
    if (r.status === "fulfilled") allEngagements.push(...r.value);
  }

  // Count by status
  const dealProgress = { agreed: 0, negotiating: 0, contacted: 0, declined: 0, responded: 0 };
  for (const e of allEngagements) {
    if (e.status in dealProgress) {
      dealProgress[e.status as keyof typeof dealProgress]++;
    }
  }

  // Weekly responses: engagements that responded in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyResponses = allEngagements.filter(
    (e) =>
      e.response_timestamp &&
      new Date(e.response_timestamp) >= oneWeekAgo
  ).length;

  // Build 7-day trend arrays from engagement timestamps
  const now = new Date();
  const outreachTrend: number[] = [];
  const responseTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    outreachTrend.push(
      allEngagements.filter((e) => {
        const d = new Date(e.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length
    );
    responseTrend.push(
      allEngagements.filter((e) => {
        if (!e.response_timestamp) return false;
        const d = new Date(e.response_timestamp);
        return d >= dayStart && d <= dayEnd;
      }).length
    );
  }

  return { activeOutreach, weeklyResponses, dealProgress, outreachTrend, responseTrend };
}

// ── Aggregate Outreach ──────────────────────────────────────────

export type AggregateOutreach = {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalEngagements: number;
  engagementsByStatus: Record<string, number>;
  perCampaign: {
    campaignId: string;
    campaignName: string;
    email: EmailDeliverySummary;
    engagements: CreatorEngagement[];
  }[];
};

export async function getAggregateOutreach(): Promise<AggregateOutreach> {
  const campaigns = await listCampaigns();

  const results = await Promise.allSettled(
    campaigns.map(async (c) => {
      const [email, engagements] = await Promise.all([
        getEmailEvents(c.id),
        getEngagements(c.id),
      ]);
      return { campaignId: c.id, campaignName: c.name, email, engagements };
    })
  );

  let totalSent = 0, totalDelivered = 0, totalOpened = 0, totalClicked = 0, totalBounced = 0;
  let totalEngagements = 0;
  const engagementsByStatus: Record<string, number> = {};
  const perCampaign: AggregateOutreach["perCampaign"] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { campaignId, campaignName, email, engagements } = r.value;
    totalSent += email.total_sent;
    totalDelivered += email.delivered;
    totalOpened += email.opened;
    totalClicked += email.clicked;
    totalBounced += email.bounced;
    totalEngagements += engagements.length;
    for (const e of engagements) {
      engagementsByStatus[e.status] = (engagementsByStatus[e.status] || 0) + 1;
    }
    if (email.total_sent > 0 || engagements.length > 0) {
      perCampaign.push({ campaignId, campaignName, email, engagements });
    }
  }

  return {
    totalSent, totalDelivered, totalOpened, totalClicked, totalBounced,
    totalEngagements, engagementsByStatus, perCampaign,
  };
}

// ── Outreach Inbox Count (lightweight) ──────────────────────────

export async function getOutreachInboxCount(): Promise<number> {
  const campaigns = await listCampaigns();
  const results = await Promise.allSettled(
    campaigns.map((c) => getEngagements(c.id))
  );
  let count = 0;
  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48h window
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const e of r.value) {
      if (e.status === "contacted") continue;
      const lastMsg = e.message_history?.length > 0
        ? e.message_history[e.message_history.length - 1]
        : null;
      const ts = e.updated_at || e.created_at;
      if (ts && new Date(ts).getTime() > cutoff && lastMsg?.from !== "brand") {
        count++;
      }
    }
  }
  return count;
}

// ── Aggregate Analytics ─────────────────────────────────────────

export type AggregateAnalytics = {
  totalCampaigns: number;
  byStatus: Record<string, number>;
  totalCreatorsContacted: number;
  totalAgreed: number;
  totalDeclined: number;
  responseRate: number;
  conversionRate: number;
  emailStats: {
    totalSent: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  perCampaign: {
    id: string;
    name: string;
    status: string;
    creators: number;
    responded: number;
    agreed: number;
    emailsSent: number;
    openRate: number;
  }[];
};

export async function getAggregateAnalytics(): Promise<AggregateAnalytics> {
  const campaigns = await listCampaigns();
  const byStatus: Record<string, number> = {};
  for (const c of campaigns) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }

  const results = await Promise.allSettled(
    campaigns.map(async (c) => {
      const [email, engagements] = await Promise.all([
        getEmailEvents(c.id),
        getEngagements(c.id),
      ]);
      return { id: c.id, name: c.name, status: c.status, email, engagements };
    })
  );

  let totalSent = 0, totalDelivered = 0, totalOpened = 0, totalClicked = 0;
  let totalContacted = 0, totalAgreed = 0, totalDeclined = 0, totalResponded = 0;
  const perCampaign: AggregateAnalytics["perCampaign"] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { id, name, status, email, engagements } = r.value;
    totalSent += email.total_sent;
    totalDelivered += email.delivered;
    totalOpened += email.opened;
    totalClicked += email.clicked;
    totalContacted += engagements.length;
    const responded = engagements.filter((e) => e.status !== "contacted").length;
    const agreed = engagements.filter((e) => e.status === "agreed").length;
    const declined = engagements.filter((e) => e.status === "declined").length;
    totalAgreed += agreed;
    totalDeclined += declined;
    totalResponded += responded;
    perCampaign.push({
      id, name, status,
      creators: engagements.length,
      responded,
      agreed,
      emailsSent: email.total_sent,
      openRate: email.total_sent > 0 ? Math.round((email.opened / email.total_sent) * 100) : 0,
    });
  }

  return {
    totalCampaigns: campaigns.length,
    byStatus,
    totalCreatorsContacted: totalContacted,
    totalAgreed,
    totalDeclined,
    responseRate: totalContacted > 0 ? Math.round((totalResponded / totalContacted) * 100) : 0,
    conversionRate: totalContacted > 0 ? Math.round((totalAgreed / totalContacted) * 100) : 0,
    emailStats: {
      totalSent,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    },
    perCampaign,
  };
}

// ── Full Analytics Dashboard ────────────────────────────────────

export type FullAnalytics = AggregateAnalytics & {
  /** Email delivery breakdown (sent, delivered, opened, clicked, bounced) per campaign */
  emailBreakdown: {
    campaignId: string;
    campaignName: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  }[];
  /** Every creator engagement across all campaigns */
  allCreators: {
    id: string;
    name: string;
    email: string;
    platform: string;
    status: string;
    campaignId: string;
    campaignName: string;
    responded: boolean;
    agreed: boolean;
    responseTimeHours: number | null;
    hasProposal: boolean;
    feeGbp: number | null;
  }[];
  /** Engagement status funnel counts */
  engagementFunnel: Record<string, number>;
  /** Negotiation stats */
  negotiationStats: {
    activeNegotiations: number;
    avgResponseTimeHours: number;
  };
  /** Platform breakdown derived from real creator data */
  platformBreakdown: {
    platform: string;
    creators: number;
    responded: number;
    agreed: number;
    declined: number;
    responseRate: number;
  }[];
};

export async function getFullAnalytics(): Promise<FullAnalytics> {
  const campaigns = await listCampaigns();
  const byStatus: Record<string, number> = {};
  for (const c of campaigns) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  }

  const results = await Promise.allSettled(
    campaigns.map(async (c) => {
      const [email, engagements] = await Promise.all([
        getEmailEvents(c.id),
        getEngagements(c.id),
      ]);
      return { id: c.id, name: c.name, status: c.status, email, engagements };
    })
  );

  let totalSent = 0, totalDelivered = 0, totalOpened = 0, totalClicked = 0;
  let totalContacted = 0, totalAgreed = 0, totalDeclined = 0, totalResponded = 0;
  const perCampaign: AggregateAnalytics["perCampaign"] = [];
  const emailBreakdown: FullAnalytics["emailBreakdown"] = [];
  const allCreators: FullAnalytics["allCreators"] = [];
  const engagementFunnel: Record<string, number> = {};
  const platformMap: Record<string, { creators: number; responded: number; agreed: number; declined: number }> = {};
  const responseTimes: number[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { id, name, status, email, engagements } = r.value;

    // Email totals
    totalSent += email.total_sent;
    totalDelivered += email.delivered;
    totalOpened += email.opened;
    totalClicked += email.clicked;

    // Email per-campaign breakdown
    emailBreakdown.push({
      campaignId: id,
      campaignName: name,
      sent: email.total_sent,
      delivered: email.delivered,
      opened: email.opened,
      clicked: email.clicked,
      bounced: email.bounced,
    });

    // Engagement stats
    totalContacted += engagements.length;
    const responded = engagements.filter((e) => e.status !== "contacted").length;
    const agreed = engagements.filter((e) => e.status === "agreed").length;
    const declined = engagements.filter((e) => e.status === "declined").length;
    totalAgreed += agreed;
    totalDeclined += declined;
    totalResponded += responded;

    perCampaign.push({
      id, name, status,
      creators: engagements.length,
      responded,
      agreed,
      emailsSent: email.total_sent,
      openRate: email.total_sent > 0 ? Math.round((email.opened / email.total_sent) * 100) : 0,
    });

    // Process each creator engagement
    for (const e of engagements) {
      // Funnel counts
      engagementFunnel[e.status] = (engagementFunnel[e.status] || 0) + 1;

      // Platform breakdown
      const plat = (e.platform || "unknown").toLowerCase();
      if (!platformMap[plat]) platformMap[plat] = { creators: 0, responded: 0, agreed: 0, declined: 0 };
      platformMap[plat].creators++;
      if (e.status !== "contacted") platformMap[plat].responded++;
      if (e.status === "agreed") platformMap[plat].agreed++;
      if (e.status === "declined") platformMap[plat].declined++;

      // Response time
      let responseTimeHours: number | null = null;
      if (e.response_timestamp && e.created_at) {
        const diff = new Date(e.response_timestamp).getTime() - new Date(e.created_at).getTime();
        if (diff > 0) {
          responseTimeHours = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
          responseTimes.push(responseTimeHours);
        }
      }

      // Fee from proposal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feeGbp = (e.latest_proposal as any)?.fee_gbp ?? (e.terms as any)?.fee_gbp ?? null;

      allCreators.push({
        id: e.creator_id,
        name: e.creator_name || e.creator_id,
        email: e.creator_email || "",
        platform: plat,
        status: e.status,
        campaignId: id,
        campaignName: name,
        responded: e.status !== "contacted",
        agreed: e.status === "agreed",
        responseTimeHours,
        hasProposal: !!e.latest_proposal,
        feeGbp: typeof feeGbp === "number" ? feeGbp : null,
      });
    }
  }

  const platformBreakdown = Object.entries(platformMap)
    .map(([platform, stats]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      ...stats,
      responseRate: stats.creators > 0 ? Math.round((stats.responded / stats.creators) * 100) : 0,
    }))
    .sort((a, b) => b.creators - a.creators);

  const avgResponseTimeHours =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  return {
    totalCampaigns: campaigns.length,
    byStatus,
    totalCreatorsContacted: totalContacted,
    totalAgreed,
    totalDeclined,
    responseRate: totalContacted > 0 ? Math.round((totalResponded / totalContacted) * 100) : 0,
    conversionRate: totalContacted > 0 ? Math.round((totalAgreed / totalContacted) * 100) : 0,
    emailStats: {
      totalSent,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    },
    perCampaign,
    emailBreakdown,
    allCreators,
    engagementFunnel,
    negotiationStats: {
      activeNegotiations: engagementFunnel["negotiating"] || 0,
      avgResponseTimeHours,
    },
    platformBreakdown,
  };
}

// ── Aggregate Negotiations ──────────────────────────────────────

export type AggregateNegotiations = {
  activeNegotiations: number;
  totalAgreed: number;
  totalDeclined: number;
  avgResponseTimeHours: number;
  negotiations: {
    campaignId: string;
    campaignName: string;
    campaignStatus: string;
    creators: CreatorEngagement[];
  }[];
};

// ── Notifications ────────────────────────────────────────────

export type AppNotification = {
  id: string;
  brand_id: string;
  type: "campaign_approval" | "creator_response" | "campaign_completion";
  title: string;
  body: string | null;
  campaign_id: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export async function listNotifications(): Promise<AppNotification[]> {
  const res = await authFetch(`${API_URL}/api/notifications`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await authFetch(`${API_URL}/api/notifications/unread-count`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || 0;
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ ok: boolean }> {
  const res = await authFetch(
    `${API_URL}/api/notifications/${notificationId}/read`,
    { method: "PUT" }
  );
  if (!res.ok) return { ok: false };
  return res.json();
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const res = await authFetch(`${API_URL}/api/notifications/read-all`, {
    method: "PUT",
  });
  if (!res.ok) return { ok: false };
  return res.json();
}

// ── Aggregate Negotiations ──────────────────────────────────────

export async function getAggregateNegotiations(): Promise<AggregateNegotiations> {
  const campaigns = await listCampaigns();

  const results = await Promise.allSettled(
    campaigns.map(async (c) => {
      const engagements = await getEngagements(c.id);
      return { campaignId: c.id, campaignName: c.name, campaignStatus: c.status, engagements };
    })
  );

  let activeNegotiations = 0;
  let totalAgreed = 0;
  let totalDeclined = 0;
  const responseTimes: number[] = [];
  const negotiations: AggregateNegotiations["negotiations"] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { campaignId, campaignName, campaignStatus, engagements } = r.value;

    // Filter to creators who have progressed beyond "contacted"
    const active = engagements.filter((e) => e.status !== "contacted");
    if (active.length === 0) continue;

    for (const e of active) {
      if (e.status === "negotiating") activeNegotiations++;
      if (e.status === "agreed") totalAgreed++;
      if (e.status === "declined") totalDeclined++;

      // Calculate response time
      if (e.response_timestamp && e.created_at) {
        const diff = new Date(e.response_timestamp).getTime() - new Date(e.created_at).getTime();
        if (diff > 0) responseTimes.push(diff / (1000 * 60 * 60)); // hours
      }
    }

    negotiations.push({ campaignId, campaignName, campaignStatus, creators: active });
  }

  const avgResponseTimeHours =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

  return { activeNegotiations, totalAgreed, totalDeclined, avgResponseTimeHours, negotiations };
}

// ── Creator Discovery ───────────────────────────────────────────

export type DiscoveredCreator = {
  id: string;
  external_id: string | null;
  platform: string;
  username: string;
  display_name: string;
  follower_count: number;
  engagement_rate: number | null;
  categories: string[];
  location: string | null;
  email: string | null;
  is_saved: boolean;
  image_url: string | null;
};

export type CreatorSearchParams = {
  platforms: string[];
  follower_min: number;
  follower_max: number;
  categories?: string[];
  locations?: string[];
  limit?: number;
};

export type CreatorSearchResult = {
  creators: DiscoveredCreator[];
  total: number;
  configured: boolean;
};

export async function searchCreators(
  params: CreatorSearchParams
): Promise<CreatorSearchResult> {
  const res = await authFetch(`${API_URL}/api/creators/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Search failed (${res.status})`);
  }
  return res.json();
}

export async function getSavedCreators(): Promise<DiscoveredCreator[]> {
  const res = await authFetch(`${API_URL}/api/creators/saved`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveCreator(
  creatorId: string
): Promise<{ ok: boolean }> {
  const res = await authFetch(`${API_URL}/api/creators/${creatorId}/save`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Save failed (${res.status})`);
  }
  return res.json();
}

export async function unsaveCreator(
  creatorId: string
): Promise<{ ok: boolean }> {
  const res = await authFetch(`${API_URL}/api/creators/${creatorId}/save`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Unsave failed (${res.status})`);
  }
  return res.json();
}
