# Partyreel — Roadmap

Canonical "what's next." Phases ship in order; each builds on the last.
[`STATUS.md`](STATUS.md) is the live "you are here" (current phase + what's blocked
on a human); this file is the per-phase plan; [`PRD.md`](PRD.md) is the product
"why"; [`adr/`](adr/) holds the binding decisions.

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
a slot and reclaims storage.

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
- [ ] Tests — RPC/mutation contract (status transitions; remove recounts caps
      correctly; purge respects `purge_at`) via a rolled-back Supabase-MCP check.

**Gotchas / decisions:**

- **Retention window is an OPEN product decision — don't infer it.** Soft-delete
  frees the slot immediately (anti-abuse), but media must persist until `purge_at`.
  The Phase 0 `/api/cron/purge` stub comment suggests ~90 days; **no PRD/ADR
  actually defines it.** Confirm the window with the maintainer, then set
  `purge_at = deleted_at + window` in `softDeleteEvent()`. (Tracked in STATUS open
  questions.)
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
- Never expose raw R2 keys; the purge runs server-side over `events/{id}/` prefixes.

**Done when:** approve/hide/remove + the queue work on partyreel.com; the cron
hard-deletes after retention with no orphans left; tests pass; STATUS/ROADMAP updated.

## ⬜ Phase 4 — Payments / tiers

**Goal.** Turn on monetization: hosts upgrade via Stripe; the webhook is the single
source of truth for `profiles.tier`; the free tier gets a watermark + upgrade prompts
at caps.

**Already wired (reuse):**

- `profiles.tier` (`tier_type`) + `stripe_customer_id` / `stripe_subscription_id`.
- `tiers.ts` ↔ `tier_limits()` SQL — the lockstep caps source.
- `/api/stripe/{checkout,portal,webhook}` — **501 stubs**.
- Admin client (`src/lib/supabase/admin.ts`, service-role) for tier writes that
  bypass RLS; env stubs `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.
- `withinLimit()` + the at-cap create-dialog pattern (Phase 1) for upgrade CTAs.

**To build:**

- [ ] Checkout session (plan → Stripe price; subscription for Pro/Max, one-time for
      Event Pass) → redirect; plus a Billing Portal link.
- [ ] **Raw-body** webhook (`await req.text()` before `constructEvent`; verify the
      signature; set `profiles.tier` via the service-role client; revalidate). This
      is the ONLY writer of `tier` — never the client.
- [ ] Free-tier watermark on exports/rendered media.
- [ ] Upgrade prompts at caps (reuse `withinLimit`).
- [ ] Tests — webhook → tier update (seeded/rolled-back); `tiers.ts` ↔ SQL parity.

**Gotchas / decisions:** raw body is mandatory (`req.json()` breaks the signature);
tiers live in two places (TS + SQL) and must stay in lockstep; decide where Stripe
price IDs live (env/config); Event Pass is one-time (~1 yr — see PRD). **Human
prereqs:** Stripe keys, products/prices, and webhook endpoint registration.

**Done when:** a checkout upgrades the host's tier via the webhook on partyreel.com;
the portal works; the new caps enforce; free exports carry the watermark.

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
