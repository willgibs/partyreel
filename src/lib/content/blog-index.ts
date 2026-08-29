import type { BlogListItem } from "./blog";

/**
 * THE BLOG INDEX's pure derivations. Client-safe (no `node:fs`): the filter island imports these,
 * `blog.ts` cannot cross that boundary.
 *
 * ★ THE HERO RULE, and why it is a rule rather than a layout detail. The obvious shape is "lift the
 * newest post out as the hero, filter the rest" - and it is broken. Tags are freeform and per-post,
 * so a hero can own tags no other post has (today the newest post owns `product` and
 * `highlight-reel` alone). Lift it out permanently and those chips render an EMPTY library while
 * the one matching article sits in the hero directly above, which reads as a bug.
 *
 * So the hero exists ONLY in the unfiltered view. Pick a tag and the hero collapses into a pure
 * library containing every match, the ex-hero included. That makes an empty tag structurally
 * impossible rather than something a content change could reintroduce, which is exactly what
 * `everyTagYieldsRows` pins.
 */

export type TagCount = { label: string; count: number };

/** Tags with their post counts, most-used first then alphabetical. Counts come from the FULL set,
 *  which is what makes them a reliable promise about what a chip will show. */
export function tagCounts(posts: BlogListItem[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export type LibrarySplit = {
  /** The staged hero. Null whenever a tag is active (see the hero rule above). */
  lead: BlogListItem | null;
  /** Everything the grid renders. */
  library: BlogListItem[];
};

export function splitLibrary(
  posts: BlogListItem[],
  activeTag: string | null,
): LibrarySplit {
  if (activeTag) {
    return {
      lead: null,
      library: posts.filter((post) => post.tags.includes(activeTag)),
    };
  }
  return { lead: posts[0] ?? null, library: posts.slice(1) };
}

/** A selected tag that is not in `tagCounts` cannot happen through the UI, but CAN arrive through
 *  the shareable `?tag=` URL. Normalize unknown values back to the unfiltered view rather than
 *  rendering an empty page for a stale or hand-typed link. */
export function normalizeTag(
  raw: string | null | undefined,
  posts: BlogListItem[],
): string | null {
  if (!raw) return null;
  return posts.some((post) => post.tags.includes(raw)) ? raw : null;
}

// ── Pagination ───────────────────────────────────────────────────────────────
// Built ahead of need (Will, 2026-08-28: "it may be worth building the future pagination we'll
// need"). It is INVISIBLE below the threshold, so today's four posts render exactly as they do now
// and the control appears the first time a page overflows.
//
// Client-side over `/blog/page/[n]` routes on purpose: the filter already owns `?tag=`, the route
// is static, and a second axis of real routes would multiply into tag x page URL space for a blog
// with four posts in it. `?page=` keeps every view shareable without any of that. If the archive
// ever gets big enough that indexing deep pages matters, THAT is the moment to promote it to real
// routes, and the pure function below is what those routes would call anyway.

/** One screenful of the library. Four rows of three on the widest grid, two of six at sm. */
export const POSTS_PER_PAGE = 12;

export type Page<T> = {
  items: T[];
  /** 1-based, always clamped into range. */
  page: number;
  pageCount: number;
  /** 1-based inclusive display range, for a "Showing 1-12 of 37" readout. */
  from: number;
  to: number;
  total: number;
};

/**
 * ★ CLAMPS rather than trusting the input. `page` arrives from `?page=` in the address bar and from
 * a filter change that can shrink the set under the reader's feet (tag with 40 posts, page 4, pick
 * a tag with 3). Both must land on a real page instead of an empty grid, so an out-of-range,
 * fractional, or non-numeric page resolves to the nearest valid one.
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number = POSTS_PER_PAGE,
): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safe = Number.isFinite(page) ? Math.floor(page) : 1;
  const current = Math.min(Math.max(safe, 1), pageCount);
  const start = (current - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}

/**
 * The page numbers to print, with `null` marking an elided run. Always shows the first, the last,
 * and a window around the current page, so the control keeps a stable width instead of growing a
 * new number every time the archive does.
 */
export function pageNumbers(
  page: number,
  pageCount: number,
  window = 1,
): (number | null)[] {
  if (pageCount <= 1) return [];
  const keep = new Set<number>([1, pageCount]);
  for (let i = page - window; i <= page + window; i++) {
    if (i >= 1 && i <= pageCount) keep.add(i);
  }
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push(null);
    out.push(n);
    prev = n;
  }
  return out;
}
