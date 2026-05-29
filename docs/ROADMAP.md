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

## ⬜ Phase 3 — Moderation + lifecycle

**Goal.** Give the host curation control (core-loop step 3): approve/hide/remove
uploads, work the hold-for-approval queue, and the delete→purge lifecycle that frees
a slot and reclaims storage. Plus the foundational **CSAM safety scan** on uploads
(the root of the filter system — see PRD "Safety & moderation").

**Already wired (reuse):**

- `media.status` enum `pending | approved | hidden | removed` (`src/lib/db/types.ts`);
  `create_media` already sets `pending`/`approved` from the event's `moderation_mode`.
- `events.deleted_at` + `events.purge_at` columns; `softDeleteEvent()` stamps
  `deleted_at` (`src/lib/db/mutations/events.ts`).
- `/api/media/[mediaId]` PATCH (approve/hide) + DELETE (remove) — **501 stub**.
- `/api/cron/purge` GET — **501 stub**, auth via `Authorization: Bearer CRON_SECRET`.
- `listEventMedia()` already excludes `removed` (`src/lib/db/queries/media.ts`);
  `MediaGrid` already renders status badges (`src/components/app/media-grid.tsx`);
  the host gallery lives in `src/app/(app)/dashboard/[eventId]/page.tsx`.
- Visibility + upload-lock toggles already shipped in `event-settings-form.tsx`
  (Phase 1) — confirm behavior; no rebuild expected.
- `media_host_all` RLS scopes media to the host's own events (the moderation path).

**To build:**

- [ ] Approve / hide mutations — host updates `media.status` (RLS path; mirror the
      Phase-1 mutation + Server-Action pattern in `src/lib/db/mutations/`); wire the
      `/api/media/[mediaId]` PATCH stub or a Server Action.
- [ ] Remove — hard-delete the row **and** its R2 object (wire the DELETE stub; reuse
      the `events/{id}/` key prefix + an R2 delete helper in `src/lib/r2/`).
- [ ] Moderation UI — approve/hide/remove controls on `MediaGrid` + a `pending`
      review queue for hold-for-approval events.
- [ ] Set `purge_at` on soft-delete (retention window — see gotchas).
- [ ] Purge cron — implement `/api/cron/purge`: find events with
      `deleted_at IS NOT NULL AND purge_at <= now()`, delete their R2 objects + rows;
      also sweep **orphaned R2 objects** (uploaded but no `media` row — the accepted
      Phase-2 race). Add the schedule to `vercel.json`.
- [ ] **Safety: CSAM legal-floor MVP** (PRD "Safety & moderation") — a report/takedown
      flow, an NCMEC CyberTipline reporting workflow, and an internal account flag for
      human review; never auto-shutdown. **No scanner vendor locked in** and **no NSFW
      filter**. Proactive upload hash-scanning (tool TBD after a data-privacy/legal
      review) is on the **v2+ docket**, built as the extensible filter root.
- [ ] **Protected events (optional, can fast-follow)** — a per-event passphrase
      (emoji / short phrase OK) gating guest upload and/or view. Needs a schema field (a
      hashed event secret), RPC/guest-flow changes, and a settings toggle (PRD "Safety &
      moderation").
- [ ] Tests — RPC/mutation contract (status transitions; remove recounts caps
      correctly; purge respects `purge_at`) via a rolled-back Supabase-MCP check.

**Gotchas / decisions:**

- **Retention policy is defined — see PRD "Data retention & lifecycle":** roughly a
  30-day in-app grace (over-limit content stays downloadable; then largest-first
  reduction), then a further 60-day hidden-but-recoverable window, then hard-delete.
  For Phase 3's explicit event-delete path, set `purge_at` from `softDeleteEvent()`;
  decide whether one `purge_at` timer suffices or the two-stage window needs a second
  timestamp (the over-limit/billing trigger itself is Phase 4).
- **The three counters are deliberately different — don't "reconcile" them away:**
  per-event caps count `status <> 'removed'` (so removing a photo frees its
  per-event slot — intended); the monthly `storage_ledger` counters NEVER decrement
  (churn defense); `storage_used_bytes` (Max tier) decrements only when the purge
  cron actually deletes the R2 object.
- **Decide `remove` semantics + the legal `status` transitions before the UI.**
  Likely `remove` = set `status='removed'` (soft: hidden everywhere, frees the
  per-event slot, swept later by purge) rather than an immediate hard-delete —
  confirm.
- **Orphan sweep needs an age threshold** — only delete unreferenced R2 objects
  older than N hours, or you'll race a guest's presigned-but-not-yet-completed
  upload (the bucket's abort-incomplete-multipart rule is a separate mechanism).
- `CRON_SECRET` is a **new env var** (Vercel) + a Vercel Cron entry (daily is a sane
  default) — flag it in STATUS "blocked on a human."
- **CSAM prereqs (human):** for the v1 MVP, register for **NCMEC CyberTipline**
  reporting and do a **data-privacy + legal review** of what we may scan/store. A
  proactive scanner is a v2+ decision after that review (Cloudflare's free tool is
  CDN-cache-only and won't see private R2; PhotoDNA is one candidate).
- Never expose raw R2 keys; the purge runs server-side over `events/{id}/` prefixes.

**Done when:** approve/hide/remove + the queue work on partyreel.com; CSAM scanning
flags matches for review (not auto-shutdown); the cron hard-deletes after retention
with no orphans left; tests pass; STATUS/ROADMAP updated.

## ⬜ Phase 4 — Payments / tiers

**Goal.** Turn on monetization on the **storage-cap model** (decided 2026-05-29 — see
PRD "Monetization & anti-abuse"): hosts upgrade via Stripe; the webhook is the single
source of truth for `profiles.tier`; caps are total storage, not item counts. Full
table + target `tiers.ts` + the Stripe setup guide: [`PRICING.md`](PRICING.md).

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

- [ ] Storage-cap tier rework (`tiers.ts`, `tier_limits()`, `create_media`; drop item
      caps, Max, and the `watermark` field; add the monthly ingress meter).
- [ ] **Tier-gated event settings** — a mechanism to lock host-settings toggles by tier
      with an upgrade hint; start by gating **`require_email`** (locked on Free,
      unlocked on Pro/Event Pass). Don't enforce the lock before tiers exist — today
      everyone is Free.
- [ ] Checkout session (Pro storage tier → subscription price; Event Pass → one-time
      price, per event) → redirect; plus a Billing Portal link.
- [ ] **Raw-body** webhook (`await req.text()` before `constructEvent`; verify the
      signature; set `profiles.tier`/`storage_cap_bytes` via the service-role client;
      revalidate). The ONLY writer of tier/cap — never the client.
- [ ] Upgrade prompts at the paywalls (creating a 2nd event; outgrowing event #1's
      storage) via `withinLimit`.
- [ ] Over-limit → the retention flow (PRD "Data retention & lifecycle": 30-day in-app
      grace, largest-first reduction, 60-day recoverable). Ties to billing webhooks.
- [ ] Tests — webhook → tier/cap update (seeded/rolled-back); `tiers.ts` ↔ SQL parity;
      storage-cap enforcement in `create_media`.

**Gotchas / decisions:** raw body is mandatory (`req.json()` breaks the signature);
`tiers.ts` and the SQL must stay in lockstep; **drive prices from Stripe Price IDs** so
they change without a deploy (keep the IDs in env/config); Event Pass is per-event,
fixed-term (~1 yr) with a renewal nudge; set the actual GB tiers and prices (open — see
STATUS). **Human prereqs:** Stripe keys,
products/prices, webhook endpoint registration.

**Done when:** a checkout upgrades tier/storage via the webhook on partyreel.com; the
portal works; storage caps and the ingress meter enforce; over-limit accounts enter the
retention flow.

## ⬜ Phase 5 — Highlight reel (scaffold → real)

**Goal.** Stitch a highlight reel from the best clips (core-loop step 5).

**Already wired (scaffold):** the `highlight_reels` table + `status` enum
(`pending|processing|ready`); `media.highlight_score` / `clip_start_seconds` /
`clip_end_seconds` / `reel_eligible`; `preview_key` (null today). **Hard constraint:**
transcode/stitch runs in an **external worker, NOT Vercel functions** (ADR-0003).

**Open decisions (resolve before building — don't assume):** worker platform;
trigger (on-demand vs. event-complete); the highlight-scoring algorithm; output
format + poster/`preview_key` generation; tiered download + watermarking. Needs a
short product + architecture spec first.

## ⬜ Phase 6 — Growth / polish

**Goal.** Lean into the growth loop + production polish (the core-loop step-4 share CTA).

**Already wired:** the public album (`/a/[token]`) + guest surfaces are the homes for
a branded share page + "make your own" CTA.

**Open decisions (resolve before building):** branded share-page spec (cover image /
title / `og:image`); analytics stack; SEO scope (meta/sitemap); onboarding polish.
Needs a spec first.

## Later / v2+ docket (post-v1)

Not part of the v1 roadmap — parked here so it isn't lost:

- **Proactive CSAM filtering** — choose and integrate an upload-time hash-matching tool
  after the data-privacy/legal review (PhotoDNA is a candidate). v1 ships only the
  legal-floor MVP (Phase 3).
- **AI support-recovery** — triage "I lost my media" emails, match sender →
  account/event, auto-send a time-boxed download link (PRD "Data retention").
- **NSFW filtering** — only if a real need emerges; host-opt-in, image moderation on
  photos and sampled video keyframes to keep cost down.
- **Growth badge** — the clean "make your own" badge design for shared albums (adjacent
  to Phase 6).
