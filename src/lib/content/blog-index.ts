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
