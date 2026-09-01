/**
 * THE BLOG TAG REGISTRY: the six tags a post may carry, with the label the UI prints and
 * the one-line description the filtered library shows under its heading.
 *
 * Three AUDIENCES (who the post is for) and three PURPOSES (what kind of piece it is).
 * A post carries one of each at most; the frontmatter schema (blog.ts) enforces membership
 * so a typo fails the BUILD, the same contract `cover` and `author` already have. The
 * registry order is the RAIL order (audiences, then purposes), deliberately fixed: a
 * most-used-first rail would reshuffle every time a batch of posts lands, which is the
 * same instability the cover resolver forbids.
 *
 * ★ ZERO IMPORTS, ON PURPOSE. This module is reached by the "use client" index island
 * (through blog-index.ts) and by PostCard, so it can never touch blog.ts / help.ts /
 * collection.ts, which reach node:fs. blog-tags.test.ts reads this file and asserts it
 * stays import-free.
 *
 * Copy here is user-facing (the rail, the library heading, the chips): no em-dashes, no
 * "night" as identity language, descriptions at most 80 characters so the heading lockup
 * holds one line at sm+ and never more than two on a phone.
 */

export type BlogTagKind = "audience" | "purpose";

export const BLOG_TAGS = [
  {
    id: "weddings",
    kind: "audience",
    label: "Weddings",
    description:
      "Receptions, ceremonies, rehearsal dinners: every guest's angle of the day.",
  },
  {
    id: "parties",
    kind: "audience",
    label: "Parties",
    description:
      "Birthdays, showers, graduations, reunions and holidays, before anyone leaves.",
  },
  {
    id: "corporate",
    kind: "audience",
    label: "Corporate",
    description:
      "Conferences, offsites and team events, curated before they are reshared.",
  },
  {
    id: "how-to",
    kind: "purpose",
    label: "How-to",
    description:
      "Practical guides for collecting, curating and sharing event photos.",
  },
  {
    id: "compared",
    kind: "purpose",
    label: "Compared",
    description:
      "How a QR event album stacks up against the ways guests already share.",
  },
  {
    id: "product",
    kind: "purpose",
    label: "Product",
    description:
      "How Partyreel works under the hood, and why it works that way.",
  },
] as const satisfies readonly {
  id: string;
  kind: BlogTagKind;
  label: string;
  description: string;
}[];

export type BlogTag = (typeof BLOG_TAGS)[number];
export type BlogTagId = BlogTag["id"];

/** Tuple form for `z.enum` (the HELP_CATEGORIES cast precedent in help.ts). */
export const BLOG_TAG_IDS = BLOG_TAGS.map((t) => t.id) as [
  BlogTagId,
  ...BlogTagId[],
];

/** The unfiltered library's line, paired with the registry descriptions so the heading
 *  lockup keeps a second line in EVERY view (a constant block height is what keeps the
 *  set-change FLIP from animating a jolt when a filter is picked). */
export const BLOG_LIBRARY_LINE =
  "Guides, stories, and product notes from the team.";

export function isBlogTagId(value: string): value is BlogTagId {
  return (BLOG_TAG_IDS as readonly string[]).includes(value);
}

/** Exhaustive by type: a BlogTagId always resolves. */
export function getBlogTag(id: BlogTagId): BlogTag {
  return BLOG_TAGS.find((t) => t.id === id)!;
}

/** The audience ids a post's tags contain (0 or 1 by the schema refine). */
export function audienceTags(tags: readonly BlogTagId[]): BlogTagId[] {
  return tags.filter((t) => getBlogTag(t).kind === "audience");
}
