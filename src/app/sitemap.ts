import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

// Public, crawlable routes ONLY. Never list /a/ or /e/ (opaque capability-token
// share links — indexing them would leak semi-private albums) or the gated app
// (/dashboard, /admin, /login). Prerendered at build; falls back to prod origin.
const base = env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
