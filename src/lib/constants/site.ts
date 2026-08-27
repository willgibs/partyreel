import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { env } from "@/lib/env";

// Single source for the canonical public origin + brand strings. Used by sitemap,
// robots, the root metadataBase, and JSON-LD. Falls back to prod when
// NEXT_PUBLIC_SITE_URL is unset (local dev / preview) — same fallback the sitemap
// and robots already used, now de-duplicated here.
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com";

export const SITE_NAME = "Partyreel";

// The brand mark color as a literal sRGB hex for OG/satori rendering (next/og
// can't read CSS tokens). V1 mono system: brand collapsed to INK - keep in
// sync with `--primary`/`--brand` in globals.css (the real logo/OG design pass
// lands in Phase 6).
export const BRAND_HEX = "#101010";

// Public-facing support/contact address shown on the marketing site (and referenced
// in the contact notification email). This DISPLAYED address stays fixed; where
// notifications actually get SENT is the `CONTACT_NOTIFY_EMAIL` env (env.ts), so this
// never has to change when `help@` receiving is wired up later.
export const SUPPORT_EMAIL = "help@partyreel.com";

// The site-wide meta description (root layout, manifest, RSS, JSON-LD),
// composed from the byte-pinned voice constants so every unfurl carries the
// ruled 2026-08-25 register and a thesis rewrite propagates automatically.
export const SITE_DESCRIPTION = `${SITE_THESIS} ${SITE_SUBHEAD}`;
