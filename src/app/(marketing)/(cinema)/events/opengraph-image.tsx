import { ImageResponse } from "next/og";

import { EVENTS_HUB } from "@/lib/constants/events";
import { BRAND_HEX } from "@/lib/constants/site";

/**
 * The /events hub's share card, on the same branded dark surface as the four
 * type cards beside it ([slug]/opengraph-image.tsx) and every album card.
 *
 * ★ IT EXISTS BECAUSE THE HUB WAS THE ONE CINEMA LANDING WITHOUT ONE: every
 * type page had a card and their parent fell back to the root's, so the page
 * this family's internal links point AT was the one that shared as "Partyreel"
 * with no line of its own. Built-in font on purpose (the Next-16 satori
 * gotcha), and the heading is the hub's own single-sourced headline.
 */
export const alt = "Partyreel: collect every photo from your event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function EventsHubOgImage() {
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
        {EVENTS_HUB.headline}
      </div>

      <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
        Guests scan a QR code and upload. No app required.
      </div>
    </div>,
    { ...size },
  );
}
