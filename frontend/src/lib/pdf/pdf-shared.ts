/**
 * Shared PDF renderers — metric grids, funnel bars, tables, bullet lists.
 *
 * Every draw function takes (doc, y, data) and returns the new y position.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  COLORS,
  PAGE,
  FONT,
  ensureSpace,
  drawHeader,
  type RGBColor,
} from "./pdf-theme";

// ── Metric Grid ──────────────────────────────────────────

export type PdfMetric = {
  label: string;
  value: string;
  sub?: string;
  accent?: RGBColor;
};

export function drawMetricGrid(
  doc: jsPDF,
  y: number,
  metrics: PdfMetric[],
  columns = 4,
  pageTitle = ""
): number {
  const cardWidth = (PAGE.contentWidth - (columns - 1) * 4) / columns;
  const cardHeight = 22;
  const rows = Math.ceil(metrics.length / columns);

  y = ensureSpace(doc, y, rows * (cardHeight + 4), pageTitle);

  metrics.forEach((m, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = PAGE.marginLeft + col * (cardWidth + 4);
    const cy = y + row * (cardHeight + 4);

    // Card background
    doc.setFillColor(...COLORS.gray50);
    doc.roundedRect(x, cy, cardWidth, cardHeight, 2, 2, "F");

    // Accent left stripe
    if (m.accent) {
      doc.setFillColor(...m.accent);
      doc.roundedRect(x, cy, 1.5, cardHeight, 0.75, 0.75, "F");
    }

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.gray600);
    doc.text(m.label, x + 5, cy + 6);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.subtitle);
    doc.setTextColor(...COLORS.gray900);
    doc.text(m.value, x + 5, cy + 14);

    // Subtitle
    if (m.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.tiny);
      doc.setTextColor(...COLORS.gray400);
      doc.text(m.sub, x + 5, cy + 19);
    }
  });

  return y + rows * (cardHeight + 4) + 4;
}

// ── Funnel Bars ──────────────────────────────────────────

export type FunnelStage = {
  label: string;
  count: number;
  total: number;
  color: RGBColor;
};

export function drawFunnelBars(
  doc: jsPDF,
  y: number,
  stages: FunnelStage[],
  pageTitle = ""
): number {
  const barHeight = 6;
  const rowHeight = 14;
  const labelWidth = 28;
  const barLeft = PAGE.marginLeft + labelWidth;
  const barMaxWidth = PAGE.contentWidth - labelWidth - 30;

  y = ensureSpace(doc, y, stages.length * rowHeight + 4, pageTitle);

  stages.forEach((stage, i) => {
    const ry = y + i * rowHeight;
    const pct = stage.total > 0 ? stage.count / stage.total : 0;

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.gray900);
    doc.text(stage.label, PAGE.marginLeft, ry + barHeight - 1);

    // Bar background
    doc.setFillColor(...COLORS.gray200);
    doc.roundedRect(barLeft, ry, barMaxWidth, barHeight, 1.5, 1.5, "F");

    // Bar fill
    if (pct > 0) {
      const fillWidth = Math.max(barMaxWidth * pct, 3);
      doc.setFillColor(...stage.color);
      doc.roundedRect(barLeft, ry, fillWidth, barHeight, 1.5, 1.5, "F");
    }

    // Count + percentage
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.gray900);
    const text = `${stage.count}  (${Math.round(pct * 100)}%)`;
    doc.text(text, barLeft + barMaxWidth + 3, ry + barHeight - 1);
  });

  return y + stages.length * rowHeight + 4;
}

// ── Key-Value Pairs ──────────────────────────────────────

export function drawKeyValuePairs(
  doc: jsPDF,
  y: number,
  pairs: { label: string; value: string }[],
  pageTitle = ""
): number {
  const maxWidth = PAGE.contentWidth - 4;

  pairs.forEach((pair) => {
    // Estimate height needed
    doc.setFontSize(FONT.body);
    const lines = doc.splitTextToSize(pair.value, maxWidth);
    const needed = 5 + lines.length * 3.5 + 3;
    y = ensureSpace(doc, y, needed, pageTitle);

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.small);
    doc.setTextColor(...COLORS.gray400);
    doc.text(pair.label.toUpperCase(), PAGE.marginLeft, y);
    y += 4;

    // Value (may wrap)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.gray900);
    doc.text(lines, PAGE.marginLeft, y);
    y += lines.length * 3.5 + 3;
  });

  return y;
}

// ── Bullet List ──────────────────────────────────────────

export function drawBulletList(
  doc: jsPDF,
  y: number,
  items: string[],
  options: { numbered?: boolean; bulletColor?: RGBColor } = {},
  pageTitle = ""
): number {
  const { numbered = false, bulletColor = COLORS.gray400 } = options;
  const indent = numbered ? 8 : 5;
  const maxWidth = PAGE.contentWidth - indent - 2;

  items.forEach((item, i) => {
    doc.setFontSize(FONT.body);
    const lines = doc.splitTextToSize(item, maxWidth);
    const needed = lines.length * 3.5 + 2;
    y = ensureSpace(doc, y, needed, pageTitle);

    if (numbered) {
      // Number circle
      doc.setFillColor(...COLORS.gray200);
      doc.circle(PAGE.marginLeft + 2.5, y - 1, 2.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONT.tiny);
      doc.setTextColor(...COLORS.gray600);
      doc.text(String(i + 1), PAGE.marginLeft + 2.5, y - 0.2, {
        align: "center",
      });
    } else {
      // Bullet dot
      doc.setFillColor(...bulletColor);
      doc.circle(PAGE.marginLeft + 1.5, y - 1, 0.8, "F");
    }

    // Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.gray900);
    doc.text(lines, PAGE.marginLeft + indent, y);
    y += lines.length * 3.5 + 2;
  });

  return y;
}

// ── Table (jspdf-autotable) ──────────────────────────────

export function drawTable(
  doc: jsPDF,
  y: number,
  head: string[],
  body: string[][],
  options: { title?: string; columnWidths?: number[]; pageTitle?: string } = {}
): number {
  const { title, columnWidths, pageTitle = "" } = options;

  if (title) {
    y = ensureSpace(doc, y, 20, pageTitle);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.gray900);
    doc.text(title, PAGE.marginLeft, y);
    y += 5;
  }

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: {
      top: PAGE.marginTop,
      left: PAGE.marginLeft,
      right: PAGE.marginRight,
    },
    didDrawPage: () => {
      drawHeader(doc, pageTitle);
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [...COLORS.gray200] as [number, number, number],
      lineWidth: 0.1,
      textColor: [...COLORS.gray900] as [number, number, number],
      font: "helvetica",
    },
    headStyles: {
      fillColor: [...COLORS.forestGreen] as [number, number, number],
      textColor: [...COLORS.white] as [number, number, number],
      fontSize: 7.5,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [...COLORS.gray50] as [number, number, number],
    },
    columnStyles: columnWidths
      ? Object.fromEntries(
          columnWidths.map((w, i) => [i, { cellWidth: w }])
        )
      : undefined,
  });

  // Get final y from autotable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? y + 20;
  return finalY + 6;
}

// ── Status Color Helper ──────────────────────────────────

export function statusColor(status: string): RGBColor {
  switch (status) {
    case "agreed":
    case "completed":
    case "running":
      return COLORS.green500;
    case "negotiating":
    case "draft":
      return COLORS.amber500;
    case "responded":
    case "awaiting_approval":
      return COLORS.purple500;
    case "declined":
    case "failed":
      return COLORS.red400;
    case "contacted":
    default:
      return COLORS.gray400;
  }
}
