import { ImageResponse } from "next/og";

import { BRAND_HEX } from "@/lib/constants/site";
import { getUseCase, USE_CASE_SLUGS } from "@/lib/constants/use-cases";

// Per-use-case share card — the use-case `ogTitle` on the branded dark surface,
// mirroring the per-event album card. Built-in font on purpose (Next-16 satori
// gotcha). Prerendered for each slug via generateStaticParams.
export function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }));
}

export const alt = "Partyreel — collect every photo from your event";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function UseCaseOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const heading =
    getUseCase(slug)?.ogTitle ?? "Every photo from your event, in one place";

  return new ImageResponse(
    (
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
              backgroundColor: BRAND_HEX,
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
          Guests scan a QR code and upload — no app, no account.
        </div>
      </div>
    ),
    { ...size },
  );
}
