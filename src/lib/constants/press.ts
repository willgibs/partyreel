/**
 * THE PRESS KIT SOURCE: the kit's manifest (the press kit band on /about draws its plates
 * and its download from `PRESS_KIT`, and scripts/build-press-kit.mjs zips the same rows) and
 * the fact sheet (`/llms-full.txt` is built from `PRESS_FACTS`; `FOUNDED_YEAR` feeds the
 * Organization JSON-LD). The boilerplate left with /press (about-press r1: no press outreach
 * is planned) and lives in the llms builder, its only reader. Covered by the content-policy
 * claims fence.
 *
 * ★ KEEP THIS MODULE ENV-FREE. constants/site.ts imports lib/env.ts, whose `env` is
 * parsed EAGERLY at import and throws without NEXT_PUBLIC_SUPABASE_*. The node Vitest
 * project has no setupFiles, so the first test to pull site.ts into this graph turns the
 * whole suite red (llms.test.ts records the same lesson). The site domain and support
 * email are therefore LITERALS here; press-kit.test.ts pins them against site.ts by
 * reading its source text, never by importing it. tiers.ts is env-free and safe.
 *
 * All copy is PROVISIONAL (the marketing-voice.ts convention): agent drafts awaiting
 * a final pass, not ratified lines.
 */

import { planById, plansForTier } from "./tiers";

/** Mirrors SUPPORT_EMAIL in constants/site.ts (pinned, not imported: see the header). */
const PRESS_EMAIL = "help@partyreel.com";
/** The apex host. Deliberately NOT derived from SITE_URL, which resolves to the
 *  deploy origin: on a branch preview that would print a vercel host to a journalist. */
const PRESS_DOMAIN = "partyreel.com";

/**
 * The fact sheet, ordered by what a reporter reaches for first rather than by logic.
 * Prices are DERIVED from tiers.ts so they cannot drift from the billing truth.
 * No storage ladder here: the claims fence in content-policy.test.ts bans the backstop
 * numbers outright, and the marketable plan sizes belong on /pricing anyway.
 * No value may contain a pipe: buildLlmsFullTxt renders these as markdown table rows.
 */
export const PRESS_FACTS: { label: string; value: string }[] = [
  {
    label: "What it is",
    value:
      "A shared photo and video album for one event, filled by the guests.",
  },
  { label: "How it works", value: "One QR code in, one album out." },
  {
    label: "Guests need",
    // ★ NEVER "no account" (2026-09-19, voice r1): a reporter quotes a fact
    // sheet verbatim, so this row was the most expensive place the old promise
    // lived. What is true on every event is the phone, the browser and the fee.
    value: "A phone and a browser. No app required, and no fee.",
  },
  {
    label: "Hosts get",
    value:
      "One live album at full quality, control over what stays, and a highlight reel that makes itself.",
  },
  {
    label: "Platform",
    value:
      "The web. Any modern phone browser, iPhone and Android alike. Nothing to install.",
  },
  {
    label: "Pricing",
    value: `Free to start. Event Pass ${planById("event_pass").priceLabel.replace(" one-time", "")} once. Pro from ${plansForTier("pro")[0].priceLabel.replace("/mo", "")} a month. Never priced per guest.`,
  },
  {
    label: "Availability",
    value: "Live now. Any browser, and the free plan needs no card.",
  },
  { label: "Category", value: "Event photo and video collection." },
  {
    label: "Not this",
    value:
      "Not a professional delivery or asset-management tool, and not a video editor.",
  },
  { label: "Founded", value: "2026" },
  { label: "Website", value: PRESS_DOMAIN },
  { label: "Press contact", value: PRESS_EMAIL },
];

/** The year for Organization.foundingDate (mirrors the fact sheet). */
export const FOUNDED_YEAR = "2026";

/** One downloadable file in the kit. `bytes` is pinned so client components can print a
 *  size without an fs.stat; press-kit.test.ts asserts it against the file on disk. */
export type PressKitAsset = {
  /** Stable id, referenced by prototypes and the zip builder. Never the filename. */
  id: string;
  /** Path under public/, site-relative (this IS the download href). */
  file: string;
  format: "svg" | "png";
  label: string;
  /** What a designer picks it for. Kept descriptive, never a service promise. */
  note: string;
  bytes: number;
};

/**
 * THE KIT MANIFEST. The single source for what ships in the press kit: the band on /about
 * draws its plates from it, and scripts/build-press-kit.mjs zips exactly these files.
 *
 * ★ The marks' files are drawn by scripts/build-press-kit.mjs from the brand's two sources
 * (`src/lib/brand/`), so a changed mark is one rerun and these rows' bytes; a new file is a row
 * here. No component changes.
 */
export const PRESS_KIT: PressKitAsset[] = [
  {
    id: "wordmark-dark",
    file: "/press/partyreel-wordmark-dark.svg",
    format: "svg",
    label: "Wordmark, ink",
    note: "For light backgrounds. Vector, scales forever.",
    bytes: 12152,
  },
  {
    id: "wordmark-dark-png",
    file: "/press/partyreel-wordmark-dark.png",
    format: "png",
    label: "Wordmark, ink",
    note: "2487 by 512, transparent background.",
    bytes: 54838,
  },
  {
    id: "wordmark-light",
    file: "/press/partyreel-wordmark-light.svg",
    format: "svg",
    label: "Wordmark, white",
    note: "For dark backgrounds. Vector, scales forever.",
    bytes: 12152,
  },
  {
    id: "wordmark-light-png",
    file: "/press/partyreel-wordmark-light.png",
    format: "png",
    label: "Wordmark, white",
    note: "2487 by 512, transparent background.",
    bytes: 47327,
  },
  {
    id: "mark-dark",
    file: "/press/partyreel-mark-dark.svg",
    format: "svg",
    label: "Icon, on its tile",
    note: "For light backgrounds. Vector, scales forever.",
    bytes: 60353,
  },
  {
    id: "mark-dark-png",
    file: "/press/partyreel-mark-dark.png",
    format: "png",
    label: "Icon, on its tile",
    note: "1024px square, transparent background.",
    bytes: 227107,
  },
  {
    id: "mark-light",
    file: "/press/partyreel-mark-light.svg",
    format: "svg",
    label: "Icon, on its own",
    note: "For dark backgrounds. Vector, scales forever.",
    bytes: 57324,
  },
  {
    id: "mark-light-png",
    file: "/press/partyreel-mark-light.png",
    format: "png",
    label: "Icon, on its own",
    note: "1024px square, transparent background.",
    bytes: 258764,
  },
  {
    id: "mark-mono",
    file: "/press/partyreel-mark-mono.svg",
    format: "svg",
    label: "Icon, one color",
    note: "Any surface. Vector, scales forever.",
    bytes: 409,
  },
  {
    id: "mark-mono-png",
    file: "/press/partyreel-mark-mono.png",
    format: "png",
    label: "Icon, one color",
    note: "1024px square, transparent background.",
    bytes: 40476,
  },
  {
    id: "app-icon",
    file: "/press/partyreel-app-icon.png",
    format: "png",
    label: "App icon",
    note: "512px, the rounded icon as it ships on a home screen.",
    bytes: 104201,
  },
  {
    id: "share-card",
    file: "/press/partyreel-share-card.png",
    format: "png",
    label: "Share card",
    note: "1200x630, the banner a link preview shows.",
    bytes: 44338,
  },
  {
    id: "qr",
    file: "/press/partyreel-qr.svg",
    format: "svg",
    label: "The QR code",
    note: "Resolves to partyreel.com. Vector, quiet zone included.",
    bytes: 4576,
  },
  {
    id: "qr-png",
    file: "/press/partyreel-qr.png",
    format: "png",
    label: "The QR code",
    note: "1024px square, ready for print.",
    bytes: 23555,
  },
];

/** The bundle of everything in PRESS_KIT. Built by scripts/build-press-kit.mjs and
 *  committed, so it is served straight off the CDN with no runtime code. */
export const PRESS_KIT_ZIP = "/press/partyreel-press-kit.zip";

/** Total uncompressed size of the kit, for the "Download the kit" label. Derived so it
 *  can never disagree with the manifest. */
export const PRESS_KIT_BYTES = PRESS_KIT.reduce((sum, a) => sum + a.bytes, 0);

/** Humanized file size for display. Kit assets are all well under a megabyte. */
export function formatKitBytes(bytes: number): string {
  return bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
