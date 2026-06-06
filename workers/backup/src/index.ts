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

export type Env = {
  /** Source bucket (the live `partyreel` bucket), bound read-only in practice. */
  PRIMARY: R2Bucket;
  /** Destination bucket (`partyreel-backup`, different region, IA, Bucket-Locked). */
  BACKUP: R2Bucket;
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

  // Backstop + initial seed.
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(reconcile(env));
  },
} satisfies ExportedHandler<Env, R2EventMessage>;
