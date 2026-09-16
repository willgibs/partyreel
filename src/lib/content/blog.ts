import { cache } from "react";
import { z } from "zod";

import { isMarketingImageId } from "@/lib/constants/marketing-media";
import { formatEventDate } from "@/lib/utils";

import { type BlogCover, coverFor } from "./blog-covers";
import {
  BLOG_TAG_IDS,
  type BlogTagId,
  audienceTags,
  getBlogTag,
} from "./blog-tags";

import { AUTHOR_IDS, DEFAULT_AUTHOR_ID, getAuthor } from "./authors";
import {
  type CollectionEntry,
  escapeXml,
  loadCollection,
  readingTime,
} from "./collection";

// ── Blog collection — the second consumer of the content pipeline (marketing-content.md) ─────
// Mirrors help.ts: a zod frontmatter contract (build-fails on a bad post) + thin,
// cache()'d accessors over `loadCollection`. Posts sort newest-first by `date`, and
// `draft: true` posts are excluded everywhere (listing / sitemap / RSS) so WIP drafts
// never ship.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const blogFrontmatterSchema = z.object({
  /**
   * ★ CAPPED AT 80 (Will, 2026-08-28). This is a LAYOUT contract, not a style preference: the index
   * is built on cards whose titles are meant to fill their measure evenly, and the page reads the
   * way it does because the featured title lands at ~3 lines and library cards at 2. At three
   * columns a card fits about 60 characters of ordinary words; 80 is the ceiling that keeps the grid
   * whole (the card clamps), measured on the wall rather than assumed. The cards
   * ALSO line-clamp, so an over-long title can never break the layout, but failing the build here
   * means the content agent finds out at authoring time instead of shipping a silently cut title.
   */
  title: z
    .string()
    .min(1)
    .max(
      80,
      "title must be 80 characters or fewer (aim 45-60): a library card holds two lines at three columns and the featured card three, so a longer title ships visibly truncated",
    ),
  description: z.string().min(1).max(160),
  /** Published date — drives sort order, the byline, and RSS pubDate. */
  date: z.string().regex(ISO_DATE, "date must be YYYY-MM-DD"),
  updated: z.string().regex(ISO_DATE, "updated must be YYYY-MM-DD").optional(),
  author: z.enum(AUTHOR_IDS).default(DEFAULT_AUTHOR_ID),
  /**
   * Registered ids only (blog-tags.ts): a typo fails the BUILD, like `author` and `cover`.
   * One or two tags (the card prints at most two chips, so a third would be invisible) and at
   * most one AUDIENCE (weddings / parties / corporate): a post is written for one room.
   */
  tags: z
    .array(z.enum(BLOG_TAG_IDS))
    .min(
      1,
      "tags must name at least one registered tag (see BLOG_TAGS in src/lib/content/blog-tags.ts)",
    )
    .max(
      2,
      "at most two tags: the card prints two chips and would hide a third",
    )
    .refine((tags) => new Set(tags).size === tags.length, {
      message: "tags must not repeat",
    })
    .refine((tags) => audienceTags(tags).length <= 1, {
      message:
        "at most one audience tag (weddings / parties / corporate); pair it with a purpose tag",
    }),
  /**
   * Optional Q&A rendered after the body AND emitted as FAQPage JSON-LD, verbatim. Plain text
   * only: the `<>` guard stops an author reaching for `<ProPrice />` in an answer (it would ship
   * as literal text into the structured data) and doubles as the </script> guard for the inlined
   * JSON-LD. Numbers are fenced separately in blog.test.ts: a FAQ answer is the one place a
   * marketed figure can only be typed, so answers point at /pricing instead of quoting caps.
   */
  faq: z
    .array(
      z.object({
        q: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .refine((q) => !/[<>]/.test(q), {
            message: "faq questions are plain text (no JSX or HTML)",
          }),
        a: z
          .string()
          .trim()
          .min(1)
          .max(
            400,
            "faq answers are plain text of 400 characters or fewer: they render verbatim and ship into FAQPage JSON-LD",
          )
          .refine((a) => !/[<>]/.test(a), {
            message:
              "faq answers are plain text (no JSX or HTML); spec components cannot be used here",
          }),
      }),
    )
    .min(1)
    .max(8)
    .refine((items) => new Set(items.map((i) => i.q)).size === items.length, {
      message: "faq questions must not repeat",
    })
    .optional(),
  /**
   * Optional art direction: a `MARKETING_IMAGES` id. Omit it and `coverFor` derives a stable one
   * from the slug, so no post is ever artless. Validated against the manifest here so a typo fails
   * the BUILD (the same contract `author: z.enum(AUTHOR_IDS)` already sets) instead of throwing at
   * render; the message names the legal ids because a bare ZodError at module scope surfaces in
   * three unrelated places at once (the loader test, the llms test, and sitemap.ts).
   */
  cover: z
    .string()
    .refine(isMarketingImageId, {
      message:
        "cover must be a marketing media id (see MARKETING_IMAGES in src/lib/constants/marketing-media.ts)",
    })
    .optional(),
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

// "Keep reading": scored, not same-tag-first.
//
// The first version was "same-tag posts first, then recency". That degenerates on a real archive:
// every audience tag matches a third of the posts, so the two NEWEST same-tag posts (the hero and
// its neighbour) landed in nearly every ending of that audience. The score below weighs a shared
// AUDIENCE (the room the reader is in) over a shared PURPOSE, and breaks ties by NEAREST publish
// date rather than newest, so the archive's endings spread instead of funnelling to the top.
// blog.test.ts bounds how often any one post may appear across all endings.
//
// `exclude` is what keeps the article's ending honest: chronological neighbours are shown ABOVE
// related posts, and on a small archive the two sets overlap, so without it the same post appears
// twice within one screen. The page passes the neighbours it already rendered.
function relatedScore(a: BlogPost, b: BlogPost): number {
  let score = 0;
  for (const tag of a.frontmatter.tags) {
    if (!b.frontmatter.tags.includes(tag)) continue;
    score += getBlogTag(tag).kind === "audience" ? 2 : 1;
  }
  return score;
}

function msApart(a: BlogPost, b: BlogPost): number {
  return Math.abs(
    Date.parse(a.frontmatter.date) - Date.parse(b.frontmatter.date),
  );
}

export function getRelatedPosts(
  post: BlogPost,
  limit = 3,
  exclude: ReadonlySet<string> = new Set(),
): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug && !exclude.has(p.slug))
    .map((p) => ({ p, score: relatedScore(post, p), gap: msApart(post, p) }))
    .sort(
      (x, y) =>
        y.score - x.score || x.gap - y.gap || x.p.slug.localeCompare(y.p.slug),
    )
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * The article's chronological neighbours. `getAllPosts()` is already newest-first, so "newer" is
 * the previous index and "older" the next. Both are null at the ends of the archive, and both are
 * null for a single-post blog, which the page renders as simply no nav rather than a dead control.
 */
export function getPostNeighbors(post: BlogPost): {
  newer: BlogPost | null;
  older: BlogPost | null;
} {
  const all = getAllPosts();
  const at = all.findIndex((p) => p.slug === post.slug);
  if (at === -1) return { newer: null, older: null };
  return {
    newer: at > 0 ? all[at - 1] : null,
    older: at < all.length - 1 ? all[at + 1] : null,
  };
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
  /** Registered ids (blog-tags.ts); the UI prints the registry LABEL for each. */
  tags: BlogTagId[];
  /** Resolved server-side (explicit frontmatter cover, else the slug-derived fallback) so the
      client filter island never touches the resolver or the manifest. */
  cover: BlogCover;
};

/** One post -> its card metadata. Exported so the post page's "Keep reading" renders the SAME
 *  PostCard the index does: extracting the card and then leaving related posts as bare text rows
 *  would show the same article as a photograph on one surface and a link on the next. */
export function toListItem(post: BlogPost): BlogListItem {
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
    cover: coverFor(post.slug, post.frontmatter.cover),
  };
}

export function getPostListItems(): BlogListItem[] {
  return getAllPosts().map(toListItem);
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

/**
 * Cover byte sizes, keyed by the site-relative src. RSS 2.0 requires `length` on an enclosure, and
 * only the caller can stat a file, so the ROUTE reads sizes off disk and passes them in - the same
 * parameter-injection that keeps this builder pure and unit-testable on literals. A src with no
 * known size emits no enclosure at all rather than a lie like length="0".
 */
export type RssCoverSizes = ReadonlyMap<string, number>;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function enclosureFor(
  post: BlogPost,
  site: RssSiteConfig,
  sizes: RssCoverSizes | undefined,
): string {
  if (!sizes) return "";
  const cover = coverFor(post.slug, post.frontmatter.cover);
  const bytes = sizes.get(cover.src);
  const type = MIME_BY_EXT[cover.src.split(".").pop()?.toLowerCase() ?? ""];
  if (!bytes || !type) return "";
  return `
      <enclosure url="${escapeXml(`${site.url}${cover.src}`)}" length="${bytes}" type="${type}" />`;
}

export function buildBlogRssXml(
  posts: BlogPost[],
  site: RssSiteConfig,
  coverSizes?: RssCoverSizes,
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
      <dc:creator>${escapeXml(getAuthor(post.frontmatter.author).name)}</dc:creator>${enclosureFor(post, site, coverSizes)}
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
