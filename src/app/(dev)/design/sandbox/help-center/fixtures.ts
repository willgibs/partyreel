import type { HelpSearchItem } from "@/lib/content/help";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_REEL_SECONDS, planById } from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * FIXTURES FOR THE `help-center` BOARD: the ten real categories with every
 * guide's title, five real facts (read from the same single sources
 * `getHelpFacts` reads — never a second set of numbers), the Start-here trio
 * and three real articles, hand-copied as data rather than read from the
 * `.mdx` (the boundary rule: `help.ts` reaches `node:fs` through
 * `collection.ts`, so nothing here may import it as a value; `readingTime`
 * is re-implemented as a tiny pure copy below).
 *
 * ★ COPIED FROM THE CATALOG AT THIS LANE'S BASE (2026-09-28), so a hub drawn
 * "as today" lists what /help lists: the category rows mirror
 * `HELP_CATEGORIES`, the guide titles each category's `.mdx` frontmatter in
 * `order`, the quick links `HELP_QUICK_LINKS`, the trio `START_HERE_SLUGS`.
 * A copy drifts the moment the catalog moves, which is why the board redraws
 * "today" from the files rather than from its own last drawing.
 */

export type FixtureCategory = {
  slug: string;
  stripLabel: string;
  title: string;
  blurb: string;
  /** Every guide in the category, in its frontmatter `order`. */
  guides: readonly string[];
  feature: { href: string; label: string } | null;
};

export const CATEGORIES: FixtureCategory[] = [
  {
    slug: "getting-started",
    stripLabel: "Start",
    title: "Getting started",
    blurb: "How it works, your first event, and your dashboard.",
    guides: [
      "How Partyreel works",
      "Create your first event",
      "Your dashboard, explained",
      "Your event page, explained",
      "Event settings, explained",
      "A day-of checklist for hosts",
    ],
    feature: { href: "/how-it-works", label: "How it works" },
  },
  {
    slug: "qr-and-invites",
    stripLabel: "QR",
    title: "QR & invites",
    blurb: "The code, the cards, the screens: getting guests in.",
    guides: [
      "Customize and share your QR code",
      "Print your QR code, or put it on a screen",
      "Send the event link by text or email (no QR needed)",
      "Set a custom event link",
    ],
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
    guides: [
      "Why an event asks for your email",
      "Join an event and add your photos",
      "What you can upload: formats and sizes",
      "Browse the album: the gallery, the photo viewer, and the reel",
      "Find your uploads, and the events you added to",
      "Your name on a guest list and on your profile",
      "What guests can and can't see",
      "Report a problem, or get a photo of you taken down",
    ],
    feature: { href: "/features/guests", label: "Guests & profiles" },
  },
  {
    slug: "event-album",
    stripLabel: "Album",
    title: "Event album",
    blurb: "Review, curate, and shape what everyone sees.",
    guides: [
      "Curate what shows up in your album",
      "Review uploads before they appear",
      "Hide, remove, and restore",
      "Select many photos at once",
      "Add your own photos (and your photographer's)",
      "Turn off uploads, or cap the size of guest uploads",
      "Likes: who sees them and what they do",
    ],
    feature: { href: "/features/curation", label: "Curation" },
  },
  {
    slug: "sharing-and-downloads",
    stripLabel: "Sharing",
    title: "Sharing & downloads",
    blurb: "The album link, full-quality downloads, and the zip.",
    guides: [
      "Share the album after the event",
      "Download your photos, videos, and albums",
    ],
    feature: { href: "/features/sharing", label: "Sharing & downloads" },
  },
  {
    // `reel-story` r1's `help=highlight-reel`, as help.ts now carries it.
    slug: "highlight-reel",
    stripLabel: "Reel",
    title: "Highlight reel",
    blurb:
      "The reel that plays itself, on a screen too, and the clips you make.",
    guides: [
      "The highlight reel",
      "Play the reel on a screen",
      "Make your own clip",
      "Looks, length, and layout",
      "Add a clip to the event",
    ],
    feature: { href: "/reel", label: "Highlight reel" },
  },
  {
    slug: "plans-and-billing",
    stripLabel: "Plans",
    title: "Plans & billing",
    blurb: "Storage, the free plan, Pro, and the one-time Event Pass.",
    guides: [
      "What the free plan includes",
      "Pro vs. Event Pass: which is right for you?",
      "How long an Event Pass lasts (and how to extend it)",
      "Storage, plans, and what counts toward your limit",
      "What happens when storage fills up",
      "Upgrade, downgrade, or cancel",
      "Payments, receipts, and invoices",
    ],
    feature: { href: "/pricing", label: "Pricing" },
  },
  {
    slug: "account-and-profile",
    stripLabel: "Account",
    title: "Account & profile",
    blurb: "Sign-in, your name and photo, your profile, and notifications.",
    guides: [
      "Sign in: a code, Google, or a password",
      "Your display name and photo",
      "Your public profile, following, and blocking",
      "Notifications and the emails Partyreel sends",
    ],
    feature: { href: "/features/guests", label: "Guests & profiles" },
  },
  {
    slug: "privacy-and-safety",
    stripLabel: "Privacy",
    title: "Privacy & safety",
    blurb: "Who can see your media, how long it's kept, and your data.",
    guides: [
      "Who can see your event and media",
      "Password-protect your event",
      "Require verified emails, explained",
      "Photo metadata and location data",
      "How long your media is kept",
      "Reporting content and keeping your event safe",
      "Your data and deleting your account",
      "Require an upload to view, explained",
    ],
    feature: { href: "/features/privacy", label: "Privacy & trust" },
  },
  {
    slug: "troubleshooting",
    stripLabel: "Fixes",
    title: "Troubleshooting",
    blurb: "When something won't scan, send, or upload.",
    guides: [
      "The email code didn't arrive",
      "You can't sign in",
      "An upload won't finish",
      "A photo is missing from the album",
      '"This album is full" and other messages guests might see',
      "The QR code won't scan, or the link won't open",
      "A video won't play",
      "A clip won't finish or save",
    ],
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
    // The CLIP's cap: the live reel itself runs uncapped on every plan.
    label: "Clip, free / paid",
    value: `${MAX_REEL_SECONDS.free}s / ${MAX_REEL_SECONDS.pro}s`,
    href: "/help/reel-styles-length-and-layout",
  },
  {
    label: "Event Pass storage",
    value: formatBytes(planById("event_pass").storageBytes),
    href: "/help/how-long-an-event-pass-lasts",
  },
];

/** The hub's curated trio (`START_HERE_SLUGS`), with each guide's own description. */
export const START_HERE = [
  {
    slug: "how-partyreel-works",
    title: "How Partyreel works",
    description:
      "You create an event and get a QR code. Guests scan it and add photos and videos from their phone browser, no app required. It all lands in one live album you curate and share, playing as a reel.",
  },
  {
    slug: "create-your-first-event",
    title: "Create your first event",
    description:
      "Sign in, add your name, and the wizard walks three steps: Details, Design, Share. Only the name is required; the link and QR code are ready when it is created.",
  },
  {
    slug: "day-of-checklist-for-hosts",
    title: "A day-of checklist for hosts",
    description:
      "Print the code big, test it as a guest, put it where people look, put the reel on a screen, tell everyone once, seed the album, glance at Review, and close uploads when it is over.",
  },
] as const;

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

/** words / 200 wpm, rounded — the same shape collection.ts's readingTime
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
    // crumbs-3 and crumbs-4 rewrote it for the lit door and the keep.
    updated: "2026-09-27",
    audience: "guest",
    audienceLabel: null,
    headings: [
      { id: "joining", text: "Joining" },
      { id: "adding-more", text: "Adding more" },
      { id: "if-one-doesnt-finish", text: "If one doesn't finish" },
      {
        id: "what-happens-to-your-photos",
        text: "What happens to your photos",
      },
    ],
    // The body's own count (collection.ts's split), so the meta reads "3 min read" as /help does.
    words: 669,
  },
  "an-upload-wont-finish": {
    slug: "an-upload-wont-finish",
    title: "An upload won't finish",
    description:
      "Almost always the connection: retry from the sheet that lists what didn't go. A refused file tells you why (too large, wrong type, uploads closed). Big videos need a steady connection and time.",
    category: "troubleshooting",
    categoryTitle: "Troubleshooting",
    updated: "2026-09-28",
    audience: "both",
    audienceLabel: null,
    headings: [
      {
        id: "its-stuck-or-dimmed",
        text: "It's stuck or dimmed, no reason given",
      },
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
  {
    label: "Download everything",
    href: "/help/download-photos-videos-and-albums",
  },
  { label: "Is my event private?", href: "/help/who-can-see-your-event" },
] as const;

export const CATEGORY_CHIPS = CATEGORIES.map((c) => ({
  slug: c.slug,
  title: c.title,
}));
