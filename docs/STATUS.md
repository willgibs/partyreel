# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-29
**Current phase:** Phase 4 — Payments/tiers, staged in **3 cuts** (see
[`ROADMAP.md`](ROADMAP.md)). **Cut 4a (storage-cap model rework) is built + locally
verified**; its migration is **already applied to the live DB**. Next: **deploy 4a**,
then build **Cut 4b (Stripe Pro subscriptions)**.
**Last shipped:** Phase 3 — Moderation + lifecycle + safety, **verified in production**
(2026-05-29): moderation approve/hide/unhide/remove + the pending queue; the purge cron
reclaimed R2 objects + DB rows + `storage_used_bytes` while leaving the monthly ledger
untouched; report → `/admin` review with dismiss + action both working (no auto-hide).

Phases 1–3 are **verified in production**. Phase 3 shipped code-complete (committed
`734133d`, deployed to partyreel.com) with both human prereqs done (`CRON_SECRET` in
Vercel; `profiles.is_admin` flipped for the operator), and the **live end-to-end pass is
now complete** — see "Verified" below. Canonical domain is **partyreel.com**
(`NEXT_PUBLIC_SITE_URL=https://partyreel.com`); R2 (bucket `partyreel`) is provisioned
with CORS (`ExposeHeaders: ETag`) + an abort-incomplete-multipart lifecycle rule.

**Cut 4a (storage-cap model rework)** is built + locally verified. It swaps the old
per-event item-cap model for a **total-storage-cap + monthly ingress-bytes** model:
`tiers.ts` reworked to the `PLANS`/`MAX_EVENTS`/`MONTHLY_INGRESS_BYTES` shape; migration
`20260529145751_phase4a_storage_cap_model` reworked `tier_limits()` (now
`max_events`/`monthly_ingress_bytes`/`default_storage_cap_bytes`), `create_media` (drops
item caps; enforces a universal cap = `coalesce(storage_cap_bytes, tier default)` with a
**10% overflow buffer**, plus the monthly ingress meter), and `get_upload_context` (now
returns `at_storage_cap`/`at_monthly_cap`). UI: `require_email` is **tier-gated** (locked
on Free, server-enforced in `updateEvent`), the dashboard has a **storage gauge**, and
`/pricing` renders the GB cards. **Everyone is still Free (2 GB)** until 4b wires Stripe.
Verified: typecheck/lint/format/test (53)/build clean; rolled-back create_media checks
(cap+buffer, monthly ingress, `get_upload_context` flags) pass; advisors = the same **6**
anon RPCs; `/pricing` rendered locally. **⚠️ The migration is live on the DB but the 4a
code is not yet deployed** — deploy 4a to resync (transient state is safe: all hosts are
Free with tiny data, and `create_media` stays authoritative).

## What exists now

The full guest core loop is live, plus Phase 3 host curation + lifecycle + safety on
top of it: scan QR → join (no account) → upload → host **curates** (approve/hide/
remove + pending queue) → public album renders approved-only → delete/remove flows into
a purge cron that reclaims storage → guests can report, operators review.

Phase 2 (verified in production) shipped:

- **Guest join + upload UI** (`src/app/(guest)/e/[token]`, `src/components/guest/*`):
  join form (per-event required fields) → a client upload orchestrator that
  presigns, uploads **directly to R2** (single PUT < 100 MB, else multipart) with
  per-file XHR progress, then completes. Returning-guest session persisted in
  localStorage via `useSyncExternalStore`.
- **Three route handlers** (`/api/guests`, `/api/r2/presign-upload`,
  `/api/r2/complete-upload`). The presign route is the orchestration brain: it
  validates the session, re-checks limits + tier caps, and **builds the R2 key
  server-side** (client never supplies a key) — minimizing orphaned objects.
- **New RPC `get_upload_context`** (5th capability-token RPC) resolves
  session→event + cap headroom for that pre-check; counting mirrors `create_media`.
- **Galleries:** host live gallery on the event page + public `/a/[token]` album,
  both presigning R2 keys server-side (`presignDownload`, 1 h TTL), `force-dynamic`.
- **R2 client + presign wired** (`src/lib/r2/{client,presign}.ts`) with the
  checksum-safe `S3Client` config; `@aws-sdk/client-s3` added.
- **Vitest harness** (`pnpm test`) + unit tests for the data-integrity pure layer.
- **Bug fix (migration `…_fix_create_media_video_bytes_overflow`):** `create_media`
  threw `integer out of range` on _every_ call — `2 * 1024 * 1024 * 1024` overflows
  int4 during DECLARE init. Fixed with `2::bigint`. Caught by the new RPC-contract test.

Phase 3 (**verified in production**) adds:

- **Moderation** — `setMediaStatus` / `removeMedia` / `approveAllPending` mutations
  (`src/lib/db/mutations/media.ts`) + Server Actions; a `host-media-grid.tsx` with
  per-item Approve/Hide/Unhide/Remove (Remove behind a confirm Dialog) and a **Pending
  review** section (Approve all) for hold-for-approval events. Extracted a shared
  presentational `MediaTile`. Retired the `/api/media/[mediaId]` 501 stub.
- **Lifecycle** — `media.removed_at` clock; `softDeleteEvent` stamps
  `purge_at = deleted_at + 60d`; the **purge cron** (`/api/cron/purge`, timing-safe
  `Bearer $CRON_SECRET`) sweeps events past `purge_at`, removed media past a 7-day grace,
  and orphaned R2 objects (>24 h, no row). `purge_media_rows` RPC does the atomic
  row-delete + `storage_used_bytes` decrement; R2 helpers in `src/lib/r2/delete.ts` +
  `parseMediaIdFromKey`; `assertCronEnv()` in `env.ts`; `vercel.json` cron (`0 4 * * *`).
- **Safety** — `create_report` RPC (6th anon capability-token RPC; insert-only, never
  auto-hides), `reportSchema` + `/api/reports` POST + a discreet report dialog on the
  public album; an operator review surface at `/admin` (gated by `profiles.is_admin`)
  with dismiss/action Server Actions. `reports` table is RLS deny-all (operator-internal).

**Verified (Phase 2 + 3):** typecheck/lint/format/test/build clean; 41 unit tests pass.
DB contract via Supabase MCP (rolled-back txns, zero pollution): the Phase-2 checks
plus four Phase-3 checks — remove frees the per-event slot; `purge_media_rows`
decrements `storage_used_bytes` by Σbytes / leaves `storage_ledger` untouched / is
idempotent; the sweep-1 `purge_at` predicate; `create_report` inserts `open` /
cross-event `media_id` → `check_violation` / bad token → `no_data_found`. `get_advisors`
= the expected **6** anon RPC WARNs (`purge_media_rows` stays locked down).

**Live pass on partyreel.com (2026-05-29 — DONE):**

- **Moderation** — guest uploads to a `live` event approve/hide/unhide/remove from the
  host grid; on a `hold_for_approval` event uploads land `pending`, are excluded from the
  public album, and Approve-one + Approve-all both clear the queue. (Gotcha found: the
  event-settings form is **not** auto-save — the moderation-mode toggle only persists
  after clicking **Save changes**.)
- **Lifecycle** — soft-deleting an event stamped `purge_at = deleted_at + 60d` (exact)
  and freed the slot. Back-dated test data + the cron (`Bearer $CRON_SECRET`) returned
  `expired_events {events:1, media_rows:3, r2_deleted:3, freed:66666}`, `removed_media
  {media_rows:2, r2_deleted:2, freed:37271286}`, `orphans:0`. After-state confirmed: the
  expired event + all its media rows gone (the live event untouched), both hosts'
  `storage_used_bytes` decremented to 0, **both `storage_ledger.cumulative_bytes` rows
  UNCHANGED** (66666 / 37271286 — the churn-defense invariant held).
- **Safety** — a report from `/a/[token]` appeared in `/admin`; **Dismiss** resolved it
  with no media change; **Action** set the media `removed` + marked the report `actioned`;
  the queue emptied; a report **never** auto-hid content.

_(Orphan-sweep caveat: a **freshly injected** orphan can't be force-demonstrated — R2/S3
`LastModified` is set on PUT and can't be back-dated, so a new object never clears the
24 h guard; the sweep's parse/match correctness is covered by the `parseMediaIdFromKey`
unit tests instead.)_

## Next action

1. **Deploy Cut 4a** to partyreel.com (the migration is already live — this resyncs the
   app to the new DB), then run a quick live check: a Free host sees the dashboard storage
   gauge (X of 2 GB), the `require_email` toggle is locked with an upgrade hint, and
   `/pricing` shows the GB cards.
2. **Build Cut 4b — Stripe Pro subscriptions** (see [`ROADMAP.md`](ROADMAP.md) "Phase 4").
   Add the `stripe` Node SDK + `assertStripeEnv()`, `src/lib/stripe/{client,plans}.ts`,
   and wire the checkout/portal/**raw-body webhook** (the sole writer of
   `profiles.tier`/`storage_cap_bytes`, via the admin client). Human prereqs (Stripe Pro
   products/prices + env vars + webhook endpoint + Billing Portal) are under "Blocked on a
   human" below. **Start with the standing Context7 doc-check** on the current `stripe`
   Node SDK + Next 16 raw-body route handlers. Cut 4c (Event Pass) follows.

## Blocked on a human ("manual instrument")

**Done:** R2 bucket `partyreel` + creds (`.env.local` + Vercel), R2 CORS
(`ExposeHeaders: ETag`), the abort-incomplete-multipart lifecycle rule, the apex
`partyreel.com` primary domain, and **both Phase-3 prereqs**:

- **`CRON_SECRET`** set in Vercel env + redeployed — the purge cron's bearer.
  `vercel.json` registers the cron (`/api/cron/purge`, `0 4 * * *`) and Vercel Cron
  auto-sends `Authorization: Bearer $CRON_SECRET`.
- **`profiles.is_admin = true`** flipped for the operator account (currently
  `hi@willgibs.com`) via the Supabase SQL editor, so `/admin` is reachable. It's
  service-role-write-only by design (never client-writable). The operator is simply any
  signed-in profile with `is_admin = true`; to move it off a personal email later, flip
  the new account on and the old one off (the new account must have signed in once so its
  `profiles` row exists).

**Upcoming (Phase 4):**

- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) + the 4 Price IDs
  (`STRIPE_PRICE_PRO_100` / `_500` / `_2TB` / `_EVENT_PASS`) + products/prices + webhook
  endpoint registration + Billing Portal config — see [`PRICING.md`](PRICING.md) "Stripe
  dashboard setup".
- **Supabase CLI** not installed locally; migrations are applied via the Supabase
  MCP. For `pnpm db:types` / `db:push`, install the CLI and
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

## Known / accepted

- **`get_advisors` flags the 6 capability-token RPCs** (`get_event_by_qr_token`,
  `get_public_album`, `create_guest`, `create_media`, `get_upload_context`,
  `create_report`) as SECURITY DEFINER executable by `anon` (and `authenticated`) —
  intentional; the token is the auth (ADR-0004). Do **not** revoke EXECUTE. The "Leaked
  Password Protection Disabled" WARN is unrelated (we use magic-link/OAuth, not
  passwords).
- **`purge_media_rows` must stay absent** from that advisor list — it's REVOKED from
  anon/authenticated (service-role only). If it ever shows up, an over-broad grant
  slipped in.
- **`reports` table shows `rls_enabled_no_policy` (INFO) — by design.** RLS is on with
  no policies = deny-all; reports are operator-internal (access only via the
  `create_report` RPC + the service-role admin client). Not a gap to "fix".
- Orphaned R2 objects (presigned + uploaded but `create_media` rejected on a race) are
  accepted; the Phase-3 purge cron sweeps R2 objects >24 h old with no `media` row.

## Open questions (deferred, decide before relevant phase)

- **Tier specifics** (Phase 4): storage model and **prices LOCKED** (2026-05-29) — Free
  2 GB; Pro 100 GB $9/mo, 500 GB $19/mo, 2 TB $39/mo; Event Pass 75 GB $24 one-time
  (~1 yr, ~$15/yr renewal); no watermarks; monthly ingress meter. `require_email` is the
  first tier-gated toggle. Full table + Stripe setup guide: [`PRICING.md`](PRICING.md).
  **The `tiers.ts` / `tier_limits()` / `create_media` rework + consumer updates LANDED in
  Cut 4a** — `tiers.ts` now encodes the storage-cap model. Remaining Phase-4 open item:
  `MONTHLY_INGRESS_BYTES.pro` is still `null` (unmetered) — tune it before Pro launch.
- ~~**Safety**~~ **RESOLVED (2026-05-29):** v1 = a **reports/review MVP** only (public
  report flow + internal operator review at `/admin`; never auto-hide). **No scanner, no
  NSFW filter, no NCMEC/legal-registration prereq** — proactive filtering is **v2+**.
  Built in Phase 3 (PRD "Safety & moderation"). Host access gates (passphrase /
  require-upload-to-view) are deferred to a fast-follow.
- ~~**Retention schema**~~ **RESOLVED (2026-05-29):** the explicit event-delete path uses
  **one `purge_at` timer = `deleted_at + 60d`**; individual media removal uses a separate
  **`removed_at + 7d`** grace. The over-capacity 30-day grace is a Phase-4 account/billing
  state, not a second timestamp here.
- Transcoding pipeline + video poster/thumbnails — Phase 5 (`preview_key` is null for
  now; the gallery renders `<video>` directly).
- Presigned read-URL strategy for very large galleries (per-request presign vs.
  proxy) — currently per-request, 1 h TTL; revisit only if albums get huge.
- Committed, automated RPC integration suite — deferred to pre-launch (needs a paid
  Supabase branch or a local Postgres test DB).
