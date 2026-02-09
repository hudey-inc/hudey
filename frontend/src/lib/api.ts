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
