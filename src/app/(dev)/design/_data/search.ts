/**
 * ONE SEARCH INDEX: the sidebar's filter only sees the sidebar, so this builds
 * one index over everything the Library and the lab render, beside the nav and
 * from the same registries, and the palette (⌘K) searches it.
 *
 * The index is built SERVER-SIDE (`buildSearchIndex`, beside `buildNav`) and
 * handed to the chrome as props, for the reason nav.ts states: the gallery
 * registry mounts production components, and a client import of it would drag
 * every one of them into the sidebar's bundle. Entries are deliberately thin
 * (id, kind, title, href, one line of context, a keyword blob) because the
 * whole index rides the layout payload once per load.
 *
 * Scoring is `id exact > title prefix > word in title > keyword`, and the
 * results group by kind, so typing "1" lands on the first principle and typing
 * "glow" shows the component before a page that mentions it.
 */

export type SearchKind =
  | "page"
  | "rule"
  | "component"
  | "board"
  | "proposal"
  | "track"
  | "glossary";

export type SearchEntry = {
  /** Stable and unique: `${kind}:${id}`. */
  key: string;
  kind: SearchKind;
  /** What a reader would type to mean exactly this: a rule id, a component id. */
  id: string;
  title: string;
  href: string;
  /** One line under the title; never the whole body. */
  context?: string;
  /** Extra words that should match, space-joined and already lowercase. */
  keywords?: string;
};

export type SearchIndex = SearchEntry[];

/** The order the palette groups results in: the Library first, the lab after. */
export const KIND_ORDER: SearchKind[] = [
  "page",
  "rule",
  "component",
  "board",
  "proposal",
  "track",
  "glossary",
];

export const KIND_LABEL: Record<SearchKind, string> = {
  page: "Pages",
  rule: "The ten",
  component: "Components",
  board: "Boards",
  proposal: "Proposals",
  track: "Tracks",
  glossary: "Glossary",
};

// ── Scoring ──────────────────────────────────────────────────────────────────

const ID_EXACT = 1000;
const TITLE_PREFIX = 700;
const TITLE_WORD = 500;
const ID_PREFIX = 400;
const TITLE_SUBSTRING = 250;
const KEYWORD = 100;

/** Normalizes a query or a field: lowercase, collapsed whitespace, trimmed. */
export function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * How well one entry answers `q` (already normalized), or 0 for no match.
 * Shorter titles win ties, so "Tag" outranks "Tag row" for "tag".
 */
export function scoreEntry(entry: SearchEntry, q: string): number {
  if (!q) return 0;
  const id = entry.id.toLowerCase();
  const title = norm(entry.title);
  let score = 0;

  if (id === q) score = ID_EXACT;
  else if (title === q) score = ID_EXACT - 1;
  else if (title.startsWith(q)) score = TITLE_PREFIX;
  else if (new RegExp(`\\b${escapeRe(q)}`).test(title)) score = TITLE_WORD;
  else if (id.startsWith(q)) score = ID_PREFIX;
  else if (title.includes(q)) score = TITLE_SUBSTRING;
  else if (
    (entry.keywords && entry.keywords.includes(q)) ||
    (entry.context && norm(entry.context).includes(q)) ||
    id.includes(q)
  )
    score = KEYWORD;

  if (score === 0) return 0;
  // A tie breaks toward the shorter title: the thing itself, not a mention.
  return score * 100 - Math.min(title.length, 99);
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type SearchGroup = { kind: SearchKind; entries: SearchEntry[] };

/**
 * Every hit, grouped by kind in KIND_ORDER, each group sorted by score.
 * `limit` caps the TOTAL, so a query matching two hundred entries still
 * leaves room for the rule it was really after (the best of each kind is kept
 * first, then the rest by score).
 */
export function searchLab(
  index: SearchIndex,
  query: string,
  limit = 40,
): SearchGroup[] {
  const q = norm(query);
  if (!q) return [];
  const hits: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const score = scoreEntry(entry, q);
    if (score > 0) hits.push({ entry, score });
  }
  hits.sort(
    (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
  );

  // Round-robin by kind up to the cap, so one loud kind never buries the rest.
  const byKind = new Map<SearchKind, SearchEntry[]>();
  const queues = new Map<SearchKind, SearchEntry[]>();
  for (const { entry } of hits) {
    const queue = queues.get(entry.kind) ?? [];
    queue.push(entry);
    queues.set(entry.kind, queue);
  }
  let taken = 0;
  let round = 0;
  const perRound = 3;
  while (taken < limit) {
    let moved = false;
    for (const kind of KIND_ORDER) {
      const queue = queues.get(kind);
      if (!queue?.length) continue;
      for (let i = 0; i < perRound && queue.length && taken < limit; i++) {
        const entry = queue.shift();
        if (!entry) break;
        byKind.set(kind, [...(byKind.get(kind) ?? []), entry]);
        taken++;
        moved = true;
      }
    }
    if (!moved) break;
    if (++round > limit) break;
  }

  return KIND_ORDER.filter((kind) => byKind.get(kind)?.length).map((kind) => ({
    kind,
    entries: byKind.get(kind) ?? [],
  }));
}
