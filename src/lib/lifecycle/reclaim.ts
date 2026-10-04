/**
 * THE ONE WAY BYTES LEAVE, shared by every purge sweep and account deletion (the 1,000-row round,
 * 2026-09-23): R2 objects FIRST, then the rows through `purge_media_rows`, never more than
 * `MAX_ROWS` ids a call; and the one legal-hold question the event-level purges ask.
 *
 * R2 FIRST (load-bearing): deleting a row, or the event row that cascades to it, destroys the
 * `original_key` / `preview_key` / `phone_key` the object delete still needs. R2-then-rows also makes a crash
 * recoverable: a row whose object is gone is retried (deleting an absent key is a success), and an
 * object whose row is gone is caught by the orphan sweep. A partial R2 failure still purges the rows
 * (the orphan sweep is the backstop for a stranded object) and is counted in `r2_errored`.
 *
 * ★ AND NEVER A KEPT ROW (admin-triage r2, 20260929140000): before a single object is deleted, the batch asks
 * `kept_media_ids` which of its rows the purge must keep (a hold, an open report: its item, or any item of an
 * album an open album report names) and leaves those out whole, object and row. The SQL guard inside
 * `purge_media_rows` asks the same function, but it saves only the ROW, and the objects go first: this is
 * where an open report's bytes wait for the review. A kept row stays where it is for the next run.
 *
 * ★ AT MOST `MAX_ROWS` IDS A `purge_media_rows` CALL. The function answers one row per HOST among its
 * input (the freed bytes), so its answer can never outgrow its input, and an input of at most 1,000
 * ids is an answer PostgREST cannot clip: the freed-bytes report stays whole (`row-cap-policy.test.ts`
 * lists it as single-row on exactly that promise). The calls run ONE AT A TIME: each decrements
 * `profiles.storage_used_bytes` for the hosts it touched, and two concurrent calls locking the same
 * hosts' rows in different orders could deadlock.
 *
 * Server-only: R2 and the service-role client.
 */
import "server-only";

import { mustQuery } from "@/lib/db/must-query";
import { inChunks, MAX_ROWS } from "@/lib/db/read-all";
import { deleteR2Objects } from "@/lib/r2/delete";
import type { createAdminClient } from "@/lib/supabase/admin";

export type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * A media row as the purge needs it: its id and the three object keys it may own, its original, the
 * tile's preview and the phone-size copy (take-home r1). ★ EVERY PURGE READS ALL THREE, by
 * `MEDIA_KEY_COLUMNS`: a key the read leaves out is an object no purge ever deletes, under a row that is
 * gone (the orphan sweep reclaims it only after the row, and never while it stands).
 * `stored-copies-policy.test.ts` refuses a reader of `preview_key` that never names `phone_key`.
 */
export type MediaKeyRow = {
  id: string;
  original_key: string;
  preview_key: string | null;
  phone_key: string | null;
};

/**
 * The columns every purge reads a row's objects by, and exactly the ones `mediaKeysOf` deletes.
 *
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `media.phone_key` arrives with migration 20261003110000,
 * so each purge read that names it types its rows itself (`.overrideTypes<MediaKeyRow[], { merge: false
 * }>()`, or the row type it reads beside them); drop the overrides once `src/lib/db/types.ts` knows the
 * column (the select's own type is the row again).
 */
export const MEDIA_KEY_COLUMNS = "id, original_key, preview_key, phone_key";

/** What a reclaim did, in the shape every sweep's tally reports. */
export type Reclaimed = {
  media_rows: number;
  r2_deleted: number;
  r2_errored: number;
  freed_bytes: number;
};

export function emptyReclaimed(): Reclaimed {
  return { media_rows: 0, r2_deleted: 0, r2_errored: 0, freed_bytes: 0 };
}

/** Fold one reclaim into a running tally. */
export function addReclaimed(into: Reclaimed, more: Reclaimed): void {
  into.media_rows += more.media_rows;
  into.r2_deleted += more.r2_deleted;
  into.r2_errored += more.r2_errored;
  into.freed_bytes += more.freed_bytes;
}

/** Every object key the rows own: the original always, the preview and the phone copy when there are. */
export function mediaKeysOf(rows: readonly MediaKeyRow[]): string[] {
  const keys: string[] = [];
  for (const row of rows) {
    keys.push(row.original_key);
    if (row.preview_key) keys.push(row.preview_key);
    if (row.phone_key) keys.push(row.phone_key);
  }
  return keys;
}

/**
 * THE PHONE-SIZE COPIES OF ROWS A CALLER ALREADY HOLDS BY ID: a host's own bin is read under her RLS, which
 * cannot see `phone_key` (no client role holds it, `20261003110000`), so the service role reads the copies of
 * exactly the rows her read proved hers, `IN_CHUNK` ids a request. A failed read throws: a purge that cannot
 * know every object a row owns deletes none of them.
 */
export async function readPhoneKeys(
  admin: AdminClient,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const rows = await inChunks("media: phone copies", ids, async (chunk) =>
    (
      (await mustQuery(
        admin
          .from("media")
          .select("id, phone_key")
          .in("id", chunk)
          // The typed seam (`MEDIA_KEY_COLUMNS`), until the types know `phone_key`.
          .overrideTypes<
            { id: string; phone_key: string | null }[],
            { merge: false }
          >(),
        "media: phone copies",
      )) ?? []
    ).filter((row): row is { id: string; phone_key: string } =>
      Boolean(row.phone_key),
    ),
  );
  return new Map(rows.map((row) => [row.id, row.phone_key]));
}

/**
 * Hard-delete rows and decrement `storage_used_bytes` atomically, `MAX_ROWS` ids a call, one call at
 * a time; returns the bytes freed. `purge_media_rows` refuses a held row at the SQL boundary, but the
 * CALLER must already have left held rows out: its R2 delete ran first.
 */
export async function purgeMediaRows(
  admin: AdminClient,
  ids: readonly string[],
): Promise<number> {
  const freed = await inChunks(
    "cron/purge: purge_media_rows",
    ids,
    async (chunk) =>
      (await mustQuery(
        admin.rpc("purge_media_rows", { p_media_ids: chunk }),
        "cron/purge: purge_media_rows",
      )) ?? [],
    { size: MAX_ROWS, concurrency: 1 },
  );
  return freed.reduce((sum, row) => sum + Number(row.freed_bytes ?? 0), 0);
}

/**
 * WHICH OF THESE ROWS THE PURGE MUST KEEP, as `kept_media_ids(uuid[])` answers it: one uuid[] per call, the ids
 * in the POST body, `MAX_ROWS` a call, so neither the batch nor the answer can be cut. A failed read throws: a
 * batch that cannot ask deletes nothing.
 */
export async function readKeptMediaIds(
  admin: AdminClient,
  ids: readonly string[],
): Promise<string[]> {
  return inChunks(
    "cron/purge: kept_media_ids",
    ids,
    async (chunk) =>
      (await mustQuery(
        admin.rpc("kept_media_ids", { p_media_ids: chunk }),
        "cron/purge: kept_media_ids",
      )) ?? [],
    { size: MAX_ROWS },
  );
}

/**
 * R2 first, then the rows: the whole reclaim for a batch of rows the caller has already cleared of
 * holds, less any row the purge must keep (asked first, above). `extraKeys` are derived objects with no
 * media row (an event's rendered reel), deleted in the same R2 pass. The tally counts what was reclaimed;
 * a kept row is simply not in it.
 */
export async function reclaimMedia(
  admin: AdminClient,
  rows: readonly MediaKeyRow[],
  extraKeys: readonly string[] = [],
): Promise<Reclaimed> {
  const kept =
    rows.length > 0
      ? new Set(
          await readKeptMediaIds(
            admin,
            rows.map((row) => row.id),
          ),
        )
      : new Set<string>();
  const doomed = kept.size > 0 ? rows.filter((row) => !kept.has(row.id)) : rows;
  const r2 = await deleteR2Objects([...mediaKeysOf(doomed), ...extraKeys]);
  const freed =
    doomed.length > 0
      ? await purgeMediaRows(
          admin,
          doomed.map((row) => row.id),
        )
      : 0;
  return {
    media_rows: doomed.length,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    freed_bytes: freed,
  };
}

/**
 * WHICH OF THESE EVENTS HOLD ANY MEDIA UNDER LEGAL HOLD, as `held_event_ids(uuid[])` answers it: one
 * uuid[] per call, the ids in the POST body, so neither the event list nor the answer can be cut. The
 * question used to be a read of one row per HELD photo, which stops at 1,000 rows: past it, an event
 * whose held rows fell beyond the cut read as purgeable, its objects were deleted and its event row's
 * cascade took the held rows with it. `MAX_ROWS` events a call keeps each body small.
 */
export async function readHeldEventIds(
  admin: AdminClient,
  eventIds: readonly string[],
): Promise<string[]> {
  return inChunks(
    "cron/purge: held_event_ids",
    eventIds,
    async (chunk) =>
      (await mustQuery(
        admin.rpc("held_event_ids", { p_event_ids: chunk }),
        "cron/purge: held_event_ids",
      )) ?? [],
    { size: MAX_ROWS },
  );
}
