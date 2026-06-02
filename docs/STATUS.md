# Partyreel — Status

> **You-are-here, short and current.** What's live, what's pending a human, what's in flight.
> For the feature map read [`SYSTEMS.md`](SYSTEMS.md); for backlog/deferred work + the
> pick-up-a-task loop read [`ROADMAP.md`](ROADMAP.md); for how to work in the repo read
> [`CLAUDE.md`](../CLAUDE.md).

**Updated:** 2026-06-02

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

- **Host-side media upload (two-way media flow) — SHIPPED + LIVE-VERIFIED on partyreel.com**
  (commit `06554ff`). The host can now add media directly from the event page (e.g. a photographer's
  batch), not just curate guest uploads. New `create_media_as_host` + `get_host_upload_context` RPCs
  (migration `…_host_uploads`, applied) — the AUTHENTICATED twin of the guest upload RPCs:
  `auth.uid()` + event-ownership auth, same per-file limits + cap/ingress enforcement (host uploads
  **count against the plan**), `status='approved'` always, `guest_id=NULL`. Authenticated-only
  (advisors confirm: 2 new lint-0029 entries, 0 new anon/0028). Shared `uploadFile` now takes the
  endpoint pair + identity; new `/api/host/r2/*` routes; `HostUpload` + `EventUploads` ("Add photos"
  in the Uploads card header). Rolled-back RPC contract check + `typecheck`/`lint`/`test` (191) green.
  **Chrome-MCP verified on prod (host `willg97@gmail.com`):** Add-photos toggle reveals the dropzone →
  upload → "Added to the album" → grid count 3→4; DB-confirmed the new row is `guest_id=NULL` +
  `status='approved'` with `storage_used_bytes` +103 and monthly ingress +103 (exact); the item shows
  in the public `/a/` album (guests see it); console clean. Verification artifact soft-removed (album
  back to 3).
- **Config/permissions rework — a 3-phase initiative** (master plan: access → uploads/identity →
  accounts/saved events). **Phase 1 (3-state access + Pro password protection) SHIPPED +
  LIVE-VERIFIED** (commits `ea02f32` + `c0721bc`): `events.is_public` → an `event_visibility` enum
  (`open|password|private`); Pro-only password gate (bcrypt via `set/clear_event_password`; the 9th
  anon RPC `verify_event_password`; a signed httpOnly unlock cookie; password media served only via a
  cookie-guarded server admin-read — the anon RPCs gate on `visibility='open'`); settings redesigned
  into "Visibility & access" (`ToggleGroup` + conditional password sub-panel) + "Guest uploads"
  cards; `UNLOCK_COOKIE_SECRET` set in Vercel; verified on a phone (gate + wrong-password reject +
  unlock persists across album + 12 s poll; Private locks; Open unchanged; hash absent from client
  payloads). ADR-0007. **Phase 2 (uploads & identity) IN PROGRESS — cut 2a (video = Pro-only) SHIPPED +
  LIVE-VERIFIED** (commit `6bdd0bd`). A free host's event is photos-only for guests AND the host:
  the `tier='free'` video gate sits at the top of the tier-caps block in BOTH `create_media` +
  `create_media_as_host` (authoritative); `get_upload_context`/`get_host_upload_context` gained an
  advisory `video_blocked` flag the presign routes fail fast on; the host upload picker hides video on
  Free (`videosAllowedForTier`) + a read-only "Video uploads" settings status row; pricing reframed
  (video = Pro/Event-Pass). Migration `…_phase2a_video_pro_gate` applied; advisors **UNCHANGED** (no
  new RPC/grant); rolled-back RPC contract checks pass; typecheck/lint/test (202)/build green.
  **Chrome-MCP verified on prod (host `willg97@gmail.com`, Free):** the settings "Video uploads →
  Photos only" row + upgrade link; the host picker forced to `accept="image/*"` ("Add photos", no
  video); a guest video presign on the deployed API returned **403 `video_not_allowed`** ("This event
  accepts photos only.") while a photo presign returned **200** (the guest dropzone still OFFERS video —
  the tier never leaks; rejection is server-side); pricing page shows Free = "Photos only", paid =
  "Photos and video". Cuts 2b (remove guest display names) + 2c (verified-email OTP + shared
  `<EmailSignIn>`) next.
- **Admin / operations portal — Round 1 (perimeter + auth foundation) SHIPPED + LIVE-VERIFIED on
  `admin.partyreel.com`.** A new portal in this SAME app: one `requireAdmin()` seam
  ([admin-context.ts](../src/lib/auth/admin-context.ts)) = `getUser()` + `is_admin` + **free TOTP
  MFA (AAL2)**; host-isolated session; the report review migrated out of `(app)/admin` into
  `/admin/reports`; Overview + Security pages. Solo-admin-now / team-later (the seam is the
  future-RBAC swap point, see SYSTEMS "Admin / operations portal"). **Chrome-MCP verified end-to-end:**
  `partyreel.com/admin` → 404 (apex never serves it); subdomain root → `/admin` → `/login` redirect;
  Google login as `hi@willgibs.com` lands on the subdomain (the `?next=` callback bug is fixed) →
  MFA enroll → AAL2 → portal; Overview/Reports/Security render; report **Dismiss + Action** work
  through `requireAdminAction` (DB-confirmed: resolved_by = admin, dismissed item's media untouched);
  console clean. Two fixes shipped during verification: the host-aware callback (commit `8c7a237`) and
  a pre-existing report-timestamp hydration error (React #418, `21a9526`); the QR render (`c44536d`).
  **Round 2 (Sentry error tracking) BUILT + gate-green** (`7d997cb`): `@sentry/nextjs` app-wide, errors
  + 10% tracing + on-error Session Replay (media-blocked, text-masked), DSN-gated no-op, manual captures
  at the swallowed paths (upload finalizer / webhook provisioning / all 7 cron sweeps / admin actions),
  everything else via `onRequestError`. Build clean under Turbopack (post-build source maps).
  **Live-verified on prod (2026-06-01):** a deliberate bad-signature webhook POST created Sentry issue
  `JAVASCRIPT-NEXTJS-2` with the `area:webhook` tag + clean PII (resolved as a test). Client Session
  Replay is configured (on-error, media-blocked) but not yet exercised by a real client error.
  **Phase 3 (support & moderation inbox) SHIPPED + LIVE-VERIFIED** (`e0903c2`): `/admin/support` +
  `/admin/applicants` triage the previously write-only `contact_submissions` + `job_applications`
  (status `new`/`in_progress`/`closed` + reply-from-inbox `mailto` + Overview count badges); reports
  gained an Open/All history filter (resolved rows read-only). Additive migration (`handled_by`/
  `handled_at` + status CHECK, RLS unchanged); advisors clean. Chrome-verified: status change
  (DB-confirmed `handled_by`/`handled_at`), filters, mailto, reports history, apex 404, no hydration
  errors. **Phase 4 (accounts & billing) SHIPPED + LIVE-VERIFIED** (`9282aa6`): `/admin/accounts` is a
  read-only host browser, search by email/name plus a detail view of tier + subscription/Event-Pass state +
  ACTIVE storage vs effective cap (and the raw `storage_used_bytes` counter) + event/media counts + a
  test/live-aware Stripe customer deep-link. No migration, no writes (the Stripe webhook stays the sole tier
  writer); the service-role reads reuse the over-capacity sweep's active-bytes query. Chrome-verified on
  `admin.partyreel.com`: both real accounts list + search-filter; willg97's detail matched Supabase exactly
  (52.5 KB active vs 2 GB cap, 2.6 MB raw counter, 1 event / 3 media), the operator's zero-state renders, both
  Stripe links resolve to the right TEST-mode customer (`cus_…`), apex `/admin/accounts` 404s, console clean.
  **Phase 5 (proactive album moderation) SHIPPED + LIVE-VERIFIED** (`d812ccc`): `/admin/albums` is the
  operator's proactive counterpart to the reactive Reports queue, a recent-uploads feed across all events
  (status-filterable) + an album drill-in (event metadata + per-status counts + the full media grid), with
  direct soft-remove (pulls from every public album/gallery instantly; the 7-day purge cron reclaims the
  bytes) + restore within the grace. Reuses the report-action soft-remove shape + the R2 presign /
  `MediaTile` / `MediaLightbox` render path; writes go through `requireAdminAction` (AAL2) + the
  service-role client. No migration, no new RPC. Chrome-verified on `admin.partyreel.com`: feed + filters +
  drill-in render; removed an approved item → DB `status='removed'` + `removed_at`, `get_public_album` 3→2
  and the public `/a/` album showed 2; restored it → 3 again, DB cleared; apex `/admin/albums` 404s; console
  clean. **Phase 6a (analytics dashboard, numbers + live revenue) SHIPPED + LIVE-VERIFIED** (`53c82b3`):
  `/admin/metrics` shows platform KPIs across four families (accounts / content+storage / engagement /
  growth) as stat cards + a live Stripe revenue card (MRR + balance, best-effort). Migration-free:
  service-role aggregator (head-counts + small fetches → pure, unit-tested reducers) + the existing
  `getStripe` client; "Media" inner-joins events to stay consistent with the active-events count.
  Chrome-verified on `admin.partyreel.com`: every KPI matched a direct Supabase cross-check (1 account /
  free, 1 event, 3 active media, 26 QR scans, 4 album views) and the revenue card matched the Stripe MCP
  (test-mode: $0 MRR / 0 subs, $0 available, $41.15 pending); apex `/admin/metrics` 404s; console clean.
  **Phase 6b (charts) SHIPPED + LIVE-VERIFIED** (`7dce416`, console fix `bb460b6`): `recharts` trend +
  distribution charts on `/admin/metrics` (signup + scans/views lines, tier / media-type / newsletter-source
  bars), grayscale + the coral accent. Per-day trends are pure builders over the SAME rows P6a fetched (no
  new query); recharts `ResponsiveContainer` is seeded with `initialDimension` (no ResponsiveContainer warning),
  and `react-is` is pinned to React 19 via a pnpm override (the zod-override pattern). Chrome-verified on
  `admin.partyreel.com`: charts render + reconcile with the KPIs (QR scans 26 / album views 4 / 1 signup /
  2 photos + 1 video), console clean. **Phase 7 (header nav dropdown + operator alerts + announcements UI)
  SHIPPED + LIVE-VERIFIED** (`b1df0d7`): the 8+ -item nav bar is now a single active-aware dropdown
  ([admin-nav.tsx](../src/components/admin/admin-nav.tsx)); a header operator-alerts bell surfaces pending
  work portal-wide (from the existing count queries); and `/admin/announcements` is an operator
  compose/publish surface (optional CTA link + scheduling + delete) writing the existing announcements
  table that hosts read via the unchanged notification bell. Migration-free (reuses DropdownMenu,
  requireAdminAction + the admin client, the RHF + zodResolver form pattern). Chrome-verified on
  `admin.partyreel.com`: nav dropdown shows the active section + all surfaces, the alerts bell matched the
  DB (all-zero → "Nothing pending"), a publish → DB host-visible → delete round-trip, apex
  `/admin/announcements` 404s, console clean. **This completes the planned admin-portal phases (R1–P7); the
  blog/help/careers CMS stays deferred (that content is edited in-repo).**
- **Marketing polish arc — R1–R4 all deployed + live-tested on partyreel.com; R5 (home pass) built + Preview-verified, deploy pending. The 5-round arc is COMPLETE.**
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
  **R4 — event landing-page retrofit** gave each of the 4 event pages a DISTINCT hero frame + a DISTINCT
  "Built for X" layout (bento / rows / quadrants / timeline) and turned the `/events` hub into a
  frame-preview showcase (`EVENT_PRESENTATION` + the `eventFrame()` resolver + `BuiltFor`; see SYSTEMS
  "Marketing site"), scrubbing all event-copy em-dashes (+ a no-em-dash guard, now **152 tests**). **Built +
  verified via the gate + Preview MCP** (all 4 landing pages with the right hero frame — conferences = a
  DECORATIVE QR, not `LiveQr` — + the right benefit layout, the hub's 4 frames height-aligned in a
  fixed-stage, mobile 1-col, console clean); **deployed + Chrome-tested live on partyreel.com** (all 4 pages
  + the hub render the distinct frames; conferences QR confirmed decorative). **R5 — home pass (closes the
  arc)**: the home `FeatureHighlights` teaser now leads with a `GalleryFrame` spotlight + a benefit list, and
  the Events teaser shows the shared **`EventFrameCards`** (the SAME frame-preview cards as the `/events` hub,
  single-sourced in [event-frame-cards.tsx](../src/components/marketing/event-frame-cards.tsx) so they never
  drift); scrubbed the home + site-wide footer/`site.ts` em-dashes. **Built + verified via the gate + Preview
  MCP** (both teasers, the hub unchanged by the refactor, mobile, console clean, balanced frame density —
  hero→gallery-spotlight→event-cards→reel-spotlight alternation); **deploy + Chrome spot-check pending**.
  _(Two follow-ups since shipped + deployed: (1) the **remaining-pages em-dash sweep + a durable AST guard**
  ([no-em-dash-policy.test.ts](../src/lib/no-em-dash-policy.test.ts)) — the **whole marketing surface is now
  em-dash-clean AND regression-guarded**; (2) the **`/events` hub is enriched** into a full landing page (hero
  + SEO overview + the shared cards + a cross-event benefits 4-up + an aggregate FAQ with FAQPage JSON-LD,
  single-sourced in `EVENTS_HUB`; the shared `FaqAccordion` also backs each `[slug]`) — **built + Preview-verified,
  deploy pending**. (3) the **`(app)`/`(guest)`/email em-dash sweep is DONE** — recast all ~30 in the host/guest/
  auth UI + email templates + lib errors, and **widened the AST guard to the whole app** (`app`+`components`+
  `lib`, + the `&mdash;` entity), so the ENTIRE user-facing surface is em-dash-free + regression-guarded
  (**built + verified, deploy pending**); no remaining em-dash debt. R3's demo is wired to the **Share Step
  Test** stand-in event; swapping in curated media is a pre-launch item.)_
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

- **Sentry R2 leftovers (env + capture DONE + smoke-verified).** Remaining: (1) confirm the **email
  alert rule** fires, Sentry auto-creates a default "new issue" rule and the smoke test just created
  issue `JAVASCRIPT-NEXTJS-2`, so check the inbox; if nothing arrived, add one via Sentry → Alerts →
  Create Alert → Issues + enable Settings → Account → Notifications → Issue Alerts (the MCP can't create
  alert rules). (2) The **privacy-policy** session-recording line (drafted in ROADMAP near-term) lands
  when the `/privacy` stub becomes the real policy.
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
**Admin portal go-live (done):** Supabase TOTP MFA enabled + `admin.partyreel.com/auth/callback`
in the redirect allow-list; `admin.partyreel.com` added in Vercel (same project) with
`NEXT_PUBLIC_ADMIN_HOST` set; `hi@willgibs.com` enrolled TOTP (holds the factor). Break-glass if
the authenticator is lost: delete the factor in the Supabase dashboard (`auth.mfa_factors`).
**Sentry (R2):** the `javascript-nextjs` project + DSN + the 4 env vars are set in Vercel + deployed;
capture smoke-verified on prod (org `partyreel`).

## After any change

Advance this file, the [`SYSTEMS.md`](SYSTEMS.md) entry if a feature changed, and the
[`ROADMAP.md`](ROADMAP.md) box/backlog — same change. Re-run `get_advisors` after DDL (the
expected set is the 7 anon capability RPCs + the deny-all INFOs + the unrelated leaked-password
WARN — see SYSTEMS "Security & data model").
