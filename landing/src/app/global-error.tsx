"use client";

/**
 * Handles errors that bubble up from the root layout itself. Next.js renders
 * this outside of `app/layout.tsx`, so it must render its own <html> and
 * <body>. Keep it intentionally minimal — no fonts, no analytics, no
 * providers — since those are what most likely failed if we got here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3f1ea",
          color: "#2F4538",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#4b5563", marginBottom: 24 }}>
            A critical error prevented the page from loading. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#2F4538",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              Ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
