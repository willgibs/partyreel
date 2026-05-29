# Partyreel — Status

> **First file to read each session.** Short and frequently updated: where we
> are, what's done, what's next, and what's blocked on a human.

**Updated:** 2026-05-29
**Current phase:** Phase 2 — Guest join + upload (code complete; the browser→R2
round-trip is blocked on human R2 setup — see below)
**Next phase:** Phase 3 — Moderation + lifecycle

Phase 1 is verified in production (magic-link + Google both reach the dashboard;
a created event's QR opens the guest page). Canonical domain is now
**partyreel.com** (`NEXT_PUBLIC_SITE_URL=https://partyreel.com`).

## What exists now

The full guest core loop is built: scan QR → join (no account) → upload photos/
videos → host sees them live + public album renders. `pnpm typecheck`, `lint`,
`format:check`, `test` (34 unit tests), and `build` are all clean (17 routes).
This phase:

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

**Verified:** typecheck/lint/format/test/build clean. DB contract via Supabase MCP
(rolled-back txn, zero pollution): `get_upload_context` shape correct; `create_media`
records with the right status + rejects cross-event keys; `get_public_album` returns
a proper structure; `get_advisors` = the expected 5 RPC WARNs. The guest join page
renders and hydrates cleanly against the live test event. **Not yet verified** (needs
R2 below): the actual browser→R2 upload, gallery/album image rendering, and cap behavior.

## Next action

**Provision R2 (human, below), then run the upload round-trip** on partyreel.com:
scan an event QR → join → upload a photo (single PUT) and a >100 MB video (multipart);
confirm the object lands, a `media` row appears with the right status, and both
galleries render. Then start Phase 3 (moderation: approve/hide/remove + the
hold-for-approval queue; the purge cron incl. orphaned-R2-object cleanup). Run the
per-phase Context7 doc check first.

## Blocked on a human ("manual instrument")

**To finish Phase 2 verification:**

- **Cloudflare R2:** create a **private** bucket; set `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` in `.env.local` **and** Vercel.
- **R2 bucket CORS:** allow `PUT, POST, GET, HEAD` + the `content-type` request
  header, and **`ExposeHeaders: ["ETag"]`** (multipart completion reads per-part
  ETags from the browser — without this it silently fails).
- **R2 lifecycle rule:** abort incomplete multipart uploads after ~1 day.
- **Vercel domains (optional polish):** make `partyreel.com` the primary so `www`
  redirects to it (today the apex 307s to `www`), for hop-free QR scans.

**For later phases:**

- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) — Phase 4.
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

- NSFW / safety scanning service (Rekognition vs Vision SafeSearch vs OSS) —
  before public launch.
- Transcoding pipeline + video poster/thumbnails — Phase 5 (`preview_key` is null
  for now; the gallery renders `<video>` directly).
- Presigned read-URL strategy for very large galleries (per-request presign vs.
  proxy) — currently per-request, 1 h TTL; revisit only if albums get huge.
- Whether to add an inactivity-based purge for free events (currently none).
- Committed, automated RPC integration suite — deferred to pre-launch (needs a
  paid Supabase branch or a local Postgres test DB).
