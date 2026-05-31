import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

// ── Generic in-repo MDX collection core (shared by help + blog) ──────────────────
// Reads `content/<dir>/*.mdx`, splits frontmatter with gray-matter, validates each
// file against the caller's zod schema (so a malformed file FAILS THE BUILD), and
// returns slug + typed frontmatter + body. Importing `node:fs` makes every consumer
// server/build-only by construction — the client surfaces receive plain metadata via
// props. See ADR-0006. help.ts + blog.ts are thin wrappers that add a schema + sort.

export type CollectionEntry<T> = {
  slug: string;
  frontmatter: T;
  /** MDX body with frontmatter already stripped (gray-matter `content`). */
  body: string;
};

export function loadCollection<S extends z.ZodTypeAny>({
  dir,
  schema,
}: {
  dir: string;
  schema: S;
}): CollectionEntry<z.infer<S>>[] {
  const root = path.join(process.cwd(), "content", dir);
  return fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(root, file), "utf8");
      const { data, content } = matter(raw);
      const frontmatter = schema.parse(data) as z.infer<S>;
      return { slug, frontmatter, body: content };
    });
}

// Heading-anchor slug. Used BOTH by the MDX <h2>/<h3> components (which set the `id`)
// and by `extractHeadings` (the on-this-page TOC) — one function, so links + ids can
// never drift. (We don't use rehype-slug; this keeps the id scheme fully in-repo.)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type ArticleHeading = { id: string; text: string };

// Pull the `##` headings out of an MDX body for the TOC, skipping fenced code.
export function extractHeadings(body: string): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[1].replace(/[*_`]/g, "").trim();
    headings.push({ id: slugify(text), text });
  }
  return headings;
}

// Rough reading time from a body's word count (~200 wpm), min 1 minute.
export function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

// XML-escape for the RSS feed. `&` MUST be replaced first. Mirrors the email `esc()`
// discipline — the Next docs explicitly warn to sanitize anything put into the feed.
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
