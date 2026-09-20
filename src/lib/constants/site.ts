import {
  SITE_DESCRIPTION_LINE,
  SITE_THESIS,
} from "@/lib/constants/marketing-voice";
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

// The site-wide meta description (root layout, manifest, RSS, JSON-LD).
//
// ★ IT IS NO LONGER `${SITE_THESIS} ${SITE_SUBHEAD}`. Will's hero sentence
// (2026-09-19, voice r1) is 144 characters on its own, so the composed form
// reached 175 and every search result and unfurl truncated mid-clause, which is
// the one place the subhead's closing benefit lived. A meta description and a
// hero subhead are read in different places by different people and only
// happened to be the same sentence; they are two lines now. The THESIS is still
// interpolated, so a thesis rewrite still propagates here, and the second half
// carries the same three beats in the ruled order (the opportunity is implied by
// the thesis above it, then what we do, then the benefit). Keep it under ~160.
export const SITE_DESCRIPTION = `${SITE_THESIS} ${SITE_DESCRIPTION_LINE}`;
