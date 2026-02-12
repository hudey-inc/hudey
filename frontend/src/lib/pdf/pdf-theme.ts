/**
 * PDF theme — brand colors, page layout, and reusable header/footer/section helpers.
 */

import jsPDF from "jspdf";

// ── Brand Colors (RGB tuples) ─────────────────────────────
export const COLORS = {
  forestGreen: [47, 69, 56] as const,
  terracotta: [209, 107, 66] as const,
  sand: [232, 220, 200] as const,
  white: [255, 255, 255] as const,
  black: [0, 0, 0] as const,
  gray900: [17, 24, 39] as const,
  gray600: [75, 85, 99] as const,
  gray400: [156, 163, 175] as const,
  gray200: [229, 231, 235] as const,
  gray100: [243, 244, 246] as const,
  gray50: [249, 250, 251] as const,
  green500: [34, 197, 94] as const,
  blue500: [59, 130, 246] as const,
  purple500: [168, 85, 247] as const,
  red400: [248, 113, 113] as const,
  amber500: [245, 158, 11] as const,
} as const;

export type RGBColor = readonly [number, number, number];

// ── Page Layout (A4 mm) ───────────────────────────────────
export const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 15,
  marginRight: 15,
  marginTop: 25,
  marginBottom: 20,
  contentWidth: 180, // 210 - 15 - 15
} as const;

// ── Font Sizes ────────────────────────────────────────────
export const FONT = {
  title: 18,
  subtitle: 14,
  section: 12,
  body: 9,
  small: 7.5,
  tiny: 6.5,
} as const;

// ── Header ────────────────────────────────────────────────

export function drawHeader(doc: jsPDF, title: string): void {
  const w = PAGE.width;

  // Green bar background
  doc.setFillColor(...COLORS.forestGreen);
  doc.rect(0, 0, w, 18, "F");

  // "HUDEY" text on the left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.text("HUDEY", PAGE.marginLeft, 11.5);

  // Document title on the right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.sand);
  const titleTrimmed = title.length > 60 ? title.slice(0, 57) + "..." : title;
  doc.text(titleTrimmed, w - PAGE.marginRight, 11.5, { align: "right" });

  // Terracotta accent line
  doc.setDrawColor(...COLORS.terracotta);
  doc.setLineWidth(0.6);
  doc.line(0, 18, w, 18);
}

// ── Footer ────────────────────────────────────────────────

export function drawFooter(
  doc: jsPDF,
  pageNum: number,
  totalPages: number
): void {
  const y = PAGE.height - 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.tiny);
  doc.setTextColor(...COLORS.gray400);

  // Page number center
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE.width / 2, y, {
    align: "center",
  });

  // Generated date right
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Generated ${dateStr}  |  Hudey`, PAGE.width - PAGE.marginRight, y, {
    align: "right",
  });
}

// ── Stamp Footers on All Pages ────────────────────────────

export function stampFooters(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }
}

// ── Page Break Helper ─────────────────────────────────────

export function ensureSpace(
  doc: jsPDF,
  y: number,
  requiredHeight: number,
  title: string
): number {
  if (y + requiredHeight > PAGE.height - PAGE.marginBottom) {
    doc.addPage();
    drawHeader(doc, title);
    return PAGE.marginTop + 2;
  }
  return y;
}

// ── Section Title ─────────────────────────────────────────

export function drawSectionTitle(
  doc: jsPDF,
  y: number,
  text: string,
  pageTitle: string
): number {
  y = ensureSpace(doc, y, 14, pageTitle);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.section);
  doc.setTextColor(...COLORS.forestGreen);
  doc.text(text, PAGE.marginLeft, y);

  // Underline
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginLeft, y + 2, PAGE.marginLeft + PAGE.contentWidth, y + 2);

  return y + 8;
}

// ── Date Formatter ────────────────────────────────────────

export function formatPdfDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
