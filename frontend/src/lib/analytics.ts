/**
 * Google Analytics event tracking utility.
 *
 * Wraps `gtag('event', ...)` with typed helpers for every key conversion
 * event so the rest of the codebase never touches the GA API directly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// ── Low-level helper ──────────────────────────────────────────

function sendEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, params);
  }
}

// ── Auth events ───────────────────────────────────────────────

export function trackSignup(method: "email" | "google") {
  sendEvent("sign_up", { method });
}

export function trackLogin(method: "password" | "magic_link" | "google") {
  sendEvent("login", { method });
}

// ── Campaign events ───────────────────────────────────────────

export function trackCampaignCreated(source: "form" | "template") {
  sendEvent("campaign_created", { source });
}

// ── Outreach events ───────────────────────────────────────────

export function trackOutreachReply() {
  sendEvent("outreach_reply_sent");
}

export function trackDealAgreed() {
  sendEvent("deal_agreed");
}

export function trackEngagementStatusChange(
  status: "negotiating" | "agreed" | "declined",
) {
  sendEvent("engagement_status_change", { status });
  if (status === "agreed") trackDealAgreed();
}

// ── Landing CTA events (separate GA property) ────────────────

export function trackCTAClick(location: string) {
  sendEvent("cta_click", { location });
}
