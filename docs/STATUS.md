# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-29
**Current phase:** Phase 3 — Moderation + lifecycle + safety (**built**; pending
partyreel.com verification + 2 human prereqs — see "Blocked on a human").
**Last shipped:** Phase 2 — Guest join + upload, **verified in production** (a photo
and a >100 MB video, uploaded from a mobile QR, both landed in the host gallery).

Phases 1 & 2 are verified in production; Phase 3 is **code-complete and locally/DB
verified** but not yet exercised on the live site. Canonical domain is **partyreel.com**
(`NEXT_PUBLIC_SITE_URL=https://partyreel.com`); R2 (bucket `partyreel`) is provisioned
with CORS (`ExposeHeaders: ETag`) + an abort-incomplete-multipart lifecycle rule.

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

Phase 3 (**built; pending live verification**) adds:

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
= the expected **6** anon RPC WARNs (`purge_media_rows` stays locked down). **Pending:**
the partyreel.com pass for Phase 3 (moderation, the cron against back-dated data, and
the report→review loop) — needs the two human prereqs below.

## Next action

**Verify Phase 3 on partyreel.com**, then start Phase 4. Phase 3 is code-complete and
locally/DB-verified; the live pass is blocked only on the two human prereqs below
(`CRON_SECRET` + flipping `is_admin`). The live pass (see ROADMAP "Phase 3 → Done
when"): as host, approve/hide/unhide/remove + the pending queue; delete an event and
confirm `purge_at` ≈ 60 d out, then invoke the cron with the bearer against back-dated
test data (`curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/purge`) and confirm
R2 objects + rows are reclaimed, `storage_used_bytes` decremented, `storage_ledger`
untouched, and an injected orphan swept; submit a report from `/a/[token]`, see it in
`/admin`, and confirm dismiss + action both work (and that a report does **not**
auto-hide). Then pick up **Phase 4 — Payments/tiers** in [`ROADMAP.md`](ROADMAP.md).

## Blocked on a human ("manual instrument")

**Done:** R2 bucket `partyreel` + creds (`.env.local` + Vercel), R2 CORS
(`ExposeHeaders: ETag`), the abort-incomplete-multipart lifecycle rule, and the apex
`partyreel.com` primary domain are all set.

**Upcoming (the two Phase-3 prereqs are first):**

- **`CRON_SECRET`** in Vercel env — the purge cron's bearer. `vercel.json` already
  registers the cron (`/api/cron/purge`, `0 4 * * *`); Vercel Cron auto-sends
  `Authorization: Bearer $CRON_SECRET`. Set the var, then confirm the cron is picked up
  after the next deploy. (Until set, `assertCronEnv()` makes the route 401/throw — the
  app still builds without it.)
- **Flip `profiles.is_admin = true`** for the operator account (one-time, via Supabase
  MCP `execute_sql`) so `/admin` (the report review surface) is reachable. It's
  service-role-write-only by design — never client-writable.
- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) + products/prices +
  webhook registration — Phase 4.
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
  first tier-gated toggle. Full table + shaped target `tiers.ts` + Stripe setup guide:
  [`PRICING.md`](PRICING.md). The `tiers.ts` / `tier_limits()` / `create_media` rework
  and consumer updates land in Phase 4 — `tiers.ts` still encodes the old item-cap model
  until then.
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
