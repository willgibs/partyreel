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
NOT backed up** (derivable; overwrite-in-place conflicts with the lock — the queued "avatars → Supabase
Storage" initiative closes that gap). Workers Paid ~$5/mo, zero egress, off Vercel; a Backblaze B2
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
- **Bucket Lock = WORM.** The backup copy is intentionally keep-all + immutable; the lifecycle purge does
  NOT touch it (a future deletion-aware prune handles that). Don't add a backup-delete path.
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
| Avatars not backed up | out of scope by design (see Pillar B) |

The zero-silent-failure mandate (every backend job must be manageable + health-visible from `/admin`) is
admin-portal **P8** → [admin-observability.md](admin-observability.md) + [`../ROADMAP.md`](../ROADMAP.md).
Remaining durability backlog (→ ROADMAP): a deletion-aware backup prune, the B2 cross-vendor tier, a
fine-grained-PAT migration for the CI push.

## See also

[ADR-0013](../adr/0013-media-durability-orphan-sweep-safety-and-backup.md) · [architecture.md](architecture.md) (the overview) · [lifecycle-recovery.md](lifecycle-recovery.md) (the cron that runs the guarded sweep) · [admin-observability.md](admin-observability.md) (P8).
