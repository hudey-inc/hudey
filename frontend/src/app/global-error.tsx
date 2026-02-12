"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(to bottom right, #f9fafb, #ffffff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background blobs */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 600,
              height: 600,
              background: "rgba(232, 220, 200, 0.3)",
              borderRadius: "50%",
              filter: "blur(48px)",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 500,
              height: 500,
              background: "rgba(209, 107, 66, 0.1)",
              borderRadius: "50%",
              filter: "blur(48px)",
              zIndex: 0,
            }}
          />

          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 448, textAlign: "center" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#2F4538",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="250 280 560 500" style={{ width: "58%", height: "58%" }} fill="white" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(283,312)">
                    <path d="M511.007,379.495C502.078,326.662 479.422,287.093 443.04,260.787C406.657,234.481 372.575,225.551 340.793,233.995C296.616,245.604 265.32,284.413 246.906,336.104C232.94,374.076 218.004,444.966 218.004,444.966C218.004,444.966 206.032,395.942 196.375,365.405C177.476,305.649 147.634,248.329 78.1233,244.332C55.4673,243.032 36.569,250.432 21.4287,266.532C-6.02931,299.832 -5.54331,369.032 19.6057,428.932L90.5447,442.982L67.5727,386.132C56.0587,356.632 55.5667,332.132 66.9437,312.632C71.8627,304.197 79.0007,299.432 88.3577,298.332C115.058,295.632 133.958,326.632 148.058,367.032C159.472,399.632 175.538,475.282 175.538,475.282L262.892,475.282C262.892,475.282 278.892,393.132 289.692,360.532C305.292,313.132 331.792,276.332 359.392,280.232C377.392,282.732 401.292,292.832 424.992,341.632L511.007,379.495Z" fillOpacity="0.99" />
                    <path d="M83.5,454.005L95,455.005L95,455.005C95,455.005 89.191,454.505 83.5,454.005Z" fillOpacity="0.98" />
                  </g>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>Hudey</span>
            </div>

            {/* Card */}
            <div
              style={{
                background: "white",
                borderRadius: 16,
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
                padding: "2rem",
              }}
            >
              {/* Error icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <AlertTriangle style={{ width: 32, height: 32, color: "#dc2626" }} />
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                Something went wrong
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
                An unexpected error occurred. Please try again or return to the home page.
              </p>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={reset}
                  style={{
                    width: "100%",
                    background: "#2F4538",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <RefreshCw style={{ width: 20, height: 20 }} />
                  Try Again
                </button>
                <a
                  href="/"
                  style={{
                    width: "100%",
                    background: "white",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: 12,
                    padding: "14px 20px",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <Home style={{ width: 20, height: 20 }} />
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
