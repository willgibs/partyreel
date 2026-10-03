/**
 * Partyreel media-backup Worker (durability-backups.md, Pillar B).
 *
 * Real-time, append-only, immutable second copy of all EVENT media. Runs entirely on Cloudflare
 * (zero egress, off Vercel, scales O(uploads)). Two entry points, one Worker:
 *
 *   queue()     — R2 `object-create` event notifications for the `events/` prefix arrive via a Queue;
 *                 each new object is copied PRIMARY -> BACKUP within seconds (RPO ~ seconds).
 *   scheduled() — a daily reconciliation sweep: copy any `events/` object missing from BACKUP. This
 *                 is the backstop for missed/failed events AND the one-time initial seed of objects
 *                 that predate the Worker.
 *
 * The BACKUP bucket is in a different region (WNAM) with a Bucket Lock (>= the 30-day recovery
 * window) so nothing — not the purge cron, not a compromised token, not a bug — can delete a backup
 * object within the window. Because a locked object cannot be overwritten AND our media keys are
 * write-once (events/<eventId>/<kind>/<mediaId>/<variant>.<ext>), every copy is idempotent: if the
 * key already exists in BACKUP we skip it (this is also why Queue redelivery + reconciliation are safe).
 *
 * Avatars (avatars/...) are intentionally NOT backed up here: they overwrite-in-place, which conflicts
 * with the lock, and they're derivable. (See durability-backups.md / "Queued next initiatives": avatars move to
 * Supabase Storage.) The event-notification subscription is filtered to `--prefix events/`, and the
 * reconciliation sweep lists only `events/`, so avatars never reach this Worker.
 */
import { jobFinish, jobStart } from "./job-heartbeat";
import { COPY_PART_BYTES, needsMultipart, partRanges } from "./strategy";
import { parseLedger } from "./prune-ledger";
import { readConfirmAnswer, runPrune, type ConfirmAnswer } from "./prune-run";
import { PRUNE_STATE_NAME, PruneState } from "./prune-state";
import { depthNote, readQueueDepths, type DepthCounts } from "./queue-metrics";

// The prune's ledger lives in this Durable Object class; a Worker exports the classes its bindings name.
export { PruneState };

export type Env = {
  /** Source bucket (the live `partyreel` bucket), bound read-only in practice. */
  PRIMARY: R2Bucket;
  /** Destination bucket (`partyreel-backup`, different region, IA, Bucket-Locked). */
  BACKUP: R2Bucket;
  /** Prune mode: the literal "live" enables deletes; anything else (incl. unset) is a dry run. */
  PRUNE_MODE?: string;
  /** App endpoint that row-confirms gone mediaIds + runs the prune breaker (the Worker can't reach the DB). */
  PRUNE_API_URL?: string;
  /** Shared bearer secret for PRUNE_API_URL (`wrangler secret put PRUNE_API_SECRET`). */
  PRUNE_API_SECRET?: string;
  /**
   * Producer bindings for the live queue and its dead-letter queue, used ONLY to read their depth
   * (`Queue.metrics()`); this Worker never sends to either. OPTIONAL so a deploy whose wrangler.jsonc
   * predates them still backs media up and simply reports no depth reading. See queue-metrics.ts.
   */
  BACKUP_QUEUE?: Queue;
  BACKUP_DLQ?: Queue;
  /**
   * The prune's ledger (prune-state.ts): its cursor, its last runs and its hold. OPTIONAL so a deploy whose
   * wrangler.jsonc predates it still backs media up; the prune then runs dry and says why (it will not delete
   * without knowing whether a hold stands).
   */
  PRUNE_STATE?: DurableObjectNamespace<PruneState>;
};

/**
 * R2 event-notification message body (the `object-create` subset). Shape per Cloudflare's R2 event
 * notifications schema. We only need the object key; everything else is informational.
 */
type R2EventMessage = {
  account?: string;
  bucket?: string;
  action?: string; // PutObject | CompleteMultipartUpload | CopyObject (object-create subset)
  object?: { key?: string; size?: number; eTag?: string };
  eventTime?: string;
};

// Write the backup copy as Infrequent Access: it's cold (read only during a real restore), so IA's
// lower storage price applies and its retrieval fee effectively never does.
const STORAGE_CLASS = "InfrequentAccess" as const;

// Only ever touch the event-media prefix (defense in depth — the subscription is already prefixed).
const MEDIA_PREFIX = "events/";

// Reconciliation: cap objects examined per run so a daily sweep stays bounded. If we hit this, the
// next run continues (objects already copied are skipped cheaply). Revisit a KV/D1 copy-state index
// instead of HEAD-per-object once counts grow large (durability-backups.md scale note).
const RECONCILE_MAX_PER_RUN = 5000;

// The prune runs on a SEPARATE weekly cron (Mondays 06:00 UTC, after the app's 04:00 purge + the
// 05:00 reconcile). scheduled() branches on controller.cron to pick reconcile vs prune.
const PRUNE_CRON = "0 6 * * 1";

type CopyResult = "copied" | "exists" | "missing";

/**
 * Copy one object PRIMARY -> BACKUP, idempotently. `exists` = already backed up (skip), `missing` =
 * the source is gone (raced a delete; nothing to do). Throws only on a real transfer error so the
 * caller can retry.
 */
async function backupOne(env: Env, key: string): Promise<CopyResult> {
  // Idempotency + lock-safety: a locked backup object can't be overwritten, and our media keys are
  // write-once, so presence == done. Makes Queue redelivery and the reconciliation sweep safe.
  const already = await env.BACKUP.head(key);
  if (already) return "exists";

  const src = await env.PRIMARY.get(key);
  if (!src) return "missing";

  const { httpMetadata } = src;
  const size = src.size;

  if (!needsMultipart(size)) {
    // Small object: stream the body straight through (no full-object buffering).
    await env.BACKUP.put(key, src.body, {
      httpMetadata,
      storageClass: STORAGE_CLASS,
    });
    return "copied";
  }

  // Large object: multipart copy. Re-fetch the source in ranges (we only used the first get for its
  // size) and upload one buffered part at a time — bounded memory, each part an independent subrequest.
  const mp = await env.BACKUP.createMultipartUpload(key, {
    httpMetadata,
    storageClass: STORAGE_CLASS,
  });
  try {
    const uploaded: R2UploadedPart[] = [];
    for (const range of partRanges(size, COPY_PART_BYTES)) {
      const part = await env.PRIMARY.get(key, {
        range: { offset: range.offset, length: range.length },
      });
      if (!part) {
        throw new Error(
          `source range ${range.offset}+${range.length} vanished for ${key}`,
        );
      }
      const body = await part.arrayBuffer();
      uploaded.push(await mp.uploadPart(range.partNumber, body));
    }
    await mp.complete(uploaded);
    return "copied";
  } catch (err) {
    // Don't leave a dangling multipart (R2 auto-aborts after 7d, but be tidy + idempotent on retry).
    await mp.abort().catch(() => {});
    throw err;
  }
}

type ReconcileTally = {
  checked: number;
  copied: number;
  failed: number;
  capped: boolean;
};

async function reconcileSweep(env: Env): Promise<ReconcileTally> {
  let cursor: string | undefined;
  let checked = 0;
  let copied = 0;
  let failed = 0;
  for (;;) {
    const listed: R2Objects = await env.PRIMARY.list({
      prefix: MEDIA_PREFIX,
      cursor,
      limit: 1000,
    });
    for (const obj of listed.objects) {
      if (checked >= RECONCILE_MAX_PER_RUN) {
        console.warn(
          `reconcile: hit per-run cap (${RECONCILE_MAX_PER_RUN}); next run continues`,
          { checked, copied },
        );
        return { checked, copied, failed, capped: true };
      }
      checked++;
      try {
        if ((await backupOne(env, obj.key)) === "copied") copied++;
      } catch (err) {
        // Best-effort: log and move on; the next sweep retries this key. Counted, though: a run
        // that copied nothing because every key threw must not close as a green `ok`.
        failed++;
        console.error("reconcile: copy failed", {
          key: obj.key,
          err: String(err),
        });
      }
    }
    if (!listed.truncated) break;
    cursor = listed.cursor;
  }
  return { checked, copied, failed, capped: false };
}

/**
 * The daily backstop, wrapped in its kill switch + heartbeat (admin-portal P8). FAILS OPEN on an
 * unreachable heartbeat: this is the media backup's safety net, so a missing copy is a durability
 * risk while a missing log line is only a blind spot. The run happens either way; only the record
 * of it is lost, and the app's freshness scan will notice the silence.
 */
async function reconcile(env: Env): Promise<void> {
  const gate = await jobStart(env, "backup_reconcile");
  if (gate.ok && gate.paused) {
    console.warn("reconcile: paused from /admin/jobs; skipped this run");
    return;
  }
  if (!gate.ok) {
    console.warn("reconcile: heartbeat unavailable; running unlogged", {
      err: gate.error,
    });
  }
  const run = gate.ok ? gate.run : null;

  // Read the depths FIRST and reuse them on both exits. They are a reading about the queue, not about
  // this sweep, so a run that then fails must still report them: a reconcile that died is exactly
  // when an operator most needs to know how deep the dead-letter queue is.
  const depths = await readQueueDepths(env);

  try {
    const tally = await reconcileSweep(env);
    console.log("reconcile: done", tally, depths);
    await jobFinish(env, "backup_reconcile", run, {
      status: tally.failed > 0 ? "error" : "ok",
      counts: { ...tally, ...depths },
      note: joinNotes(
        tally.failed > 0 ? `${tally.failed} object(s) failed to copy` : null,
        depthNote(depths),
      ),
    });
  } catch (err) {
    // A throw here is the sweep itself failing (a list call, not a single key). Close the row as an
    // error so /admin/jobs shows a failure rather than a run stuck open forever.
    console.error("reconcile: run failed", { err: String(err) });
    await jobFinish(env, "backup_reconcile", run, {
      status: "error",
      counts: depths,
      note: String(err).slice(0, 300),
    });
  }
}

/** Two optional lines into one note, or undefined when there is nothing to say. */
function joinNotes(
  ...parts: (string | null | undefined)[]
): string | undefined {
  const kept = parts.filter((p): p is string => Boolean(p));
  return kept.length ? kept.join("; ").slice(0, 500) : undefined;
}

/**
 * Ask the app which of these mediaIds have no `media` row (it also runs the prune's circuit-breaker on the real row
 * count, which this Worker cannot reach). Any transport error, non-2xx or answer of the wrong shape is
 * `unavailable`, and the run deletes nothing (prune-run.ts).
 */
async function confirmGone(
  env: Env,
  mediaIds: string[],
  objectsScanned: number,
  mode: string,
): Promise<ConfirmAnswer> {
  try {
    // URL and secret are guaranteed set by pruneRun()'s guard before this is ever called.
    const res = await fetch(env.PRUNE_API_URL as string, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.PRUNE_API_SECRET}`,
      },
      body: JSON.stringify({ mediaIds, objectsScanned, mode }),
    });
    if (!res.ok) {
      await res.body?.cancel();
      return { kind: "unavailable", detail: `HTTP ${res.status}` };
    }
    return readConfirmAnswer(await res.json());
  } catch (err) {
    return { kind: "unavailable", detail: String(err).slice(0, 120) };
  }
}

/**
 * Deletion-aware prune (durability-backups.md, Pillar B): the INVERSE of reconcile(), reclaiming a backup object
 * once its source is gone, and the ONLY job that deletes from the last-resort backup. The run itself is
 * prune-run.ts (primary first, three readings before a delete, a doubt deletes nothing, its caps its budget); this
 * is its wiring: the bindings, the confirm route, and the ledger it resumes from.
 *
 * Every exit reports an outcome, so a fail-closed abort is visible on /admin/jobs instead of looking like a run that
 * never happened.
 */
type PruneOutcome = {
  status: "ok" | "error";
  note?: string;
  counts: Record<string, number | string | boolean>;
};

async function pruneRun(env: Env): Promise<PruneOutcome> {
  if (!env.PRUNE_API_URL || !env.PRUNE_API_SECRET) {
    console.error(
      "prune: PRUNE_API_URL / PRUNE_API_SECRET not set; skipping run",
    );
    return {
      status: "error",
      note: "PRUNE_API_URL / PRUNE_API_SECRET not set",
      counts: {},
    };
  }

  // THE LEDGER. A store that cannot be read is a doubt about whether a hold stands, so the run goes ahead DRY
  // (it still reports what it would do) and saves nothing over what it could not read. A store that reads back
  // damaged is repaired: parseLedger's fallbacks are all the safe direction (the head, the floor, a fresh hold).
  const notes: string[] = [];
  let mode = env.PRUNE_MODE ?? "dryrun";
  let raw: unknown = null;
  let readable = true;
  const store = env.PRUNE_STATE
    ? env.PRUNE_STATE.get(env.PRUNE_STATE.idFromName(PRUNE_STATE_NAME))
    : null;
  if (!store) {
    readable = false;
    notes.push("No ledger binding: ran dry from the head, deleted nothing.");
  } else {
    try {
      raw = await store.load();
    } catch (err) {
      readable = false;
      console.error("prune: ledger unreadable", { err: String(err) });
      notes.push("Ledger unreadable: ran dry from the head, deleted nothing.");
    }
  }
  if (!readable) mode = "dryrun";
  const parsed = parseLedger(raw);
  if (parsed.note) notes.push(parsed.note);

  const result = await runPrune(
    {
      backup: env.BACKUP,
      primary: env.PRIMARY,
      confirm: (ids, scanned) => confirmGone(env, ids, scanned, mode),
      now: () => Date.now(),
    },
    { mode, ledger: parsed.ledger, startedAtMs: Date.now() },
  );
  console.log("prune: done", result.counts);

  let status = result.status;
  if (!readable || parsed.note) status = "error";
  if (result.ledger && store && readable) {
    try {
      await store.save(result.ledger);
    } catch (err) {
      status = "error";
      console.error("prune: ledger not saved", { err: String(err) });
      notes.push("Ledger not saved: the next run judges this ground again.");
    }
  }
  return {
    status,
    note: joinNotes(...notes, result.note),
    counts: result.counts,
  };
}

/**
 * The weekly prune, wrapped in its kill switch + heartbeat (admin-portal P8). FAILS CLOSED on an
 * unreachable heartbeat, unlike the reconcile: this is the only job in the system that deletes from
 * the last-resort copy, and it already refuses to act on any question it could not get answered. A
 * skipped prune costs a week of backup growth; a prune run against unknown state could cost the
 * backup itself.
 */
async function prune(env: Env): Promise<void> {
  const gate = await jobStart(env, "backup_prune");
  if (!gate.ok) {
    console.error("prune: heartbeat unavailable; skipping run (fails closed)", {
      err: gate.error,
    });
    return;
  }
  if (gate.paused) {
    console.warn("prune: paused from /admin/jobs; skipped this run");
    return;
  }

  // The weekly run reports the depths too, so a week where the daily reconcile itself stopped firing
  // still leaves one fresh reading of the queue behind it.
  const depths: DepthCounts = await readQueueDepths(env);

  try {
    const outcome = await pruneRun(env);
    await jobFinish(env, "backup_prune", gate.run, {
      ...outcome,
      counts: { ...outcome.counts, ...depths },
      note: joinNotes(outcome.note, depthNote(depths)),
    });
  } catch (err) {
    console.error("prune: run failed", { err: String(err) });
    await jobFinish(env, "backup_prune", gate.run, {
      status: "error",
      counts: depths,
      note: String(err).slice(0, 300),
    });
  }
}

export default {
  // Real-time path: one message per `object-create` under `events/`.
  async queue(batch: MessageBatch<R2EventMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const key = message.body?.object?.key;
      if (!key) {
        // Malformed / unexpected payload — ack so it doesn't poison the queue (nothing to copy).
        console.warn("queue: message had no object key", { id: message.id });
        message.ack();
        continue;
      }
      try {
        await backupOne(env, key);
        message.ack();
      } catch (err) {
        // Transient transfer error — let the Queue retry; repeated failures land in the DLQ.
        console.error("queue: backup failed, will retry", {
          key,
          err: String(err),
        });
        message.retry();
      }
    }
  },

  // Daily cron runs the reconcile backstop + initial seed; the weekly cron runs the deletion-aware
  // prune. Both share this one handler — branch on which cron fired (Cloudflare passes its expression).
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    if (controller.cron === PRUNE_CRON) {
      ctx.waitUntil(prune(env));
    } else {
      ctx.waitUntil(reconcile(env));
    }
  },
} satisfies ExportedHandler<Env, R2EventMessage>;
