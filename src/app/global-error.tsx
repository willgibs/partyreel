"use client";

import { useEffect } from "react";

import { captureError } from "@/lib/observability/sentry";

// LAST-RESORT boundary: this only renders when the ROOT LAYOUT itself crashed,
// so it must supply its own <html>/<body> and depend on nothing that layout
// loaded. Inline styles only (globals.css may not exist here), no UI-kit
// imports, system font stack. captureError is the one dependency: it no-ops
// without a DSN and a reporting failure can't break the screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError("render:global", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fcfcfc",
          color: "#1a1a1a",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 24px",
              color: "#555",
              lineHeight: 1.5,
            }}
          >
            That&apos;s on us, not you. Reloading usually fixes it.
          </p>
          <button
            onClick={reset}
            style={{
              font: "inherit",
              fontWeight: 500,
              background: "#1a1a1a",
              color: "#fcfcfc",
              border: 0,
              borderRadius: "16px",
              padding: "10px 24px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "24px",
                fontSize: "0.75rem",
                color: "#999",
              }}
            >
              Error code: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
