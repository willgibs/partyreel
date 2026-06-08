# Durability & backups (ADR-0013)

> ROLE: how media bytes + DB rows survive a fault, and the safety on the orphan sweep — the mechanics behind the [architecture.md](architecture.md) overview.
> BELONGS HERE: the orphan-sweep circuit-breaker, the media-backup Worker (Queue/DLQ/reconciliation), the DB backup Action, the restore (DR) procedure, the failure-points table, the cost gotcha. · NOT HERE: the high-level data-flow picture (→ [architecture.md](architecture.md)), the lifecycle sweeps themselves (→ [lifecycle-recovery.md](lifecycle-recovery.md)).
> GROWS BY: integrate-in-place.

## What it does

Two stores of truth, each with a **backup shadow**, all running OFF the app (Cloudflare + GitHub Actions),
so a backup failure is a durability risk, **never a user-facing outage**. All three pillars are LIVE +
verified. ALL user media sits in ONE primary R2 bucket with NO native versioning/replication (R2 has
neither), so the safety here is load-bearing: the daily orphan sweep could otherwise wipe the bucket on a
DB-loss event.

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
orphan set exceeds an absolute (1000) / fractional (25% of objects scanned) cap. So a DB fault (bad
migration, snapshot restore, mass delete, RLS/query bug) can't let one run wipe the bucket.
**Note:** `media` is currently empty pre-launch, so the breaker is protectively ACTIVE — reclaim
intentional orphans via a force-purge path, not the guarded cron.

## Pillar B — real-time media backup (Worker → locked 2nd bucket)

Live path: a PUT to PRIMARY R2 (`events/…`) fires an `object-created` notification → Cloudflare **Queue**
→ the consumer **Worker** (`partyreel-backup`) copies the object → BACKUP R2 (`partyreel-backup`, WNAM, IA,
**Bucket Lock** ≥ 35-day WORM). A failed copy retries → **DLQ**. A daily **05:00 UTC reconciliation** (the
Worker's `scheduled()`) re-copies anything the live path missed (and was the one-time seed). **Avatars are
not in this R2 backup by design** — they now live in the public Supabase Storage `avatars` bucket (derivable,
and overwrite-in-place would conflict with the lock anyway). Workers Paid ~$5/mo, zero egress, off Vercel; a Backblaze B2
cross-vendor tier is a later add. DR-drill-verified (2026-06-06: ~15 s replication; the lock blocks
deletion; restore works; >100 MB multipart copy byte-identical).

## Pillar C — off-site DB backup

Supabase Pro daily backup (7-day, same-vendor) **plus** a nightly off-site `pg_dump` →
`partyreel-backup/db/` (the GitHub Action — longer retention; survives a whole-Supabase-account loss),
hardened with a post-upload byte-size verify + a Node-24 opt-in. Restore-verified 2026-06-07. PITR is
deferred ($100–400/mo).

## Restore (DR)

Rows ← Supabase backup OR the `db/` dump; bytes ← copy `partyreel-backup` → `partyreel`. **A full restore
needs BOTH halves.**

## Invariants / gotchas (why it's like this — don't revert)

- **The circuit-breaker is the one thing standing between a DB fault and an irreversible bucket wipe.** Keep
  its empty-table + absolute/fractional caps; do not "simplify" the orphan sweep to delete unconditionally.
- **Bucket Lock = WORM.** The backup copy is keep-all + immutable for 35 days; the lifecycle purge does NOT
  touch it. The **deletion-aware prune is the ONE sanctioned backup-delete path** (dual-gated + breaker +
  36-day age gate + dry-run — see its section below); don't add any other.
- **There is NO Docker in production.** The "Worker" is a Cloudflare edge function; Docker only exists inside
  the GitHub runner (to run `supabase db dump`) and was a local-only detail of the restore-test.
- **R2 cost GOTCHA:** the R2 *overview* page's "Billable usage" donut is a FORECAST ARTIFACT that can show a
  scary number (~$9.92 observed with near-zero real usage, by rounding Class A up to its $9/million list
  rate). The authoritative truth is **Billing → Billable usage** ($0.00 total + projected). A **$10 usage
  budget alert** (→ partyr33l@gmail.com) guards against a real runaway. R2 is ~$0 at this scale (free tier:
  10 GB / 1M Class A / 10M Class B per month; ~$0.01/GB-month beyond); R2↔R2 egress is free.

## New failure points (all degrade a BACKUP, never the live app)

| Failure | Containment |
| --- | --- |
| Worker error / queue backlog | auto-retries → DLQ; the daily reconciliation backstop |
| Missed R2 event notification | reconciliation re-copies within 24 h |
| GitHub DB-backup fails | run fails loudly + post-upload byte-size verify; **but a _persistent_ failure is only as visible as the Actions tab → this is exactly what admin-portal P8 (observability) targets** |
| DB-password / secret drift | the backup breaks until the secret updates (the app uses separate Supabase API keys, unaffected) |
| Avatars not in the R2 WORM backup | by design — on Supabase Storage (bytes ride Supabase infra durability, metadata in pg_dump); derivable, so no WORM tier needed |
| Prune breaker tripped / source looks empty | deletes nothing, alerts (Sentry + deduped email); dry-run + the 36-day lock are independent backstops |

The zero-silent-failure mandate (every backend job must be manageable + health-visible from `/admin`) is
admin-portal **P8** → [admin-observability.md](admin-observability.md) + [`../ROADMAP.md`](../ROADMAP.md).

## Deletion-aware backup prune (BUILT — ships in dry-run)

The backup is **keep-all by design**: an age-based "expire after N days" rule was REJECTED because it would
delete backups of media that is still LIVE in the primary. So the backup is **accrue-only** — when media
leaves the primary (guest/host delete, the purge cron, the orphan sweep), the primary object disappears but
its backup copy stays, so backup storage climbs as media churns (primary `partyreel` ~0 B pre-launch, backup
`partyreel-backup` ~136 MB). The prune bounds that growth. It is the **inverse of the orphan sweep** and the
**single most dangerous job in the system — the ONLY job that DELETES from the backup (the last-resort
copy)** — so it is layered defense-in-depth:

- **Dual existence check (the oracle).** A backup object is reclaimed only when **BOTH** independent sources
  agree it is gone: (a) its **`media` row is gone** (the authoritative oracle, via the app's confirm
  endpoint) AND (b) its **primary R2 object is absent** (a HEAD against PRIMARY). Either source alone says
  "keep", so no single-source fault (a lost primary object with the row intact, OR partial row loss with the
  objects intact) can wrongly prune. **NOT an age rule.**
- **DB-first ordering (the cost shape).** The Worker lists BACKUP, age/key-filters, then POSTs the candidate
  mediaIds to the app, which row-confirms them; the Worker HEADs the primary ONLY for the confirmed-gone set.
  So there is no per-live-object HEAD: the repeated per-run cost is a bucket LIST + batched DB lookups (free
  / already-paid), ~$0 into tens of millions of objects. Upgrade ladder if that ever costs real money: a
  streaming merge-join of the two listings, then a deletion-driven tombstone (O(churn) not O(size)) / a
  shared copy-state KV/D1 index for prune+reconcile (the reconcile sweep carries the same scan-cost note).
- **Circuit-breaker (app-side, `evaluatePrune`).** Mirrors the orphan sweep's `media_table_empty` fail-closed
  guard: if the `media` table is empty while candidates exist, the confirm endpoint deletes nothing and
  alerts (Sentry + a deduped operator email, like the orphan breaker). The orphan sweep's **`fraction_cap` is
  deliberately OMITTED** — for an accrue-only backup the "source gone" fraction is legitimately large and
  growing, so it would mis-fire; per-run volume is instead bounded by a **clamp** (`PRUNE_DELETE_CAP_PER_RUN`
  = 500, enforced Worker-side across batches), never a trip.
- **Age gate + the 35-day Bucket Lock.** The prune only considers objects older than **36 days** (one day
  past the lock); the lock is the physical backstop (it blocks deleting anything younger even if the logic is
  buggy). A still-locked delete is a **silent no-op that returns success**, so the age gate is the
  *correctness* gate, not the lock.
- **Dry-run by default.** `PRUNE_MODE` (a Worker `var`, default `"dryrun"`) runs the full pipeline and logs
  what it WOULD delete, but deletes nothing until a human flips it to `"live"` + redeploys post-launch. This,
  the breaker, and an empty-primary early-out are three independent guards against **THE LANDMINE: the
  primary is ~0 B right now, so a naive run would delete the ENTIRE backup.**

Cadence: a **weekly** Worker cron (`0 6 * * 1`, after the daily 04:00 purge + 05:00 reconcile). Observability
ships **alert-only** (breaker trips page); the `/admin` job-runs heartbeat is deferred to admin **P8**
(→ [`../ROADMAP.md`](../ROADMAP.md)). Flipping to live also removes the pre-launch test-data-reset's
"≥35 d before launch" timing constraint. New shared secret: `PRUNE_API_SECRET` (Worker + Vercel).

## See also

[ADR-0013](../adr/0013-media-durability-orphan-sweep-safety-and-backup.md) · [architecture.md](architecture.md) (the overview) · [lifecycle-recovery.md](lifecycle-recovery.md) (the cron that runs the guarded sweep) · [admin-observability.md](admin-observability.md) (P8).
