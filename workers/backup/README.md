# partyreel-backup — media-backup Worker (ADR-0013, Pillar B)

Real-time, append-only, **immutable** second copy of all event media. Runs entirely on Cloudflare
(zero egress, off Vercel). This package is **deployed separately from the Next app** via `wrangler`;
it is excluded from the app's `tsc`/`eslint`/`vitest` (see root `tsconfig.json` / `eslint.config.mjs`).

> Status: the backup copy is **live + DR-drill-verified** (results below). The deletion-aware prune is
> the newest addition; it ships in **dry-run** (deletes nothing), needs a redeploy + the step-7 secret,
> then a human flips `PRUNE_MODE` to live post-launch.

## How it works

- **`queue()`** consumes R2 `object-create` event notifications (filtered to the `events/` prefix) and
  copies each new object `PRIMARY → BACKUP` within seconds. Small objects (≤ 100 MB) stream straight
  through; larger ones (videos up to ~5 GB) use the R2 multipart binding API (`src/strategy.ts`).
- **`scheduled()`** runs two crons (it branches on `controller.cron`): a **daily reconciliation** (copy
  any `events/` object missing from BACKUP — the backstop for missed/failed events **and the one-time
  initial seed**), and a **weekly deletion-aware prune** (see "Deletion-aware prune" below).
- **Idempotent:** every copy does `BACKUP.head(key)` first and skips if present. Safe because media
  keys are write-once AND the Bucket Lock forbids overwriting a locked object.
- **Avatars are excluded** (the `events/` prefix filter): they overwrite-in-place (conflicts with the
  lock) and are derivable. (They move to Supabase Storage in a separate initiative — ADR-0013.)

## Bindings (wrangler.jsonc)

- `PRIMARY` → `partyreel` (source), `BACKUP` → `partyreel-backup` (destination). Native R2 bindings —
  **no S3 credentials in the Worker.**

## One-time human setup (needs Cloudflare auth; the R2 MCP can't do locks/lifecycle/queues/workers)

```bash
# 0. Workers Paid plan must be active on the P3 account (Queues requires it, ~$5/mo) — billing step, do first.
#    Then authenticate once: `wrangler login` (browser OAuth) — no API key needs to be shared anywhere.

# 1. Backup bucket: a DIFFERENT region than primary (ENAM) + Infrequent Access default.
wrangler r2 bucket create partyreel-backup --location wnam --storage-class InfrequentAccess

# 2. Immutability: a 35-day Bucket Lock on ALL objects (WORM). Finite (NOT indefinite) so the
#    deletion-aware prune can bound storage. The `""` positional = all prefixes.
wrangler r2 bucket lock add partyreel-backup dr-window "" --retention-days 35 --force

# 3. Housekeeping ONLY: abort incomplete multipart uploads after 7d. Do NOT add a blanket object-expiry
#    rule — age-from-creation expiry would drop backups of STILL-LIVE media. Storage is bounded by the
#    deletion-aware prune instead (delete a backup object once its source is gone AND it's past the lock).
wrangler r2 bucket lifecycle add partyreel-backup abort-incomplete-mpu "" --abort-multipart-days 7 --force

# 4. Queues: consumer + dead-letter (must exist BEFORE deploy — wrangler.jsonc references them).
wrangler queues create partyreel-backup
wrangler queues create partyreel-backup-dlq

# 5. Install + validate + deploy the Worker (the consumer must exist before we point events at it).
npm install
npm run typecheck && npm test && npm run dry-run
wrangler deploy

# 6. Subscribe primary's object-create events (events/ only) to the queue.
wrangler r2 bucket notification create partyreel \
  --event-types object-create --queue partyreel-backup --prefix events/

# 7. Deletion-aware prune secret (ADR-0013): a shared bearer token the weekly prune sends to the app's
#    confirm endpoint. Set the SAME random value in Vercel (PRUNE_API_SECRET) and here. The prune ships
#    in dry-run (PRUNE_MODE=dryrun in wrangler.jsonc), so it deletes nothing until a human flips it live.
wrangler secret put PRUNE_API_SECRET
```

App/Vercel env: set `PRUNE_API_SECRET` (the SAME value as step 7) so the prune's confirm endpoint can
authenticate; no other app env changes. (Optional later: a GitHub Action to auto-deploy this dir on change.)

## Live DR drill — results (verified 2026-06-06; deployed to the P3 account)

- ✅ **Real-time replication:** a test object written to `partyreel/events/...` appeared in `partyreel-backup`
  (IA) in **~15 s**, byte-identical.
- ✅ **Immutability:** deleting the object from `partyreel-backup` does NOT remove it — the 35-day Bucket Lock
  holds. ⚠️ **Ops gotcha:** `wrangler r2 object delete` prints `Delete complete` and exits 0 on a locked object
  even though the delete is a server-side no-op. **Verify lock protection by READING the object back, never by
  trusting the delete command's output.**
- ✅ **Loss + restore:** deleted the object from `partyreel` (gone) → restored from backup (`get` backup → `put`
  primary) → present + intact. RPO ≈ seconds (real-time) / daily (reconciliation backstop); RTO = a copy back.
- ✅ **Multipart (> 100 MB) path:** verified — a 130 MB object copied **byte-identical** via
  `createMultipartUpload` + ranged `get` + `uploadPart` (~160 s incl. the queue batch + 32 MB-part copy;
  vs. ~15 s for a small object, as expected).

Re-run the basics: `wrangler r2 object put partyreel/events/_drill/x --file <f> --remote` then poll
`wrangler r2 object get partyreel-backup/events/_drill/x --remote`.

## Deletion-aware prune (ADR-0013) — the weekly cron

The backup is **keep-all by design**: when media leaves the primary (host delete -> 30-day recovery ->
the app's purge cron hard-deletes the primary object + row), the backup copy stays. The prune bounds that
growth by reclaiming a backup object once its source is gone. It is the INVERSE of reconcile and the
**single most dangerous job here, the only one that deletes from the last-resort backup**, so it is
layered defense-in-depth:

- **Dry-run by default.** `PRUNE_MODE` (a `vars` entry, default `"dryrun"`) gates deletes: the prune runs
  the full pipeline and logs what it WOULD delete, but deletes nothing until a human sets it to `"live"`
  and redeploys. Flip to live only post-launch, once the primary is populated.
- **Dual existence check.** An object is pruned only when BOTH (a) its `media` row is gone (the app's
  `PRUNE_API_URL` confirm endpoint, the authoritative oracle) AND (b) its primary R2 object is absent (a
  HEAD against PRIMARY). Either source alone says "keep".
- **Circuit-breaker (app-side).** If the `media` table is empty while candidates exist, the confirm
  endpoint trips `media_table_empty`: it deletes nothing and alerts an operator (Sentry + a deduped
  email). Fails CLOSED, exactly the pre-launch 0-row state, which is why dry-run is also the default.
- **Age gate + Bucket Lock.** The prune only considers objects older than 36 days (one day past the
  35-day lock); the lock physically refuses deleting anything younger even if the logic is wrong. (A
  still-locked delete is a silent no-op, so the age gate is the correctness gate, not the lock.)
- **Per-run cap.** At most `PRUNE_DELETE_CAP_PER_RUN` (500) deletions per weekly run, so any single run
  is bounded; a legitimate backlog drains over several runs.

**Flip to live (post-launch):** set `"PRUNE_MODE": "live"` in `wrangler.jsonc`, then `wrangler deploy`.

**Verify:**
- *Now (dry-run):* after deploy, the Monday 06:00 UTC run logs to Cloudflare (`wrangler tail` or the
  dashboard). While the primary/`media` are empty it logs the empty-skip or trips the breaker (and emails
  the operator); it never deletes. Force a run immediately with `wrangler dev --test-scheduled` then
  `curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+6+*+*+1"` (set `PRUNE_API_SECRET` in `.dev.vars`).
- *Post-launch (destructive drill):* with `media` populated and `PRUNE_MODE=live`, delete a known media's
  primary object + row, wait past the 36-day window, run the prune, confirm the backup copy is removed and
  a <36-day object is not (the lock holds).

## Local checks

```bash
npm run typecheck   # tsc against @cloudflare/workers-types
npm test            # vitest — pure strategy helpers
npm run dry-run     # wrangler build (no deploy, no auth)
```
