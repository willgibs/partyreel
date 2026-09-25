import type { HelpSearchItem } from "./help";

// ── Help palette ranking (R6) ──────────────────────────────────────────────────
// Pure, fs-free, client-safe: the palette island imports THIS module, never
// help.ts (which reaches node:fs through the collection loader — a value import
// would kill the client build). HelpSearchItem crosses as a TYPE only.
//
// Semantics: every query term must match somewhere on the item (AND, like the
// old inline filter) — then items rank by WHERE the terms hit: title prefix >
// title > keyword > heading > description/category. Headings are a scoring
// signal, and become a deep-link anchor ONLY when some term matches nothing but
// headings (the "sole reason" rule) — that's when jumping mid-article beats
// landing at the top.

export type RankedHelpResult = {
  item: HelpSearchItem;
  score: number;
  /** Set when the match only exists because of this heading — deep-link to it. */
  anchor: { id: string; text: string } | null;
};

const WEIGHT = {
  titlePrefix: 5,
  title: 3,
  keyword: 2.5,
  heading: 2,
  description: 1,
  category: 1,
} as const;

export function tokenizeQuery(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function bestTermScore(
  item: HelpSearchItem,
  term: string,
): {
  score: number;
  headingOnly: boolean;
  heading: HelpSearchItem["headings"][number] | null;
} {
  const title = item.title.toLowerCase();
  let score = 0;
  if (title.startsWith(term)) score = WEIGHT.titlePrefix;
  else if (title.includes(term)) score = WEIGHT.title;

  const keywordHit = item.keywords.some((k) => k.toLowerCase().includes(term));
  if (keywordHit) score = Math.max(score, WEIGHT.keyword);

  const heading =
    item.headings.find((h) => h.text.toLowerCase().includes(term)) ?? null;
  if (heading) score = Math.max(score, WEIGHT.heading);

  const proseHit =
    item.description.toLowerCase().includes(term) ||
    item.categoryTitle.toLowerCase().includes(term);
  if (proseHit) score = Math.max(score, WEIGHT.description);

  return {
    score,
    heading,
    headingOnly: heading !== null && score === WEIGHT.heading && !keywordHit,
  };
}

export function rankHelpSearch(
  items: HelpSearchItem[],
  query: string,
  limit = 8,
): RankedHelpResult[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return [];

  const ranked: (RankedHelpResult & { index: number })[] = [];
  items.forEach((item, index) => {
    let total = 0;
    let anchor: RankedHelpResult["anchor"] = null;
    for (const term of terms) {
      const hit = bestTermScore(item, term);
      if (hit.score === 0) return; // AND semantics: one dead term kills the item.
      total += hit.score;
      // First heading-only term wins the anchor; a later stronger surface
      // never clears it (the article still matched only because of a section).
      if (hit.headingOnly && !anchor && hit.heading) anchor = hit.heading;
    }
    ranked.push({ item, score: total, anchor, index });
  });

  return ranked
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item, score, anchor }) => ({ item, score, anchor }));
}

// ── Match emphasis ─────────────────────────────────────────────────────────────
// Index-position segmentation on the ORIGINAL string (never a RegExp built from
// user input, never HTML): the palette renders `match: true` segments bolder.

export type MatchSegment = { text: string; match: boolean };

export function segmentMatches(text: string, query: string): MatchSegment[] {
  const terms = tokenizeQuery(query);
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = 0;
    while (true) {
      const at = lower.indexOf(term, from);
      if (at === -1) break;
      ranges.push([at, at + term.length]);
      from = at + term.length;
    }
  }
  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }

  const segments: MatchSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor)
      segments.push({ text: text.slice(cursor, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), match: false });
  return segments;
}

// ── The Pages tail (the de-silo hook) ──────────────────────────────────────────
// A tiny static destinations list so searches like "price" also offer the site
// page itself — the help center is one resource inside a bigger site, and the
// palette should hand people onward. Static by design (no fs); labels mirror
// nav voice.

export type HelpDestination = { label: string; href: string };

const DESTINATIONS: (HelpDestination & { keywords: string[] })[] = [
  {
    label: "Pricing",
    href: "/pricing",
    keywords: [
      "pricing",
      "price",
      "cost",
      "plans",
      "billing",
      "pay",
      "upgrade",
    ],
  },
  {
    label: "How it works",
    href: "/how-it-works",
    keywords: ["how it works", "overview", "tour", "guide", "start"],
  },
  {
    label: "All features",
    href: "/features",
    keywords: ["features", "feature"],
  },
  {
    label: "Highlight reel",
    href: "/reel",
    keywords: ["reel", "highlight", "clip", "screen", "video", "montage"],
  },
  {
    label: "Contact",
    href: "/contact",
    keywords: ["contact", "support", "help", "human", "email us", "talk"],
  },
];

export function matchDestinations(query: string, limit = 3): HelpDestination[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return [];
  return DESTINATIONS.filter((destination) =>
    terms.some(
      (term) =>
        destination.label.toLowerCase().includes(term) ||
        destination.keywords.some((k) => k.startsWith(term)),
    ),
  )
    .slice(0, limit)
    .map(({ label, href }) => ({ label, href }));
}
