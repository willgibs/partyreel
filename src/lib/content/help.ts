import {
  CreditCard,
  Film,
  Images,
  QrCode,
  Rocket,
  Share2,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cache } from "react";
import { z } from "zod";

import { MAX_REEL_SECONDS, planById } from "@/lib/constants/tiers";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

import {
  type CollectionEntry,
  extractHeadings,
  loadCollection,
} from "./collection";

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

// Closed, ordered category set — TAXONOMY v3 (R6, ruled by Will 2026-08-26):
// lifecycle-ordered (set up → invite → guests → album → out → reel → pay → trust →
// fix), host-voiced except Guest experience, names concise with no leading "The".
// The frontmatter `category` enum derives from these slugs (an unknown category
// fails the build), and the Vitest suite requires every category to hold ≥1
// article — so a NEW category must land in the same commit as its first article.
// `feature` is the de-silo map: each category's one marketing rung, surfaced as
// the index pane's tail link + the article end-matter "bigger picture" pointer
// (labels mirror the nav registry so the two surfaces can't drift in voice).
// Icons are the legacy card accents (the R6 index draws DOM-art emblems instead;
// icons remain for any compact surface that wants a glyph).
export const HELP_CATEGORIES = [
  {
    slug: "getting-started",
    title: "Getting started",
    blurb: "How it works, your first event, and your dashboard.",
    icon: Rocket,
    feature: { href: "/how-it-works", label: "How it works" },
  },
  {
    slug: "qr-and-invites",
    title: "QR & invites",
    blurb: "The code, the cards, the screens: getting guests in.",
    icon: QrCode,
    feature: { href: "/features/qr", label: "The QR code" },
  },
  {
    slug: "guest-experience",
    title: "Guest experience",
    blurb: "Joining, uploading, and browsing: no app, no account.",
    icon: Users,
    feature: { href: "/features/guests", label: "Guests & profiles" },
  },
  {
    slug: "event-album",
    title: "Event album",
    blurb: "Review, curate, and shape what everyone sees.",
    icon: Images,
    // Curation (not /features/album) on purpose: this category answers "will the
    // album be presentable", the curation rung's question. Album-rung articles
    // still cross-link at the article level.
    feature: { href: "/features/curation", label: "Curation" },
  },
  {
    slug: "sharing-and-downloads",
    title: "Sharing & downloads",
    blurb: "The album link, full-quality downloads, and the zip.",
    icon: Share2,
    feature: { href: "/features/sharing", label: "Sharing & downloads" },
  },
  {
    slug: "highlight-reel",
    title: "Highlight reel",
    blurb: "Your event's best moments, cut into one shareable video.",
    icon: Film,
    feature: { href: "/reel", label: "The highlight reel" },
  },
  {
    slug: "plans-and-billing",
    title: "Plans & billing",
    blurb: "Storage, the free plan, Pro, and the one-time Event Pass.",
    icon: CreditCard,
    feature: { href: "/pricing", label: "Pricing" },
  },
  {
    slug: "privacy-and-safety",
    title: "Privacy & safety",
    blurb: "Who can see your media, how long it's kept, and your data.",
    icon: ShieldCheck,
    feature: { href: "/features/privacy", label: "Privacy & trust" },
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    blurb: "When something won't scan, send, or upload.",
    icon: Wrench,
    // No marketing rung for failure modes; the contact band is its "up" path.
    feature: null,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  feature: { href: string; label: string } | null;
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

/**
 * Relatedness score between two articles (R6): shared frontmatter keywords carry
 * the signal (x2, case-insensitive), same category adds a base point. Pure so the
 * Vitest unit test can drive it with synthetic fixtures; a score of 0 means "not
 * related" and never renders. This replaced same-category-first-3, which left any
 * alone-in-its-category article with an empty Related section and could never
 * cross categories.
 */
export function scoreRelated(
  a: { category: string; keywords: readonly string[] },
  b: { category: string; keywords: readonly string[] },
): number {
  const mine = new Set(a.keywords.map((k) => k.toLowerCase()));
  const shared = b.keywords.filter((k) => mine.has(k.toLowerCase())).length;
  return shared * 2 + (a.category === b.category ? 1 : 0);
}

// Scored related articles; ties break on the canonical index order so results are
// deterministic. Under-filling is intentional (never pad with unrelated articles).
export function getRelatedArticles(
  article: HelpArticle,
  limit = 3,
): HelpArticle[] {
  const self = {
    category: article.frontmatter.category,
    keywords: article.frontmatter.keywords,
  };
  return getAllArticles()
    .map((candidate, index) => ({
      candidate,
      index,
      score:
        candidate.slug === article.slug
          ? 0
          : scoreRelated(self, {
              category: candidate.frontmatter.category,
              keywords: candidate.frontmatter.keywords,
            }),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

// Light, serializable metadata for the client search palette (NO bodies — they stay
// on the server; headings are the one body-derived signal, small and high-value:
// they let the palette deep-link straight to a section). Shape kept flat so it
// crosses the server→client boundary cleanly; the ranking logic lives in the
// fs-free `help-search-rank.ts`, which imports this TYPE only.
export type HelpSearchItem = {
  slug: string;
  title: string;
  description: string;
  category: HelpCategorySlug;
  categoryTitle: string;
  keywords: string[];
  headings: { id: string; text: string }[];
};

export function getSearchIndex(): HelpSearchItem[] {
  return getAllArticles().map((article) => ({
    slug: article.slug,
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    category: article.frontmatter.category,
    categoryTitle: getCategory(article.frontmatter.category).title,
    keywords: article.frontmatter.keywords,
    headings: extractHeadings(article.body),
  }));
}

// ── Curated index surfaces (R6) ────────────────────────────────────────────────
// Single-sourced here (server-only) so the index page stays declarative and the
// Vitest existence test can catch a renamed slug — the old page-local POPULAR_SLUGS
// array silently dropped a card on rename. Order is render order.

/** The "Start here" trio on /help. */
export const START_HERE_SLUGS = [
  "how-partyreel-works",
  "create-your-first-event",
  "the-highlight-reel",
] as const;

export function getStartHereArticles(): HelpArticle[] {
  // Preserves the curated order; the existence test guarantees every slug resolves.
  return START_HERE_SLUGS.map((slug) => getArticle(slug)).filter(
    (article): article is HelpArticle => article !== null,
  );
}

/**
 * Quick-link chips under the hero search: the questions people actually arrive
 * with, one deliberately guest-voiced (the guest fast-lane). Labels PROVISIONAL.
 */
export const HELP_QUICK_LINKS = [
  { label: "What's on the free plan?", href: "/help/storage-plans-and-limits" },
  { label: "How do guests join?", href: "/help/how-guests-join-and-upload" },
  {
    label: "Download everything",
    href: "/help/download-photos-videos-and-albums",
  },
  { label: "Is my event private?", href: "/help/who-can-see-your-event" },
] as const satisfies readonly { label: string; href: string }[];

/**
 * "The numbers" strip on /help: the product's hard limits at a glance, every
 * value rendered FROM the real constant (never hand-typed — the whole point),
 * each linking to the article that explains it. Server-only by construction.
 */
export function getHelpFacts(): { label: string; value: string; href: string }[] {
  return [
    {
      label: "Max upload size",
      value: formatBytes(MAX_UPLOAD_BYTES),
      href: "/help/how-guests-join-and-upload",
    },
    {
      label: "Free storage",
      value: formatBytes(planById("free").storageBytes),
      href: "/help/storage-plans-and-limits",
    },
    {
      label: "Recovery window",
      value: `${RECENTLY_DELETED_WINDOW_DAYS} days`,
      href: "/help/moderate-and-curate-your-album",
    },
    {
      label: "Reel length",
      value: `${MAX_REEL_SECONDS.free}s free, ${MAX_REEL_SECONDS.pro}s paid`,
      href: "/help/the-highlight-reel",
    },
    {
      label: "Event Pass",
      value: `${formatBytes(planById("event_pass").storageBytes)}, about a year`,
      href: "/help/pro-vs-event-pass",
    },
  ];
}
