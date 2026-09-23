# Durability & backups

> ROLE: how media bytes + DB rows survive a fault, and the safety on the orphan sweep — the mechanics behind the [architecture.md](architecture.md) overview.
> BELONGS HERE: the orphan-sweep circuit-breaker, the media-backup Worker (Queue/DLQ/reconciliation), the DB backup Action, the restore (DR) procedure, the failure-points table, the cost gotcha. · NOT HERE: the high-level data-flow picture (→ [architecture.md](architecture.md)), the lifecycle sweeps themselves (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## What it does

Two stores of truth, each with a **backup shadow**, all running OFF the app (Cloudflare + GitHub Actions),
so a backup failure is a durability risk, **never a user-facing outage**. ALL user media sits in ONE
primary R2 bucket with NO native versioning or replication (R2 has neither), so the safety here is
load-bearing: without it the daily orphan sweep could wipe the bucket on a DB-loss event.

## Where it lives

- Pillar A (breaker): [`r2/orphan-guard.ts`](../../src/lib/r2/orphan-guard.ts) (`evaluateOrphanSweep`),
  wired into `sweepOrphans` in [`/api/cron/purge`](../../src/app/api/cron/purge/route.ts).
- Pillar B (media backup): [`workers/backup/`](../../workers/backup) — a Cloudflare Worker + Queue + DLQ.
  The weekly **deletion-aware prune** is the `prune` branch of its `scheduled()` +
  [`prune-strategy.ts`](../../workers/backup/src/prune-strategy.ts), with the app-side breaker
  [`r2/prune-guard.ts`](../../src/lib/r2/prune-guard.ts) (`evaluatePrune`) behind the confirm endpoint
  [`/api/internal/backup-prune`](../../src/app/api/internal/backup-prune/route.ts).
- Pillar C (DB backup): [`.github/workflows/db-backup.yml`](../../.github/workflows/db-backup.yml).

## Pillar A — orphan-sweep circuit-breaker

The orphan sweep (delete R2 objects that have no `media` row) is guarded by `evaluateOrphanSweep`: it
deletes NOTHING and alerts (Sentry + a deduped operator email) when the `media` table is empty OR the
orphan set exceeds an absolute (1000) or fractional (25% of objects scanned, once ≥50 are scanned) cap.
So a DB fault (bad migration, snapshot restore, mass delete, RLS/query bug) can't let one run wipe the
bucket. Each run lists at most 20 pages (`ORPHAN_PAGE_CAP`, about 20,000 objects) from the HEAD of the
bucket and considers only objects older than 24 h (`ORPHAN_MIN_AGE_HOURS`), so past the cap it never
examines the tail (the ROADMAP's pagination-cursor task). Pre-launch the `media` table holds a small set of disposable test rows, so the empty-table breaker
arms whenever a test reset empties it: reclaim intentional orphans via a force-purge path, not the
guarded cron.

## Pillar B — real-time media backup (Worker → locked 2nd bucket)

Live path: a PUT to PRIMARY R2 (`events/…`) fires an `object-created` notification → Cloudflare **Queue**
→ the consumer **Worker** (`partyreel-backup`) copies the object → BACKUP R2 (`partyreel-backup`, WNAM, IA,
**Bucket Lock** ≥ 35-day WORM). A failed copy retries → **DLQ**. A daily **05:00 UTC reconciliation** (the
Worker's `scheduled()`) re-copies anything the live path missed. **The reconcile examines at most 5,000
objects per run (`RECONCILE_MAX_PER_RUN`), always from the START of the listing**, so once the primary
holds more than 5,000 `events/` objects the keys past the first 5,000 are never re-checked (its "next run
continues" log line is false; a capped run reports `capped: true` in its heartbeat; the ROADMAP's
pagination-cursor task). **Avatars are not in this R2 backup by design**: they
live in the public Supabase Storage `avatars` bucket (derivable, and overwrite-in-place would conflict
with the lock). Workers Paid ~$5/mo, zero egress, off Vercel. DR-drilled: ~15 s
replication, the lock blocks deletion, and a >100 MB multipart copy restores byte-identical.

## Pillar C — off-site DB backup

Supabase Pro daily backup (7-day, same-vendor) **plus** a nightly off-site `pg_dump` →
`partyreel-backup/db/` (the GitHub Action: longer retention; survives a whole-Supabase-account loss),
with a post-upload byte-size verify and `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`. Restore-verified. No PITR
($100–400/mo).

## Restore (DR)

Rows ← Supabase backup OR the `db/` dump; bytes ← copy `partyreel-backup` → `partyreel`. **A full restore
needs BOTH halves.**

The objectives this buys: media RPO is **seconds** on the live event path with the daily reconciliation as
the backstop, DB RPO is **≤24 h**; RTO is a bucket-to-bucket copy at free in-region egress, minutes at
today's size and hours at scale. Pillar A protects the objects during any window where the rows are
transiently wrong, which is exactly when a restore is in progress.

## Invariants / gotchas (why it's like this — don't revert)

- **The circuit-breaker is the one thing standing between a DB fault and an irreversible bucket wipe.** Keep
  its empty-table + absolute/fractional caps; never "simplify" the orphan sweep to delete unconditionally.
- **Bucket Lock = WORM.** The backup copy is keep-all + immutable for 35 days; the lifecycle purge does NOT
  touch it. The **deletion-aware prune is the ONE sanctioned backup-delete path** (dual-gated + breaker +
  36-day age gate + dry-run, below); never add another.
- **There is NO Docker in production.** The "Worker" is a Cloudflare edge function; Docker exists only
  inside the GitHub runner (to run `supabase db dump`).
- **R2 cost GOTCHA:** the R2 *overview* page's "Billable usage" donut is a FORECAST ARTIFACT that can show a
  scary number (~$9.92 with near-zero real usage, by rounding Class A up to its $9/million list rate). The
  authoritative truth is **Billing → Billable usage** ($0.00 total + projected). A **$10 usage budget
  alert** (→ partyr33l@gmail.com) guards against a real runaway. R2 is ~$0 at this scale (free tier: 10 GB
  / 1M Class A / 10M Class B per month; ~$0.01/GB-month beyond); R2↔R2 egress is free.

## New failure points (all degrade a BACKUP, never the live app)

| Failure | Containment |
| --- | --- |
| Worker error / queue backlog | auto-retries → DLQ; the daily reconciliation backstop; the backlog and the DLQ depth are REPORTED (below) |
| Objects stuck in the DLQ | every Worker run reads the depth; any dead letter reads as FAILED on `/admin/jobs` and raises `job_dead_letters_pending`; the next reconcile copies them |
| Missed R2 event notification | the next reconcile re-copies it, within the per-run scan cap (below) |
| GitHub DB-backup fails | the run fails loudly + the post-upload byte-size verify, and its heartbeat closes with `always()` so a failure shows as FAILED on `/admin/jobs` rather than as a silence; a run that stops firing altogether trips the missed-run alert |
| DB-password / secret drift | the backup breaks until the secret updates (the app uses separate Supabase API keys, unaffected) |
| Avatars not in the R2 WORM backup | by design: on Supabase Storage (bytes ride Supabase infra durability, metadata in pg_dump); derivable, so no WORM tier needed |
| Prune breaker tripped / source looks empty | deletes nothing, alerts (Sentry + deduped email); dry-run, the 36-day age gate and the 35-day lock are independent backstops |

Every pillar meets the zero-silent-failure rule: the reconcile, the prune and the DB backup each carry a
kill switch and a heartbeat, and a missing run raises a Sentry event. The model + the per-job
fail-open/fail-closed postures live in [admin-observability.md](admin-observability.md) "Backend jobs".

★ **The Worker reports the QUEUE and DEAD-LETTER depths on every scheduled run**
([`queue-metrics.ts`](../../workers/backup/src/queue-metrics.ts)), through `Queue.metrics()` on two
producer bindings it never sends to (`BACKUP_QUEUE`, `BACKUP_DLQ` in `wrangler.jsonc`): a dead letter is a
media object with NO backup copy until a reconcile catches it. The numbers ride the heartbeat's free-form
`counts` under `queue_backlog` / `dead_letter_backlog` (+ `_oldest_min`), which the app's pure catalog
names for the reader; the strings are pinned by a test on BOTH sides, since the packages cannot import
each other. The bindings are OPTIONAL in `Env` and every read is guarded: a metrics call must never cost a
backup run, and an unreadable queue reports NO key rather than a zero.
→ [admin-observability.md](admin-observability.md).

★ **The two Worker jobs report through the APP, on a URL DERIVED from `PRUNE_API_URL`** (its sibling
path, [`job-heartbeat.ts`](../../workers/backup/src/job-heartbeat.ts)): a Worker cannot reach the
database, and deriving the URL means no new var to deploy, no second secret to rotate, and no way for
the two endpoints to drift onto different environments. Their postures are OPPOSITE on an unreachable
heartbeat, on purpose: the **reconcile runs anyway** (a missing backup copy beats a missing log line),
the **prune skips** (it is the only job that deletes from the last-resort copy, and it refuses to act on
any unanswered question). If the endpoints ever stop being siblings, add a `JOB_API_URL` var rather than
reshaping the derivation.

## Deletion-aware backup prune (BUILT — ships in dry-run)

The backup is **keep-all**: never an age-based "expire after N days" rule, which would delete backups of
media still LIVE in the primary. So the backup is **accrue-only**: when media leaves the primary
(guest/host delete, the purge cron, the orphan sweep), its backup copy stays, and backup storage climbs as
media churns. The prune bounds that growth. It is the **inverse of the orphan sweep** and the **single most
dangerous job in the system, the ONLY job that DELETES from the backup (the last-resort copy)**, so it is
layered defense-in-depth:

- **Dual existence check (the oracle).** A backup object is reclaimed only when **BOTH** independent sources
  agree it is gone: (a) its **`media` row is gone** (the authoritative oracle, via the app's confirm
  endpoint) AND (b) its **primary R2 object is absent** (a HEAD against PRIMARY). Either source alone says
  "keep", so no single-source fault (a lost primary object with the row intact, OR partial row loss with the
  objects intact) can wrongly prune. **NOT an age rule.**
- **DB-first ordering (the cost shape).** The Worker lists BACKUP, age/key-filters, then POSTs the candidate
  mediaIds to the app, which row-confirms them; the Worker HEADs the primary ONLY for the confirmed-gone set.
  So there is no per-live-object HEAD: the per-run cost is a bucket LIST + batched DB lookups, ~$0 into
  tens of millions of objects. If that ever costs real money: a streaming merge-join of the two listings,
  then a deletion-driven tombstone (O(churn), not O(size)) or a shared copy-state KV/D1 index for
  prune + reconcile.
- **Circuit-breaker (app-side, `evaluatePrune`).** Mirrors the orphan sweep's `media_table_empty` fail-closed
  guard: if the `media` table is empty while candidates exist, the confirm endpoint deletes nothing and
  alerts (Sentry + a deduped operator email). The orphan sweep's **`fraction_cap` is deliberately
  OMITTED**: for an accrue-only backup the "source gone" fraction is legitimately large and growing, so it
  would mis-fire; per-run volume is bounded by a **clamp** instead (`PRUNE_DELETE_CAP_PER_RUN` = 500,
  enforced Worker-side across batches), never a trip.
- **Age gate + the 35-day Bucket Lock.** The prune only considers objects older than **36 days** (one day
  past the lock); the lock is the physical backstop (it blocks deleting anything younger even if the logic is
  buggy). A still-locked delete is a **silent no-op that returns success**, so the age gate is the
  *correctness* gate, not the lock.
- **Dry-run by default.** `PRUNE_MODE` (a Worker `var`, default `"dryrun"`) runs the full pipeline and logs
  what it WOULD delete, but deletes nothing until a human flips it to `"live"` + redeploys post-launch (a
  launch switch). This, the breaker and an empty-primary early-out are three independent guards against
  **THE LANDMINE: pre-launch the primary is near-empty, so a naive run would delete the ENTIRE backup.**

Cadence: a **weekly** Worker cron (`0 6 * * 1`, after the daily 04:00 purge + 05:00 reconcile). Breaker
trips page, and each run writes a `job_runs` heartbeat visible on `/admin/jobs` (scanned, gone media,
would-delete count, mode), with its own kill switch. Flipping to live also lifts the pre-launch test-data
reset's "≥35 d before launch" timing constraint. Shared secret: `PRUNE_API_SECRET` (Worker + Vercel).

## See also

[architecture.md](architecture.md) (the overview) · [lifecycle-recovery.md](lifecycle-recovery.md) (the cron that runs the guarded sweep) · [admin-observability.md](admin-observability.md) (the jobs console).
