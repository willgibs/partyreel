import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com";

// Allow the marketing site; disallow the gated host app and the opaque
// capability-token surfaces. /a/ and /e/ still emit OG tags so a shared link
// unfurls in chat, but search engines must not crawl/index them (they also set
// `robots: { index: false }` per-page as defense in depth).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/login",
        "/auth",
        "/a/",
        "/e/",
        "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
