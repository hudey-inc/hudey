/**
 * API client tests — verify request shaping, error handling, and type contracts.
 *
 * Mocks fetch() and Supabase auth to test the authFetch wrapper and
 * each API function's request/response handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client before importing API module
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: { access_token: "test-token-123" } } }),
      getUser: () => Promise.resolve({ data: { user: { id: "u1" } } }),
    },
  }),
}));

// Must import after mocks are set up
import {
  listCampaigns,
  getCampaign,
  deleteCampaign,
  getBrand,
  updateBrand,
  listApprovals,
  decideApproval,
  runCampaign,
  createCampaign,
  getEngagements,
  getEmailEvents,
  listNotifications,
  getUnreadCount,
} from "@/lib/api";

const API_URL = "http://localhost:8000";

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Campaigns ──────────────────────────────────────────────

describe("listCampaigns", () => {
  it("returns campaigns on success", async () => {
    const campaigns = [{ id: "c1", name: "Test", status: "draft" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(campaigns),
      })
    );

    const result = await listCampaigns();
    expect(result).toEqual(campaigns);
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/campaigns`,
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("throws on error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Not authenticated" }),
      })
    );

    await expect(listCampaigns()).rejects.toThrow("Not authenticated");
  });
});

describe("getCampaign", () => {
  it("returns campaign on success", async () => {
    const campaign = { id: "c1", name: "Lasena", status: "completed" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(campaign),
      })
    );

    const result = await getCampaign("c1");
    expect(result?.name).toBe("Lasena");
  });

  it("returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    const result = await getCampaign("bad-id");
    expect(result).toBeNull();
  });
});

describe("deleteCampaign", () => {
  it("sends DELETE request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    );

    const result = await deleteCampaign("c1");
    expect(result.ok).toBe(true);
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/campaigns/c1");
    expect(opts.method).toBe("DELETE");
  });
});

describe("createCampaign", () => {
  it("sends POST with body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-id" }),
      })
    );

    const result = await createCampaign({ brief: {}, name: "Test" });
    expect(result.id).toBe("new-id");
  });
});

describe("runCampaign", () => {
  it("sends POST to run endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    );

    const result = await runCampaign("c1");
    expect(result.ok).toBe(true);
  });
});

// ── Brand ──────────────────────────────────────────────────

describe("getBrand", () => {
  it("returns brand profile", async () => {
    const brand = { id: "b1", name: "Hudey", industry: "Technology" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(brand),
      })
    );

    const result = await getBrand();
    expect(result.name).toBe("Hudey");
  });
});

describe("updateBrand", () => {
  it("sends PUT with updates", async () => {
    const updated = { id: "b1", name: "Updated" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updated),
      })
    );

    const result = await updateBrand({ name: "Updated" });
    expect(result.name).toBe("Updated");
  });
});

// ── Approvals ──────────────────────────────────────────────

describe("listApprovals", () => {
  it("returns approvals for campaign", async () => {
    const approvals = [{ id: "a1", approval_type: "strategy", status: "pending" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(approvals),
      })
    );

    const result = await listApprovals("c1");
    expect(result).toHaveLength(1);
  });
});

describe("decideApproval", () => {
  it("sends approval decision", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    );

    const result = await decideApproval("a1", "approved", "Looks good");
    expect(result.ok).toBe(true);
  });
});

// ── Engagements ────────────────────────────────────────────

describe("getEngagements", () => {
  it("returns engagements on success", async () => {
    const engagements = [{ id: "e1", creator_id: "cr1", status: "responded" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(engagements),
      })
    );

    const result = await getEngagements("c1");
    expect(result).toHaveLength(1);
  });

  it("returns empty array on error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const result = await getEngagements("c1");
    expect(result).toEqual([]);
  });
});

// ── Email Events ───────────────────────────────────────────

describe("getEmailEvents", () => {
  it("returns delivery summary", async () => {
    const summary = { total_sent: 5, delivered: 4, opened: 3, clicked: 1, bounced: 0, per_creator: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(summary),
      })
    );

    const result = await getEmailEvents("c1");
    expect(result.total_sent).toBe(5);
  });

  it("returns zeroed summary on error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const result = await getEmailEvents("c1");
    expect(result.total_sent).toBe(0);
  });
});

// ── Notifications ──────────────────────────────────────────

describe("listNotifications", () => {
  it("returns notifications on success", async () => {
    const notifs = [{ id: "n1", title: "Test" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(notifs),
      })
    );

    const result = await listNotifications();
    expect(result).toHaveLength(1);
  });

  it("returns empty array on error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    const result = await listNotifications();
    expect(result).toEqual([]);
  });
});

describe("getUnreadCount", () => {
  it("returns count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ count: 5 }),
      })
    );

    const result = await getUnreadCount();
    expect(result).toBe(5);
  });
});

// ── Auth header ────────────────────────────────────────────

describe("authFetch wrapper", () => {
  it("includes Bearer token in Authorization header", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    await listCampaigns();

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = opts.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token-123");
  });
});
