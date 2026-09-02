import type { MetadataRoute } from "next";

import { JOB_SLUGS } from "@/lib/constants/careers";
import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import { FEATURE_PAGE_SLUGS } from "@/lib/constants/feature-pages";
import { LEGAL_DOCUMENTS } from "@/lib/constants/legal";
import { SITE_URL } from "@/lib/constants/site";
import { getAllPosts } from "@/lib/content/blog";
import { getAllArticles } from "@/lib/content/help";

// Public, crawlable routes ONLY. Never list /a/ or /e/ (opaque capability-token
// share links — indexing them would leak semi-private albums) or the gated app
// (/dashboard, /admin, /login). Each build-out round appends its static routes here
// and loops over its content slugs (events, help, blog, careers) as they land.
// Prerendered at build; falls back to prod origin.
type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /** Content date from frontmatter where one exists; build time otherwise. */
  lastModified?: Date;
};

const ROUTES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/features", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/reel", changeFrequency: "monthly", priority: 0.8 },
  { path: "/events", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help", changeFrequency: "weekly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/press", changeFrequency: "monthly", priority: 0.5 },
  { path: "/careers", changeFrequency: "weekly", priority: 0.6 },
  // The legal pages carry their version date (the legal single-source), not
  // build time: a policy that "changed" every deploy is the sitemap lying.
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: new Date(LEGAL_DOCUMENTS.privacy.lastUpdated),
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.3,
    lastModified: new Date(LEGAL_DOCUMENTS.terms.lastUpdated),
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: Entry[] = [
    ...ROUTES,
    ...FEATURE_PAGE_SLUGS.map((slug) => ({
      path: `/features/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...EVENT_TYPE_SLUGS.map((slug) => ({
      path: `/events/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...JOB_SLUGS.map((slug) => ({
      path: `/careers/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    // Content entries carry their frontmatter dates so lastModified means
    // something (it was uniformly build time before; crawlers rightly ignore
    // a sitemap where every page "changed" every deploy).
    ...getAllArticles().map((article) => ({
      path: `/help/${article.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      lastModified: article.frontmatter.updated
        ? new Date(article.frontmatter.updated)
        : undefined,
    })),
    ...getAllPosts().map((post) => ({
      path: `/blog/${post.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      // A revision is news to a crawler; the publish date is the floor (the help precedent).
      lastModified: new Date(post.frontmatter.updated ?? post.frontmatter.date),
    })),
  ];
  return entries.map(
    ({ path, changeFrequency, priority, lastModified: lm }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: lm ?? lastModified,
      changeFrequency,
      priority,
    }),
  );
}
