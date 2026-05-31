// Blog author registry. CLIENT-SAFE (no `fs`) so bylines render anywhere — the post
// cards, the post header, and the RSS feed all read names from here. `partyreel-team`
// is the default (generic posts); named people (e.g. `will-gibson`) front the more
// personal, human-voice posts. A post's frontmatter `author` is one of these ids.

export type Author = { name: string; role: string };

export const AUTHORS = {
  "partyreel-team": { name: "Partyreel Team", role: "Partyreel" },
  "will-gibson": { name: "Will Gibson", role: "Founder" },
} as const satisfies Record<string, Author>;

export type AuthorId = keyof typeof AUTHORS;

export const AUTHOR_IDS = Object.keys(AUTHORS) as [AuthorId, ...AuthorId[]];

export const DEFAULT_AUTHOR_ID: AuthorId = "partyreel-team";

/** Resolve an author id to its record; unknown/missing → the default author. */
export function getAuthor(id: string): Author {
  return AUTHORS[id as AuthorId] ?? AUTHORS[DEFAULT_AUTHOR_ID];
}
