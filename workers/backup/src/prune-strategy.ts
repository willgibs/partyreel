// Pure helpers for the media-backup Worker's deletion-aware prune (ADR-0013, Pillar B).
// NO Worker globals here on purpose — this module is unit-tested in plain Node (prune-strategy.test.ts).
//
// The prune is the INVERSE of the orphan sweep and the ONLY job that deletes from the last-resort
// backup, so these helpers encode its two LOCAL safety gates: an AGE gate (never delete inside the
// Bucket Lock window) and a KEY-RECOGNITION gate (never delete a key we cannot positively identify).
// The DB confirm + the circuit-breaker live app-side (src/lib/r2/prune-guard.ts); the per-run delete
// cap is applied by index.ts as it accumulates confirmed-gone candidates across batches.

// The backup bucket has a 35-day Bucket Lock (WORM). We use a 36-day floor (one day of margin) so we
// never even ATTEMPT to delete an object inside the lock: a locked-object delete is a SILENT
// server-side no-op that RETURNS SUCCESS (see README "Ops gotcha"), which would otherwise inflate our
// deleted counts with deletes that never happened. The lock is the physical backstop; this age gate is
// the correctness gate. Age is read from R2's `uploaded` timestamp — the time the BACKUP copy was
// written, which is exactly what the lock retention is measured from.
export const PRUNE_LOCK_MIN_AGE_MS = 36 * 24 * 60 * 60 * 1000; // 36 days

// Cap backup objects examined per run so a weekly sweep stays bounded (mirrors RECONCILE_MAX_PER_RUN).
// If hit, the next run continues (already-pruned objects are simply absent next time).
export const PRUNE_LIST_MAX_PER_RUN = 5000;

// Max backup objects a single prune run may DELETE. A CLAMP, not a trip: a legitimate backlog (lots of
// media churned out of the primary at once) is EXPECTED for an accrue-only backup, so index.ts drains
// it over several weekly runs rather than refusing to run. Smaller than the orphan sweep's 1000 cap —
// this is the more dangerous bucket and the weekly cadence gives ample runs to drain a real backlog.
// Enforced here (Worker-side) because the app confirm endpoint is stateless per batch.
export const PRUNE_DELETE_CAP_PER_RUN = 500;

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
