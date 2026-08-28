/**
 * THE PRESS KIT SOURCE. One quotable home for "what is Partyreel": the /press page
 * renders these and the /llms.txt builder feeds them to AI crawlers, so the canonical
 * summary can never fork. Covered by the content-policy claims fence.
 *
 * ★ KEEP THIS MODULE ENV-FREE. constants/site.ts imports lib/env.ts, whose `env` is
 * parsed EAGERLY at import and throws without NEXT_PUBLIC_SUPABASE_*. The node Vitest
 * project has no setupFiles, so the first test to pull site.ts into this graph turns the
 * whole suite red (llms.test.ts records the same lesson). The site domain and support
 * email are therefore LITERALS here; press-kit.test.ts pins them against site.ts by
 * reading its source text, never by importing it. tiers.ts is env-free and safe.
 *
 * All copy is PROVISIONAL (the marketing-voice.ts convention): agent drafts awaiting
 * Will's ruling, not ratified lines.
 */

import { planById } from "./tiers";

/** Mirrors SUPPORT_EMAIL in constants/site.ts (pinned, not imported: see the header). */
const PRESS_EMAIL = "help@partyreel.com";
/** The apex host. Deliberately NOT derived from SITE_URL, which resolves to the
 *  deploy origin: on a branch preview that would print a vercel host to a journalist. */
const PRESS_DOMAIN = "partyreel.com";

/**
 * The paragraph version. Sentence one is the strongest line the company has written and
 * is deliberately untouched. The reel length is left unnumbered because the cap is
 * per-tier (tiers.ts MAX_REEL_SECONDS), so a fixed number here would be wrong on Free.
 */
export const PRESS_BOILERPLATE =
  "Partyreel turns every guest's phone into the event's camera. The host shares one QR code; guests scan it and upload photos and videos with no app and no account. Everything lands in one live album at full quality, where the host decides what stays and everyone leaves with the originals. Nobody has to chase a group chat the next morning. There are no per-guest fees, and any album can become a highlight reel.";

/** The one-sentence version: what a reporter pastes into a story. */
export const PRESS_BOILERPLATE_SHORT =
  "Partyreel turns every guest's phone into the event's camera: guests scan one QR code, their photos and videos land in one live album at full quality, and the event can end as a highlight reel.";

/**
 * The ~20-word descriptor for a directory entry, a caption, or a conference program.
 * Leads with the name (directories need that) and its second clause rhymes with the
 * ruled SITE_THESIS on purpose, so the shortest and biggest things we say match.
 */
export const PRESS_BOILERPLATE_LINE =
  "Partyreel: one QR code turns every guest's phone into the event's camera, and one album holds the whole event.";

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
    value: "A phone and a browser. No app, no account, no fee.",
  },
  {
    label: "Hosts get",
    value:
      "One live album at full quality, control over what stays, and a highlight reel at the end.",
  },
  {
    label: "Platform",
    value:
      "The web. Any modern phone browser, iPhone and Android alike. Nothing to install.",
  },
  {
    label: "Pricing",
    value: `Free to start. Event Pass ${planById("event_pass").priceLabel.replace(" one-time", "")} once. Pro from ${planById("pro_100").priceLabel.replace("/mo", "")} a month. Never priced per guest.`,
  },
  {
    label: "Availability",
    value: "Live now. Any browser, and the free plan needs no card.",
  },
  { label: "Category", value: "Event photo and video collection." },
  {
    label: "Not this",
    value:
      "Not a professional delivery or asset-management tool, and not a slideshow product.",
  },
  { label: "Founded", value: "2026" },
  { label: "Website", value: PRESS_DOMAIN },
  { label: "Press contact", value: PRESS_EMAIL },
];

/** The year for Organization.foundingDate (mirrors the fact sheet). */
export const FOUNDED_YEAR = "2026";

/**
 * Brand usage rules, ordered by audience: everyone needs the name and the quoting rule,
 * only the designer laying out the piece needs clear space and minimum size.
 *
 * ★ Written about the SYSTEM, never about this glyph. The mark set changes before launch,
 * so clear space is expressed against the mark's OWN box ("a quarter of its height") and
 * the color rule names the three shipped versions rather than the artwork inside them. A
 * new mark inherits every rule below unchanged.
 */
export const PRESS_USAGE_RULES: { title: string; body: string }[] = [
  {
    title: "The name",
    body: "Write Partyreel. One word, one capital P, nothing else capitalized. Not PartyReel, not Party Reel, not PARTYREEL. It takes no 'the' in front of it.",
  },
  {
    title: "Quoting",
    body: "Quote the boilerplate whole or in part, and edit it to fit your piece. No permission needed and no link required, though a link is always welcome.",
  },
  {
    title: "Clear space",
    body: "Keep a margin around the mark equal to a quarter of its height, on all four sides. Nothing crosses into it: no type, no page edge, no other logo.",
  },
  {
    title: "Minimum size",
    body: "Never smaller than 24px on screen or 8mm in print. Below that it stops reading as a mark and starts reading as a smudge.",
  },
  {
    title: "Ink",
    body: "The marks are drawn in #101010 on white. That hex is the color of the artwork, not a sample of the site, so match the file rather than a screenshot.",
  },
  {
    title: "Type",
    body: "Urbanist for headlines, Inter for everything else. The name itself is set in Inter Semibold at slightly tight tracking, so you can set it yourself from those two faces. There is no wordmark file in the kit.",
  },
  {
    title: "Please do not",
    body: "Recolor it, stretch it, rotate it, outline it, add a shadow, set it on a busy photo, or tuck it inside another shape. If a file needs editing to work in your layout, write instead and we will make the one you need.",
  },
];

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
 * THE KIT MANIFEST. The single source for what ships in the press kit: the /press page
 * maps over it, and scripts/build-press-kit.mjs zips exactly these files.
 *
 * ★ This array is what makes the coming logo change a one-edit job. Swap the files in
 * public/press/, edit the rows, rerun the build script. No component changes.
 */
export const PRESS_KIT: PressKitAsset[] = [
  {
    id: "mark-dark",
    file: "/press/partyreel-mark-dark.svg",
    format: "svg",
    label: "Mark, dark chip",
    note: "For light backgrounds. Vector, scales forever.",
    bytes: 636,
  },
  {
    id: "mark-dark-png",
    file: "/press/partyreel-mark-dark.png",
    format: "png",
    label: "Mark, dark chip",
    note: "1024px square, transparent background.",
    bytes: 45420,
  },
  {
    id: "mark-light",
    file: "/press/partyreel-mark-light.svg",
    format: "svg",
    label: "Mark, light chip",
    note: "For dark backgrounds. Vector, scales forever.",
    bytes: 636,
  },
  {
    id: "mark-light-png",
    file: "/press/partyreel-mark-light.png",
    format: "png",
    label: "Mark, light chip",
    note: "1024px square, transparent background.",
    bytes: 45771,
  },
  {
    id: "mark-mono",
    file: "/press/partyreel-mark-mono.svg",
    format: "svg",
    label: "Bare mark",
    note: "One color, any surface. Vector, scales forever.",
    bytes: 511,
  },
  {
    id: "mark-mono-png",
    file: "/press/partyreel-mark-mono.png",
    format: "png",
    label: "Bare mark",
    note: "1024px square, transparent background.",
    bytes: 57895,
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
