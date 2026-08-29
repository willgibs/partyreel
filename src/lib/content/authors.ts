// Blog author registry. CLIENT-SAFE (no `fs`) so bylines render anywhere — the post
// cards, the post header, and the RSS feed all read names from here. A post's
// frontmatter `author` is one of these ids.
//
// ★ ONE AUTHOR ON PURPOSE (Will, 2026-08-28): "Partyreel Team" is the universal byline
// for now, and named individuals are deliberately NOT registered — a dormant entry is
// something a content agent can pick up by accident, which is exactly the outcome the
// ruling is avoiding. The registry itself is the mechanism, not the policy: adding a
// named author later is one line here plus the frontmatter that references it. The
// byline stays IN the card design regardless (also his call), so the shape is ready.

export type Author = { name: string; role: string };

export const AUTHORS = {
  "partyreel-team": { name: "Partyreel Team", role: "Partyreel" },
} as const satisfies Record<string, Author>;

export type AuthorId = keyof typeof AUTHORS;

export const AUTHOR_IDS = Object.keys(AUTHORS) as [AuthorId, ...AuthorId[]];

export const DEFAULT_AUTHOR_ID: AuthorId = "partyreel-team";

/** Resolve an author id to its record; unknown/missing → the default author. */
export function getAuthor(id: string): Author {
  return AUTHORS[id as AuthorId] ?? AUTHORS[DEFAULT_AUTHOR_ID];
}
