# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-29
**Current phase:** Phase 4 + the fast-follows + the free-tier 6-month inactivity removal
are **committed + deployed**. Now on **Phase 6 (growth/polish), growth-loop cut** —
**code-complete + locally verified**: branded share pages + a "make your own" growth badge,
marketing SEO (metadataBase/OG images/sitemap/robots + per-event share unfurls), and guest
email capture (post-upload prompt → `guests.email` + a durable `newsletter_signups` list).
**Pending: commit + deploy + live-verify the guest email-capture flow.** **Phase 5
(highlight reel) is deliberately TABLED** pending product research (it defines the core
output, so it shouldn't be rushed). Remaining Phase-6 candidates (onboarding/create wizard,
QR designer, notification center, link analytics) are later cuts.
**Last shipped (deployed):** the fast-follows (Resend `sendOnce`, over-capacity grace +
auto-reduce, Event Pass renewal) + the free-tier 6-month inactivity removal — committed +
deployed to partyreel.com (2026-05-29). Live verification of those flows is still pending
(needs `EMAIL_FROM` set + seeded test data). Earlier the same day: Cut 4c (Event Pass,
one-time `mode:payment` → `checkout.session.completed` → `tier='event_pass'` + 75 GB +
`tier_expires_at`; `expired_passes` sweep downgrades a lapsed pass) and Cut 4b (Pro
subscriptions: upgrade→Pro, portal, cancel→downgrade, bad-signature reject) — both verified
in production.

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
anon RPCs; `/pricing` rendered locally. **Committed + deployed** to partyreel.com.

**Cut 4b (Stripe Pro subscriptions)** is **code-complete + locally verified** (typecheck/
lint/format/test (60)/build clean; `/pricing` renders the 3 Pro checkout buttons). Adds
the `stripe` SDK; `assertStripeEnv()` + 3 `STRIPE_PRICE_PRO_*` env vars;
`src/lib/stripe/{client,plans,provision}.ts` (lazy SDK client pinned to apiVersion
`2026-05-27.dahlia`; price↔plan map; a **pure, unit-tested** `resolveSubscriptionUpdate`);
the checkout/portal/**raw-body webhook** routes (the webhook is the **sole writer** of
`tier`/`storage_cap_bytes` via the admin client, idempotent); pricing CTAs → checkout +
a dashboard **Manage billing** button. **Stripe test resources created via MCP
(2026-05-29):** 3 Pro products + recurring prices — `price_1TcTbgPtjqmVkBwk7qfplvly`
(100 GB/$9), `price_1TcTbtPtjqmVkBwkIT8mPznE` (500 GB/$19), `price_1TcTbwPtjqmVkBwkHQpJuYOr`
(2 TB/$39). The webhook endpoint + Billing Portal were configured in the Stripe dashboard
(the MCP can't create those), and the 5 env values are set in `.env.local` + Vercel.
**VERIFIED in production 2026-05-29** (see "Last shipped" — upgrade→Pro, portal, immediate
cancel→downgrade, bad-signature reject all confirmed live; webhook provisioning checked via
the Supabase MCP). _(Connector was initially LIVE — 3 products created by mistake then
archived, nothing chargeable; now TEST.)_

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

**Ship the Phase-6 growth-loop cut** (code-complete + locally verified: typecheck/lint/
format/**test (75)**/build clean; the `newsletter_signups` migration applied to prod + a
rolled-back `capture_guest_email` RPC check; advisors show the expected new
`newsletter_signups` deny-all INFO + `capture_guest_email` anon WARN; types regenerated).
Verified locally via the preview: `/opengraph-image` + the per-event `/a/[token]` OG card
render (branded), `/sitemap.xml` + `/robots.txt` correct, the share pages carry OG tags +
`robots noindex`, and the album shows the "make your own" growth badge + linkified logo.
What's left:

1. **Commit + deploy** the growth-loop code (Will commits/deploys). No new env var or human
   prereq (uses the existing `NEXT_PUBLIC_SITE_URL` + Resend config).
2. **Live-verify (partyreel.com):** (a) **email capture** — scan an event QR → upload one
   file → the one-time prompt appears → submit email (+opt-in) → confirm `guests.email` set +
   a `newsletter_signups` row (Supabase MCP) → re-upload as the same guest → the prompt does
   NOT reappear; (b) **share unfurl** — paste a `/a/[token]` link into iMessage/Slack → branded
   card + event name, and confirm `noindex` is present (not search-indexed).

Also still pending from the prior cut: **live-verify the fast-follows + inactivity**
(deployed, but needs `EMAIL_FROM` set + seeded test data) — a test email arrives + doesn't
resend; over-cap grace→auto-reduce; renewal nudge + $15 checkout; inactivity warn/remove.
`EMAIL_FROM` format is **`Partyreel <noreply@partyreel.com>`** (no quotes in Vercel).

After this: the remaining Phase-6 candidates, then **Phase 5 (highlight reel)** once its
product/architecture spec is settled (worker platform: managed API vs. Cloudflare Containers).

After this: **Phase 5** (highlight reel) / **Phase 6** (growth).

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

- **Stripe (Cut 4b): DONE in test mode + verified** — products/prices (MCP) + webhook +
  portal (dashboard) + the 5 env vars are all set. The division: the MCP creates
  products/prices; the human does the **webhook endpoint** + **Billing Portal** (dashboard)
  and pastes the env values (the agent can't set Vercel env or read the secret key). Cut 4c
  adds the Event Pass price + `STRIPE_PRICE_EVENT_PASS`.
- **Before launch — go live (test → live):** re-create the Stripe resources in LIVE + swap
  the 5 env values to `sk_live_…`/live `whsec_`/live price IDs (the code needs no changes).
  Full checklist: [`PRICING.md`](PRICING.md) "Test → Live cutover".
- **Supabase CLI** not installed locally; migrations are applied via the Supabase
  MCP. For `pnpm db:types` / `db:push`, install the CLI and
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

## Known / accepted

- **`get_advisors` flags the 7 capability-token RPCs** (`get_event_by_qr_token`,
  `get_public_album`, `create_guest`, `create_media`, `get_upload_context`,
  `create_report`, `capture_guest_email`) as SECURITY DEFINER executable by `anon` (and
  `authenticated`) — intentional; the token is the auth (ADR-0004). Do **not** revoke
  EXECUTE. The "Leaked Password Protection Disabled" WARN is unrelated (we use
  magic-link/OAuth, not passwords).
- **`purge_media_rows` must stay absent** from that advisor list — it's REVOKED from
  anon/authenticated (service-role only). If it ever shows up, an over-broad grant
  slipped in.
- **`reports`, `sent_emails`, and `newsletter_signups` show `rls_enabled_no_policy`
  (INFO) — by design.** RLS is on with no policies = deny-all; they're operator/
  service-role-internal (written only via SECURITY DEFINER RPCs + the admin client). Not a
  gap to "fix".
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
