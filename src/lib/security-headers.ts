/**
 * THE RESPONSE HEADERS EVERY ROUTE SENDS (QA #42; framing, crumbs-55). Applied to EVERY response, app and API
 * alike, by `headers()` in next.config.ts, which is why this module has NO `@/` imports (the config file is not on
 * the alias: the blog-redirects.ts pattern) and why `security-headers.test.ts` can hold the set against every route.
 * Two Vercel projects build this one tree (`partyreel` and `partyreel-admin`, `src/lib/surface`), so the operations
 * portal answers with exactly what the app does.
 *
 * ★ NO OTHER SITE MAY FRAME THE APP (clickjacking). `Content-Security-Policy: frame-ancestors 'self'`, and
 * `X-Frame-Options: SAMEORIGIN` for the browsers that predate the directive (a browser that knows the directive
 * follows it and ignores the header, so the two never disagree). It is `'self'` and never `'none'` because the app
 * frames its OWN pages: See it as a guest draws the guest's page in a phone over the hub (`share/as-guest-stage.tsx`,
 * an iframe of the root-relative `/dashboard/<id>/as-guest`), and the design lab frames its boards, and a same-origin
 * frame is exactly what `'self'` admits. Keep such a frame's `src` root-relative: an absolute URL to the site would
 * be another origin on any host that is not that one (a preview alias), and the browser would refuse it. A page of
 * the app inside ANOTHER site (an embed) is not a feature the product has; if one is ever built, that is a decision
 * to widen one path here, never to drop these.
 *
 * ★ THIS IS THE ONE CSP DIRECTIVE THAT SHIPS, AND IT STANDS ALONE ON PURPOSE. A full enforced policy on a Next app
 * needs a per-request nonce threaded through the streaming render and a real inventory of every inline style and
 * third-party origin, and a half-right one breaks the product silently for a subset of browsers (its own project,
 * ROADMAP). `frame-ancestors` needs none of that: it limits who may embed THIS page, restricts nothing the page
 * loads, and a policy that names no `default-src` constrains nothing else. Browsers read it from the header only
 * (a `<meta>` policy and a report-only one both ignore it), which is why it is here and not in the layout. When the
 * full policy lands it must carry `FRAME_ANCESTORS` too (the proxy sets it per request, for the nonce), so
 * whichever of the two policies a browser holds still refuses the frame.
 *
 * HSTS ships WITHOUT `preload` on purpose: submitting the apex to the browsers' preload list is a one-way door for
 * the domain and every future subdomain, so it belongs to the launch checklist, not to a hardening pass. `max-age`
 * is two years, which is the value the list would require anyway.
 *
 * Permissions-Policy denies what the product genuinely does not use (verified: no geolocation, no Payment Request;
 * Stripe is a redirect to its own domain). `camera` and `microphone` are `self`: the album's own camera
 * (`components/guest/camera/`) asks for the camera with getUserMedia, and for the microphone only while a guest
 * holds the shutter to film (an empty `microphone` list refused even the site itself, so every camera video would
 * have been silent). `payment` is `self` so a same-origin feature can never be broken by this file from a distance.
 */

export type ResponseHeader = { key: string; value: string };

export type HeaderRule = { source: string; headers: ResponseHeader[] };

/** The one directive of the policy: only the app's own origin may frame it. */
export const FRAME_ANCESTORS = "frame-ancestors 'self'";

/** The framing refusal, in the two spellings browsers read (the directive wins where it is understood). */
export const FRAME_HEADERS: ResponseHeader[] = [
  { key: "Content-Security-Policy", value: FRAME_ANCESTORS },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

export const SECURITY_HEADERS: ResponseHeader[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=(), browsing-topics=()",
  },
  ...FRAME_HEADERS,
];

/**
 * What `headers()` returns: one catch-all rule, so a page, a route handler, a static asset and the proxy's own
 * redirects and 404 rewrites all carry the set. A narrower `source` here would leave a route framable, which is
 * what `security-headers.test.ts` reads every route against.
 */
export const SECURITY_HEADER_RULES: HeaderRule[] = [
  { source: "/:path*", headers: SECURITY_HEADERS },
];
