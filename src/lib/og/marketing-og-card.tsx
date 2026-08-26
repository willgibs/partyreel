import { ImageResponse } from "next/og";

import { BRAND_HEX } from "@/lib/constants/site";

/**
 * THE SHARED MARKETING OG CARD (expansion A3): the branded dark share surface
 * that four routes had each hand-copied (~94 lines apiece: root, events types,
 * blog, guest event). New marketing routes compose THIS instead; the legacy
 * copies migrate opportunistically (not this round, to keep their diffs quiet).
 * Built-in font on purpose (the Next-16 satori gotcha: no custom font loading).
 *
 * Usage in an opengraph-image.tsx:
 *   export const alt = ...; export const size = OG_SIZE; export const
 *   contentType = "image/png";
 *   export default function Og() { return marketingOgCard({ heading }); }
 */
export const OG_SIZE = { width: 1200, height: 630 };

const DEFAULT_KICKER = "Guests scan a QR code and upload. No app, no account.";

export function marketingOgCard({
  heading,
  kicker = DEFAULT_KICKER,
}: {
  heading: string;
  kicker?: string;
}) {
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
        {kicker}
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
