import { cache } from "react";
import { z } from "zod";

import { formatEventDate } from "@/lib/utils";

import { AUTHOR_IDS, DEFAULT_AUTHOR_ID, getAuthor } from "./authors";
import {
  type CollectionEntry,
  escapeXml,
  loadCollection,
  readingTime,
} from "./collection";

// ── Blog collection — the second consumer of the content pipeline (ADR-0006) ─────
// Mirrors help.ts: a zod frontmatter contract (build-fails on a bad post) + thin,
// cache()'d accessors over `loadCollection`. Posts sort newest-first by `date`, and
// `draft: true` posts are excluded everywhere (listing / sitemap / RSS) so WIP drafts
// never ship.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  /** Published date — drives sort order, the byline, and RSS pubDate. */
  date: z.string().regex(ISO_DATE, "date must be YYYY-MM-DD"),
  updated: z.string().regex(ISO_DATE, "updated must be YYYY-MM-DD").optional(),
  author: z.enum(AUTHOR_IDS).default(DEFAULT_AUTHOR_ID),
  tags: z.array(z.string()).default([]),
  /** WIP posts: kept out of the listing, sitemap, and feed. */
  draft: z.boolean().default(false),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
export type BlogPost = CollectionEntry<BlogFrontmatter>;

export const getAllPosts = cache((): BlogPost[] => {
  return loadCollection({ dir: "blog", schema: blogFrontmatterSchema })
    .filter((post) => !post.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
});

export const getPost = cache((slug: string): BlogPost | null => {
  return getAllPosts().find((post) => post.slug === slug) ?? null;
});

export function getAllBlogSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.frontmatter.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}

// Same-tag posts first (then recency) for "Related posts".
export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const others = getAllPosts().filter((p) => p.slug !== post.slug);
  const sharesTag = (p: BlogPost) =>
    p.frontmatter.tags.some((t) => post.frontmatter.tags.includes(t));
  return [
    ...others.filter(sharesTag),
    ...others.filter((p) => !sharesTag(p)),
  ].slice(0, limit);
}

// Light, serializable metadata for the client tag-filter (NO bodies — they stay on the
// server). Author name/role + reading time are pre-derived so cards render cheaply.
export type BlogListItem = {
  slug: string;
  title: string;
  description: string;
  /** ISO date for the <time dateTime> attribute. */
  date: string;
  /** Pre-formatted on the server so the client card never re-formats (no locale
      hydration mismatch in the client-side filter list). */
  dateLabel: string;
  authorName: string;
  authorRole: string;
  readingTime: string;
  tags: string[];
};

export function getPostListItems(): BlogListItem[] {
  return getAllPosts().map((post) => {
    const author = getAuthor(post.frontmatter.author);
    return {
      slug: post.slug,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      date: post.frontmatter.date,
      dateLabel: formatEventDate(post.frontmatter.date),
      authorName: author.name,
      authorRole: author.role,
      readingTime: readingTime(post.body),
      tags: post.frontmatter.tags,
    };
  });
}

// ── RSS 2.0 feed ────────────────────────────────────────────────────────────────
// Pure builder (unit-tested) → the /blog/feed.xml route just wraps it. Every dynamic
// value is escapeXml'd (the Next docs warn to sanitize feed markup). pubDate is parsed
// at local NOON so a YYYY-MM-DD never shifts a calendar day across the UTC boundary.
function rfc822(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toUTCString();
}

// Site config is passed in (not imported) so this module stays free of the
// env-validating `site.ts` and remains importable in Vitest — the /blog/feed.xml
// route supplies the real SITE_* constants; the test supplies literals.
export type RssSiteConfig = { url: string; name: string; description: string };

export function buildBlogRssXml(
  posts: BlogPost[],
  site: RssSiteConfig,
): string {
  const items = posts
    .map((post) => {
      const url = `${site.url}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <description>${escapeXml(post.frontmatter.description)}</description>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${rfc822(post.frontmatter.date)}</pubDate>
      <dc:creator>${escapeXml(getAuthor(post.frontmatter.author).name)}</dc:creator>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${site.name} Blog`)}</title>
    <link>${site.url}/blog</link>
    <description>${escapeXml(site.description)}</description>
    <language>en</language>
    <atom:link href="${site.url}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
