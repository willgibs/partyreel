/**
 * QUEUE + DEAD-LETTER DEPTH, read by the Worker and reported on every scheduled run.
 *
 * The backlog of the live copy path and, more importantly, its DEAD LETTERS were visible only on the
 * Cloudflare dashboard. A dead letter is a media object the real-time path gave up on after all five
 * retries: it has no backup copy until a reconcile sweep happens to catch it, and nothing in
 * Partyreel ever said so. That is the exact shape of silent failure /admin/jobs exists to end, and
 * the only process that can see it is this Worker.
 *
 * HOW: `Queue.metrics()` (Cloudflare, April 2026) returns the realtime backlog of a queue through an
 * ordinary producer binding — `backlogCount`, `backlogBytes` and the oldest unacknowledged message's
 * timestamp. This Worker never SENDS to either queue; the bindings exist only so it can ask. That is
 * why they are optional in `Env`: the Worker keeps running (and keeps backing media up) on a deploy
 * where wrangler.jsonc has not been updated yet, and simply reports no reading.
 *
 * ★ A DEPTH READ MUST NEVER COST A RUN. Every read is independently guarded, and a failure yields
 * "no reading" rather than a throw: the reconcile's job is copying objects, and losing that to a
 * metrics call would be a durability regression traded for an observability gain. "No reading" is
 * also never reported as zero — the app side treats an absent key as unknown and says so on the card,
 * because a fabricated zero on a dead-letter card is worse than no card at all.
 */

/** Just the shape this module needs; the full Env lives in index.ts. */
export type QueueMetricsEnv = {
  /** Producer binding for the live backup queue. Read-only in practice (metrics, never send). */
  BACKUP_QUEUE?: Queue;
  /** Producer binding for its dead-letter queue. Same: this Worker only ever asks its depth. */
  BACKUP_DLQ?: Queue;
};

/**
 * The `counts` keys these readings travel under. MIRRORED in the app's pure catalog
 * (`DEPTH_COUNT_KEYS` / `DEPTH_AGE_COUNT_KEYS` in src/app/admin/jobs/catalog.ts), because the Worker
 * is a separate package and cannot import from it. A parity test on the app side pins the strings;
 * change one and change both.
 */
export const DEPTH_KEYS = {
  queueBacklog: "queue_backlog",
  queueOldestMin: "queue_oldest_min",
  deadLetterBacklog: "dead_letter_backlog",
  deadLetterOldestMin: "dead_letter_oldest_min",
} as const;

export type DepthCounts = Record<string, number>;

/** What one queue answered, or null when it could not be asked. */
export type QueueReading = {
  backlog: number;
  /** Age of the oldest unacknowledged message, in whole minutes. Null when the queue is empty. */
  oldestMinutes: number | null;
};

/** Minimal surface so the unit test can hand in a fake without a Workers runtime. */
export type MetricsSource = {
  metrics(): Promise<{
    backlogCount: number;
    backlogBytes: number;
    oldestMessageTimestamp?: Date;
  }>;
};

/**
 * Ask one queue for its depth. Returns null on ANY failure (an unbound queue, a transient API error,
 * a runtime too old for `metrics()`), because the caller must carry on either way.
 */
export async function readQueue(
  queue: MetricsSource | undefined,
  nowMs: number,
  label: string,
): Promise<QueueReading | null> {
  if (!queue || typeof queue.metrics !== "function") return null;
  try {
    const m = await queue.metrics();
    const backlog = Number(m.backlogCount);
    if (!Number.isFinite(backlog)) return null;
    const oldest = m.oldestMessageTimestamp
      ? Math.max(
          0,
          Math.round((nowMs - m.oldestMessageTimestamp.getTime()) / 60_000),
        )
      : null;
    return { backlog, oldestMinutes: oldest };
  } catch (err) {
    console.error("queue metrics: read failed", {
      queue: label,
      err: String(err),
    });
    return null;
  }
}

/**
 * Both depths, flattened into the `counts` keys the heartbeat carries. An unreadable queue
 * contributes NO key at all, which the app reads as "no reading" — never as a healthy zero.
 */
export async function readQueueDepths(
  env: QueueMetricsEnv,
  nowMs: number = Date.now(),
): Promise<DepthCounts> {
  const [live, dead] = await Promise.all([
    readQueue(env.BACKUP_QUEUE, nowMs, "partyreel-backup"),
    readQueue(env.BACKUP_DLQ, nowMs, "partyreel-backup-dlq"),
  ]);

  const counts: DepthCounts = {};
  if (live) {
    counts[DEPTH_KEYS.queueBacklog] = live.backlog;
    if (live.oldestMinutes !== null) {
      counts[DEPTH_KEYS.queueOldestMin] = live.oldestMinutes;
    }
  }
  if (dead) {
    counts[DEPTH_KEYS.deadLetterBacklog] = dead.backlog;
    if (dead.oldestMinutes !== null) {
      counts[DEPTH_KEYS.deadLetterOldestMin] = dead.oldestMinutes;
    }
  }
  return counts;
}

/**
 * One operator-readable line for a run that found dead letters, appended to whatever the sweep
 * itself had to say. Null when there is nothing to add, so a healthy run's note stays empty.
 */
export function depthNote(counts: DepthCounts): string | null {
  const dead = counts[DEPTH_KEYS.deadLetterBacklog];
  if (typeof dead !== "number" || dead <= 0) return null;
  const oldest = counts[DEPTH_KEYS.deadLetterOldestMin];
  const age =
    typeof oldest === "number" ? `, oldest ${formatMinutes(oldest)}` : "";
  return `${dead} dead letter${dead === 1 ? "" : "s"} waiting${age}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}
