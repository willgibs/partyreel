# Partyreel — Status

> **You-are-here, short and current.** What's live, what's pending a human, what's in flight.
> For the feature map read [`SYSTEMS.md`](SYSTEMS.md); for backlog/deferred work + the
> pick-up-a-task loop read [`ROADMAP.md`](ROADMAP.md); for how to work in the repo read
> [`CLAUDE.md`](../CLAUDE.md).

**Updated:** 2026-05-31

## Where we are

**The v1 foundation is built and verified in production.** The focused phased roadmap is
complete — the project is now in **one-off task mode** (a goal → its own small plan → build →
verify on partyreel.com → record). Shipped + live-verified: host auth, the create wizard + QR
designer + first-time welcome, guest join/upload, galleries, moderation + the purge-cron
lifecycle, the storage-cap tier model + Stripe (Pro subs, Event Pass, portal), the growth loop
(branded share/SEO/guest email capture), link analytics, the notification center, the album
lightbox + per-item download, and the **unified live guest event page** (live polling gallery +
in-page share). Full map in [`SYSTEMS.md`](SYSTEMS.md). Canonical domain **partyreel.com**; R2 bucket `partyreel`
provisioned (CORS `ExposeHeaders: ETag` + abort-incomplete-multipart rule).

**Only scaffolded:** Phase 5 — the highlight reel (DB scaffold only; the *build* stays tabled
pending a product + architecture decision — see ROADMAP). Its **marketing framing is now
confirmed** (2026-05-31): a core value prop — an auto-compiled, host-customizable, shareable/
downloadable reel of the event's favorite moments — featured as such on the new site.

## In flight / pending verification

- **Marketing polish arc — R1 (Events rename) + R2 (frame library + `/features` retrofit) + R3 (interactive demo) all deployed + live-tested on partyreel.com; R4 next.**
  Post-build-out polish in focused rounds (see ROADMAP "Marketing polish arc"). **R1** renamed the section
  to **Events** (`/use-cases` → `/events`, nav `Events ▾`; **no 301s** — old `/use-cases*` 404). **R2** built
  the **media-frame library** ([frames/](../src/components/marketing/frames): `BrowserFrame` base + `AlbumFrame`
  / `GalleryFrame` / `ReelFrame` / `PhoneFrame` / `QrFrame`) and retrofitted `/features` into 8 distinct,
  frame-rich sections (+ scrubbed 29 em-dashes). Both **deployed + Chrome-tested on partyreel.com**.
  **R3 — interactive demo** (env-gated via `NEXT_PUBLIC_DEMO_QR_TOKEN`, no schema change): a real scannable
  demo QR on the `/features` hero + a home **"Try the live demo"** CTA, and `/e/[demo qr_token]` runs in
  **demo mode** — simulated client-side uploads via the optimistic-tile path, never persisted (see SYSTEMS
  "Interactive demo"). **Verified via the gate + Preview MCP AND live on partyreel.com (Chrome MCP)**:
  typecheck/lint/**150 tests**/build green with the env UNSET; on prod (pointed at the Share Step Test event)
  the home CTA + `/features` real QR render, tapping the QR → demo event with banner + curated media, the
  just-in-time name prompt → a simulated upload prepended a `blob:` tile that **Supabase confirmed wrote zero
  new `media`/`guests` rows**, gone on refresh (console + network clean). Caught + fixed a real bug pre-deploy:
  the new public env var was added to the `env.ts` schema but not its `parsePublic()` reader, so it would've
  stayed `undefined` in prod. **Forward copy policy: no em-dashes in site/app copy** (CLAUDE.md + memory).
  Next: **R4 — event landing pages retrofit** (distinct frame per type + the event-page body-copy em-dash
  scrub). _(R3 is wired to the **Share Step Test** event as a stand-in; swapping in a curated event with catchy
  media is a pre-launch polish item, not a blocker.)_
- **Marketing site full build-out COMPLETE — all 7 rounds, deployed + live-tested on partyreel.com.**
  Expanding the scaffolded marketing site to a launch-ready full site (Features / Use cases / Help
  / Contact / Careers / Blog), designed as-if-complete (7-round plan in `.claude/plans/`). R1
  landed the IA + design foundation: a `marketing-nav.ts` single-source, a config-driven header
  (dropdown-capable) + a real mobile `Sheet` menu (there was none), a multi-column footer,
  Org/Website JSON-LD + a shared `SITE_URL`/brand constant, and two **global, shared-with-the-app**
  changes — the **#FB4817** accent (replaces the old coral) + a wider `Container` (`max-w-7xl`).
  Verified via Preview MCP (accent = exact `rgb(251,72,23)`, desktop nav + mobile Sheet + footer,
  no console errors; typecheck/lint/113 tests clean). **Round 2** added `/features` (capability
  deep-dive; `features.ts` single-source feeding the home teaser too) + elevated the highlight reel
  to a confident marquee (video-player frame), plus a global **Inter** type refresh with tighter
  heading tracking (both shared with the app). **Round 3** added the `/use-cases` hub + 4 umbrella
  landing pages (weddings / parties / conferences / trips) off one `[slug]` template — per-slug OG +
  breadcrumb/FAQ JSON-LD, a shared `album-frame`, the `Use cases ▾` dropdown — and fixed the OG
  cards' stale brand color (now single-sourced `BRAND_HEX = #FB4817`). **Round 4** shipped `/contact`:
  a deny-all `contact_submissions` table (migration `20260531090115`) written by a Server Action via
  the service-role admin client, the first react-hook-form form, and a **best-effort** Resend
  notification (`sendOnce` + `replyTo`; the DB row is authoritative — see
  [ADR-0005](adr/0005-marketing-form-submissions.md)). **Deployed + tested live via Chrome MCP** — the
  full battery passed: happy path → DB row + delivered email, validation, honeypot (no row), XSS
  stored literal + `esc()`-escaped in the email. Resend sending is set in Vercel;
  `CONTACT_NOTIFY_EMAIL=hi@willgibs.com` (displayed `help@` fixed via `SUPPORT_EMAIL`; `help@`
  receiving via forwarding is a pre-launch TODO). **Round 5** added `/careers` — a mission-focused hub
  with varied sections + 2 roles (a neutral General Application + a fully-specified, remote/equity-
  framed **Reels Engineer** owning the reel) + a deny-all `job_applications` table (migration
  `20260531171514`) reusing the R4 form pattern. **Deployed + Chrome-tested live** (the full form battery
  passed against `job_applications` — happy path → row + email, validation, honeypot, XSS-escaped).
  **Round 6** shipped the **Help center** (`/help` + `/help/[slug]`): a new in-repo **MDX content
  pipeline** (`content/help/*.mdx` + gray-matter + `next-mdx-remote/rsc` + build-time zod frontmatter
  validation — see [ADR-0006](adr/0006-mdx-content-pipeline.md)) feeding a categorized index with
  **client-side search** + per-article pages (on-this-page TOC, related articles, Breadcrumb/Article
  JSON-LD, Contact CTA); **12 launch articles**; first-party MDX components (Callout / AlbumShowcase /
  inline **spec components** reading the limits/tiers single sources) + a `prose-help`
  `@tailwindcss/typography` theme; a header **`Resources ▾`** dropdown + footer column (Help + Contact;
  Company → Careers). **No DB changes.** **Deployed + Chrome-tested live on partyreel.com** — index +
  search (results/empty), articles' prose/specs/TOC-anchors/related/JSON-LD, 404, dark mode, mobile
  Sheet, sitemap; one papercut caught + fixed live (`scroll-mt-24` so TOC jumps clear the sticky header).
  **Round 7 (Blog) — the FINAL round** — shipped **`/blog`** (date-sorted index + a client-side **tag
  filter**) + **`/blog/[slug]`** posts (byline from a client-safe **named-author registry** —
  `partyreel-team` default + `will-gibson`; reading time; TOC; related; per-post `next/og` card; **Article
  JSON-LD with a `Person` author**) + a **build-static RSS 2.0 feed** (`/blog/feed.xml`,
  `dynamic="force-static"`, hand-rolled, no dep), all reusing the R6 pipeline via a generalized
  **`collection.ts`** core (`help.ts`/`blog.ts` are now thin wrappers). **4 launch posts**; Blog joins the
  **`Resources ▾`** header dropdown + footer column. **No DB changes.** **Built + verified via Preview MCP
  + the full gate** (typecheck/lint/**148 tests**/build — build SSGs `/blog`, the 4 posts, their OG cards,
  and the feed); deploy + a Chrome spot-check pending. **The 7-round marketing build-out is complete.**
  _(Remaining tracked follow-up in ROADMAP: a Features/Use-cases quality uplift + a reusable media-frame
  component library.)_
- **Unified guest event page** (`/e/[qr_token]`) — **shipped + deployed** (commit `f073451`):
  header + just-in-time upload + a **live polling gallery** + in-page QR/share, all driven by the
  host's `is_public`/`accepting_uploads` state. Verified on **partyreel.com**: render + native
  Share (feature-detected) + the **live poll** (an injected approved photo appeared at the top
  within ~12 s, no reload) + the QR-enlarge dialog; and on localhost the **3-state matrix**
  (private-lock / accepting-off / full), the lightbox, and the optimistic-upload path. _(Real
  file-picker uploads can't be driven via the Chrome MCP — the optimistic-tile path is client-only
  logic, verified locally.)_ The album lightbox + per-item download (commit `8a4f3ae`) is also
  fully verified, incl. the host-gallery lightbox + Save while signed in.
- **The email-driven lifecycle flows are deployed but NOT yet live-verified** — over-capacity
  grace→auto-reduce, the Event-Pass renewal nudge ($15 checkout), and free-tier inactivity
  warn/remove all send via Resend, which **isn't configured yet** (see below). Verify each once
  `EMAIL_FROM` + a sending domain are set (a test email arrives + doesn't re-send; the
  grace/renewal/inactivity transitions fire).
- _(Test data on prod is disposable — host test account `willg97@gmail.com` with one "Share Step
  Test" event holding 3 seeded test media from verification; operator/admin `hi@willgibs.com`. **Note:** that
  event currently backs the live demo (`NEXT_PUBLIC_DEMO_QR_TOKEN` = its `qr_token`), so repoint the env var
  before deleting/repurposing it.)_

## Blocked on a human ("manual instrument")

The agent can't do these — they need a human in a dashboard:

- **Resend** — set `RESEND_API_KEY` + `EMAIL_FROM` (`Partyreel <noreply@partyreel.com>`, no
  quotes in Vercel) + **verify a sending domain (DNS)**. Until then transactional email is dark.
- **Stripe test → live (before launch)** — re-create products/prices in LIVE + swap the 5 env
  vars to `sk_live_…` / live `whsec_` / live price IDs (code needs no change). Checklist:
  [`PRICING.md`](PRICING.md) "Test → Live cutover". _(Currently TEST mode, verified.)_
- **`MONTHLY_INGRESS_BYTES.pro`** is still `null` (unmetered) — tune it before Pro launch.
- **The interactive-demo event (polish-arc R3) — _pre-launch polish, NOT blocking._** `NEXT_PUBLIC_DEMO_QR_TOKEN`
  is set in Vercel + deployed, pointed at the **Share Step Test** event as a stand-in (live-tested). Before
  launch, swap it to a dedicated event with **catchy approved media** (public + accepting uploads) — its mostly
  test media (a couple solid-color photos + a color-bars video that shows black until played) is fine for now
  but not the showcase you want. Just update the env var to the new event's `qr_token` (+ `.env.local`).
- **Supabase CLI** isn't installed locally; migrations are applied via the **Supabase MCP**
  (`apply_migration`). To use `pnpm db:types` / `db:push`, install the CLI +
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

**Already done (don't redo):** R2 bucket + creds + CORS + lifecycle rule, the apex
`partyreel.com` domain, `CRON_SECRET` (Vercel), `profiles.is_admin = true` for the operator, and
the Stripe **TEST** products/prices + webhook endpoint + Billing Portal + the 5 env vars.

## After any change

Advance this file, the [`SYSTEMS.md`](SYSTEMS.md) entry if a feature changed, and the
[`ROADMAP.md`](ROADMAP.md) box/backlog — same change. Re-run `get_advisors` after DDL (the
expected set is the 7 anon capability RPCs + the deny-all INFOs + the unrelated leaked-password
WARN — see SYSTEMS "Security & data model").
