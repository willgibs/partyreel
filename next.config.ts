import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

import { BLOG_REDIRECTS } from "./src/lib/content/blog-redirects";

/**
 * Security response headers (QA #42). Applied to EVERY route, app and API alike.
 *
 * What is deliberately NOT here: a Content-Security-Policy. An enforced CSP on a Next app needs a
 * per-request nonce threaded through the streaming render and a real inventory of every inline style
 * and third-party origin, and a half-right one breaks the product silently for a subset of browsers.
 * That is its own round; this set is the part that is unambiguous and costs nothing.
 *
 * HSTS ships WITHOUT `preload` on purpose: submitting the apex to the browsers' preload list is a
 * one-way door for the domain and every future subdomain, so it belongs to the launch checklist, not
 * to a hardening pass. `max-age` is two years, which is the value the list would require anyway.
 *
 * Permissions-Policy denies what the product genuinely does not use (verified: no getUserMedia, no
 * geolocation, no Payment Request; Stripe is a redirect to its own domain, and guest capture is the
 * file picker's `capture` attribute, not the camera API). `camera` and `payment` are `self` rather
 * than empty so a same-origin feature can never be broken by this file from a distance; the third
 * parties an empty list would block are already blocked by having no iframes.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // `X-Powered-By: Next.js` tells an attacker the framework and narrows their exploit search for
  // free. Nothing reads it.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
  /**
   * SHARP NEVER REACHES A FUNCTION (the Vercel cost round, 2026-09-11). Measured on the
   * real trace files: sharp and its `@img` platform packages were 16.6 MB of the 51.1 MB
   * union Vercel stores per deployment, and they sat in ALL 113 route bundles.
   *
   * ★ Next already ignores sharp when it detects a Vercel build (`hasNextSupport`, i.e.
   * NOW_BUILDER is set) — but only for the `next-server` trace, NOT for the per-route
   * `.nft.json` files, which is why a NOW_BUILDER=1 build still traced every byte of it.
   * This closes that half. The key `"**"` is load-bearing twice over: Next matches it
   * against each route path with picomatch `contains`, AND against the literal string
   * `"next-server"`, which is how the same list reaches the shared ignore set.
   *
   * ★ Safe ON VERCEL ONLY. Image optimization runs at the platform level there, which is
   * why Next drops `image-optimizer.js` from the trace on the same condition. If this app
   * is ever self-hosted behind `next start`, DELETE this block or image optimization
   * breaks at runtime (Next's own docs list sharp as the one extra dependency
   * self-hosting needs).
   *
   * The globs match pnpm's real layout: the files live under `node_modules/.pnpm/<pkg>@<ver>/`,
   * so a plain `node_modules/sharp/**` would match nothing. Both forms are listed anyway, and
   * `@img+*` covers the linux-x64 variants Vercel installs.
   */
  // The design lab's desk (/design/c) reads docs/tracks/*.md at request time to
  // show each open board's track status; the directory is outside the bundle
  // unless traced in (the review wave, 2026-09-14).
  outputFileTracingIncludes: {
    "/design/c": ["./docs/tracks/*.md"],
  },
  outputFileTracingExcludes: {
    "**": [
      "node_modules/.pnpm/sharp@*/**",
      "node_modules/.pnpm/@img+*/**",
      "node_modules/.pnpm/node_modules/sharp/**",
      "node_modules/.pnpm/node_modules/@img/**",
      "node_modules/sharp/**",
      "node_modules/@img/**",
    ],
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
