/**
 * Campaign PDF generator — per-campaign full report.
 *
 * Sections: title, metrics, funnel, brief, strategy, email delivery, creators, AI insights.
 */

import jsPDF from "jspdf";
import type { Campaign, EmailDeliverySummary } from "@/lib/api";
import {
  COLORS,
  PAGE,
  FONT,
  drawHeader,
  stampFooters,
  ensureSpace,
  drawSectionTitle,
  formatPdfDate,
} from "./pdf-theme";
import {
  drawMetricGrid,
  drawFunnelBars,
  drawKeyValuePairs,
  drawBulletList,
  drawTable,
  type PdfMetric,
  type FunnelStage,
} from "./pdf-shared";

// ── Types ────────────────────────────────────────────────

export type CampaignPdfData = {
  campaign: Campaign;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engagements: any[];
  emailSummary: EmailDeliverySummary;
  totalCreators: number;
  respondedCount: number;
  agreedCount: number;
  negotiatingCount: number;
  declinedCount: number;
  emailsSent: number;
  emailsDelivered: number;
  deliveryRate: number;
  responseRate: number;
};

// ── Generator ────────────────────────────────────────────

export async function generateCampaignPdf(data: CampaignPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const title = `Campaign Report: ${data.campaign.name}`;

  drawHeader(doc, title);
  let y = PAGE.marginTop + 2;

  // ── 1. Title Block ──────────────────────────────────────

  // Campaign name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.title);
  doc.setTextColor(...COLORS.gray900);
  const nameLines = doc.splitTextToSize(data.campaign.name, PAGE.contentWidth);
  doc.text(nameLines, PAGE.marginLeft, y);
  y += nameLines.length * 7 + 2;

  // Status badge
  const status = data.campaign.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const badgeColor = getStatusBadgeColor(data.campaign.status);
  const badgeWidth = doc.getTextWidth(status) + 6;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(PAGE.marginLeft, y - 3.5, badgeWidth, 5.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.white);
  doc.text(status, PAGE.marginLeft + 3, y);
  y += 3;

  // Dates
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.gray600);
  let dateText = `Created ${formatPdfDate(data.campaign.created_at)}`;
  if (data.campaign.completed_at) {
    dateText += `  |  Completed ${formatPdfDate(data.campaign.completed_at)}`;
  }
  doc.text(dateText, PAGE.marginLeft, y + 4);
  y += 10;

  // Budget summary line
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brief = (data.campaign.brief || (data.campaign.result_json as any)?.brief) as Record<string, any> | undefined;
  const budgetGBP = brief?.budget_gbp ? Number(brief.budget_gbp) : 0;
  if (budgetGBP > 0) {
    doc.setFillColor(...COLORS.forestGreen);
    doc.roundedRect(PAGE.marginLeft, y, PAGE.contentWidth, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.text(`Budget: \u00a3${budgetGBP.toLocaleString()}`, PAGE.marginLeft + 5, y + 7.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    doc.text(
      `${data.totalCreators} creators  |  ${data.agreedCount} deals agreed  |  ${data.responseRate}% response rate`,
      PAGE.marginLeft + PAGE.contentWidth - 5,
      y + 7.5,
      { align: "right" }
    );
    y += 18;
  } else {
    y += 4;
  }

  // ── 2. Key Metrics ─────────────────────────────────────

  y = drawSectionTitle(doc, y, "Key Metrics", title);

  const metrics: PdfMetric[] = [
    { label: "Creators Contacted", value: String(data.totalCreators), accent: COLORS.blue500 },
    { label: "Response Rate", value: data.responseRate > 0 ? `${data.responseRate}%` : "\u2014", sub: `${data.respondedCount} responded`, accent: COLORS.purple500 },
    { label: "Emails Delivered", value: String(data.emailsDelivered), sub: `${data.deliveryRate}% delivery`, accent: COLORS.forestGreen },
    { label: "Deals Agreed", value: String(data.agreedCount), sub: data.totalCreators > 0 ? `${Math.round((data.agreedCount / data.totalCreators) * 100)}% conversion` : "", accent: COLORS.green500 },
  ];
  y = drawMetricGrid(doc, y, metrics, 4, title);

  // ── 3. Response Funnel ─────────────────────────────────

  if (data.totalCreators > 0) {
    y = drawSectionTitle(doc, y, "Response Funnel", title);
    const stages: FunnelStage[] = [
      { label: "Contacted", count: data.totalCreators, total: data.totalCreators, color: COLORS.blue500 },
      { label: "Responded", count: data.respondedCount, total: data.totalCreators, color: COLORS.purple500 },
      { label: "Negotiating", count: data.negotiatingCount, total: data.totalCreators, color: [...COLORS.terracotta] as [number, number, number] },
      { label: "Agreed", count: data.agreedCount, total: data.totalCreators, color: COLORS.green500 },
      { label: "Declined", count: data.declinedCount, total: data.totalCreators, color: COLORS.red400 },
    ];
    y = drawFunnelBars(doc, y, stages, title);
  }

  // ── 4. Campaign Brief ──────────────────────────────────

  if (brief && typeof brief === "object") {
    y = drawSectionTitle(doc, y, "Campaign Brief", title);
    const pairs: { label: string; value: string }[] = [];
    if (brief.brand_name) pairs.push({ label: "Brand", value: String(brief.brand_name) });
    if (brief.industry) pairs.push({ label: "Industry", value: String(brief.industry) });
    if (brief.target_audience) pairs.push({ label: "Target Audience", value: String(brief.target_audience) });
    if (brief.key_message) pairs.push({ label: "Key Message", value: String(brief.key_message) });
    if (Array.isArray(brief.platforms)) pairs.push({ label: "Platforms", value: (brief.platforms as string[]).join(", ") });
    if (brief.budget_gbp != null) pairs.push({ label: "Budget", value: `\u00a3${Number(brief.budget_gbp).toLocaleString()}` });
    if (brief.objective) pairs.push({ label: "Objective", value: String(brief.objective) });
    if (pairs.length > 0) y = drawKeyValuePairs(doc, y, pairs, title);
  }

  // ── 5. Strategy ────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strategy = (data.campaign.strategy || (data.campaign.result_json as any)?.strategy) as Record<string, any> | undefined;
  if (strategy && typeof strategy === "object") {
    y = drawSectionTitle(doc, y, "Strategy", title);
    const pairs: { label: string; value: string }[] = [];
    if (strategy.approach) pairs.push({ label: "Approach", value: String(strategy.approach) });
    if (strategy.creator_count != null) pairs.push({ label: "Creator Count", value: String(strategy.creator_count) });
    if (strategy.budget_per_creator) pairs.push({ label: "Budget Per Creator", value: `\u00a3${Number(strategy.budget_per_creator).toLocaleString()}` });
    if (strategy.platform_priority) {
      const plats = Array.isArray(strategy.platform_priority)
        ? (strategy.platform_priority as string[]).join(", ")
        : String(strategy.platform_priority);
      pairs.push({ label: "Platform Priority", value: plats });
    }
    if (strategy.messaging_angle) pairs.push({ label: "Messaging", value: String(strategy.messaging_angle) });
    if (pairs.length > 0) y = drawKeyValuePairs(doc, y, pairs, title);
  }

  // ── 6. Email Delivery ──────────────────────────────────

  if (data.emailsSent > 0) {
    y = drawSectionTitle(doc, y, "Email Delivery", title);

    // Summary metrics
    const emailMetrics: PdfMetric[] = [
      { label: "Sent", value: String(data.emailSummary.total_sent), accent: COLORS.blue500 },
      { label: "Delivered", value: String(data.emailSummary.delivered), accent: COLORS.green500 },
      { label: "Opened", value: String(data.emailSummary.opened), accent: COLORS.purple500 },
      { label: "Clicked", value: String(data.emailSummary.clicked), accent: COLORS.terracotta },
    ];
    if (data.emailSummary.bounced > 0) {
      emailMetrics.push({ label: "Bounced", value: String(data.emailSummary.bounced), accent: COLORS.red400 });
    }
    y = drawMetricGrid(doc, y, emailMetrics, emailMetrics.length > 4 ? 5 : 4, title);

    // Per-creator table
    if (data.emailSummary.per_creator.length > 0) {
      const head = ["Recipient", "Status", "Events"];
      const body = data.emailSummary.per_creator.map((c) => [
        c.recipient || c.creator_id,
        capitalize(c.status),
        c.events.map((e) => capitalize(e.event_type)).join(", "),
      ]);
      y = drawTable(doc, y, head, body, { pageTitle: title });
    }
  }

  // ── 7. Creator List ────────────────────────────────────

  if (data.engagements.length > 0) {
    y = drawSectionTitle(doc, y, "Creators", title);
    const head = ["Creator", "Platform", "Status", "Messages", "Proposed Fee"];
    const body = data.engagements.map((e: {
      creator_name?: string;
      platform?: string;
      status: string;
      message_history?: unknown[];
      latest_proposal?: { fee_gbp?: number };
    }) => [
      e.creator_name || "Unknown",
      capitalize(e.platform || "email"),
      capitalize(e.status),
      String(e.message_history?.length || 0),
      e.latest_proposal?.fee_gbp != null
        ? `\u00a3${Number(e.latest_proposal.fee_gbp).toLocaleString()}`
        : "\u2014",
    ]);
    y = drawTable(doc, y, head, body, { pageTitle: title });
  }

  // ── 8. AI Insights ─────────────────────────────────────

  const result = data.campaign.result_json;
  if (result) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = (result.report || result) as Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insights = (report.insights || result.insights || {}) as Record<string, any>;
    const hasInsights = insights.executive_summary || insights.highlights || insights.recommendations;

    if (hasInsights) {
      y = drawSectionTitle(doc, y, "AI Insights", title);

      // Executive Summary
      if (Array.isArray(insights.executive_summary) && insights.executive_summary.length > 0) {
        y = ensureSpace(doc, y, 10, title);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.gray600);
        doc.text("Executive Summary", PAGE.marginLeft, y);
        y += 5;
        y = drawBulletList(doc, y, insights.executive_summary as string[], {}, title);
        y += 3;
      }

      // What Worked
      if (Array.isArray(insights.highlights) && insights.highlights.length > 0) {
        y = ensureSpace(doc, y, 10, title);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.green500);
        doc.text("What Worked", PAGE.marginLeft, y);
        y += 5;
        y = drawBulletList(doc, y, insights.highlights as string[], { bulletColor: COLORS.green500 }, title);
        y += 3;
      }

      // To Improve
      if (Array.isArray(insights.improvements) && insights.improvements.length > 0) {
        y = ensureSpace(doc, y, 10, title);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.amber500);
        doc.text("To Improve", PAGE.marginLeft, y);
        y += 5;
        y = drawBulletList(doc, y, insights.improvements as string[], { bulletColor: COLORS.amber500 }, title);
        y += 3;
      }

      // ROI / Impact
      if (insights.roi && String(insights.roi) !== "N/A") {
        y = ensureSpace(doc, y, 15, title);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.blue500);
        doc.text("ROI / Impact", PAGE.marginLeft, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.gray900);
        const roiLines = doc.splitTextToSize(String(insights.roi), PAGE.contentWidth);
        y = ensureSpace(doc, y, roiLines.length * 3.5, title);
        doc.text(roiLines, PAGE.marginLeft, y);
        y += roiLines.length * 3.5 + 5;
      }

      // Recommendations
      if (Array.isArray(insights.recommendations) && insights.recommendations.length > 0) {
        y = ensureSpace(doc, y, 10, title);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.gray600);
        doc.text("Recommendations", PAGE.marginLeft, y);
        y += 5;
        y = drawBulletList(doc, y, insights.recommendations as string[], { numbered: true }, title);
      }
    }
  }

  // ── Stamp footers & save ──
  stampFooters(doc);
  const safeName = data.campaign.name.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`hudey-campaign-${safeName}-${date}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function getStatusBadgeColor(status: string): readonly [number, number, number] {
  switch (status) {
    case "running":
      return COLORS.green500;
    case "completed":
      return COLORS.blue500;
    case "awaiting_approval":
      return COLORS.purple500;
    case "failed":
      return COLORS.red400;
    default:
      return COLORS.amber500;
  }
}
