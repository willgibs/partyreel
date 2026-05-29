/**
 * Phase 3 purge sweeper — Vercel Cron (daily, see vercel.json). Reclaims storage
 * by HARD-deleting media that has aged out of its recoverable tail, plus orphaned
 * R2 objects. This is the ONLY path that frees real bytes (R2 + DB rows +
 * profiles.storage_used_bytes); everything upstream is soft state.
 *
 * AUTH: Vercel auto-sends `Authorization: Bearer $CRON_SECRET`. We fail CLOSED —
 * no secret configured, or a mismatch, returns 401 and runs nothing. The compare
 * is timing-safe (sha256 + timingSafeEqual) so it leaks neither value nor length.
 *
 * ORDERING (load-bearing): for each batch we delete R2 OBJECTS FIRST, then the DB
 * rows. WHY: deleting an event row cascades (FK) to its media rows — which would
 * destroy the original_key/preview_key we still need to delete from R2. R2-then-DB
 * also makes a crash recoverable: leftover rows whose objects are gone get retried
 * (R2 delete of an absent key is a no-op success), and leftover objects whose rows
 * are gone get caught by the orphan sweep.
 *
 * Each sweep is independently try/caught so one failure doesn't abort the rest.
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { assertCronEnv } from "@/lib/env";
import { deleteR2Objects, listR2Objects } from "@/lib/r2/delete";
import { parseMediaIdFromKey } from "@/lib/r2/keys";
import { createAdminClient } from "@/lib/supabase/admin";

// node:crypto + the service-role admin client require the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// R2 list/delete + DB deletes can take a while on a large backlog.
export const maxDuration = 60;

// Individually-removed media gets a short recoverable grace before hard-delete; the
// 60-day event tail is separate (events.purge_at, set on soft-delete).
const REMOVED_GRACE_DAYS = 7;
// Default tail for legacy soft-deletes that predate purge_at (deleted_at + this).
const EVENT_TAIL_DAYS = 60;
// An orphan candidate must be older than this — well past the 15-min presign TTL —
// so we never race an in-flight upload (presigned, PUT in progress, create_media
// not yet called) and delete a brand-new object.
const ORPHAN_MIN_AGE_HOURS = 24;
// Cap R2 list pages per run so one invocation stays bounded (≤1000 objects/page).
const ORPHAN_PAGE_CAP = 20;
const MEDIA_PREFIX = "events/";

type AdminClient = ReturnType<typeof createAdminClient>;
type MediaRow = {
  id: string;
  original_key: string;
  preview_key: string | null;
};

function keysOf(rows: MediaRow[]): string[] {
  const keys: string[] = [];
  for (const r of rows) {
    keys.push(r.original_key);
    if (r.preview_key) keys.push(r.preview_key);
  }
  return keys;
}

function constantTimeEquals(a: string, b: string): boolean {
  // Hash to a fixed length first: timingSafeEqual throws on unequal-length buffers,
  // and we don't want to leak the secret's length via that error/short-circuit.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function GET(request: Request): Promise<Response> {
  let cronSecret: string;
  try {
    cronSecret = assertCronEnv().CRON_SECRET;
  } catch {
    // Fail closed — better a broken cron than an unauthenticated purge.
    return new Response("Cron not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  // Track media ids handled by earlier sweeps so a later sweep can't double-process.
  const handled = new Set<string>();
  const sweeps: Record<string, unknown> = {};

  try {
    sweeps.expired_events = await sweepExpiredEvents(admin, now, handled);
  } catch (e) {
    sweeps.expired_events = { error: String(e) };
  }
  try {
    sweeps.removed_media = await sweepRemovedMedia(admin, now, handled);
  } catch (e) {
    sweeps.removed_media = { error: String(e) };
  }
  try {
    sweeps.orphans = await sweepOrphans(admin, now);
  } catch (e) {
    sweeps.orphans = { error: String(e) };
  }

  return Response.json({ ok: true, ran_at: now.toISOString(), sweeps });
}

/**
 * Sweep 1 — events whose recoverable tail has elapsed. Hard-delete their media (R2
 * + rows + usage), then the event rows (cascades to guests/reels/reports).
 * `coalesce(purge_at, deleted_at + 60d)` so legacy soft-deletes (no purge_at) are
 * still reclaimed instead of leaking storage forever.
 */
async function sweepExpiredEvents(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  const nowIso = now.toISOString();
  const legacyCutoffIso = new Date(
    now.getTime() - EVENT_TAIL_DAYS * 86_400_000,
  ).toISOString();

  const { data: events, error } = await admin
    .from("events")
    .select("id")
    .not("deleted_at", "is", null)
    .or(
      `purge_at.lte.${nowIso},and(purge_at.is.null,deleted_at.lte.${legacyCutoffIso})`,
    );
  if (error) throw new Error(`select events: ${error.message}`);

  const eventIds = (events ?? []).map((e) => e.id);
  if (eventIds.length === 0) {
    return {
      events: 0,
      media_rows: 0,
      r2_deleted: 0,
      r2_errored: 0,
      freed_bytes: 0,
    };
  }

  const { data: media, error: mErr } = await admin
    .from("media")
    .select("id, original_key, preview_key")
    .in("event_id", eventIds);
  if (mErr) throw new Error(`select media: ${mErr.message}`);

  const rows = (media ?? []) as MediaRow[];
  const mediaIds = rows.map((r) => r.id);
  const r2 = await deleteR2Objects(keysOf(rows));
  const freed = mediaIds.length ? await purgeRows(admin, mediaIds) : 0;
  mediaIds.forEach((id) => handled.add(id));

  // Now safe to drop the event rows — their media is gone, so the FK cascade has
  // nothing of value left to destroy.
  const { error: delErr } = await admin
    .from("events")
    .delete()
    .in("id", eventIds);
  if (delErr) throw new Error(`delete events: ${delErr.message}`);

  return {
    events: eventIds.length,
    media_rows: mediaIds.length,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    freed_bytes: freed,
  };
}

/**
 * Sweep 2 — individually-removed media (status='removed') past its grace window.
 * A host "remove" frees the per-event slot immediately (counts skip 'removed'); the
 * bytes are reclaimed here after the grace, giving an undo tail.
 */
async function sweepRemovedMedia(
  admin: AdminClient,
  now: Date,
  handled: Set<string>,
) {
  const cutoffIso = new Date(
    now.getTime() - REMOVED_GRACE_DAYS * 86_400_000,
  ).toISOString();

  const { data: media, error } = await admin
    .from("media")
    .select("id, original_key, preview_key")
    .eq("status", "removed")
    .lte("removed_at", cutoffIso);
  if (error) throw new Error(`select removed media: ${error.message}`);

  const rows = ((media ?? []) as MediaRow[]).filter((r) => !handled.has(r.id));
  if (rows.length === 0) {
    return { media_rows: 0, r2_deleted: 0, r2_errored: 0, freed_bytes: 0 };
  }

  const mediaIds = rows.map((r) => r.id);
  const r2 = await deleteR2Objects(keysOf(rows));
  const freed = await purgeRows(admin, mediaIds);
  mediaIds.forEach((id) => handled.add(id));

  return {
    media_rows: mediaIds.length,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    freed_bytes: freed,
  };
}

/**
 * Sweep 3 — orphaned R2 objects: uploaded bytes with no media row (a presign that
 * raced create_media, or stragglers from a crashed earlier sweep). No counter
 * change — orphans were never counted toward storage_used_bytes. Only deletes
 * objects older than ORPHAN_MIN_AGE_HOURS and only ones we positively recognize
 * (parseMediaIdFromKey); unrecognized keys are left untouched.
 */
async function sweepOrphans(admin: AdminClient, now: Date) {
  const ageCutoff = now.getTime() - ORPHAN_MIN_AGE_HOURS * 3_600_000;
  const orphanKeys: string[] = [];
  let token: string | undefined;
  let pages = 0;

  do {
    const { objects, nextToken } = await listR2Objects({
      prefix: MEDIA_PREFIX,
      continuationToken: token,
    });
    pages += 1;

    // Group aged objects by mediaId so original+preview for one item resolve together.
    const keysByMediaId = new Map<string, string[]>();
    for (const o of objects) {
      if (!o.lastModified || o.lastModified.getTime() > ageCutoff) continue;
      const mediaId = parseMediaIdFromKey(o.key);
      if (!mediaId) continue; // not our layout → never delete
      const arr = keysByMediaId.get(mediaId) ?? [];
      arr.push(o.key);
      keysByMediaId.set(mediaId, arr);
    }

    const candidateIds = [...keysByMediaId.keys()];
    if (candidateIds.length > 0) {
      const { data: existing, error } = await admin
        .from("media")
        .select("id")
        .in("id", candidateIds);
      if (error) throw new Error(`select media for orphans: ${error.message}`);
      const existingIds = new Set((existing ?? []).map((r) => r.id));
      for (const [mediaId, keys] of keysByMediaId) {
        if (!existingIds.has(mediaId)) orphanKeys.push(...keys);
      }
    }

    token = nextToken ?? undefined;
  } while (token && pages < ORPHAN_PAGE_CAP);

  const r2 = orphanKeys.length
    ? await deleteR2Objects(orphanKeys)
    : { deleted: 0, errored: [] };

  return {
    scanned_pages: pages,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    // True if we hit the page cap with more to list — next run continues from the top.
    more_remain: Boolean(token),
  };
}

/** Atomic hard-delete of rows + storage_used_bytes decrement; returns Σ freed bytes. */
async function purgeRows(
  admin: AdminClient,
  mediaIds: string[],
): Promise<number> {
  const { data, error } = await admin.rpc("purge_media_rows", {
    p_media_ids: mediaIds,
  });
  if (error) throw new Error(`purge_media_rows: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + Number(r.freed_bytes ?? 0), 0);
}
