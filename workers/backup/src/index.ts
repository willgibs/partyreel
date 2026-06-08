/**
 * Partyreel media-backup Worker (ADR-0013, Pillar B).
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
 * with the lock, and they're derivable. (See ADR-0013 / "Queued next initiatives": avatars move to
 * Supabase Storage.) The event-notification subscription is filtered to `--prefix events/`, and the
 * reconciliation sweep lists only `events/`, so avatars never reach this Worker.
 */
import { COPY_PART_BYTES, needsMultipart, partRanges } from "./strategy";
import {
  PRUNE_DELETE_CAP_PER_RUN,
  PRUNE_LIST_MAX_PER_RUN,
  isPrunableAge,
  parseMediaIdFromKey,
  shouldDelete,
} from "./prune-strategy";

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
// instead of HEAD-per-object once counts grow large (ADR-0013 scale note).
const RECONCILE_MAX_PER_RUN = 5000;

// The prune runs on a SEPARATE weekly cron (Mondays 06:00 UTC, after the app's 04:00 purge + the
// 05:00 reconcile). scheduled() branches on controller.cron to pick reconcile vs prune.
const PRUNE_CRON = "0 6 * * 1";

// R2's binding delete() accepts up to 1000 keys per call.
const MAX_DELETE_KEYS = 1000;

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

async function reconcile(env: Env): Promise<void> {
  let cursor: string | undefined;
  let checked = 0;
  let copied = 0;
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
        return;
      }
      checked++;
      try {
        if ((await backupOne(env, obj.key)) === "copied") copied++;
      } catch (err) {
        // Best-effort: log and move on; the next sweep retries this key.
        console.error("reconcile: copy failed", {
          key: obj.key,
          err: String(err),
        });
      }
    }
    if (!listed.truncated) break;
    cursor = listed.cursor;
  }
  console.log("reconcile: done", { checked, copied });
}

type ConfirmResult =
  | { trip: true; reason: string }
  | { trip: false; goneIds: string[] };

/**
 * Ask the app which of these mediaIds are GONE (no media row) and run the prune circuit-breaker — the
 * authoritative row count lives in the DB, which this Worker cannot reach. Fails CLOSED: any transport
 * or non-2xx error returns null so the caller aborts the run and deletes nothing.
 */
async function confirmGone(
  env: Env,
  mediaIds: string[],
  objectsScanned: number,
  mode: string,
): Promise<ConfirmResult | null> {
  try {
    // URL is guaranteed set by prune()'s guard before this is ever called.
    const res = await fetch(env.PRUNE_API_URL as string, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.PRUNE_API_SECRET}`,
      },
      body: JSON.stringify({ mediaIds, objectsScanned, mode }),
    });
    if (!res.ok) {
      console.error(
        `prune: confirm HTTP ${res.status}; aborting (deleted nothing)`,
      );
      return null;
    }
    return (await res.json()) as ConfirmResult;
  } catch (err) {
    console.error("prune: confirm request failed; aborting (deleted nothing)", {
      err: String(err),
    });
    return null;
  }
}

/**
 * Deletion-aware prune (ADR-0013, Pillar B) — the INVERSE of reconcile(): reclaim a backup object once
 * its source is gone. The ONLY job that deletes from the last-resort backup, so it is defense-in-depth:
 *   1. dry-run by default (PRUNE_MODE !== "live" deletes nothing — shouldDelete);
 *   2. an AGE gate (36-day margin past the 35-day Bucket Lock — isPrunableAge);
 *   3. a KEY-RECOGNITION gate (never delete a key we can't identify — parseMediaIdFromKey);
 *   4. a DUAL existence check: prune only when BOTH the primary R2 object is absent AND the media row
 *      is gone (the app confirms the row half + runs the breaker);
 *   5. an app-side circuit-breaker (media_table_empty) that fails CLOSED + alerts an operator;
 *   6. a per-run delete cap (PRUNE_DELETE_CAP_PER_RUN, enforced here across batches).
 * The Bucket Lock physically protects anything inside the 35-day window even if this logic is wrong.
 *
 * DB-first ordering: we HEAD the primary only for confirmed-gone items, so there is no per-live-object
 * HEAD (see docs/systems/durability-backups.md "Cost & scaling").
 */
async function prune(env: Env): Promise<void> {
  if (!env.PRUNE_API_URL || !env.PRUNE_API_SECRET) {
    console.error(
      "prune: PRUNE_API_URL / PRUNE_API_SECRET not set; skipping run",
    );
    return;
  }
  const mode = env.PRUNE_MODE ?? "dryrun";
  const live = shouldDelete(env.PRUNE_MODE);

  // Cheap early-out (defense-in-depth vs the "primary is 0 B" landmine): if the primary has no event
  // media at all, the source is gone/uninitialized — never prune. The authoritative empty-trip is
  // media_table_empty app-side.
  const probe = await env.PRIMARY.list({ prefix: MEDIA_PREFIX, limit: 1 });
  if (probe.objects.length === 0) {
    console.warn(
      "prune: primary empty under events/; skipping (no source to compare against)",
    );
    return;
  }

  const now = Date.now();
  // Confirmed-gone candidates accumulated across batches: mediaId -> its age-eligible backup keys.
  const goneByMediaId = new Map<string, string[]>();
  let scanned = 0;
  let moreRemain = false;
  let done = false;
  let cursor: string | undefined;

  while (!done) {
    const listed: R2Objects = await env.BACKUP.list({
      prefix: MEDIA_PREFIX,
      cursor,
      limit: 1000,
    });

    // Group this page's age-eligible, recognized keys by mediaId (original + preview share one).
    const keysByMediaId = new Map<string, string[]>();
    for (const obj of listed.objects) {
      if (scanned >= PRUNE_LIST_MAX_PER_RUN) {
        moreRemain = true;
        done = true;
        console.warn(
          `prune: hit per-run scan cap (${PRUNE_LIST_MAX_PER_RUN}); next run continues`,
        );
        break;
      }
      scanned++;
      if (!isPrunableAge(obj.uploaded, now)) continue; // inside the lock window — physically protected
      const mediaId = parseMediaIdFromKey(obj.key);
      if (!mediaId) continue; // not our layout — never delete
      const arr = keysByMediaId.get(mediaId) ?? [];
      arr.push(obj.key);
      keysByMediaId.set(mediaId, arr);
    }

    if (keysByMediaId.size > 0) {
      const result = await confirmGone(
        env,
        [...keysByMediaId.keys()],
        scanned,
        mode,
      );
      if (!result || result.trip) {
        if (result?.trip) {
          console.error(
            `prune: circuit-breaker tripped (${result.reason}); deleted nothing`,
          );
        }
        return; // fail closed — confirm unavailable or breaker tripped
      }
      for (const mediaId of result.goneIds) {
        const keys = keysByMediaId.get(mediaId);
        if (keys) goneByMediaId.set(mediaId, keys);
      }
      if (goneByMediaId.size >= PRUNE_DELETE_CAP_PER_RUN) {
        moreRemain = true;
        done = true;
      }
    }

    if (!done) {
      if (listed.truncated) cursor = listed.cursor;
      else done = true;
    }
  }

  // Clamp to the per-run cap, then the SECOND gate: HEAD the primary and keep only keys whose primary
  // object is ALSO absent (the dual-gate). Only confirmed-gone items are HEADed -> no per-live HEAD.
  const cappedMediaIds = [...goneByMediaId.keys()].slice(
    0,
    PRUNE_DELETE_CAP_PER_RUN,
  );
  const toDelete: string[] = [];
  for (const mediaId of cappedMediaIds) {
    for (const key of goneByMediaId.get(mediaId) ?? []) {
      if (!(await env.PRIMARY.head(key))) toDelete.push(key); // primary also gone -> safe to prune
    }
  }

  if (!live) {
    console.log("prune: dry-run (set PRUNE_MODE=live to enable deletes)", {
      scanned,
      gone_media: goneByMediaId.size,
      would_delete_keys: toDelete.length,
      more_remain: moreRemain,
    });
    return;
  }

  // Live: delete from BACKUP in <=1000-key chunks. The binding delete() returns void, and a
  // still-locked delete is a silent no-op, so a thrown chunk (transient error) is logged + counted,
  // never retried-to-crash; the age gate already kept us outside the lock window.
  let deleted = 0;
  let errored = 0;
  for (let i = 0; i < toDelete.length; i += MAX_DELETE_KEYS) {
    const chunk = toDelete.slice(i, i + MAX_DELETE_KEYS);
    try {
      await env.BACKUP.delete(chunk);
      deleted += chunk.length;
    } catch (err) {
      errored += chunk.length;
      console.error("prune: delete chunk failed", {
        count: chunk.length,
        err: String(err),
      });
    }
  }
  console.log("prune: done", {
    scanned,
    gone_media: goneByMediaId.size,
    deleted,
    errored,
    more_remain: moreRemain,
  });
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
