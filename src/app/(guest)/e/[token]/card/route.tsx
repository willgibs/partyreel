import { ImageResponse } from "next/og";

import { BRAND_HEX } from "@/lib/constants/site";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";
import { EVENT_CARD_ALT, EVENT_CARD_SIZE } from "@/lib/guest/event-card";

/**
 * THE EVENT'S SHARE CARD: the event name on the branded dark surface, so a pasted event link unfurls
 * with the real name. Private and missing events fall back to a generic card (no existence or name
 * leak, the same rule as the page's `generateMetadata`). One link per event (database-security.md).
 *
 * ★ A ROUTE, NOT THE `opengraph-image` FILE CONVENTION (reel-guest-wiring, 2026-09-24). A link to
 * one photograph (`?photo=<id>`) unfurls as THAT photograph on an album anyone may open (page.tsx),
 * and file-based metadata outranks `generateMetadata` (Next's own rule), so while this card was the
 * convention file no photograph could ever take its place. The page now names this route as the
 * image for every other link; the pixels are unchanged.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await getEventByQrToken(token);
  const eventName =
    result.ok && result.data.visibility !== "private"
      ? result.data.name
      : EVENT_CARD_ALT;
  // Guard against pathological names blowing out the layout.
  const heading =
    eventName.length > 70 ? `${eventName.slice(0, 69)}…` : eventName;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0d0d0d",
        padding: "88px",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "#fafafa",
          }}
        >
          <svg
            width="40"
            height="40"
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
        <div style={{ fontSize: "34px", fontWeight: 600, color: "#d4d4d8" }}>
          Partyreel
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "76px",
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          maxWidth: "1000px",
        }}
      >
        {heading}
      </div>

      <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
        See the photos &amp; videos on Partyreel
      </div>
    </div>,
    {
      ...EVENT_CARD_SIZE,
      // Unfurlers fetch this once per paste; an hour spares the render for a busy group chat
      // without holding a renamed event's old card for long.
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
