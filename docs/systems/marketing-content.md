# Marketing site, content & SEO

> ROLE: the public `(marketing)` site, its content pipelines, SEO/OG, the 404 boundaries, and the marketing side of the demo.
> BELONGS HERE: the marketing pages + nav, the frame library, the MDX help/blog pipeline, metadata/OG/sitemap/robots, the 404 system, the demo env wiring. · NOT HERE: the guest demo-mode behavior (→ [guest-flow.md](guest-flow.md)), the QR designer used in-app (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

The public `(marketing)` route group on the shared domain. Nav is single-sourced
([`marketing-nav.ts`](../../src/lib/constants/marketing-nav.ts)) and consumed by the config-driven
[`marketing-header.tsx`](../../src/components/marketing/marketing-header.tsx) (desktop dropdowns + a mobile
`Sheet`, both in the client [`marketing-nav.tsx`](../../src/components/marketing/marketing-nav.tsx)) + the
multi-column [`marketing-footer.tsx`](../../src/components/marketing/marketing-footer.tsx); both render only
**live** routes. **Brand = the app's design system turned up**: grayscale UI + the single `#FB4817` accent
(`--brand`), media is the color; marketing runs louder via type/layout/motion only (motion follows the
in-repo `emil-design-eng` skill). One `SITE_URL`/brand constant ([`site.ts`](../../src/lib/constants/site.ts),
incl. `BRAND_HEX` — satori needs a literal hex) is shared by `sitemap.ts` / `robots.ts` / the root `metadataBase`.

## Pages + their single-sources

- **home** + **`/features`** (copy in [`features.ts`](../../src/lib/constants/features.ts), feeding the home
  teaser too; layout via `FeatureSpotlight` + the `FEATURE_PRESENTATION` map in
  [`features-layout.ts`](../../src/lib/constants/features-layout.ts)).
- **`/events`** — a full landing hub + 4 umbrella pages (weddings/parties/conferences/trips) off ONE
  `[slug]` template; copy in [`events.ts`](../../src/lib/constants/events.ts) (`EVENT_TYPE*` — named to
  avoid colliding with the real `events` domain; + the `EVENTS_HUB` block); distinct hero + "Built for X"
  layouts via `EVENT_PRESENTATION` ([`events-layout.ts`](../../src/lib/constants/events-layout.ts)) + the
  `eventFrame()` resolver ([`event-frame.tsx`](../../src/components/marketing/event-frame.tsx)) +
  [`built-for.tsx`](../../src/components/marketing/built-for.tsx); shared
  [`event-frame-cards.tsx`](../../src/components/marketing/event-frame-cards.tsx) +
  [`faq-accordion.tsx`](../../src/components/marketing/faq-accordion.tsx) (+ FAQPage JSON-LD).
- **Media-frame library** ([`frames/`](../../src/components/marketing/frames)) — a `BrowserFrame` base + a
  vocabulary (`AlbumFrame`/`GalleryFrame`/`ReelFrame`/`PhoneFrame`/`QrFrame`); never one visual reused.
  `QrFrame` takes a `liveQrUrl?` → a REAL scannable QR ([`live-qr.tsx`](../../src/components/marketing/frames/live-qr.tsx) wrapping `StyledQr`) when the demo is set, else a decorative block.
- **`/contact`** + **`/careers`** — forms → deny-all `contact_submissions` / `job_applications` via a Server
  Action + the service-role admin client; best-effort Resend notify via `sendOnce` (ADR-0005;
  [`careers.ts`](../../src/lib/constants/careers.ts)).
- **`/help`** + **`/blog`** — an in-repo **MDX content pipeline** (ADR-0006): `content/*.mdx` + `gray-matter`
  + `next-mdx-remote/rsc` + **build-time zod frontmatter validation**. The generic core is
  [`content/collection.ts`](../../src/lib/content/collection.ts) (`loadCollection` + `slugify` +
  `extractHeadings` + `readingTime` + `escapeXml`); [`help.ts`](../../src/lib/content/help.ts) +
  [`blog.ts`](../../src/lib/content/blog.ts) are thin wrappers. Help (rebuilt R6, 2026-08-26 — "the index
  of everything"): a NINE-category lifecycle taxonomy (each category carries a `feature` link up to its
  marketing rung; a new category must land WITH its first article — the test requires ≥1 per category) +
  a ranked ⌘K **search palette** mounted from [`help/layout.tsx`](../../src/app/(marketing)/(cinema)/help/layout.tsx)
  ([`help-palette.tsx`](../../src/components/marketing/help/help-palette.tsx); pure fs-free scorer in
  [`help-search-rank.ts`](../../src/lib/content/help-search-rank.ts) — heading hits deep-link to sections
  only when they're the sole match reason, plus a static "Pages" tail onward to the site) + the index
  sheet (numbered panes, DOM-art [`help-emblems.tsx`](../../src/components/marketing/help/help-emblems.tsx),
  a live-constants "numbers" strip) + answer-first articles (the frontmatter `description` renders as the
  "In short" lead; scroll-spy ToC via pure `pickActiveHeading`; one delegated copy-anchor island; prev/next;
  an honest feedback row handing misses to `/contact?about=<slug>`, which the static contact page prefills
  from an allowlist). First-party MDX components
  ([`mdx-components.tsx`](../../src/components/marketing/mdx-components.tsx) — `Callout`, `AlbumShowcase`,
  `Steps`/`Step`, `Kbd`, `UiLabel`, inline spec components reading the `limits.ts`/`tiers.ts` single sources
  so numbers can't drift; NOTHING client-side may import it, it reaches `node:fs`) + a `prose-help` theme.
  Help lives in the **(cinema) group** since the polish arc (dark overlay nav + dark stages; the reading
  bodies ride `PaperChapter`, the search card / emblem strip / In-short card are `surface-paper` islands,
  the strip and the article's In-short card STRADDLE the cinema→paper cut via negative margin). Shared help
  components live in [`components/marketing/help/`](../../src/components/marketing/help). ★ MOTION LANDMINE:
  `[data-mkt] .mkt-line` forces `display:block` (texts-reveal recipe, 0,2,1 specificity) and silently kills
  flex utilities on the same element — center constrained children with `mx-auto`, never a parent
  `justify-center`. ★ The R6 MONO RULING (site-wide type doctrine, full text in
  [`design-system.md`](design-system.md)): mono is for numerals/tabular alignment ONLY in standard UI —
  captions, labels, and CTA notes are Inter. The content agent's brief lives at
  [`content/help/AUTHORING.md`](../../content/help/AUTHORING.md) (taxonomy map + component vocabulary +
  writing rules; the content-policy tests scan `.md` too so the brief obeys itself). Blog: date-sorted index + client-side tag filter, a client-safe author registry
  ([`authors.ts`](../../src/lib/content/authors.ts)), Article JSON-LD, per-post `next/og` cards, and a
  build-static **RSS 2.0 feed** (`/blog/feed.xml`, `dynamic="force-static"`, hand-rolled `buildBlogRssXml`
  that takes its site config as a param so it stays out of the env-validating `site.ts` + is unit-tested);
  `draft: true` posts are excluded from listing/sitemap/RSS.
- `/pricing`, legal. The header `Resources ▾` + footer Resources column group Help + Blog + Contact.

## SEO / OG

`metadataBase` is set in the root [`layout.tsx`](../../src/app/layout.tsx) (`env.NEXT_PUBLIC_SITE_URL ??
"https://partyreel.com"`) — WITHOUT it Next errors on relative OG URLs. OG images are **code-generated via
`next/og`** ([`opengraph-image.tsx`](../../src/app/opengraph-image.tsx) site-wide + a per-event card at
`(guest)/e/[token]/opengraph-image.tsx`). `sitemap.ts`/`robots.ts` list/allow ONLY the marketing routes.

## Gotchas (why it's like this — don't revert)

- **The `next/og` images load NO font** — the built-in font dodges the Next-16 satori font gotcha. Don't add a custom font loader.
- **The event page emits OG tags but `robots: { index: false }`.** `/e/[token]` sets `generateMetadata`
  (event name/description + the per-event OG) so links unfurl in chat, but the opaque `qr_token` must NEVER
  be indexed. `robots.ts` also disallows `/e/`, `/dashboard`, `/admin`, `/login`, `/auth`, `/api/`. The
  guest query `getEventByQrToken` is wrapped in React `cache()` so `generateMetadata` + the page + the OG
  image share one RPC per request.
- **404 — the double-chrome boundary (live-caught).** Five `not-found.tsx` (root catch-all + one per route
  group) share ONE animated core ([`not-found-screen.tsx`](../../src/components/shared/not-found-screen.tsx)
  — presentational, NO `Container`/chrome). The root [`not-found.tsx`](../../src/app/not-found.tsx) renders
  its OWN `MarketingHeader`/`Footer` because UNMATCHED URLs fall through to `app/layout.tsx` with no group
  chrome — but a `notFound()` thrown INSIDE the marketing group renders the root boundary INSIDE
  `(marketing)/layout.tsx`, which ALREADY renders header/footer → the chrome **double-stacks**. The fix is a
  [`(marketing)/not-found.tsx`](../../src/app/(marketing)/not-found.tsx) boundary that renders ONLY the
  centered content (lost-visitor copy single-sourced in
  [`marketing-not-found.tsx`](../../src/components/marketing/marketing-not-found.tsx)). By audience: root
  (unmatched URL, brings its own chrome), marketing (bad `[slug]`, no chrome), guest (dead/expired event link
  → reassure + a "What is Partyreel?" CTA + the demo, minimal `Logo` header), host (inside the authed
  `AppShell`), admin (inside the MFA-gated `AdminShell`). All five → single chrome, 404 status + `noindex`.
- **Local-dev OG host:** in `pnpm dev` the emitted `og:image` URL shows the `localhost:3000` host (Next
  resolves metadata against the request origin in dev) while `sitemap.ts`/`robots.ts` show the
  `partyreel.com` fallback — NOT a bug; prod (with `NEXT_PUBLIC_SITE_URL` set) resolves correctly. The
  per-event OG URL carries a Next hash suffix (`…/opengraph-image-<hash>?…`) — read the real URL from `<head>`.

## Interactive demo (marketing side)

Env-gated, no schema change. A real curated event's `qr_token` is set in `NEXT_PUBLIC_DEMO_QR_TOKEN`
(public). **GOTCHA: it must be referenced explicitly in [`env.ts`](../../src/lib/env.ts)'s `parsePublic()`**
— Next only inlines literally-named `process.env.NEXT_PUBLIC_*` (this was added to the schema but not its
reader once, so it stayed `undefined` in prod). [`demo.ts`](../../src/lib/demo.ts) is the single source
(`DEMO_EVENT_URL` + `isDemoToken`). When set: the `/features` hero QR + a home-hero "Try the live demo" CTA
become real links; unset → no demo anywhere (decorative QR, no CTA). The guest-page demo-mode behavior is in
[guest-flow.md](guest-flow.md).

## See also

[ADR-0005](../adr/0005-marketing-form-submissions.md) · [ADR-0006](../adr/0006-mdx-content-pipeline.md) · [host-app.md](host-app.md) (the in-app QR designer / how-it-works single-source) · [notifications-analytics-growth.md](notifications-analytics-growth.md) (guest email capture / OG-driven growth).
