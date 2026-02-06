const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  completed_at?: string;
};

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const res = await fetch(`${API_URL}/api/campaigns`);
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const res = await fetch(`${API_URL}/api/campaigns/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

export async function createCampaign(body: {
  brief?: Record<string, unknown>;
  strategy?: Record<string, unknown>;
  name?: string;
  short_id?: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/campaigns`, {
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
