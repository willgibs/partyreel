# partyreel-backup — media-backup Worker (ADR-0013, Pillar B)

Real-time, append-only, **immutable** second copy of all event media. Runs entirely on Cloudflare
(zero egress, off Vercel). This package is **deployed separately from the Next app** via `wrangler`;
it is excluded from the app's `tsc`/`eslint`/`vitest` (see root `tsconfig.json` / `eslint.config.mjs`).

> Status: **code authored + locally validated** (typecheck, unit tests, `wrangler deploy --dry-run`).
> NOT yet deployed — the human runs the setup below, then we run the live drill together.

## How it works

- **`queue()`** consumes R2 `object-create` event notifications (filtered to the `events/` prefix) and
  copies each new object `PRIMARY → BACKUP` within seconds. Small objects (≤ 100 MB) stream straight
  through; larger ones (videos up to ~5 GB) use the R2 multipart binding API (`src/strategy.ts`).
- **`scheduled()`** runs a daily reconciliation sweep: copy any `events/` object missing from BACKUP —
  the backstop for missed/failed events **and the one-time initial seed** of pre-existing objects.
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

# 2. Immutability: a 35-day Bucket Lock on ALL objects (WORM). Finite (NOT indefinite) so a future
#    deletion-aware prune can bound storage. The `""` positional = all prefixes.
wrangler r2 bucket lock add partyreel-backup dr-window "" --retention-days 35 --force

# 3. Housekeeping ONLY: abort incomplete multipart uploads after 7d. Do NOT add a blanket object-expiry
#    rule — age-from-creation expiry would drop backups of STILL-LIVE media. Storage is bounded later by
#    a deletion-aware prune (delete a backup object once its primary copy is gone AND it's past the lock).
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
```

No app/Vercel env changes. (Optional later: a GitHub Action to auto-deploy this dir on change.)
Storage model: keep-all for now (safe + cheap at current scale); add the deletion-aware prune when storage grows.

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

## Local checks

```bash
npm run typecheck   # tsc against @cloudflare/workers-types
npm test            # vitest — pure strategy helpers
npm run dry-run     # wrangler build (no deploy, no auth)
```
