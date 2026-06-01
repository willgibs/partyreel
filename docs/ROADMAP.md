# Partyreel — What's next / backlog

> The v1 foundation shipped (the phased roadmap is complete — what exists is mapped in
> [`SYSTEMS.md`](SYSTEMS.md)). The project is now in **one-off task mode**: a goal becomes its
> own small plan. This file is the parking lot — deferred work + decisions kept ready so a new
> agent needs only a goal. [`STATUS.md`](STATUS.md) is you-are-here; [`CLAUDE.md`](../CLAUDE.md)
> is the operating guide; [`PRD.md`](PRD.md) is the product why; [`adr/`](adr/) holds decisions.

## Picking up a task

A fresh agent given a goal can run this loop (defaults, not rails — use judgment):

1. **Orient** — [`STATUS.md`](STATUS.md) (you-are-here + human blockers), then the relevant
   [`SYSTEMS.md`](SYSTEMS.md) entry (what exists + invariants + the files); skim the linked
   ADR/PRD for the why.
2. **Doc-check** — before coding, pull current docs for the libraries/services the task touches
   via the **Context7 MCP** (this stack drifts; see CLAUDE.md "Tooling").
3. **Plan** — for anything non-trivial, write a short plan and clarify open product/UX choices
   with the human (AskUserQuestion) **before** building. Reuse the DRY single-sources (CLAUDE.md).
4. **Build** — leave WHY-comments; use the MCPs (Supabase, R2, Vercel, Stripe) directly.
5. **Test** — Vitest for pure logic + a rolled-back Supabase-MCP RPC contract check for any new
   SQL; run `pnpm typecheck && lint && test && build` + `format`. After DDL run `get_advisors`.
6. **Verify on partyreel.com** — host UI is auth-gated and auth/upload/email can't complete on
   localhost (see CLAUDE.md "Local dev vs. live testing"); deploy + drive Chrome (+ the Supabase
   MCP to seed/inspect state — test data is disposable).
7. **Record** — advance STATUS + the SYSTEMS entry + this backlog + any ADR, same change.

## 🚧 Admin / operations portal (in progress)

A large, multi-round internal portal so Will can run Partyreel (and later invite teammates) instead of
reading operator data by hand in SQL/MCP. Overarching plan + locked decisions: the approved plan file +
SYSTEMS "Admin / operations portal". **Each phase gets its own dedicated planning round.** Decisions:
solo hardened admin now / team later via the one `requireAdmin()` seam (no RBAC tables yet);
`admin.partyreel.com` subdomain in THIS app; free TOTP MFA (AAL2); **Sentry** for errors (free
Developer tier, pay only when a team is added); defer the admin-action audit log.

1. ✅ **R1 — Perimeter + auth foundation (BUILT + gate-green; live-verify pending the STATUS manual
   steps).** Subdomain routing (proxy root-redirect + layout host-guard so the apex 404s `/admin`), the
   `requireAdmin`/`requireAdminAction` seam ([admin-context.ts](src/lib/auth/admin-context.ts)),
   lockout-proof MFA enroll/step-up, `AdminShell`, host-aware login, and the report review migrated out
   of `(app)/admin` into `/admin/reports`. No schema change.
2. ⏭️ **R2 — Sentry error tracking** (app-wide; free tier). `@sentry/nextjs`: `instrumentation.ts` +
   `onRequestError`, server/edge/client configs, `withSentryConfig` source maps, PII scrub in
   `beforeSend`, `captureException` in the caught paths (upload/webhook/cron/admin), email alerts.
   **Verify `@sentry/nextjs` supports Next 16 + Turbopack via Context7 before installing.** No DB.
3. **P3 — Support & moderation inbox** — triage `contact_submissions` + `job_applications` (status
   workflow) + extend reports into a real queue. The tables already exist (deny-all RLS).
4. **P4 — Accounts & billing** — user search/detail, tier/subscription/storage, promo codes (Stripe
   Coupons). Reads billing state; the Stripe webhook stays the source of truth for `tier`.
5. **P5 — Analytics & metrics** — platform-wide dashboards (scans/views, signups, storage, revenue).
6. **P6 — Content & announcements + operator notifications** — announcement compose/publish UI;
   blog/help/careers management (file-vs-DB decided in its round); operator notifications.

## ✅ Done — marketing site full build-out (all 7 rounds)

Expanded the scaffolded marketing site into a launch-ready, "as-if-complete" site. One shared
design system with the app — grayscale UI + the single **#FB4817** accent, media is the color;
marketing just runs louder (type/layout/motion). Motion follows the in-repo `emil-design-eng`
skill. All 7 rounds shipped (R1–R6 deployed + live-tested; R7 built + verified, deploy pending):

1. ✅ **Foundation** — `marketing-nav.ts` single-source; config-driven header (dropdowns) + a
   real mobile `Sheet` menu (there was none); multi-column footer; Org/Website/Breadcrumb
   JSON-LD + a shared `SITE_URL`/brand constant; **#FB4817** accent + wider `Container`
   (`max-w-7xl`) — both global, shared with the app.
2. ✅ **Features** (`/features`) + `features.ts` single-source; highlight-reel elevated to a marquee.
3. ✅ **Use cases** (renamed → **`/events`** in the polish arc below) — hub + 4 umbrella landing pages
   (weddings / parties / conferences / trips), per-page OG + breadcrumb/FAQ JSON-LD; shared `album-frame`.
4. ✅ **Contact** — form → `contact_submissions` (deny-all RLS) + best-effort Resend notify
   (ADR-0005); deployed + Chrome-tested live (happy path, validation, honeypot, XSS-escaping).
5. ✅ **Careers** — mission-focused hub + 2 roles (General Application + a fully-specified Reels
   Engineer) → `job_applications` (same pattern); deployed + Chrome-tested live.
6. ✅ **Help center** (`/help` + `/help/[slug]`) — new in-repo **MDX content pipeline**
   (`content/help/*.mdx` + gray-matter + `next-mdx-remote/rsc` + build-time zod frontmatter validation;
   [ADR-0006](adr/0006-mdx-content-pipeline.md)); categorized index + client-side search; **12 launch
   articles**; per-article on-this-page TOC / related / Breadcrumb+Article JSON-LD / Contact CTA;
   first-party MDX components (Callout / AlbumShowcase / inline limits-tiers spec components) + a
   `prose-help` typography theme; `Resources ▾` header dropdown + footer column (Help + Contact). No DB
   changes. **R7 reuses this pipeline.**
7. ✅ **Blog** (`/blog` + `/blog/[slug]`) — the FINAL round. Reused the R6 pipeline via a generalized
   **`content/collection.ts`** core (`help.ts`/`blog.ts` are thin wrappers); a date-sorted index with a
   **client-side tag filter**, per-post pages (named-author byline, reading time, TOC, related, per-post
   `next/og` card, Article JSON-LD with a `Person` author), and a **build-static RSS 2.0 feed**
   (`/blog/feed.xml`, hand-rolled, no dep). A client-safe **authors registry** + **4 launch posts**; Blog
   joins the `Resources ▾` nav. No DB changes.

**The 7-round build-out is complete.** _(Each round got its own focused plan file.)_

## 🚧 Marketing polish arc — refining the complete build-out

Post-build-out polish in focused rounds (each its own plan file; dedicate more per round as we go).
**Whole-arc copy policy: NO em-dashes (`—`) in site/app copy** (reads as an AI tell) — see CLAUDE.md +
memory. **Bar: max creative resources per page** — distinctive human copy, a *unique* visual
presentation per page (the frame library is a vocabulary of frames, never one visual reused), UI
details beyond a template feel.

1. ✅ **Rename "Use cases" → "Events"** — `/use-cases` → `/events`; `events.ts` (`EVENT_TYPE*`, avoiding
   the real `events` domain); nav `Events ▾` + footer column; all copy + internal links. No 301s (no
   traffic / external links yet; old `/use-cases*` now 404). Cleaner presentation + unblocks round 3.
2. ✅ **Media-frame library + `/features` retrofit** — `components/marketing/frames/`: a `BrowserFrame`
   base + `AlbumFrame` (moved) / `GalleryFrame` / `ReelFrame` (promoted from reel-teaser) / `PhoneFrame` /
   `QrFrame` (demo-ready). `/features` rebuilt from 5 identical card grids into a QR hero + phone/gallery/
   album spotlights + the reel marquee + a bespoke privacy panel + a storage keepsake pair
   (`FeatureSpotlight` + `FEATURE_PRESENTATION`). Scrubbed 29 em-dashes from `features.ts` + a no-em-dash
   guard test.
3. ✅ **Interactive demo** — a real demo QR in marketing → a curated demo event (env var
   `NEXT_PUBLIC_DEMO_QR_TOKEN`, no schema change); the `/e/[qr_token]` guest page runs in **demo mode**:
   "uploads" are simulated client-side (optimistic `createObjectURL` tile, never persisted), reusing the
   existing optimistic-tile path. `QrFrame` renders a real scannable QR (`liveQrUrl`) + a "Try the live demo"
   home CTA. Env-gated (decorative when unset). _Built + verified via the gate + Preview MCP + **live on
   partyreel.com** (simulated upload wrote **zero** DB rows, Supabase-confirmed); **deployed**, pointed at the
   Share Step Test event as a stand-in. Pre-launch: swap in a curated event with catchy media (STATUS)._
4. ✅ **Event landing pages retrofit** — a distinct hero frame per type (weddings→album, parties→phone,
   conferences→QR decorative, trips→reel) AND a distinct "Built for X" layout per type (bento / rows /
   quadrants / timeline), driven by `EVENT_PRESENTATION` ([events-layout.ts](src/lib/constants/events-layout.ts))
   + the `eventFrame()` resolver + `BuiltFor`; the `/events` hub became a frame-preview showcase. Scrubbed
   all event-copy em-dashes (+ a no-em-dash test guard). _Built + verified via the gate + Preview MCP
   (all 4 pages + hub, mobile, console clean); deploy + Chrome spot-check pending._
5. ✅ **Home pass (closes the arc)** — the home `FeatureHighlights` teaser leads with a `GalleryFrame`
   spotlight + benefit list; the Events teaser shows the shared **`EventFrameCards`**
   ([event-frame-cards.tsx](src/components/marketing/event-frame-cards.tsx)) — the same frame-preview cards
   as the `/events` hub, single-sourced. Scrubbed the home + site-wide footer/`site.ts` em-dashes. _Built +
   verified via the gate + Preview MCP (both teasers, hub unchanged, mobile, console clean, balanced frame
   density); deploy + Chrome spot-check pending._ **The marketing polish arc is complete.**

**Polish-arc follow-ups (each its own small plan):**
- ✅ **Enrich the `/events` hub beyond a directory (DONE)** — the hub is now a real landing page: a hero
  (headline + SEO overview) + the trust strip + the shared `EventFrameCards` + a cross-event benefits 4-up +
  an aggregate FAQ with **FAQPage JSON-LD** (rich-result eligible), all single-sourced in the new `EVENTS_HUB`
  block ([events.ts](src/lib/constants/events.ts)). The `<details>` FAQ was extracted to a shared
  [FaqAccordion](src/components/marketing/faq-accordion.tsx) (hub + each `[slug]`). Gate + Preview verified.
- ✅ **Em-dash sweep of the remaining marketing pages (DONE)** — recast all ~30 user-facing em-dashes across
  [careers.ts](src/lib/constants/careers.ts) + the careers/contact/blog/help/pricing/terms/privacy pages + the
  root OG card ([opengraph-image.tsx](src/app/opengraph-image.tsx)) into natural copy IN CONTEXT (colons for
  lists, commas for asides, two sentences for trailing tags). **The whole marketing surface is now
  em-dash-clean** — only code comments + the `.not.toContain("—")` test-guard literals remain. Verified by
  grep + the gate (152 tests/build) + a Preview read. A durable **AST-based Vitest guard**
  ([no-em-dash-policy.test.ts](src/lib/no-em-dash-policy.test.ts)) now scans the marketing surface (string +
  JSX copy, comments exempt) so this can't silently recur.
- ✅ **Extend the no-em-dash policy to the `(app)`/`(guest)`/email surface (DONE)** — recast all ~30 remaining
  user-facing em-dashes (host/guest/auth UI, error toasts, validation + API/DB messages, the transactional
  email templates [email/templates.ts](src/lib/email/templates.ts), and 2 dev-facing thrown errors) into
  natural copy in context. **Widened the guard's `SCAN` to `app` + `components` + `lib`** (the whole app) +
  made it flag the `&mdash;` HTML entity too, so the ENTIRE user-facing surface is now em-dash-free +
  regression-guarded (any new em-dash anywhere fails `pnpm test`). **No remaining em-dash debt.**

## ⏸️ Tabled — needs a product + architecture decision first

- **Highlight reel (Phase 5)** — stitch a highlight reel from the best clips (core-loop step 5).
  Scaffold exists (`highlight_reels` + media reel fields; see SYSTEMS). **Hard constraint:**
  transcode/stitch runs in an **external worker, NOT Vercel** (ADR-0003). **Central open fork:**
  where the worker runs — a **managed video API** (e.g. Shotstack, ~$0.20–0.40/rendered min,
  fastest) vs. **self-hosted ffmpeg on Cloudflare Containers** (same account as R2 = zero egress,
  cheapest at scale, most to build). Also open: trigger (on-demand vs. auto-on-event-complete),
  clip-selection algorithm (start heuristic), output format + `preview_key`/poster generation,
  any tier-gating (PRD's no-watermark stance steers away from a reel watermark). Resume with a
  short product + architecture spec; the "Generate reel" entry point appears in the host gallery
  only when it ships.

## Near-term follow-ups (ready to build; deferred from shipped cuts)

- **Notification center signals (extend the bell)** — link-activity "new since last seen" deltas
  (from `link_stats`) and billing/payment alerts (needs a denormalized Stripe `past_due` flag on
  `profiles` first). Each = one read in `getNotificationData` + one case in `buildNotifications`.
- **Announcement compose UI** — a small `/admin` form to publish `announcements` (today they're
  authored via SQL/MCP). Also deferred: a durable per-item notification feed + real-time push,
  and per-item announcement un-read toggling (today's marker is "all caught up as of a timestamp").
- **Host access gates** (Phase-3 deferral) — per-event settings that gate guest access: a
  **passphrase** (emoji/short phrase) to upload and/or view, and **require-upload-to-view**
  (optionally an item minimum). Each needs an event-settings field + a gate in the
  capability-token guest-flow / album RPCs.
- **Guest "email me the album" auto-send** — the growth-loop capture is email-only today; the
  automatic album-link email (reusing `sendOnce`) was deferred.
- **Album download — bigger cuts** (per-item Save shipped in the lightbox): a host **"Download all"
  (zip)** export — heavier; stream-zip or an external worker for large albums (ADR-0003 keeps
  transcode/stitch off Vercel, same constraint applies to large zips) — and a **per-tile
  hover/quick-download** on the grid. If galleries get huge, switch the download URL from the
  current up-front per-item presign to a **lazy/route-based presign** (dovetails with the deferred
  large-gallery read-proxy noted in `lib/r2/presign.ts`).
- **Guest gallery follow-ups** — the unified live guest event page **shipped** (`/e/[qr_token]`:
  guests now see + add to a live polling gallery + share the join link). Remaining: **per-photo
  attribution** (uploader display-name on tiles — `get_event_media_by_qr_token` + `get_public_album`
  would return `guest.display_name`), and the deferred **"email me the album" auto-send** (reuse
  `sendOnce`; blocked on Resend). Also: a true file-picker upload e2e for the optimistic-tile path
  couldn't be driven via the Chrome MCP (client-only logic, verified locally) — reconfirm on a real
  device when convenient.

## v2+ docket (post-core, bigger)

- **Multi-account events (co-hosts + invited guests)** — let an owner link other accounts:
  **co-hosts** (shared management) and **invite-only guests** (extending `require_email`).
  **Co-hosting is paid-only** — the **owner** must be Pro / hold an Event Pass; co-hosts need no
  plan of their own. **Additive model:** keep `events.host_id` as the owner/billing+storage
  anchor, add an **`event_members(event_id, user_id, role)`** table, and broaden the host RLS
  policies (`events_host_all`, `media_host_all`, …) from `host_id = auth.uid()` to
  membership-based. Deferring causes no painful migration — but write near-term host RLS in a
  membership-broadening-friendly way. **→ When this ships, wire co-host invitations into the
  notification bell** ("you've been invited to co-host X / N pending invites" — Will: required
  follow-up; it's a one-read + one-`buildNotifications`-case extension), and consider invite-only
  guests there too.
- **Referral program** — a % incentive with attribution + payouts (Stripe credits or Connect):
  planners refer hosts; guests who sign up from an event page earn the host a cut on Pro
  conversion. Substantial (attribution + payouts) → post-core.
- **Guest → full-user conversion** — `require_email` becomes a _confirmed_ email (magic-link)
  that quietly creates a latent account; a later traditional login triggers full signup/onboarding
  and merges. Interacts with auth + the tier-gated `require_email`.
- **Proactive CSAM filtering** — an upload-time hash-matching tool (PhotoDNA a candidate). v1
  ships only the report/takedown + operator-review MVP.
- **NSFW filtering** — only if a real need emerges; host-opt-in, image moderation on photos +
  sampled video keyframes to keep cost down (≈ $1/1k images, video ≈ $0.10/min via Rekognition —
  sample frames; Google Vision has no video moderation).
- **AI support-recovery** — triage "I lost my media" emails, match sender → account/event,
  auto-send a time-boxed download link (PRD "Data retention").

## Tech debt / decisions to revisit

- **Committed automated RPC integration suite** — today the RPC contract is checked via
  rolled-back Supabase-MCP runs per change. A committed suite needs a paid Supabase branch or a
  local Postgres test DB. Do before launch.
- **Presigned read-URL strategy for very large galleries** — currently per-request presign (1 h
  TTL); revisit a proxy/caching approach only if albums get huge.
- **Cold storage for the storage tail** — evaluated + rejected (R2 IA only ~33% cheaper; Glacier
  = cross-cloud project). Revisit an R2 IA lifecycle rule only if tail cost grows.
