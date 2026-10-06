# Durability & backups

Open this before you:
- touch anything that deletes R2 objects: the orphan sweep, the backup prune;
- touch anything that writes the backup into the primary: the backup restore;
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

The orphan sweep deletes R2 objects no `media` row names, older than 24 hours.
- ★ **Its breaker, `evaluateOrphanSweep`, is the one thing between a database fault and an irreversible bucket
  wipe:** it deletes NOTHING and alerts (Sentry and a deduplicated operator email) when the `media` table is empty or
  the orphan set passes an absolute or a fractional cap, so a bad migration, a snapshot restore, a mass delete or a
  query bug cannot let one run wipe the bucket. Keep all three caps.
- Before launch the `media` table holds a few test rows, so a test reset that empties it arms the empty-table breaker:
  reclaim deliberate orphans through a force-purge path, never the guarded cron.

## Pillar B: the media backup

A new object under the primary's `events/` (a staged PUT copied in, a multipart assembled) fires an `object-create`
notification into a Cloudflare Queue, and the `partyreel-backup` Worker copies the object to the `partyreel-backup`
bucket (WNAM, Infrequent Access, Bucket Lock: 35-day WORM); a failed copy retries into a dead-letter queue, and a
daily 05:00 UTC reconcile re-copies anything the live path missed. Avatars live in Supabase Storage, outside it: they
are derivable, and overwrite in place, which the lock would refuse. Only `events/` is ever copied, listed or pruned:
the subscription is filtered to it and the queue skips any other key in code (`isBackedUpKey`), so an upload's
day-long `staging/` object never reaches the lock.
- **Bucket Lock makes the backup keep-all and immutable for 35 days;** the lifecycle purge never touches it, and the
  deletion-aware prune below is the one sanctioned backup-delete path.
- **The Worker reports the queue and dead-letter depths on every scheduled run** (`queue-metrics.ts`), because a dead
  letter is a media object with NO backup copy until a reconcile catches it. The depths ride the heartbeat's `counts`
  (`queue_backlog`, `dead_letter_backlog`, each with `_oldest_min`), strings a test pins on BOTH sides since the
  packages cannot import each other.
- ★ **The Worker's jobs report through the app, and fail opposite ways on purpose** (`job-heartbeat.ts`, on a URL
  derived from `PRUNE_API_URL`, since a Worker cannot reach the database): on an unreachable heartbeat the reconcile
  runs anyway (a missing backup copy beats a missing log line), while the prune skips (it deletes from the last-resort
  copy, so it acts on no unanswered question) and so does the restore (it writes only what the app names).

### The deletion-aware prune

The backup is accrue-only: an age rule would delete backups of media still live, so when media leaves the primary its
copy stays, and backup storage climbs with churn. The weekly prune (Mondays 06:00 UTC, after the purge and the
reconcile) bounds it to the live set and about 43 days of uploads (the gate and the cadence). It is the inverse of the
orphan sweep and the most dangerous job in the system, the only one that deletes from the last-resort copy, so its
guards are layered (`workers/backup/src/prune-run.ts`, a pure engine under test):
- **Three readings, never an age rule:** a run lists a page of the backup, then the primary over the same key range,
  and only a key the primary does not list is a candidate; the app's confirm endpoint (`/api/internal/backup-prune`)
  is asked about candidates only, never the live set; and a HEAD of the primary right before the delete keeps anything
  restored since the listing. Either source alone says keep, so no single-source fault can prune.
- ★ **A doubt deletes nothing.** Deletes happen once, at the run's end, so a confirm that is down or answers in the
  wrong shape, the app's breaker, an id it was never asked about, or a listing that does not move forward aborts the
  whole run with nothing deleted and the cursor where it was; a failed HEAD keeps that one item while the run still
  deletes the others it confirmed, and closes as an error.
- ★ **What the backup alone holds is an alert, never a note:** a candidate whose row lives while the primary lost its
  object is a host's photo with one copy left. It is kept, and with the restore on or in dry run the app's confirm
  route is asked which of its keys a live row still NAMES (`loneKeys` → `named`, by `mediaKeysOf`), so a key its row
  let go of (a phone copy dropped at an upload's complete for being over its cap) is never counted or copied back:
  restored, it would be an object no row names, which no sweep reclaims (the orphan sweep keys on the row's id). The
  rest go into the lone copies' table (`lone-store.ts`, SQL in `PruneState`): a run settles the range it judged into
  it and reports the table's whole count (`primary_missing`, zero included, so a quiet week is a reading), so a pass
  that spans runs reads the whole backup's lone copies after every run, never its own range alone. The count is said
  second in the note, each item's keys named in the run's log ("held by the backup alone", Workers Logs, the first 200
  items a run), and raised where the report lands (`/api/internal/job-run`: the `backup_primary_missing` warning and
  the ops mail, at most once a day) beside its card on `/admin/jobs` (a failure at any count, the bell). It sees only
  keys past the 36-day gate; the daily reconcile judges the younger ones (below), and each walk settles only its own
  side of the gate in the table. The restore below copies them back.
- **An app-side breaker** (`evaluatePrune`): an empty `media` table beside candidates deletes nothing and alerts. The
  orphan sweep's fractional cap is deliberately absent: the gone fraction is legitimately large after a clear-out.
- **The hold is the clamp, sized to the deletions:** a run whose backlog passes ten times the usual (the median of its
  last eight runs, dry ones included, never under 2,000 media: `prune-ledger.ts`) deletes nothing, reads attention,
  and raises a Sentry warning (`backup_prune_held`) and the ops mail where its report lands (`/api/internal/job-run`),
  each run it holds. It guards what the readings cannot: rows and objects deleted together (a purge bug, a stolen
  key), so all three agree. A fixed per-run number either throttles real churn or lets a disaster's whole volume
  through. The test-data reset's backlog holds the first live run after the launch switch.
- ★ **A hold never releases itself:** a clock that let it through would delete the last copy of whatever nobody looked
  at. A person presses Release the hold on the prune's card (`src/app/admin/jobs/prune-hold.ts`), the job heartbeat's
  start answer carries it (`releasedAtMs`), and the Worker honours it only when it is newer than the hold, so every
  hold takes its own press. The pause switch stays the brake. Every report while a hold stands carries it
  (`held_since`, `held_media`), so the card offers the release even after a paused or aborted run.
- **A 36-day age gate, one day past the lock.** A delete of a still-locked object is a silent no-op that returns
  success, so the age gate, not the lock, is what makes the prune correct.
- ★ **Dry-run by default** (`PRUNE_MODE = "dryrun"`: the whole pipeline runs and reports what it would delete). Before
  launch the primary is near-empty, so a naive run would delete the ENTIRE backup; dry-run, the breaker and an
  empty-primary early-out are three independent guards. Flipping to `"live"` is a launch switch (ROADMAP), and it
  lifts the pre-launch test-data reset's "at least 35 days before launch" constraint. The Worker and Vercel share
  `PRUNE_API_SECRET`.
- ★ **It keeps up: a cursor, and caps that are its budget,** because a run that restarts at the head never reaches
  the backup's tail, which then keeps every deleted byte for good. Its ledger (the listing position, the last runs and
  the hold) lives in a SQLite Durable Object, `PruneState`, since the Worker cannot reach the database. A run walks on
  from the cursor until the listing ends (the next pass starts at the head) or its deadline (12 of the cron's 15
  minutes), its subrequest budget (95,000 under `wrangler.jsonc`'s 100,000) or its delete cap (30,000 media) stops it,
  which reads attention with a counted `remaining`. A ledger it cannot read makes the run dry and saves nothing; one
  that reads back damaged falls back to the head, the floor and no hold, the safe direction each.

### The reconcile

The daily backstop (`workers/backup/src/reconcile-run.ts`, a pure engine under test, wired in `index.ts`) walks the
primary's and the backup's listings side by side, a thousand keys a page each, so a run costs two listings a thousand
keys, never a request an object (the old HEAD per object took 715 s over 3,419 objects, and the next day's run was cut
off by the platform at 15 minutes, its card Overdue).
- **It compares by key, size and checksum:** a key the backup lacks is copied (`backupOne`, three in flight); a
  checksum counts only when both sides are a single upload's MD5, since the backup copies a large object in its own
  32 MiB parts, so the same bytes carry different multipart etags (R2's upload docs, "ETags", read 2026-10-05).
- ★ **A key whose two copies differ is said, never overwritten** (`mismatched`, and `breaker_tripped`: Needs a look):
  keys are written once, so either the primary was rewritten in place (the 2026-07-03 EXIF backfill left two) or one
  copy is damaged, and only a person can say which is good: delete the backup's copy once its lock has passed and the
  next run copies the primary's, or copy the backup's back.
- **It carries on:** no page or copy starts past 11 minutes, a multipart copy starts no part past 12.5 (it aborts,
  deferred to the next run, which starts with it), its subrequests stay under 95,000, and a run that stops keeps a
  cursor in `PruneState` (`reconcile-ledger.ts`) at the first thing it did not finish. A copy deferred though it began
  with the whole run ahead of it can fit no run: said (`too_large`, an error) and remembered, so later passes say it
  without spending a run on it again. A pass that spans runs reads Needs a look; one run that settles nothing fails.
- ★ **The young lone copies are its to judge:** a key the backup holds and the primary lacks, taken inside the prune's
  36-day gate, is asked of the app (`named`), and the named ones go into the lone copies' table on its young side (by
  `uploaded_ms`), so neither judge's walk drops the other's keys, and one that ages past the gate between walks is
  held until the prune's walk judges it. New ones ask for a restore pass at once. An app that cannot answer leaves the
  table as it was past where judging stopped, and the run errs; its report carries the table's whole count, as the
  prune's and the restore's do.
- **A doubt copies and judges nothing:** an empty primary beside a full backup (a wiped bucket or a listing fault) or a
  listing that does not move forward.
- **A run that does not end clean says so where its report lands** (`/api/internal/job-run`): stopped early, failed,
  or copies that differ raise the `backup_reconcile_unfinished` warning and the ops mail, at most once a day. Its card
  reads its pass, its last whole pass and what waits on a person (`src/app/admin/jobs/reconcile-view.ts`); a run the
  platform cuts reports nothing, which the missed-run scan reads as Overdue.

### The restore

The backup's lone copies, copied back into the primary on their own (`workers/backup/src/restore-run.ts`, a pure
engine under test, wired in `restore-pass.ts`): a pass takes each key in the lone copies' table and copies it from
`partyreel-backup` into `partyreel` at the same key.
- ★ **Three guards on every copy, each on its own:** only a key a live row still names, asked of the confirm route
  right before each batch; never over an object that is there, a HEAD first and then the write itself conditional
  (`If-None-Match: *`, which R2's binding refuses with `null` when anything is stored at the key: the Workers API
  reference, "Conditional operations", read 2026-10-05, and walked in workerd's local R2); never past one write's
  reach: R2 takes at most 5 GiB less 5 MiB in one put and a multipart upload's complete takes no condition, so a
  larger object is never written by halves; it stays held, said key by key, for a copy by hand.
- ★ **Its mode is its own (`RESTORE_MODE`):** `on` copies, `off` does nothing, and anything else (unset included) is a
  dry run that asks and reads everything and copies nothing, so a var missing or mistyped never writes; wrangler.jsonc
  ships `dryrun`. Switching it on is no launch switch: it writes only objects a live row names, into places nothing
  is stored. It fails closed on an unreachable app, since it writes only what the app names.
- **A pass is `PruneState`'s alarm,** so it has an invocation and a 15-minute budget of its own whoever asked: the
  daily cron (asked first, apart from the reconcile, so a reconcile that fails never takes the day's restore with it),
  a reconcile that found lone copies new to the table, each prune's end, and Restore now. A request never starts a second pass beside one in flight and is never lost: one that comes while a
  pass runs queues the next (`restore-schedule.ts`). A pass judges at most 2,000 keys and starts no copy past 12
  minutes; what it leaves is counted (`remaining`) and the next pass carries on.
- **Restore now is the one start the app has for a Cloudflare job:** the restore card's control, behind AAL2, POSTs
  the Worker's one door (`POST /restore` on its workers.dev origin, `BACKUP_WORKER_URL`, the internal-jobs bearer it
  already holds), which asks the object for a pass; every other path is a 404 and every other caller a 401.
- **Every outcome is said:** each key's in Workers Logs with its key; its card (`backup_restore`, its own switch and
  heartbeat, daily) says what it copied back, what it could not and why (a failed copy stays held for the next pass;
  too large, or gone from the backup too, closes the pass as an error), and what it left alone (in the primary
  already, or named by no row: both dropped from the table). Its report carries the table's count after it, which the
  lone copies' card reads beside the prune's, freshest first, so lone copies copied back read healthy at once.

## Pillar C: the database backup

Supabase Pro's daily backup (7 days, same vendor) plus a nightly off-site `pg_dump` to `partyreel-backup/db/` (the
GitHub Action `db-backup.yml`, which outlives a whole-account loss), verified by size after upload. There is no PITR
(its cost is not worth it before revenue), so the database's recovery point is up to a day. The Action breaks when
the database password rotates until its secret follows (the app's API keys are separate).

## Restore

Rows come from the Supabase backup or the `db/` dump; bytes by copying `partyreel-backup` into `partyreel`. A full
restore needs BOTH halves, and the prune is paused from `/admin/jobs` first: mid-restore, rows and objects are missing
together, which is exactly what it reads as gone. The backup restore (above) mends a handful of lone copies on its
own; a whole bucket is this copy, and its conditional writes make any race with the restore harmless. Media's recovery point is seconds on the live path (the daily
reconcile the backstop), the database's up to a day, and the recovery time is a bucket-to-bucket copy on free
in-region egress. Pillar A protects the objects while the rows are transiently wrong, which is exactly when a restore
is under way.

## Cost & scaling

- The durability stack's one recurring charge is Workers Paid, about $5 a month (Queues need it); R2 is about $0 at
  this scale, and R2-to-R2 egress is free.
- ★ **The R2 overview page's "Billable usage" donut is a forecast artifact** that can show a scary number on
  near-zero usage; the truth is Billing, Billable usage. A $10 usage budget alert to partyr33l@gmail.com guards a real
  runaway.
- **The prune's cost shape is its primary-first merge** (above): two listings a thousand keys (Class A) and no call
  about a live object, about $0 into tens of millions of objects. The restore's is its lone copies: a pass with none
  is two heartbeat calls to the app; each key at most four R2 calls inside Cloudflare and a confirm call a thousand. Its deadline bounds a run to what two list calls a
  thousand keys can reach in 12 minutes (millions at a Worker's R2 latency); past that a pass spans runs, deleted bytes
  outlive the 43 days, and the card reads `stopped_early` every week: the cue for a daily cadence (a catalog change).
- **The reconcile's cost shape is the prune's:** two listings a thousand keys a day (Class A, cents a month at 100,000
  objects) and a copy only for what the queue missed. A pass fits one run far past 100,000 objects (about 210 listings,
  a minute; the live dry run of 2026-10-05 read 5,862 keys in 16 subrequests, 12 s over the internet), so the cursor
  is for a backlog of copies or a bucket far past that. ★ A copy is one invocation's: a video whose multipart copy
  outruns 10 minutes is `too_large` on every pass and a copy by hand (the queue's own copy has the same 15 minutes).
  The orphan sweep resumes where it stopped ([lifecycle-recovery.md](lifecycle-recovery.md)), 20 pages a night, so an
  orphan waits at most one cycle (the bucket's objects over 20,000 a night).
