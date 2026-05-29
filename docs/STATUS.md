# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-29
**Current phase:** Phase 3 — Moderation + lifecycle (next up — not started)
**Last shipped:** Phase 2 — Guest join + upload, **verified in production** (a photo
and a >100 MB video, uploaded from a mobile QR, both landed in the host gallery).

Phases 1 & 2 are verified in production. Canonical domain is **partyreel.com**
(`NEXT_PUBLIC_SITE_URL=https://partyreel.com`); R2 (bucket `partyreel`) is provisioned
with CORS (`ExposeHeaders: ETag`) + an abort-incomplete-multipart lifecycle rule. To
start Phase 3, read its entry in [`ROADMAP.md`](ROADMAP.md) and the "Picking up a
phase" playbook there.

## What exists now

The full guest core loop is built: scan QR → join (no account) → upload photos/
videos → host sees them live + public album renders. `pnpm typecheck`, `lint`,
`format:check`, `test` (34 unit tests), and `build` are all clean (17 routes).
Phase 2 shipped:

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

**Verified:** typecheck/lint/format/test/build clean; 34 unit tests pass. DB contract
via Supabase MCP (rolled-back txn, zero pollution): `get_upload_context` shape correct;
`create_media` records with the right status + rejects cross-event keys;
`get_public_album` returns a proper structure; `get_advisors` = the expected 5 RPC
WARNs. **End-to-end in production:** a photo (single PUT) and a >100 MB video
(multipart) uploaded from a mobile QR both landed in the host gallery.

## Next action

**Start Phase 3 — Moderation + lifecycle:** approve/hide/remove + the
hold-for-approval queue, the soft-delete→purge lifecycle, and the orphaned-R2-object
sweep. Open its entry in [`ROADMAP.md`](ROADMAP.md) (wired-vs-build, gotchas,
done-criteria) and follow the "Picking up a phase" loop there — Context7 doc-check
first, build, test (Vitest + rolled-back Supabase-MCP RPC check), then verify on
partyreel.com. **Decide the soft-delete retention window first** (open question below)
— `purge_at` depends on it.

## Blocked on a human ("manual instrument")

**Done:** R2 bucket `partyreel` + creds (`.env.local` + Vercel), R2 CORS
(`ExposeHeaders: ETag`), the abort-incomplete-multipart lifecycle rule, and the apex
`partyreel.com` primary domain are all set.

**Upcoming:**

- **`CRON_SECRET`** (Vercel env) + a Vercel Cron entry — Phase 3 purge sweeper.
- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) + products/prices +
  webhook registration — Phase 4.
- **Supabase CLI** not installed locally; migrations are applied via the Supabase
  MCP. For `pnpm db:types` / `db:push`, install the CLI and
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

## Known / accepted

- **`get_advisors` flags the 5 capability-token RPCs** (`get_event_by_qr_token`,
  `get_public_album`, `create_guest`, `create_media`, `get_upload_context`) as
  SECURITY DEFINER executable by `anon` (and `authenticated`) — intentional; the
  token is the auth (ADR-0004). Do **not** revoke EXECUTE. The "Leaked Password
  Protection Disabled" WARN is unrelated (we use magic-link/OAuth, not passwords).
- Orphaned R2 objects (presigned + uploaded but `create_media` rejected on a race)
  are accepted; Phase 3 purge should sweep R2 objects with no `media` row.

## Open questions (deferred, decide before relevant phase)

- **Tier specifics** (Phase 4): the storage model is **decided** (total storage caps;
  **Free + Pro with a storage selector + per-event Event Pass**; no watermarks;
  monthly ingress meter — see PRD "Monetization"). Still to set: the exact GB tiers
  and prices, and the free-tier feature gates (candidates: limited QR management, some
  gated event settings). The `tiers.ts` / `tier_limits()` / `create_media` rework
  happens in Phase 4 — `tiers.ts` still encodes the old item-cap model until then.
- **Safety scanning** (before public launch): NSFW = host-optional toggle; CSAM =
  reliably prevented (legal floor; Cloudflare's CSAM Scanning Tool is a candidate
  since media is on R2). Needs a focused legal + cost/tooling pass; a legal-MVP is OK
  at launch, and fuller CSAM coverage may slip to v2 only if not legally required for
  the closely-monitored early rollout.
- **Retention schema** (Phase 3/4): one `purge_at` timer vs. a second timestamp for the
  two-stage (30d grace → 60d hidden) window. Impl detail; policy itself is decided
  (PRD "Data retention & lifecycle", incl. the 6-month free-inactivity trigger).
- Transcoding pipeline + video poster/thumbnails — Phase 5 (`preview_key` is null for
  now; the gallery renders `<video>` directly).
- Presigned read-URL strategy for very large galleries (per-request presign vs.
  proxy) — currently per-request, 1 h TTL; revisit only if albums get huge.
- Committed, automated RPC integration suite — deferred to pre-launch (needs a paid
  Supabase branch or a local Postgres test DB).
