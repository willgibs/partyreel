# Partyreel — Roadmap

Canonical "what's next." Phases ship in order; each builds on the last.
[`STATUS.md`](STATUS.md) is the live "you are here" (current phase + what's blocked
on a human); this file is the per-phase plan; [`PRD.md`](PRD.md) is the product
"why"; [`PRICING.md`](PRICING.md) holds the tier/pricing detail; [`adr/`](adr/) holds
the binding decisions.

## Picking up a phase

A fresh agent told "continue with phase N" can run this loop (these are defaults,
not rails — use judgment):

1. **Orient** — read [`STATUS.md`](STATUS.md) first (you-are-here + human blockers),
   then this phase's entry below; skim the linked ADRs/PRD for the "why".
2. **Doc-check** — before coding, pull current docs for the libraries/services the
   phase touches via the Context7 MCP (this stack drifts; see CLAUDE.md "Tooling").
3. **Build** — reuse the DRY single-sources (CLAUDE.md), leave WHY-comments, and use
   the MCPs (Supabase, Cloudflare R2, Vercel) directly rather than asking.
4. **Test** — Vitest unit tests for pure logic + a rolled-back Supabase-MCP RPC
   contract check for the SQL the phase touches (CLAUDE.md "Working conventions").
5. **Verify on partyreel.com** — auth/upload/gallery flows can't be tested on
   localhost (not in the Supabase / R2 CORS / `NEXT_PUBLIC_SITE_URL` allow-lists; see
   the CLAUDE.md "Local dev vs. live testing" gotcha).
6. **Record** — advance STATUS, tick the boxes here, update any ADR — same change.

Each phase entry below lists **goal**, **already wired** (reuse these), **to build**,
**gotchas/decisions**, and **done when**. Once the roadmap is complete the project
shifts to one-off tasks, and this playbook + STATUS/ROADMAP leave the regular rotation.

## ✅ Phase 0 — Foundation

A deployable skeleton with the full design system, complete database schema +
security, and the living docs that let future agents pick up each phase.
**No working end-user features by design** — it's a clean handoff point.

- [x] Next 16 app initialized (TS, App Router, `src/`, Tailwind v4, ESLint, `@/*`)
- [x] Clean/minimal design system (shadcn radix-nova, `@theme` tokens, primitives + shared composites)
- [x] Route-group shells: `(marketing)`, `(auth)`, `(app)` (getUser gate), `(guest)`; API 501 stubs
- [x] Supabase project created + clients wired (`client`/`server`/`middleware`/`admin`), proxy session refresh
- [x] Schema applied: enums, 6 tables, indexes, triggers, RLS, capability-token RPCs; advisors run; types generated
- [x] Constants + stubs: `tiers.ts`, `r2/*`, `media/*`
- [x] Agent docs: CLAUDE.md, PRD, ROADMAP, STATUS, ADRs 0001–0004

## ✅ Phase 1 — Host auth + event creation

Verified in production (magic-link + Google both reach the dashboard).

- [x] Supabase Auth (email magic-link + Google OAuth); signup → profile trigger already exists
- [x] Login UI (replace `(auth)/login` placeholder); `/auth/callback` already wired
- [x] `form` primitive (hand-authored — radix-nova has no `form` item) + `react-hook-form` + zod resolver
- [x] Create-event flow (Server Actions) — DB defaults generate qr/share tokens; `enforce_event_limit` trigger guards `maxEvents`
- [x] QR code render; event settings (moderation mode, visibility, upload lock, required fields)
- [x] Dashboard event list (replace placeholder)

## ✅ Phase 2 — Guest join + upload (the core loop)

Verified in production (photo + video upload from a mobile QR both land in the host
gallery). Caught + fixed a Phase 0 `create_media` int4-overflow bug that blocked
every upload.

- [x] `/e/[token]` join via `create_guest` RPC → issues `session_token`
- [x] Browser → R2 **direct multipart** upload (presign + complete); `create_media` RPC sets status + ledger + caps
- [x] Live host gallery + public `/a/[token]` album (approved-only, presigned reads)
- [x] New `get_upload_context` RPC (presign-time session→event + cap pre-check) + Vitest unit harness
- [x] R2 bucket + CORS verified end-to-end (checksum `WHEN_REQUIRED`, ExposeHeaders ETag)

## ✅ Phase 3 — Moderation + lifecycle + safety (reports/review MVP)

**Verified in production (2026-05-29).** Moderation (approve/hide/unhide/remove + the
pending queue), the delete→purge lifecycle (the cron reclaimed R2 + rows +
`storage_used_bytes` while the monthly ledger stayed untouched), and the report→`/admin`
review loop (dismiss + action, no auto-hide) all confirmed live. Local
typecheck/lint/format/test/build clean; DB contract verified via rolled-back
Supabase-MCP checks; advisors show the expected **6** anon RPCs (`purge_media_rows`
stays locked down).

**Goal.** Give the host curation control (core-loop step 3): approve/hide/remove
uploads and work the hold-for-approval queue; the delete→purge lifecycle that frees a
slot and reclaims storage (R2 objects + DB rows + an orphan sweep); and a **safety
reports/review MVP** — a public report flow + an internal operator review surface. **No
upload scanner and no NSFW filter** — proactive filtering is v2+ (PRD "Safety &
moderation").

**Already wired (reused):**

- `media.status` enum `pending | approved | hidden | removed` (`src/lib/db/types.ts`);
  `create_media` already sets `pending`/`approved` from the event's `moderation_mode`.
- `events.deleted_at` + `events.purge_at` columns; `softDeleteEvent()`
  (`src/lib/db/mutations/events.ts`).
- `listEventMedia()` already excludes `removed` (`src/lib/db/queries/media.ts`); the
  host gallery lives in `src/app/(app)/dashboard/[eventId]/page.tsx`.
- `media_host_all` RLS scopes media to the host's own events (the moderation path);
  `createAdminClient()` (service role) for the operator surface; `presignDownload`.
- The `MutationResult`/`ActionResult` + `useTransition`+toast+confirm-Dialog patterns
  (`mutations/events.ts`, `dashboard/actions.ts`, `event-settings-form.tsx`).

**Built:**

- [x] Moderation mutations (`src/lib/db/mutations/media.ts`) + thin Server Actions
      (`src/app/(app)/dashboard/[eventId]/actions.ts`): `setMediaStatus` (approve/hide/
      unhide, status allowlisted), `removeMedia`, `approveAllPending`. **Retired the
      `/api/media/[mediaId]` 501 stub** — Server Actions give auth + `revalidatePath`.
- [x] Remove = **soft** (`status='removed'` + `removed_at`): frees the per-event slot
      immediately, gives an undo window; the cron reclaims R2 + row after a 7-day grace.
      No R2 call / counter change at remove time.
- [x] Moderation UI — extracted a presentational `MediaTile` (shared with the public
      album), new `host-media-grid.tsx` with per-item Approve/Hide/Unhide/Remove
      (Remove behind a confirm Dialog) + a **Pending review** section with **Approve all**
      for hold-for-approval events (partitioned in the RSC; no new route).
- [x] `purge_at = deleted_at + 60d` stamped in `softDeleteEvent()` (single timer).
- [x] Purge cron (`src/app/api/cron/purge/route.ts`, Node runtime, raised `maxDuration`,
      timing-safe `Bearer $CRON_SECRET` auth) — three sweeps: events past `purge_at`,
      individually-removed media past a 7-day grace, and **orphaned R2 objects** (>24 h
      old, no `media` row). R2-then-rows ordering; `purge_media_rows` RPC does the atomic
      row-delete + `storage_used_bytes` decrement. R2 helpers in `src/lib/r2/delete.ts`
      (`deleteR2Objects` ≤1000/batch, `listR2Objects` paginated) + `parseMediaIdFromKey`.
      Schedule added to `vercel.json` (`0 4 * * *`).
- [x] **Safety: reports/review MVP** — `create_report` RPC (6th anon capability-token
      RPC; insert-only, **never** auto-hides), `reportSchema` + `/api/reports` POST + a
      discreet `report-dialog.tsx` on the public album; an operator surface at `/admin`
      (gated by `profiles.is_admin`, `notFound()` for non-admins) with dismiss/action
      Server Actions. `reports` table is RLS deny-all (operator-internal; access via the
      RPC + service-role client only).
- [x] Tests — Vitest (`report.ts` schema, `parseMediaIdFromKey` round-trip) + four
      rolled-back Supabase-MCP RPC checks (remove frees the slot; `purge_media_rows`
      decrements usage / leaves the ledger / is idempotent; sweep-1 `purge_at` predicate;
      `create_report` open/cross-event-`check_violation`/bad-token-`no_data_found`).

**Deferred to a fast-follow (out of Phase 3):**

- **Host access options** — per-event settings that gate guest access: (a) a
  **passphrase** (emoji / short phrase OK) to upload and/or view; (b)
  **require-upload-to-view**, optionally with an item minimum. Each needs an
  event-settings field + a gate in the capability-token guest-flow / album RPCs; kept
  out of this phase to stay focused on those security-critical RPCs.

**Gotchas / decisions:**

- **Retention impl decided:** for the explicit event-delete path, **one `purge_at`
  timer = `deleted_at + 60d`** (the recoverable tail; PRD "Data retention"). Individual
  media removal uses a separate, shorter **`removed_at + 7d`** grace before the cron
  reclaims it. The over-capacity 30-day grace is an account/billing state — **Phase 4**,
  not a second timestamp here.
- **`media.removed_at` is a dedicated clock — never age removal off `updated_at`** (the
  `set_updated_at` trigger bumps `updated_at` on every touch, resetting the grace).
- **The three counters are deliberately different — don't "reconcile" them away:**
  per-event caps count `status <> 'removed'` (so removing a photo frees its per-event
  slot — intended); the monthly `storage_ledger` counters NEVER decrement (churn
  defense); `storage_used_bytes` decrements **only** when `purge_media_rows` hard-deletes
  the R2 object — which is why that decrement is atomic with the row delete in one RPC.
- **Orphan sweep uses a 24 h age threshold** — well past the 15-min presign TTL, so it
  can't race a guest's presigned-but-not-yet-completed upload (the bucket's
  abort-incomplete-multipart rule is a separate mechanism). Orphans were never counted,
  so the sweep makes **no** counter change.
- **`purge_media_rows` must stay REVOKED from anon/authenticated** (service-role only) —
  it must not become a 7th anon advisor WARN.
- `CRON_SECRET` is a **new env var** (Vercel auto-sends it as the cron's bearer);
  `profiles.is_admin` is **service-role-write-only** (flip it once via the MCP) — both in
  STATUS "blocked on a human."
- Never expose raw R2 keys; the purge runs server-side over `events/{id}/` prefixes.

**Done when:** approve/hide/unhide/remove + the pending queue work on partyreel.com; a
deleted event's `purge_at` is ~60 d out and the cron reclaims R2 + rows (and an injected
orphan) after back-dating, decrementing `storage_used_bytes` while leaving the ledger
untouched; a report from `/a/[token]` appears in `/admin` and dismiss/action both work
(and a report does **not** auto-hide). Tests pass; STATUS/ROADMAP updated. _(All met —
code + local/DB + the partyreel.com live pass verified 2026-05-29; see STATUS "Verified".)_

## ✅ Phase 4 — Payments / tiers

**DONE — all 3 cuts verified in production (2026-05-29):** 4a storage-cap model, 4b Stripe
Pro subscriptions, 4c Event Pass. Remaining items below (full over-capacity retention +
renewal nudges) are **fast-follows**, not Phase-4 blockers.

**Goal.** Turn on monetization on the **storage-cap model** (decided 2026-05-29 — see
PRD "Monetization & anti-abuse"): hosts upgrade via Stripe; the webhook is the single
source of truth for `profiles.tier`; caps are total storage, not item counts. Full
table + target `tiers.ts` + the Stripe setup guide: [`PRICING.md`](PRICING.md).

**Staged in 3 cuts** (decided with Will 2026-05-29), each verifiable on partyreel.com
before the next: **4a** storage-cap model rework + tier-gated settings + pricing page (no
Stripe) — **DONE (deployed)**; **4b** Stripe Pro subscriptions (checkout/webhook/portal)
— **DONE, verified in production (2026-05-29)**: a live test-mode checkout flipped tier→Pro
+ 500 GB cap via the webhook, the portal opened, and an immediate cancel downgraded back to
Free. (The MCP created the products/prices but **can't** create webhook endpoints or portal
configs — those were dashboard tasks.); **4c** Event Pass + minimal expiry — **DONE,
verified in production**: one-time `mode:payment` checkout → `checkout.session.completed`
provisioned `tier='event_pass'` + 75 GB + `tier_expires_at` (365 d), and the purge cron's
`expired_passes` sweep downgraded a back-dated pass to Free. The **full
over-capacity retention flow** (30-day grace UI, largest-first auto-reduce, warning emails)
is a **fast-follow** — 4b/4c ship only "downgrade sets the cap + block new uploads when over."

**Tier model to implement (replaces the Phase 0 item-cap model):**

- **Free, Pro (storage selector), and Event Pass (per-event, fixed term, cheap
  renewal)** — drop the separate Max tier and ALL per-event photo/video item caps.
- Rework `tiers.ts`, the `tier_limits()` SQL fn, and `create_media` to enforce a
  single **total-storage cap** (`storage_used_bytes` vs cap) instead of per-event
  counts; remove the now-dead `watermark` field. Keep the universal per-file limits.
- Add a **monthly ingress meter** (bytes uploaded per month; never refunds on delete;
  unmarketed soft limit) — the real anti-abuse guard, since storage caps don't stop
  delete→re-upload egress burn.
- Pricing page shows GB with a friendly "≈ X photos / X one-minute videos" translation.

**Already wired (reuse):**

- `profiles.tier` (`tier_type`), `storage_cap_bytes`/`storage_used_bytes`,
  `stripe_customer_id`/`stripe_subscription_id`.
- `tiers.ts` ↔ `tier_limits()` SQL — the lockstep caps source (currently the OLD
  item-cap model; this phase reworks both together).
- `/api/stripe/{checkout,portal,webhook}` — **501 stubs**.
- Admin client (`src/lib/supabase/admin.ts`, service-role) for tier writes that bypass
  RLS; env stubs `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
- `withinLimit()` and the at-cap create-dialog pattern (Phase 1) for upgrade CTAs.

**To build:**

- [x] **(4a)** Storage-cap tier rework (`tiers.ts`, `tier_limits()`, `create_media`,
      `get_upload_context`; dropped item caps + the `watermark` field; `max` left as a
      retired enum value; added the monthly ingress-bytes meter). The **~10% overflow
      buffer** hard-blocks `create_media`; the over-capacity _grace_ (largest-first
      auto-reduce) is the fast-follow. Cap = `coalesce(storage_cap_bytes, tier default)`.
- [x] **(4a)** **Tier-gated event settings** — `GATED_EVENT_SETTINGS` + `isSettingLocked`
      gate **`require_email`** (locked on Free with an upgrade hint, server-enforced in
      `updateEvent`). The pricing page + a dashboard storage gauge also landed in 4a.
- [x] **(4b)** Checkout session (Pro storage tier → subscription price) → redirect, plus a
      Billing Portal link (dashboard "Manage billing"). Event Pass → one-time price is
      **Cut 4c**. _(Verified live 2026-05-29: checkout + portal both confirmed.)_
- [x] **(4b)** **Promo / free-pass codes** — `allow_promotion_codes: true` on the Checkout
      session (no separate system; create coupons/promo codes in Stripe as needed).
- [x] **(4b)** **Raw-body** webhook (`await req.text()` before `constructEvent`; verify
      signature; set `profiles.tier`/`storage_cap_bytes` via the service-role admin client).
      The ONLY writer of tier/cap. Pure, unit-tested `resolveSubscriptionUpdate`. _(Verified
      live 2026-05-29: upgrade→Pro + cancel→downgrade both confirmed via the Supabase MCP.)_
- [x] **(4b)** Upgrade prompts at the paywalls — the at-cap create banner + the dashboard
      storage gauge link to `/pricing`; the Pro cards start checkout.
- [x] **(fast-follow, code-complete)** Over-capacity retention — Resend email foundation
      (`sendOnce` deduped), a **45-day grace** (banner + warning emails) then **largest-first
      auto-reduce** into the Phase-3 removed tail; + **Event Pass renewal** ($15 price +
      14-day nudge email + dashboard Renew); + **free-tier 6-month inactivity removal**
      (`last_active_at` bumped via `touchHostActive` in the `(app)` layout; warn ~14 d out
      then soft-delete into the recoverable tail). The daily cron now runs **7 lifecycle
      sweeps** (expired_events, removed_media, orphans, expired_passes, over_capacity,
      renewal_nudges, inactive_free_events).
      _(Pending Resend setup + `STRIPE_PRICE_EVENT_PASS_RENEWAL` + deploy + live verify.)_
      Cold storage evaluated + rejected (R2 IA marginal; Glacier = cross-cloud project).
- [x] **(4a/4b)** Tests — `tiers.ts` ↔ `tier_limits()` parity + storage-cap enforcement in
      `create_media` (4a, rolled-back); the webhook `resolveSubscriptionUpdate` resolver
      (4b, Vitest fixtures).

**Gotchas / decisions:** raw body is mandatory (`req.json()` breaks the signature);
`tiers.ts` and the SQL must stay in lockstep; **drive prices from Stripe Price IDs** so
they change without a deploy (keep the IDs in env/config); Event Pass is per-event,
fixed-term (~1 yr) with a renewal nudge; set the actual GB tiers and prices (open — see
STATUS). **Human prereqs:** Stripe keys,
products/prices, webhook endpoint registration.

**Done when:** a checkout upgrades tier/storage via the webhook on partyreel.com; the
portal works; storage caps and the ingress meter enforce. **MET (2026-05-29)** — Pro
upgrade/cancel, Event Pass purchase/expiry, and the storage-cap enforcement all verified
live. The full over-capacity **retention flow** (grace + auto-reduce + emails) is the
fast-follow below, not a Phase-4 blocker.

## ⏸️ Phase 5 — Highlight reel (scaffold → real) — TABLED pending product research

> **Deliberately deferred (2026-05-29).** The reel defines what the product *outputs*, so
> it's a one-way door that shouldn't be rushed. The central open fork (researched, awaiting a
> decision): **where the transcode/stitch worker runs** — a **managed video-editing API**
> (e.g. Shotstack, ~$0.20–0.40/rendered min, fastest to ship) vs. **self-hosted ffmpeg on
> Cloudflare Containers** (GA Apr 2026; same account as R2 = zero egress; cheapest at scale,
> most to build). Also open: trigger (on-demand vs. auto), clip-selection algorithm (start
> simple/heuristic), output format + poster, and any tier-gating (the PRD's no-watermark stance
> steers away from a reel watermark). Resume with a short product + architecture spec.

**Goal.** Stitch a highlight reel from the best clips (core-loop step 5).

**Already wired (scaffold):** the `highlight_reels` table + `status` enum
(`pending|processing|ready`); `media.highlight_score` / `clip_start_seconds` /
`clip_end_seconds` / `reel_eligible`; `preview_key` (null today). **Hard constraint:**
transcode/stitch runs in an **external worker, NOT Vercel functions** (ADR-0003).

**Open decisions (resolve before building — don't assume):** worker platform;
trigger (on-demand vs. event-complete); the highlight-scoring algorithm; output
format + poster/`preview_key` generation; tiered download + watermarking. Needs a
short product + architecture spec first. The **"Generate reel" entry point** appears in
the host gallery when this ships — no placeholder beforehand.

## 🔨 Phase 6 — Growth / polish (in progress)

**Goal.** Amplify the growth loop (guest → future host) and polish the host experience.
Built as focused cuts; the **growth-loop cut shipped first** (decided with Will 2026-05-29)
as the highest-leverage subset for the north-star.

**Already wired:** the public album (`/a/[token]`) + guest surfaces; the Resend `sendOnce`
email guard; the capability-token RPC + `anon`-grant pattern.

**✅ Growth-loop cut (code-complete + locally verified; pending commit + deploy + live verify):**

- [x] **Branded share pages + growth badge** — a `MakeYourOwn` "make your own Partyreel" CTA
      on the public album footer + the post-upload success state, and the album logo links
      home. Brand color used only as the small mark (punctuation).
- [x] **Marketing SEO + share metadata** — `metadataBase` + default OG/twitter in the root
      layout; code-generated OG images (`next/og`: site-wide + per-event album card with the
      event name); a branded `icon.svg`; `sitemap.ts` + `robots.ts` (marketing only); marketing
      page descriptions; and `generateMetadata` on `/a/[token]` + `/e/[token]` so links unfurl
      — but with **`robots noindex`** (opaque token surfaces must not be search-indexed).
- [x] **Guest email capture** — a soft, one-time, dismissible post-upload prompt
      (localStorage-gated) → the `capture_guest_email` RPC sets `guests.email` (if null) +
      upserts a durable `newsletter_signups` list on opt-in. **Deferred:** the automatic
      album-link email send (capture-only for now).

**Remaining candidates — approved order (creation-first, decided with Will 2026-05-29):**
**QR designer → create wizard → link analytics → notification center.** Within-chain order
is forced (the QR designer is the wizard's design step + reusable; link analytics is the
notification center's capture infra); the notification center is the capstone (it surfaces
everything, including link analytics). Each is its own cut with its own spec.

- [x] **QR code designer / presets** _(cut #1 — shipped + VERIFIED in production 2026-05-30)_ —
  style the QR in-app (corporate-blocky vs. wedding-rounded) so hosts never leave for an
  external stylizer. Swapped `qrcode.react` → **`qr-code-styling`** (module/corner shapes); a
  4-preset closed set (`classic`/`bold`/`rounded`/`dots`) in the single-source
  `src/lib/constants/qr-presets.ts`, persisted on `events.qr_style` (app-validated text column,
  not a DB enum). Reusable `QrPresetPicker` + a "Customize" dialog on the event page's Share
  card; SVG + PNG download. Live pass (drove Chrome): the render/save/persist/reload round-trip
  works, a styled QR jsQR-decodes to its `/e/<token>`, no console errors, advisors unchanged.
- [x] **Onboarding + create wizard** _(cut #2 — shipped + VERIFIED in production 2026-05-30,
  incl. a post-deploy fix for a Share-step at-cap-redirect bug)_ — a dedicated
  **`/dashboard/new`** 3-step wizard (Details → QR design → Share)
  replacing the create dialog. Creates **once at commit** via the non-redirecting
  `createEventInWizard` action (returns the event → the Share step renders the real scannable QR
  in the chosen style + the album link). Embeds cut #1's `QrPresetPicker` (previews with a
  same-length placeholder token); dashboard button + empty-state CTA link to it; old
  `CreateEventDialog` + `createEventAction` deleted (single create path). New pure
  `src/lib/events/share-urls.ts` (+ test). No new SQL. Verified: typecheck/lint/**test (82)**/
  build/format clean. _(First-time host **welcome** split out as its own cut — see below.)_
- **First-time host welcome** _(cut #2b — its own full planning stage, per Will)_ — a light
  first-run welcome for brand-new accounts. Natural homes: the `/dashboard/new` route + the
  dashboard empty state (both already the first-run entry points). Not started.
- [x] **Link analytics** _(cut #3 — code-complete + locally verified; pending deploy + live
  verify)_ — scan/view activity on QR + share links. **Aggregate counts, no PII** (decided
  with Will): new `link_stats(event_id, kind, day, count)` (`kind` = qr_scan|album_view),
  recorded server-side in each guest page's `after()` via the **service-role-only**
  `record_link_hit` (REVOKED from anon — locked like `purge_media_rows`, NOT a new anon RPC;
  the original "8th anon RPC" guess was reconsidered since recording is server-initiated).
  Bots filtered at ingest (`isLikelyBot`); hosts read via an RLS policy and see counts on the
  event's "Share with guests" card. Advisors **unchanged**; rolled-back DB check confirms
  increment + lockdown + policy. Time-series/unique-visitors deferred; cut #4 surfaces these
  counters as "new activity."
- **Notification / alert center** _(cut #4 — capstone)_ — a badge by the avatar aggregating
  alerts (uploads, over-capacity/retention warnings, billing, pass expiry, link-analytics
  activity). Critical alerts already go by email in earlier phases; this is the in-app aggregator.

## Later / v2+ docket (post-v1)

Not part of the v1 roadmap — parked here so it isn't lost:

- **Proactive CSAM filtering** — choose and integrate an upload-time hash-matching tool
  (PhotoDNA is one candidate). v1 ships only the report/takedown + operator-review MVP
  (Phase 3).
- **Referral program** — a % incentive with attribution and payouts (Stripe credits or
  Connect): wedding planners refer hosts; guests who sign up from an event page earn the
  host a cut if they convert to Pro. Substantial (attribution + payouts) → post-core.
- **Guest → full-user conversion** — `require_email` becomes a _confirmed_ email
  (magic-link) that quietly creates a latent account; a later traditional login triggers
  the full signup/onboarding (more info, newsletter opt-in) and merges. Interacts with
  Phase 1 auth and the Phase 4 tier-gated `require_email`.
- **Multi-account events (co-hosts + invited guests)** — let an owner link other accounts
  to an event: **co-hosts** (shared management) and, extending `require_email`,
  **invite-only guests** (private events where only invited emails may join).
  **Co-hosting is paid-only:** the **owner** must be on Pro or hold an Event Pass to
  invite co-hosts — establishing billing responsibility up front — and co-hosts need
  **no** plan of their own (the event already qualifies via the owner's plan). Model is
  **additive**: keep `events.host_id` as the **owner / billing + storage anchor** and add
  an **`event_members(event_id, user_id, role)`** table; broaden the host RLS policies
  (`events_host_all`, `media_host_all`, etc.) from `host_id = auth.uid()` to
  membership-based. Because it's additive, deferring causes no painful migration — but
  write near-term host RLS in a membership-broadening-friendly way. (The lighter v1
  access controls — passphrase, require-upload-to-view — are the Phase 3 versions.)
- **AI support-recovery** — triage "I lost my media" emails, match sender →
  account/event, auto-send a time-boxed download link (PRD "Data retention").
- **NSFW filtering** — only if a real need emerges; host-opt-in, image moderation on
  photos and sampled video keyframes to keep cost down (cost basis researched: ≈ $1 per
  1k images, video ≈ $0.10/min via Rekognition — so sample frames, don't moderate full
  video; Google Vision has no video moderation).
