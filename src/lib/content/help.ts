import {
  CreditCard,
  Film,
  Images,
  Rocket,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cache } from "react";
import { z } from "zod";

import { type CollectionEntry, loadCollection } from "./collection";

// Re-export the generic content helpers so existing importers of help.ts (the shared
// MDX components, the article page, the test) keep their import paths unchanged.
export { extractHeadings, slugify } from "./collection";
export type { ArticleHeading } from "./collection";

// ── Help-center content pipeline ────────────────────────────────────────────────
// In-repo MDX collection: `content/help/*.mdx`. gray-matter parses + lists frontmatter
// cheaply (no MDX compile) for the index/sitemap/related/search; the article page
// renders the body with next-mdx-remote/rsc. Frontmatter is validated against
// `helpFrontmatterSchema` at read time, so a malformed article FAILS THE BUILD (a
// build-time data-integrity net — see the Vitest test + ADR-0006). This module reads
// `node:fs`, so it is server/build-only by construction; the client search component
// never imports it (it receives plain metadata via props). Round 7 (Blog) reuses this
// same shape with a `content/blog` directory.

// Closed, ordered category set. The index renders sections in THIS order; the
// frontmatter `category` enum is derived from these slugs (an unknown category fails
// the build). Icons are decorative section/card accents.
export const HELP_CATEGORIES = [
  {
    slug: "getting-started",
    title: "Getting started",
    blurb: "Create an event, design your QR code, and share it with guests.",
    icon: Rocket,
  },
  {
    slug: "for-guests",
    title: "For guests",
    blurb: "Joining and uploading: no app, no account, just a phone.",
    icon: Users,
  },
  {
    slug: "managing-your-album",
    title: "Managing your album",
    blurb: "Curate what shows up and download everything you collect.",
    icon: Images,
  },
  {
    slug: "highlight-reel",
    title: "The highlight reel",
    blurb: "Your event's best moments, auto-compiled into one shareable video.",
    icon: Film,
  },
  {
    slug: "plans-and-billing",
    title: "Plans & billing",
    blurb: "Storage, the free plan, Pro, and the one-time Event Pass.",
    icon: CreditCard,
  },
  {
    slug: "privacy-and-safety",
    title: "Privacy & safety",
    blurb: "Who can see your media, how long it's kept, and reporting.",
    icon: ShieldCheck,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
}[];

export type HelpCategory = (typeof HELP_CATEGORIES)[number];
export type HelpCategorySlug = HelpCategory["slug"];

const CATEGORY_SLUGS = HELP_CATEGORIES.map((c) => c.slug) as [
  HelpCategorySlug,
  ...HelpCategorySlug[],
];

export function getCategory(slug: HelpCategorySlug): HelpCategory {
  // Non-null: `slug` is a HelpCategorySlug, so it always resolves.
  return HELP_CATEGORIES.find((c) => c.slug === slug)!;
}

// Frontmatter contract. `description` doubles as the meta description + card copy, so
// it's capped at a search-snippet-friendly length. `.parse()` (not safeParse) is
// intentional — a bad article should break the build loudly.
export const helpFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  category: z.enum(CATEGORY_SLUGS),
  /** Sort weight WITHIN a category (lower first). */
  order: z.number().int().default(0),
  /** ISO date (YYYY-MM-DD) — surfaced as "Updated …" + JSON-LD dateModified. */
  updated: z.string().min(1),
  /** Extra search hints beyond title/description. */
  keywords: z.array(z.string()).default([]),
});

export type HelpFrontmatter = z.infer<typeof helpFrontmatterSchema>;

export type HelpArticle = CollectionEntry<HelpFrontmatter>;

const categoryOrder = new Map(HELP_CATEGORIES.map((c, i) => [c.slug, i]));

// cache(): one filesystem read per render, shared by the page + generateMetadata +
// JSON-LD (the pattern the guest queries use). Sorted by category order, then the
// per-article `order`, then title — so the index + sitemap are deterministic.
export const getAllArticles = cache((): HelpArticle[] => {
  return loadCollection({ dir: "help", schema: helpFrontmatterSchema }).sort(
    (a, b) => {
      const byCategory =
        (categoryOrder.get(a.frontmatter.category) ?? 0) -
        (categoryOrder.get(b.frontmatter.category) ?? 0);
      if (byCategory !== 0) return byCategory;
      if (a.frontmatter.order !== b.frontmatter.order)
        return a.frontmatter.order - b.frontmatter.order;
      return a.frontmatter.title.localeCompare(b.frontmatter.title);
    },
  );
});

export const getArticle = cache((slug: string): HelpArticle | null => {
  return getAllArticles().find((article) => article.slug === slug) ?? null;
});

export function getAllSlugs(): string[] {
  return getAllArticles().map((article) => article.slug);
}

// Articles grouped under each category, in category order. Categories with no article
// are dropped so the index never renders an empty section (the Vitest test guarantees
// every category has ≥1 article, so this is belt-and-suspenders).
export function getArticlesByCategory(): {
  category: HelpCategory;
  articles: HelpArticle[];
}[] {
  const all = getAllArticles();
  return HELP_CATEGORIES.map((category) => ({
    category,
    articles: all.filter((a) => a.frontmatter.category === category.slug),
  })).filter((group) => group.articles.length > 0);
}

// Same-category siblings (excluding the current article) for "Related articles".
export function getRelatedArticles(
  article: HelpArticle,
  limit = 3,
): HelpArticle[] {
  return getAllArticles()
    .filter(
      (a) =>
        a.frontmatter.category === article.frontmatter.category &&
        a.slug !== article.slug,
    )
    .slice(0, limit);
}

// Light, serializable metadata for the client search component (NO bodies — they stay
// on the server). Shape kept flat so it crosses the server→client boundary cleanly.
export type HelpSearchItem = {
  slug: string;
  title: string;
  description: string;
  category: HelpCategorySlug;
  categoryTitle: string;
  keywords: string[];
};

export function getSearchIndex(): HelpSearchItem[] {
  return getAllArticles().map((article) => ({
    slug: article.slug,
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    category: article.frontmatter.category,
    categoryTitle: getCategory(article.frontmatter.category).title,
    keywords: article.frontmatter.keywords,
  }));
}
