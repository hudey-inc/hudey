import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";
export const alt = "Hudey — AI-Powered Influencer Marketing Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at build/request time — no static PNG asset required.
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f1ea",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top: logo mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#2F4538",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            0-0
          </div>
          <div
            style={{
              color: "#2F4538",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            Hudey
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#2F4538",
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            <span>Creator partnerships,</span>
            <span style={{ fontStyle: "italic" }}>handled by AI.</span>
          </div>
          <div
            style={{
              display: "flex",
              color: "#4b5563",
              fontSize: 28,
              maxWidth: 900,
              lineHeight: 1.35,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            Hudey finds the right creators, writes personalised outreach, and
            negotiates fair rates. You approve everything.
          </div>
        </div>

        {/* Bottom: pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            alignSelf: "flex-start",
            background: "#2F4538",
            color: "white",
            padding: "14px 22px",
            borderRadius: 999,
            fontSize: 22,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#D16B42",
            }}
          />
          hudey.co
        </div>
      </div>
    ),
    { ...size },
  );
}
