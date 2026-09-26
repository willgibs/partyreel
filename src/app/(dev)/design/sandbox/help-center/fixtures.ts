import type { HelpSearchItem } from "@/lib/content/help";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_REEL_SECONDS, planById } from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * FIXTURES FOR THE `help-center` BOARD: the ten real categories, five real
 * facts (read from the same single sources `getHelpFacts` reads — never a
 * second set of numbers) and three real articles, hand-authored as data
 * rather than `.mdx` (the boundary rule: `help.ts` reaches `node:fs` through
 * `collection.ts`, so nothing here may import it as a value; `slugify` and
 * `readingTime` are re-implemented as tiny pure copies below).
 *
 * The three articles are the ones this track's manifest names under `reads`:
 * a host how-to (the QR share dialog), a guest how-to (joining and
 * uploading), and a troubleshooting answer (a stuck upload) — one from the
 * lane that gets no "bigger picture" rung today. Titles, descriptions and
 * structure are drawn from the real `.mdx`; the prose is re-set as JSX in
 * `vocab.tsx`'s vocabulary rather than compiled, per the manifest.
 */

export type FixtureCategory = {
  slug: string;
  stripLabel: string;
  title: string;
  blurb: string;
  count: number;
  feature: { href: string; label: string } | null;
};

// Mirrors HELP_CATEGORIES (help.ts) — slug, title, blurb and count copied by
// eye from the shipped catalog so the sheet previews read true; the count
// column sums to 59, the catalog's real total.
export const CATEGORIES: FixtureCategory[] = [
  {
    slug: "getting-started",
    stripLabel: "Start",
    title: "Getting started",
    blurb: "How it works, your first event, and your dashboard.",
    count: 6,
    feature: { href: "/how-it-works", label: "How it works" },
  },
  {
    slug: "qr-and-invites",
    stripLabel: "QR",
    title: "QR & invites",
    blurb: "The code, the cards, the screens: getting guests in.",
    count: 4,
    feature: { href: "/features/qr", label: "The QR code" },
  },
  {
    slug: "guest-experience",
    stripLabel: "Guests",
    title: "For guests",
    // "No app required" only (never "no account", retired by press.ts's
    // voice r1: identity-door's default now asks every new event's guests
    // to confirm an email, so "no account" is the claim that stopped being
    // sitewide-true, not "no app").
    blurb: "Joining, adding your photos, and browsing: no app required.",
    count: 8,
    feature: { href: "/features/guests", label: "Guests & profiles" },
  },
  {
    slug: "event-album",
    stripLabel: "Album",
    title: "Event album",
    blurb: "Review, curate, and shape what everyone sees.",
    count: 8,
    feature: { href: "/features/curation", label: "Curation" },
  },
  {
    slug: "sharing-and-downloads",
    stripLabel: "Sharing",
    title: "Sharing & downloads",
    blurb: "The album link, full-quality downloads, and the zip.",
    count: 2,
    feature: { href: "/features/sharing", label: "Sharing & downloads" },
  },
  {
    // THE REEL ROUND (2026-09-22): the host-made, published, stored mp4 is
    // gone. Title and feature.label follow reel-story.help's recommended
    // "the-reel" option as a stand-in — that board is still open, so this is
    // provisional, not a final name. slug/stripLabel are untouched: "Reel"
    // already reads as the plain name that option asks for.
    slug: "highlight-reel",
    stripLabel: "Reel",
    title: "The reel",
    blurb: "Live from the second photo, on a screen, and yours to cut.",
    count: 5,
    feature: { href: "/reel", label: "The reel" },
  },
  {
    slug: "plans-and-billing",
    stripLabel: "Plans",
    title: "Plans & billing",
    blurb: "Storage, the free plan, Pro, and the one-time Event Pass.",
    count: 7,
    feature: { href: "/pricing", label: "Pricing" },
  },
  {
    slug: "account-and-profile",
    stripLabel: "Account",
    title: "Account & profile",
    blurb: "Sign-in, your name and photo, your profile, and notifications.",
    count: 4,
    feature: { href: "/features/guests", label: "Guests & profiles" },
  },
  {
    slug: "privacy-and-safety",
    stripLabel: "Privacy",
    title: "Privacy & safety",
    blurb: "Who can see your media, how long it's kept, and your data.",
    count: 7,
    feature: { href: "/features/privacy", label: "Privacy & trust" },
  },
  {
    slug: "troubleshooting",
    stripLabel: "Fixes",
    title: "Troubleshooting",
    blurb: "When something won't scan, send, or upload.",
    count: 8,
    feature: null,
  },
];

export type Fact = { label: string; value: string; href: string };

// Read from the same constants getHelpFacts() reads (tiers.ts, limits.ts,
// lifecycle/recently-deleted.ts) — never a second, hand-typed set of numbers.
export const FACTS: Fact[] = [
  {
    label: "Max upload size",
    value: formatBytes(MAX_UPLOAD_BYTES),
    href: "/help/what-you-can-upload",
  },
  {
    label: "Free storage",
    value: formatBytes(planById("free").storageBytes),
    href: "/help/what-the-free-plan-includes",
  },
  {
    label: "Recovery window",
    value: `${RECENTLY_DELETED_WINDOW_DAYS} days`,
    href: "/help/hide-remove-and-restore",
  },
  {
    // The live reel carries no cap or mark on any tier now; these numbers
    // describe the on-device CUT alone. Label follows reel-story.pricing's
    // recommended "renamed" option (a provisional stand-in, unruled) and the
    // href moves off the retired download-the-reel-as-a-video article to the
    // reel's own durable page.
    label: "Cut length, free / paid",
    value: `${MAX_REEL_SECONDS.free}s / ${MAX_REEL_SECONDS.pro}s`,
    href: "/reel",
  },
  {
    label: "Event Pass storage",
    value: formatBytes(planById("event_pass").storageBytes),
    href: "/help/how-long-an-event-pass-lasts",
  },
];

export type Audience = "host" | "guest" | "both";

export type FixtureArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  updated: string;
  audience: Audience;
  /** The exceptional tag only (null when it matches the category's default). */
  audienceLabel: string | null;
  headings: { id: string; text: string }[];
  words: number;
};

/** words / 200 wpm, rounded up — the same shape collection.ts's readingTime
 *  derives, re-implemented here so nothing imports the fs-bound original. */
export function readingTimeLabel(words: number): string {
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export const ARTICLES: Record<string, FixtureArticle> = {
  "customize-and-share-your-qr": {
    slug: "customize-and-share-your-qr",
    title: "Customize and share your QR code",
    description:
      "Tap Share on your event for the QR code and the link. Pick one of four styles, download SVG for print or PNG for screens, and share it. The code never changes.",
    category: "qr-and-invites",
    categoryTitle: "QR & invites",
    updated: "2026-09-01",
    audience: "host",
    audienceLabel: null,
    headings: [
      { id: "the-share-dialog", text: "The share dialog" },
      { id: "pick-a-style", text: "Pick a style" },
      { id: "download-it", text: "Download it" },
      { id: "what-you-cant-change", text: "What you can't change" },
    ],
    words: 320,
  },
  "how-guests-join-and-upload": {
    slug: "how-guests-join-and-upload",
    title: "Join an event and add your photos",
    description:
      "Scan the host's QR code (or open their link), tap Add photos, and pick from your camera roll. It works in any phone browser, with nothing to install. Uploads go one at a time at full quality.",
    category: "guest-experience",
    categoryTitle: "For guests",
    updated: "2026-09-01",
    audience: "guest",
    audienceLabel: null,
    headings: [
      { id: "joining", text: "Joining" },
      { id: "adding-photos", text: "Adding photos" },
      { id: "if-one-doesnt-finish", text: "If one doesn't finish" },
      { id: "what-happens-to-your-photos", text: "What happens to your photos" },
    ],
    words: 340,
  },
  "an-upload-wont-finish": {
    slug: "an-upload-wont-finish",
    title: "An upload won't finish",
    description:
      "A stuck upload is almost always the connection: tap the dimmed tile to retry. A refused one tells you why (too large, wrong type, uploads closed). Big videos need a steady connection and time.",
    category: "troubleshooting",
    categoryTitle: "Troubleshooting",
    updated: "2026-09-01",
    audience: "both",
    audienceLabel: null,
    headings: [
      { id: "its-stuck-or-dimmed", text: "It's stuck or dimmed, no reason given" },
      { id: "it-was-refused", text: "It was refused" },
      { id: "for-hosts", text: "For hosts" },
    ],
    words: 300,
  },
};

/**
 * The client-safe search index the real palette needs, built from the three
 * fixture articles (`HelpSearchItem` crosses as a TYPE only — the same rule
 * `help-palette.tsx` itself follows — so this stays fs-free).
 */
export const SEARCH_INDEX: HelpSearchItem[] = Object.values(ARTICLES).map(
  (a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category as HelpSearchItem["category"],
    categoryTitle: a.categoryTitle,
    audience: a.audience,
    audienceLabel: a.audienceLabel,
    keywords: [],
    headings: a.headings,
  }),
);

export const QUICK_LINKS = [
  {
    label: "What's on the free plan?",
    href: "/help/what-the-free-plan-includes",
  },
  {
    label: "Why is it asking for my email?",
    href: "/help/why-an-event-asks-for-your-email",
  },
  { label: "Is my event private?", href: "/help/who-can-see-your-event" },
] as const;

export const CATEGORY_CHIPS = CATEGORIES.map((c) => ({
  slug: c.slug,
  title: c.title,
}));
