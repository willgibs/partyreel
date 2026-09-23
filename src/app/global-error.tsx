"use client";

import { useEffect, useRef, useState } from "react";

import { captureError } from "@/lib/observability/sentry";

// LAST-RESORT boundary: this only renders when the ROOT LAYOUT itself crashed,
// so it must supply its own <html>/<body> and depend on nothing that layout
// loaded. Inline styles only (globals.css may not exist here), no UI-kit
// imports, system font stack. captureError is the one dependency: it no-ops
// without a DSN and a reporting failure can't break the screen.
//
// ★ AND IT HAS A WAY HOME NOW (Will, `global-crash=home`, 2026-09-19). Try
// again cannot fix a genuinely broken deploy, and the one thing this screen can
// still offer for free is a plain <a href="/">: no router, no script, no
// stylesheet. It is deliberately NOT a next/link — a Link needs the router this
// screen cannot assume, and a full document load is exactly what a reader whose
// root layout just crashed wants anyway.
//
// ★ AND THE CODE COPIES (Will, `code=always`). The shared ErrorDigest is a
// Tailwind component and cannot be imported here, so the same two ideas (one
// sentence saying what the code is for, and a control that copies it) are
// rebuilt in inline styles. useState is safe: this file is already a Client
// Component, and if hydration itself is what failed, the code still prints as
// text and is still selectable.
//
// The h1's inline size is the type ladder's one `unstyled` exception
// (type-ladder-policy.test.ts, count 1): there is no stylesheet to size it
// from. Do not add a second heading here without moving that count.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    captureError("render:global", error, { digest: error.digest });
  }, [error]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

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
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
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
            {/* A PLAIN ANCHOR, DELIBERATELY, and the one place in the tree
                where next/link is the wrong answer: this screen renders
                because the ROOT LAYOUT crashed, so the router it would need is
                part of what failed, and a client-side navigation would keep
                the broken React tree alive instead of replacing it. A full
                document load is the recovery. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                font: "inherit",
                fontWeight: 500,
                background: "transparent",
                color: "#1a1a1a",
                border: "1px solid #d4d4d4",
                borderRadius: "16px",
                padding: "10px 24px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Back home
            </a>
          </div>
          {error.digest && (
            <div
              style={{
                marginTop: "24px",
                fontSize: "0.75rem",
                // #555, the same grey the paragraph above uses, not the old
                // #999: this is a sentence to READ, and #999 on this ground
                // measures 2.6:1. The rank below the buttons is carried by the
                // size, never by fading the words out.
                color: "#555",
              }}
            >
              <p style={{ margin: "0 0 6px" }}>
                This helps us find what happened if you tell us about it.
              </p>
              <button
                type="button"
                aria-label={
                  copied
                    ? `Error code ${error.digest}, copied`
                    : "Copy error code"
                }
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(error.digest ?? "")
                    .then(() => {
                      setCopied(true);
                      if (timer.current) clearTimeout(timer.current);
                      timer.current = setTimeout(() => setCopied(false), 1600);
                    })
                    .catch(() => {});
                }}
                style={{
                  font: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f0f0f0",
                  color: "#555",
                  border: 0,
                  borderRadius: "4px",
                  padding: "3px 8px",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {error.digest}
                </span>
                {/* A fixed slot for the wider of the two words, so the
                    receipt does not nudge the code sitting beside it. */}
                <span
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: "#666",
                    display: "inline-block",
                    minWidth: "50px",
                    textAlign: "left",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
              <span
                aria-live="polite"
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? `Error code ${error.digest}, copied` : ""}
              </span>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
