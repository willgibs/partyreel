import { env } from "@/lib/env";

// Single source for the canonical public origin + brand strings. Used by sitemap,
// robots, the root metadataBase, and JSON-LD. Falls back to prod when
// NEXT_PUBLIC_SITE_URL is unset (local dev / preview) — same fallback the sitemap
// and robots already used, now de-duplicated here.
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com";

export const SITE_NAME = "Partyreel";

// The brand accent as a literal sRGB hex for OG/satori rendering (next/og can't
// read the `--brand` oklch token). Keep in sync with `--brand` (#FB4817) in
// globals.css.
export const BRAND_HEX = "#FB4817";

export const SITE_DESCRIPTION =
  "Collect every photo and video from your event. Guests scan a QR code and upload in seconds — no app, no account.";
