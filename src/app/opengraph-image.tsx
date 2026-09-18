import { ImageResponse } from "next/og";

import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/brand/wordmark";
import { SITE_THESIS } from "@/lib/constants/marketing-voice";

// Site-wide social card. File-based OG: Next auto-emits og:image + twitter:image
// for every route that inherits root metadata (per-event albums override this with
// their own opengraph-image). 1200×630 is the standard large-summary card size.
// No custom font on purpose — loading Geist into satori needs a readFile dance
// (Next-16 gotcha); the built-in font carries the thesis, and the brand is the v1
// wordmark drawn from its one path (src/lib/brand/wordmark.ts), alone, as in the
// nav and the footer (Will, 2026-09-17). The placeholder mark tile left with it.
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
      <svg
        width="385"
        height="80"
        viewBox={WORDMARK_VIEWBOX}
        fill="#fafafa"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={WORDMARK_PATH} />
      </svg>
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
