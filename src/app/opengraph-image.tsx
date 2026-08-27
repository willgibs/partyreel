import { ImageResponse } from "next/og";

import { SITE_THESIS } from "@/lib/constants/marketing-voice";
import { BRAND_HEX } from "@/lib/constants/site";

// Site-wide social card. File-based OG: Next auto-emits og:image + twitter:image
// for every route that inherits root metadata (per-event albums override this with
// their own opengraph-image). 1200×630 is the standard large-summary card size.
// No custom font on purpose — loading Geist into satori needs a readFile dance
// (Next-16 gotcha); the built-in font is fine for a clean wordmark card.
// Headline = the byte-pinned SITE_THESIS (the 2026-08-25 voice ruling), so
// every unfurl advertises the ruled voice; the visual OG pass stays ROADMAP.
export const alt = `Partyreel. ${SITE_THESIS}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#0d0d0d",
        padding: "96px",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "104px",
            height: "104px",
            borderRadius: "26px",
            backgroundColor: "#fafafa",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke={BRAND_HEX}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
            <line x1="9.69" y1="8" x2="21.17" y2="8" />
            <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
            <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
            <line x1="14.31" y1="16" x2="2.83" y2="16" />
            <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
          </svg>
        </div>
        <div
          style={{
            fontSize: "68px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Partyreel
        </div>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "56px",
          fontSize: "56px",
          fontWeight: 600,
          lineHeight: 1.1,
          maxWidth: "880px",
          letterSpacing: "-0.02em",
        }}
      >
        {SITE_THESIS}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "28px",
          fontSize: "30px",
          color: "#a1a1aa",
        }}
      >
        Guests scan one QR code and upload. No app, no account.
      </div>
    </div>,
    { ...size },
  );
}
