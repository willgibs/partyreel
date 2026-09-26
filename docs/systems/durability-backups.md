# Durability & backups

Open this before you:
- touch anything that deletes R2 objects: the orphan sweep, the backup prune;
- change the backup Worker, its Queue or the DB-backup Action;
- restore from backup;
- reason about R2 cost or scale.

Elsewhere: the whole-picture flows ([architecture.md](architecture.md)), the purge sweeps ([lifecycle-recovery.md](lifecycle-recovery.md)), how every job reports
([admin-observability.md](admin-observability.md) "Backend jobs").

All media sits in ONE primary R2 bucket, and R2 has no native versioning or replication, so the safety here is
load-bearing: without it, one orphan sweep after a database loss could wipe the bucket. Every backup job runs off the
app (Cloudflare, GitHub Actions), so a backup failure is a durability risk, never an outage. Each job carries a kill
switch and a heartbeat, and a missing run raises a Sentry event.

## Pillar A: the orphan-sweep breaker

The orphan sweep deletes R2 objects no `media` row names, older than 24 hours, and `evaluateOrphanSweep` stands in
front of it: it deletes NOTHING and alerts (Sentry and a deduplicated operator email) when the `media` table is empty
or the orphan set passes an absolute or a fractional cap, so a bad migration, a snapshot restore, a mass delete or a
query bug cannot let one run wipe the bucket.
- ★ **The breaker is the one thing between a database fault and an irreversible bucket wipe.** Keep its empty-table
  and absolute and fractional caps; an orphan sweep that deletes unconditionally is the failure it exists to stop.
- Before launch the `media` table holds a few test rows, so a test reset that empties it arms the empty-table breaker:
  reclaim deliberate orphans through a force-purge path, never the guarded cron.

## Pillar B: the media backup

A PUT to the primary (`events/…`) fires an `object-created` notification into a Cloudflare Queue, and the
`partyreel-backup` Worker copies the object to the `partyreel-backup` bucket (WNAM, Infrequent Access, Bucket Lock:
35-day WORM); a failed copy retries into a dead-letter queue, and a daily 05:00 UTC reconcile re-copies anything the
live path missed. Avatars are not in it: they live in Supabase Storage, are derivable, and overwrite in place, which
the lock would refuse.
- **Bucket Lock makes the backup keep-all and immutable for 35 days;** the lifecycle purge never touches it, and the
  deletion-aware prune below is the one sanctioned backup-delete path.
- ★ **The Worker reports the queue and dead-letter depths on every scheduled run** (`queue-metrics.ts`, through
  `Queue.metrics()` on two producer bindings it never sends to), because a dead letter is a media object with NO
  backup copy until a reconcile catches it. The depths ride the heartbeat's `counts` (`queue_backlog`,
  `dead_letter_backlog`, each with `_oldest_min`), strings a test pins on BOTH sides since the packages cannot import
  each other. Every read is guarded: a metrics call never costs a backup run, and an unreadable queue reports no key
  rather than a zero.
- ★ **The Worker's two jobs report through the app, on a URL derived from `PRUNE_API_URL`** (its sibling path,
  `job-heartbeat.ts`): a Worker cannot reach the database, and the derivation means no new variable, no second secret
  and no way for the two endpoints to drift onto different environments. Their postures on an unreachable heartbeat
  are opposite on purpose: the reconcile runs anyway (a missing backup copy beats a missing log line), and the prune
  skips (it deletes from the last-resort copy, so it acts on no unanswered question). If the endpoints ever stop being
  siblings, a `JOB_API_URL` variable beats reshaping the derivation.

### The deletion-aware prune

The backup is accrue-only: an age rule would delete backups of media still live, so when media leaves the primary its
copy stays, and backup storage climbs with churn. The weekly prune (Mondays 06:00 UTC, after the purge and the
reconcile) bounds it. It is the inverse of the orphan sweep and the most dangerous job in the system, the only one
that deletes from the last-resort copy, so its guards are layered:
- **A dual existence check, never an age rule:** an object is reclaimed only when its `media` row is gone (the app's
  confirm endpoint, `/api/internal/backup-prune`) AND its primary object is absent (a HEAD). Either source alone says
  keep, so no single-source fault can prune.
- **An app-side breaker** (`evaluatePrune`): an empty `media` table beside candidates deletes nothing and alerts. The
  orphan sweep's fractional cap is deliberately absent, because for an accrue-only backup the gone fraction is
  legitimately large; a per-run clamp (`PRUNE_DELETE_CAP_PER_RUN`, enforced Worker-side across batches) bounds the
  volume instead.
- **A 36-day age gate, one day past the lock.** A delete of a still-locked object is a silent no-op that returns
  success, so the age gate, not the lock, is what makes the prune correct.
- ★ **Dry-run by default** (`PRUNE_MODE = "dryrun"`: the whole pipeline runs and logs what it would delete). Before
  launch the primary is near-empty, so a naive run would delete the ENTIRE backup; dry-run, the breaker and an
  empty-primary early-out are three independent guards. Flipping to `"live"` is a launch switch (ROADMAP), and it
  lifts the pre-launch test-data reset's "at least 35 days before launch" constraint. The Worker and Vercel share
  `PRUNE_API_SECRET`.

## Pillar C: the database backup

Supabase Pro's daily backup (7 days, same vendor) plus a nightly off-site `pg_dump` to `partyreel-backup/db/` (the
GitHub Action `db-backup.yml`, which outlives a whole-account loss), verified by size after upload. There is no PITR
(its cost is not worth it before revenue), so the database's recovery point is up to a day. The Action breaks when
the database password rotates until its secret follows (the app's API keys are separate).
- **The Action's Supabase CLI version is pinned, never `latest`:** `latest` asks GitHub's unauthenticated release API
  from a shared runner IP and gets rate-limited. The workflow carries the pin and how to bump it.

## Restore

Rows come from the Supabase backup or the `db/` dump; bytes by copying `partyreel-backup` into `partyreel`. A full
restore needs BOTH halves. Media's recovery point is seconds on the live path (the daily reconcile the backstop), the
database's up to a day, and the recovery time is a bucket-to-bucket copy on free in-region egress. Pillar A protects
the objects while the rows are transiently wrong, which is exactly when a restore is under way.

## Cost & scaling

- The durability stack's one recurring charge is Workers Paid, about $5 a month (Queues need it); R2 is about $0 at
  this scale, and R2-to-R2 egress is free.
- ★ **The R2 overview page's "Billable usage" donut is a forecast artifact** that can show a scary number on
  near-zero usage; the truth is Billing, Billable usage. A $10 usage budget alert to partyr33l@gmail.com guards a real
  runaway.
- **The prune's cost shape is its DB-first ordering:** the Worker lists the backup, filters by age and key, posts the
  candidate ids to the app to confirm the rows are gone, and HEADs the primary only for that confirmed set, so there
  is no HEAD per live object: a bucket list plus batched lookups, about $0 into tens of millions of objects (the
  next step past that is on the ROADMAP).
- **The scans restart at the head of the bucket.** The reconcile examines at most `RECONCILE_MAX_PER_RUN` (5,000)
  objects a run and the orphan sweep 20 pages, each from the start of the listing, so past the cap the tail is never
  examined (the reconcile's "next run continues" log line is false; a capped run reports `capped: true`). The
  pagination cursor is on the ROADMAP.
