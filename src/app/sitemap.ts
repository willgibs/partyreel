import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants/site";
import { USE_CASE_SLUGS } from "@/lib/constants/use-cases";

// Public, crawlable routes ONLY. Never list /a/ or /e/ (opaque capability-token
// share links — indexing them would leak semi-private albums) or the gated app
// (/dashboard, /admin, /login). Each build-out round appends its static routes here
// and loops over its content slugs (use-cases, help, blog, careers) as they land.
// Prerendered at build; falls back to prod origin.
type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const ROUTES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/features", changeFrequency: "monthly", priority: 0.8 },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: Entry[] = [
    ...ROUTES,
    ...USE_CASE_SLUGS.map((slug) => ({
      path: `/use-cases/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return entries.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
