import { ImageResponse } from "next/og";

import { BRAND_HEX } from "@/lib/constants/site";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";

// Per-event share card: the event name on the branded dark surface, so a pasted
// event link unfurls with the real name. Private/missing events fall back to a
// generic card (no existence/name leak — same rule as generateMetadata). Overrides
// the site-wide opengraph-image for /e/[token]. One link per event (ADR-00010).
export const alt = "A Partyreel event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = BRAND_HEX;

export default async function EventOgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getEventByQrToken(token);
  const eventName =
    result.ok && result.data.visibility !== "private"
      ? result.data.name
      : "A Partyreel event";
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
            backgroundColor: BRAND,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
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
    { ...size },
  );
}
