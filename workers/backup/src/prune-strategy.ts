// Pure helpers for the media-backup Worker's deletion-aware prune (durability-backups.md, Pillar B).
// NO Worker globals here on purpose — this module is unit-tested in plain Node (prune-strategy.test.ts).
//
// The prune is the INVERSE of the orphan sweep and the ONLY job that deletes from the last-resort
// backup, so these helpers encode its LOCAL safety gates: an AGE gate (never delete inside the
// Bucket Lock window) and a KEY-RECOGNITION gate (never delete a key we cannot positively identify),
// plus the run's budget. The DB confirm + the circuit-breaker live app-side
// (src/lib/r2/prune-guard.ts); the run itself is prune-run.ts, its memory between runs prune-ledger.ts.

// The backup bucket has a 35-day Bucket Lock (WORM). We use a 36-day floor (one day of margin) so we
// never even ATTEMPT to delete an object inside the lock: a locked-object delete is a SILENT
// server-side no-op that RETURNS SUCCESS (see README "Ops gotcha"), which would otherwise inflate our
// deleted counts with deletes that never happened. The lock is the physical backstop; this age gate is
// the correctness gate. Age is read from R2's `uploaded` timestamp — the time the BACKUP copy was
// written, which is exactly what the lock retention is measured from.
export const PRUNE_LOCK_MIN_AGE_MS = 36 * 24 * 60 * 60 * 1000; // 36 days

// THE RUN'S BUDGET, from the Worker's own limits (the brief: caps sized to the deletions, never a fixed small
// number). The scan has NO count cap any more: a run walks the backup from where the last one stopped
// (prune-ledger.ts's cursor) until it reaches the end or one of these stops it, and the next run carries on.
//
// A cron invocation may run 15 minutes of wall time (developers.cloudflare.com/workers/platform/limits,
// "Duration", read 2026-10-03). The run starts no new page, confirm or HEAD after this, which leaves three minutes
// for the deletes (at most PRUNE_DELETE_CAP_PER_RUN media, a call per 1,000 keys), the ledger and the heartbeat.
export const PRUNE_RUN_DEADLINE_MS = 12 * 60 * 1000;

// Every list, HEAD, delete, confirm and ledger call is a subrequest. wrangler.jsonc raises the Worker's limit to
// 100,000 (the paid default is 10,000, configurable to 10 million: the 2026-02-11 changelog); the run keeps its
// own count under it, with room for the deletes and the heartbeat, so it stops on its own terms and never dies of
// "Too many subrequests" mid-run (a run killed there would delete nothing and save no cursor, every week).
export const PRUNE_SUBREQUEST_BUDGET = 95_000;

// The most media one run deletes: the delete set is held in memory until the hold has judged it (an isolate has
// 128 MB; 30,000 media is about 90,000 keys, some 10 MB), and its HEADs are the run's longest step (six in flight,
// about 75 seconds at R2's latency). About 120 GB of photographs a run: a 100 GB plan re-filled three times a
// month deletes about 19,000 media a week (PRICING.md, "Re-uploading"). Past it, the run stops with a counted
// `remaining` and the next run carries on. The name is the one the app's confirm route and breaker cite.
export const PRUNE_DELETE_CAP_PER_RUN = 30_000;

// Ids a confirm call carries: the app's confirm route refuses more than MAX_ROWS (1,000) in one body.
export const PRUNE_CONFIRM_BATCH = 1000;

// HEADs in flight at once: a Worker may hold six connections waiting for response headers (an R2 call included);
// a seventh only queues.
export const PRUNE_HEAD_CONCURRENCY = 6;

// Only the literal "live" enables real deletes. Anything else (incl. unset / "dryrun") is a dry run:
// the prune runs the full pipeline and logs what it WOULD delete, but deletes nothing. Default-safe so
// a misconfigured var can never delete; flipping to live is a deliberate post-launch human action.
export function shouldDelete(mode: string | undefined): boolean {
  return mode === "live";
}

// True once a backup object is old enough to prune (past the lock + margin). `now` is passed in so this
// stays pure/testable. A future-dated `uploaded` (clock skew) is treated as not eligible.
export function isPrunableAge(uploaded: Date, now: number): boolean {
  const age = now - uploaded.getTime();
  return age >= PRUNE_LOCK_MIN_AGE_MS;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pull the mediaId out of an event-media key, or null if the key is not our exact layout
// (events/<eventId>/<kind>/<mediaId>/<variant>.<ext>, mediaId a UUID). A deliberate small duplication
// of the app's src/lib/r2/keys.ts parseMediaIdFromKey: the Worker is a separate package (it cannot
// import app code), and "never delete a key we cannot positively identify" must hold independently
// here. Avatars (avatars/<userId>/avatar.webp) are not in the backup at all and return null regardless.
export function parseMediaIdFromKey(key: string): string | null {
  const segments = key.split("/");
  if (segments.length !== 5) return null;
  if (segments[0] !== "events") return null;
  const mediaId = segments[3];
  return UUID_RE.test(mediaId) ? mediaId : null;
}

// True when a key matches our recognized event-media layout (parseMediaIdFromKey returns non-null).
export function isRecognizedMediaKey(key: string): boolean {
  return parseMediaIdFromKey(key) !== null;
}
