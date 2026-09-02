import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

import { BLOG_REDIRECTS } from "./src/lib/content/blog-redirects";

const nextConfig: NextConfig = {
  // Retired blog slugs (the placeholder posts the blog launched with) 308 to their successors.
  // The map lives in src/lib/content/blog-redirects.ts so a test can hold it against the live
  // slugs; this is the only config surface the blog touches.
  async redirects() {
    return BLOG_REDIRECTS.map(({ from, to }) => ({
      source: `/blog/${from}`,
      destination: `/blog/${to}`,
      permanent: true,
    }));
  },
  images: {
    // AVIF preferred, WebP fallback (array order matters). The default config
    // serves WebP only; the hero poster is the marketing LCP element, so the
    // smaller format pays the budget back directly (Track B, B1).
    formats: ["image/avif", "image/webp"],
  },
};

// Sentry build wiring (R2). Source-map upload is gated on the build-time creds — when
// SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT are unset the build still succeeds, it
// just skips the upload (so the app builds without creds, like the assert*Env vars).
// useRunAfterProductionCompileHook = the Turbopack-compatible post-build source-map upload
// (needs @sentry/nextjs >= 10.13.0); excludeServerRoutes is intentionally NOT used (Turbopack).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  useRunAfterProductionCompileHook: true,
  widenClientFileUpload: true,
});
