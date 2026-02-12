/**
 * Analytics PDF generator — cross-campaign report.
 *
 * Sections: overview metrics, engagement funnel, campaign table,
 * email breakdown, creator summary, platform breakdown.
 */

import jsPDF from "jspdf";
import type { FullAnalytics } from "@/lib/api";
import {
  COLORS,
  PAGE,
  FONT,
  drawHeader,
  stampFooters,
  drawSectionTitle,
} from "./pdf-theme";
import {
  drawMetricGrid,
  drawFunnelBars,
  drawTable,
  type PdfMetric,
  type FunnelStage,
} from "./pdf-shared";

// ── Generator ────────────────────────────────────────────

export async function generateAnalyticsPdf(
  data: FullAnalytics,
  campaignFilter: string
): Promise<void> {
  // Apply campaign filter (same logic as analytics page)
  const filtered =
    campaignFilter === "all"
      ? data
      : {
          ...data,
          perCampaign: data.perCampaign.filter((c) => c.id === campaignFilter),
          allCreators: data.allCreators.filter(
            (c) => c.campaignId === campaignFilter
          ),
          emailBreakdown: data.emailBreakdown.filter(
            (e) => e.campaignId === campaignFilter
          ),
        };

  const campaignName =
    campaignFilter !== "all"
      ? data.perCampaign.find((c) => c.id === campaignFilter)?.name
      : undefined;

  const title = campaignName
    ? `Analytics: ${campaignName}`
    : "Analytics Report";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawHeader(doc, title);
  let y = PAGE.marginTop + 2;

  // ── Title ──────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.title);
  doc.setTextColor(...COLORS.gray900);
  doc.text(title, PAGE.marginLeft, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.small);
  doc.setTextColor(...COLORS.gray600);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(
    campaignFilter === "all"
      ? `All campaigns  |  ${dateStr}`
      : `Filtered report  |  ${dateStr}`,
    PAGE.marginLeft,
    y
  );
  y += 10;

  // ── 1. Overview Metrics ────────────────────────────────

  y = drawSectionTitle(doc, y, "Overview", title);

  const row1: PdfMetric[] = [
    {
      label: "Total Campaigns",
      value: String(filtered.totalCampaigns),
      accent: COLORS.forestGreen,
    },
    {
      label: "Creators Contacted",
      value: String(filtered.totalCreatorsContacted),
      accent: COLORS.blue500,
    },
    {
      label: "Deals Agreed",
      value: String(filtered.totalAgreed),
      accent: COLORS.green500,
    },
    {
      label: "Declined",
      value: String(filtered.totalDeclined),
      accent: COLORS.red400,
    },
  ];
  y = drawMetricGrid(doc, y, row1, 4, title);

  const row2: PdfMetric[] = [
    {
      label: "Emails Sent",
      value: String(filtered.emailStats.totalSent),
      accent: COLORS.blue500,
    },
    {
      label: "Delivery Rate",
      value: `${filtered.emailStats.deliveryRate}%`,
      accent: COLORS.green500,
    },
    {
      label: "Open Rate",
      value: `${filtered.emailStats.openRate}%`,
      accent: COLORS.purple500,
    },
    {
      label: "Click Rate",
      value: `${filtered.emailStats.clickRate}%`,
      accent: COLORS.terracotta,
    },
  ];
  y = drawMetricGrid(doc, y, row2, 4, title);

  const row3: PdfMetric[] = [
    {
      label: "Response Rate",
      value: `${filtered.responseRate}%`,
      accent: COLORS.purple500,
    },
    {
      label: "Conversion Rate",
      value: `${filtered.conversionRate}%`,
      accent: COLORS.green500,
    },
  ];
  if (filtered.negotiationStats) {
    row3.push({
      label: "Active Negotiations",
      value: String(filtered.negotiationStats.activeNegotiations),
      accent: COLORS.amber500,
    });
    row3.push({
      label: "Avg Response Time",
      value: `${filtered.negotiationStats.avgResponseTimeHours}h`,
      accent: COLORS.blue500,
    });
  }
  y = drawMetricGrid(doc, y, row3, row3.length, title);

  // ── 2. Engagement Funnel ───────────────────────────────

  if (filtered.engagementFunnel && Object.keys(filtered.engagementFunnel).length > 0) {
    y = drawSectionTitle(doc, y, "Engagement Funnel", title);

    const funnelTotal = filtered.totalCreatorsContacted || 1;
    const funnelOrder = ["contacted", "responded", "negotiating", "agreed", "declined"];
    const funnelColors: Record<string, readonly [number, number, number]> = {
      contacted: COLORS.blue500,
      responded: COLORS.purple500,
      negotiating: COLORS.amber500,
      agreed: COLORS.green500,
      declined: COLORS.red400,
    };

    const stages: FunnelStage[] = funnelOrder
      .filter((key) => filtered.engagementFunnel[key] !== undefined)
      .map((key) => ({
        label: capitalize(key),
        count: filtered.engagementFunnel[key],
        total: funnelTotal,
        color: [...(funnelColors[key] || COLORS.gray400)] as [number, number, number],
      }));

    y = drawFunnelBars(doc, y, stages, title);
  }

  // ── 3. Campaign Performance ────────────────────────────

  if (filtered.perCampaign.length > 0) {
    y = drawSectionTitle(doc, y, "Campaign Performance", title);
    const head = [
      "Campaign",
      "Status",
      "Creators",
      "Responded",
      "Agreed",
      "Emails",
      "Open Rate",
    ];
    const body = filtered.perCampaign.map((c) => [
      c.name,
      capitalize(c.status),
      String(c.creators),
      String(c.responded),
      String(c.agreed),
      String(c.emailsSent),
      `${c.openRate}%`,
    ]);
    y = drawTable(doc, y, head, body, { pageTitle: title });
  }

  // ── 4. Email Breakdown ─────────────────────────────────

  if (filtered.emailBreakdown.length > 0) {
    y = drawSectionTitle(doc, y, "Email Performance", title);
    const head = [
      "Campaign",
      "Sent",
      "Delivered",
      "Opened",
      "Clicked",
      "Bounced",
    ];
    const body = filtered.emailBreakdown.map((e) => [
      e.campaignName,
      String(e.sent),
      String(e.delivered),
      String(e.opened),
      String(e.clicked),
      String(e.bounced),
    ]);
    y = drawTable(doc, y, head, body, { pageTitle: title });
  }

  // ── 5. Creator Summary ─────────────────────────────────

  if (filtered.allCreators.length > 0) {
    y = drawSectionTitle(doc, y, "Creator Summary", title);
    const head = [
      "Name",
      "Platform",
      "Campaign",
      "Status",
      "Response (h)",
      "Fee (\u00a3)",
    ];
    const body = filtered.allCreators.map((c) => [
      c.name,
      capitalize(c.platform),
      c.campaignName,
      capitalize(c.status),
      c.responseTimeHours !== null ? String(c.responseTimeHours) : "\u2014",
      c.feeGbp !== null ? Number(c.feeGbp).toLocaleString() : "\u2014",
    ]);
    y = drawTable(doc, y, head, body, { pageTitle: title });
  }

  // ── 6. Platform Breakdown ──────────────────────────────

  if (filtered.platformBreakdown && filtered.platformBreakdown.length > 0) {
    y = drawSectionTitle(doc, y, "Platform Breakdown", title);
    const head = [
      "Platform",
      "Creators",
      "Responded",
      "Agreed",
      "Declined",
      "Response Rate",
    ];
    const body = filtered.platformBreakdown.map((p) => [
      capitalize(p.platform),
      String(p.creators),
      String(p.responded),
      String(p.agreed),
      String(p.declined),
      `${p.responseRate}%`,
    ]);
    y = drawTable(doc, y, head, body, { pageTitle: title });
  }

  // ── Stamp footers & save ──
  stampFooters(doc);
  const date = new Date().toISOString().slice(0, 10);
  const suffix =
    campaignFilter === "all" ? "all" : campaignFilter.slice(0, 8);
  doc.save(`hudey-analytics-${suffix}-${date}.pdf`);
}

// ── Helpers ──────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
