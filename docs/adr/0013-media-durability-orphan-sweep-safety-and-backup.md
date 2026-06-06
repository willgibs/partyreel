# ADR-0013 — Media durability: orphan-sweep safety rails + immutable backup

- **Status:** Accepted (2026-06-06). **Pillar A (orphan-sweep circuit-breaker) implemented.**
  Pillars B (media backup) + C (DB backup) designed + sequenced as their own phases.
- **Phase:** one-off task (post-roadmap). Build steps + sequencing live in the master plan
  [`.claude/plans/we-ve-recently-pushed-a-breezy-nest.md`](../../../.claude/plans/we-ve-recently-pushed-a-breezy-nest.md)
  (supersedes the first-pass `.claude/plans/media-durability-backup.md`).
- **Supersedes (partially):** the "Cold storage evaluated + rejected" note in
  [`PRICING.md`](../PRICING.md) — that rejection stands for the _hot tail_, but Infrequent
  Access is **revived here for a cold backup** (retrieval fees only ever apply during a real restore).

## Context

**Every byte of user media — every event's guest + host photos and videos — lives in a SINGLE
Cloudflare R2 bucket (`partyreel`, account `8bd90d2f6a374d6cdff2f379e929b060` — the P3 account as of
2026-06-06; old `7982310e…` deleted, region ENAM) with no backup, no versioning, no redundancy.**
A single point of failure for all customer content. Founder flagged it "huge risk." Two dangers:

**(1) The orphan-sweep cron can wipe the bucket (ACUTE, self-inflicted).** The daily lifecycle cron
([`/api/cron/purge`](../../src/app/api/cron/purge/route.ts), sweep #3 `sweepOrphans`) lists objects
under `events/`, parses the media id from each key ([`parseMediaIdFromKey`](../../src/lib/r2/keys.ts)),
and **hard-deletes** any object >24 h old whose `media` row is gone
([`deleteR2Objects`](../../src/lib/r2/delete.ts)). It trusts the DB as the source of truth for "is
this an orphan?". If the `media` rows were ever lost or unlinked — bad migration, restore to an older
snapshot, accidental mass row-delete, RLS/query bug returning a partial set — a **single run would see
(nearly) every object as an orphan and delete it irreversibly.** No backup to undo it.

**(2) No backup of the media itself (CHRONIC).** Accidental bucket/object delete, a compromised R2
token, R2-side corruption, an upload/delete-path bug, ransomware. A guest's photos have no second copy.

**The DB is half the threat surface.** Losing `media` rows is as damaging as losing objects (the
objects backup is useless if the rows that point at them can't be restored), and a transiently-bad DB
state is exactly what arms danger (1). So the design also covers DB backup posture (Pillar C).

**Constraints:**
- **Build-to-scale, cost-frugal** ([cost-frugality memory] / [`PRICING.md`](../PRICING.md)): prefer the
  best managed/native tool over fragile internal glue; optimize fixed-vs-incremental cost; keep heavy
  work off Vercel (cost risk). A paid tier is fine when tied to value, flagged not silent.
- **R2 gotchas** (CLAUDE.md / ADR-0003): the AWS-SDK checksum config in
  [`r2/client.ts`](../../src/lib/r2/client.ts) is load-bearing; CORS/lifecycle/locks are set via
  wrangler/dashboard/S3-API; the **R2 MCP is bucket-level only** (no object/CORS/lock/token ops).
- **Interaction with recovery** ([recovery memory]): Recovery Phase 6 (pre-launch hard reset)
  _intentionally_ orphans objects — the circuit-breaker blocks that BY DESIGN, so intentional bulk
  purges use a separate force-purge path, never the guarded daily cron.

## Capability findings (verified live 2026-06-06 via Cloudflare/Supabase/Vercel MCP + docs)

| Capability | Status | Implication |
| --- | --- | --- |
| R2 **object versioning** (delete markers) | ❌ Not supported | Rules out "turn on versioning." |
| R2 **native cross-bucket / cross-region replication** | ❌ Not available | "Local Uploads" is write-latency, not redundancy. Backup must be DIY. |
| **Bucket Lock** (WORM retention) | ✅ GA, **no fee** | Duration / until-date / indefinite, per-prefix; **blocks deletes incl. S3 `DeleteObjects`**; **precedes lifecycle**; bucket can't be emptied while locked. Keystone of the backup. |
| **Cloudflare Queues + R2 event subscriptions + Cron Triggers** | ✅ GA | R2 object-create → Queue → consumer Worker (real-time replication); Cron Triggers for a scheduled reconciliation Worker. |
| **Workers** | ✅ | Free tier covers a cron-only Worker; **Workers Paid ~$5/mo** is required for Queues (real-time). |
| R2 **storage classes** | ✅ Standard + IA | Standard $0.015/GB-mo; **IA $0.01/GB-mo** + $0.01/GB retrieval (cold backup → retrieval only in a real restore). |
| R2 **egress** | ✅ **Free** | Incl. R2↔R2 same-account — a Worker copy costs only ops + storage. |
| **Backblaze B2** | ✅ (future tier) | $6/TB, S3-compatible, **Object Lock** immutability, **free egress via Cloudflare (Bandwidth Alliance)**; restore via Super Slurper. Cross-vendor option. |
| **Supabase backups** | ✅ **Pro confirmed** (org `guzirowamwfgzolbogjw`) | Daily backups ON, 7-day retention. PITR is a **$100–400/mo** add-on (deferred). |
| **Vercel** | Hobby now (Pro at launch) | Spend Management hard cap + alerts + a pause-project API exist on Pro. |

## Decision — three pillars

### Pillar A — Orphan-sweep circuit-breaker  ·  IMPLEMENTED (in-app, ~free)

A guard before the single `deleteR2Objects(orphanKeys)` call in `sweepOrphans`. The decision is a
**pure, unit-tested fn** `evaluateOrphanSweep({ mediaCount, candidateCount, objectsScanned })` in
[`src/lib/r2/orphan-guard.ts`](../../src/lib/r2/orphan-guard.ts) (tests in `orphan-guard.test.ts`):

1. **`media_table_empty`** — objects exist but `count(media) = 0` → the DB is in a bad state, not "all
   orphans." Fail closed.
2. **`absolute_cap`** — candidate set > `ORPHAN_DELETE_ABSOLUTE_CAP` (1000; normal orphan volume is a handful).
3. **`fraction_cap`** — candidates > `ORPHAN_DELETE_MAX_FRACTION` (25%) of objects scanned, applied
   only once `objectsScanned ≥ ORPHAN_RATIO_MIN_SCANNED` (50) so a tiny bucket can't false-trip.

On trip the sweep **deletes nothing**, `captureError("cron", …)` to Sentry, and sends a **deduped
operator alert** (`orphanBreakerEmail` via `sendOnce`, kind `orphan_breaker`, deduped per `(reason,
day)` → `CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL`). The safe failure mode is a storage **leak**, not
data loss; the email keeps a tripped breaker visible. Alert-send failures are swallowed (never become
a delete; Sentry is the primary signal).

**Live state note (2026-06-06):** the `media` table is currently **empty (0 rows, 2 events)** — a
clean-test state. So if the bucket holds any aged `events/` orphans, the next cron run will (correctly)
trip `media_table_empty`, reclaim nothing, and send one operator alert/day. That is the guard working
as designed; reclaim pre-launch orphans via the force-purge path (below), not the guarded cron.

**Intentional bulk purges** (Recovery Phase 6 reset, or any deliberate mass-orphaning) must NOT use the
daily cron — they trip by design. Use an explicit path: a one-shot S3-API script, or a future manual
admin route with a `force` flag + raised cap.

**Optional Phase-1b (deferred):** two-phase quarantine (record candidates, delete only those still
orphaned a run later) — heals transient unlink blips. The breaker already covers the catastrophic case.

### Pillar B — Immutable media backup  ·  DEDICATED PLAN (infra-heavy)

Real-time, append-only, immutable copy of all media, run entirely on **Cloudflare** (zero egress, off
Vercel, scales O(uploads)):

- **Backup target = a second R2 bucket** `partyreel-backup`, **different region** than ENAM, storage
  class **IA**, with a **Bucket Lock** retention ≥ the 30-day recovery window → WORM/tamper-proof DR
  window nothing can delete (cron, compromised token, bug, ransomware). Append-only + a backup-side
  lifecycle expiration past the lock window → bounded storage. _(Chosen over B2 first because the Worker
  binds two R2 buckets natively — simplest/most-robust at scale, zero egress; R2-durability is not a
  concern here. **B2 added later** as the cross-vendor + cheaper-$/TB tier when paid revenue justifies it.)_
- **Replication Worker** (`workers/backup/`): R2 **event notification** (object-create) → **Queue** →
  consumer Worker `BACKUP.put(key, PRIMARY.get(key).body, { storageClass:"InfrequentAccess" })` (idempotent;
  treat already-exists/locked as success). RPO ≈ seconds. **+ a Cron-Trigger reconciliation Worker**
  (backstop for missed events + seeding); at scale use a copy-state index (KV/D1), not HEAD-per-object.
- **Cost:** Workers Paid ~$5/mo fixed; R2↔R2 egress free; IA storage ~$0 now → $10/TB-mo.

### Pillar C — DB backup posture  ·  AFTER B (small)

Keep **Supabase Pro daily backups** (already on, 7-day). **Add a scheduled off-site logical
`pg_dump`** (GitHub Actions cron — the natural home for the `pg_dump` binary, which Workers/edge
functions can't run) → the immutable backup bucket `db/` prefix (lock-protected, ~90-day lifecycle).
The dump is small (rows/metadata; media is in R2) → near-zero cost. **Defer PITR** ($100–400/mo).

### Cross-cutting — Vercel cost & scale posture  ·  DOCUMENT ONLY

Captured in the master plan (modular, for a future dedicated plan). Highlights: keep durability work
off Vercel (done); the **12 s gallery poll** is the top invocation driver (optimize via Supabase
Realtime / conditional 304s — separate initiative); front Vercel with Cloudflare at launch (cuts
bandwidth + free DDoS/bot protection); set Vercel Spend Management hard cap + alerts on Pro; media
already bypasses Vercel image optimization (raw `<img>` on presigned R2 — keep it that way).

## Alternatives considered

- **R2 versioning / native replication** — not supported (see findings).
- **rclone on GitHub Actions** (first-pass lead) — free + zero app code, but external glue that re-lists
  the whole bucket each run (O(bucket)); **demoted to a fallback** in favor of the native event-driven Worker.
- **In-app Vercel Cron `CopyObject` route** — keeps it in-repo but adds Vercel load (the cost we're
  avoiding) and Hobby caps crons at daily. Rejected for the backup hot path.
- **B2 as the first backup target** — cheaper + cross-vendor, but more implementation (S3 signing from
  the Worker, second vendor's creds) and R2-durability isn't a concern; **deferred to a later tier.**
- **Delete the orphan sweep** — rejected; orphans are real (presign races, crash stragglers) and leak
  cost. The sweep is needed; it just needed guard rails.

## Cost

- **Pillar A:** ~$0 (queries + Sentry/email reuse).
- **Pillar B:** Workers Paid ~$5/mo fixed; backup IA storage ~$0 now (10 GB-mo free tier) → ~$10/TB-mo;
  egress + Bucket Lock free; copy/list ops negligible.
- **Pillar C:** `pg_dump` → R2 ~$0. PITR deferred ($100–400/mo).

## Recovery objectives

- **RPO:** real-time Worker ≈ seconds (event-driven); reconciliation backstop daily. DB: ≤24 h (Pro
  daily) + the logical dump cadence.
- **RTO:** restore = Worker/wrangler copy backup→primary (free egress, in-region) — minutes now, hours
  at scale; DB restore from Supabase backup or the logical dump. Pillar A protects objects during any
  window where rows are transiently inconsistent.

## Consequences

- **+** The catastrophic, irreversible failure (cron wipes the bucket) is now a visible no-op + alert,
  shipped before any infra work.
- **+** An immutable, real-time second copy of all media (Pillar B), tamper/ransomware-proof for the
  lock window; built native + off Vercel, scaling O(uploads).
- **+** DB rows protected off-site (Pillar C) so a full restore is possible; paid upgrades (B2, PITR,
  Vercel Pro) are deferred + revenue-tied.
- **−** Backup ~doubles storage cost (small absolute; IA softens it) + a fixed ~$5/mo Workers floor.
- **−** New operational surface: a Worker + Queue + scoped token + an un-emptyable (by design) backup bucket.
- **−** Pillar A can mask a genuinely large orphan backlog (it leaks rather than reclaims when tripped);
  mitigated by the loud alert + the force-purge path. **Currently active** given the empty `media` table.

[cost-frugality memory]: see `feedback_cost_frugality`
[recovery memory]: see `project_recovery_recently_deleted`
[testing memory]: see `feedback_testing`
