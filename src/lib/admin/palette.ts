import { NAV } from "@/lib/admin/nav";

/**
 * WHAT THE PALETTE CAN REACH, and the little ranker that finds it
 * (`nav=rail-palette`, Will 2026-09-20: "a search that jumps to a surface, an
 * account or an action").
 *
 * ★ THE PALETTE JUMPS, IT NEVER ACTS. Every entry here is a destination, and
 * the "actions" group is a set of destinations too: "Pause the purge sweep"
 * scrolls the jobs console to that job's card, where the switch lives and where
 * the sheet that guards it can say what pausing touches. A palette that FIRED a
 * kill switch would be the portal's cheapest possible click on its most
 * expensive possible act, which is precisely the imbalance `destructive=sheet`
 * was ruled to fix. Typing four letters and pressing Enter must never be able
 * to stop storage being reclaimed.
 *
 * ★ THE SURFACES COME FROM `nav.ts` AND ARE NEVER RE-TYPED. The rail, the
 * breadcrumb and the palette are three readings of one list; a second copy here
 * is how a thirteenth surface ends up unreachable from search.
 */

export type PaletteEntry = {
  id: string;
  label: string;
  href: string;
  /** A short trailing word (a group, a plan) the row shows on the right. */
  meta?: string;
  /** Words that should match but are not worth showing. */
  keywords?: string[];
};

/** Every admin surface, as a palette row. */
export function paletteSurfaces(): PaletteEntry[] {
  return NAV.map((item) => ({
    id: `surface-${item.href}`,
    label: item.label,
    href: item.href,
    meta: item.group,
  }));
}

/**
 * The acts an operator does often enough to want by name, each pointing at the
 * control rather than performing it. The anchors are ids the surfaces render.
 */
export const PALETTE_ACTIONS: PaletteEntry[] = [
  {
    id: "action-purge-pause",
    label: "Pause or resume the purge sweep",
    href: "/admin/jobs#job-purge_cron",
    meta: "Jobs",
    keywords: ["kill switch", "stop", "storage", "cron"],
  },
  {
    id: "action-purge-run",
    label: "Run the purge sweep now",
    href: "/admin/jobs#job-purge_cron",
    meta: "Jobs",
    keywords: ["trigger", "manual", "reclaim"],
  },
  {
    id: "action-downloads",
    label: "Pause or resume downloads",
    href: "/admin/exports#downloads",
    meta: "Exports",
    keywords: ["kill switch", "zip", "export"],
  },
  {
    id: "action-live-reel",
    label: "Pause or resume the live reel",
    href: "/admin/exports#live-reel",
    meta: "Exports",
    keywords: ["kill switch", "highlight reel", "clip", "make your own"],
  },
  {
    id: "action-announce",
    label: "Publish an announcement",
    href: "/admin/announcements#compose",
    meta: "Announcements",
    keywords: ["notify", "hosts", "bell"],
  },
  {
    id: "action-preserve",
    label: "Preserve media under legal hold",
    href: "/admin/forensics#preserve",
    meta: "Forensics",
    keywords: ["evidence", "hold", "legal"],
  },
];

/**
 * THE RANKER. AND semantics across the query's terms (one dead term kills the
 * row, which is what makes a second word narrow rather than widen), then a
 * weight by WHERE the term landed: the start of the label beats the middle of
 * it, which beats a keyword nobody sees. Ties break by declaration order, so
 * the list is stable while somebody types.
 *
 * Deliberately not the help centre's `rankHelpSearch`: that one is shaped to a
 * help article (slug, headings, audience, the "sole reason" anchor rule) and
 * carries a hard-coded marketing destinations list. What is worth sharing
 * between them is the SHAPE, and the shape is eleven lines.
 */
const WEIGHT = { prefix: 4, word: 3, label: 2, keyword: 1 } as const;

export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function termScore(entry: PaletteEntry, term: string): number {
  const label = entry.label.toLowerCase();
  if (label.startsWith(term)) return WEIGHT.prefix;
  // A term that starts any WORD of the label is nearly as good as one that
  // starts the label: "sweep" should find "Pause or resume the purge sweep".
  if (label.split(/\s+/).some((word) => word.startsWith(term)))
    return WEIGHT.word;
  if (label.includes(term)) return WEIGHT.label;
  if (entry.keywords?.some((k) => k.toLowerCase().includes(term)))
    return WEIGHT.keyword;
  if (entry.meta?.toLowerCase().includes(term)) return WEIGHT.keyword;
  return 0;
}

export function matchPalette(
  entries: PaletteEntry[],
  query: string,
  limit = 8,
): PaletteEntry[] {
  const terms = tokenize(query);
  if (terms.length === 0) return entries.slice(0, limit);

  const scored: { entry: PaletteEntry; score: number; index: number }[] = [];
  entries.forEach((entry, index) => {
    let total = 0;
    for (const term of terms) {
      const score = termScore(entry, term);
      if (score === 0) return;
      total += score;
    }
    scored.push({ entry, score: total, index });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
