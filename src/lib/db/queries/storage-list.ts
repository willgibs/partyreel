/**
 * WHAT'S USING SPACE: the reads behind the size list (host-storage r1, Will 2026-09-28: `order=flat`,
 * one ranked list, largest first across every event, with a filter for All or one event).
 *
 * ★ SIZES ARE READ UNDER RLS, NEVER THE SERVICE ROLE. Every row here comes through the request's
 * cookie-bound client after the caller's `getUser()`: `media_host_all` already limits `media` to the
 * host's own events, and each read ALSO names the host through `events!inner` (or through the id
 * list of her own live events), so a read can never widen past her account. The one admin read is
 * attribution (who added each item), which reads `guests` and other people's profiles by design
 * (`readAlbumAttribution`), and only ever for ids the RLS read already returned.
 *
 * ★ WHAT COUNTS IS WHAT THE CAP COUNTS: `host_active_bytes()`, non-removed media in non-deleted
 * events (`status <> 'removed'`, `events.deleted_at is null`). An item in the list is an item a
 * Remove frees room for, at once.
 *
 * ★ NOTHING HERE CAN BE CUT AT 1,000 ROWS (read-all.ts). The list is a PAGE on purpose, largest
 * first by `(file_size_bytes desc, id desc)` through `readAllPages`' budget, and the screen says
 * how many it shows of how many ("Show more"). The per-event totals behind the filter are read
 * WHOLE, a keyset walk each over her live events and over their sums, because a list that stopped at
 * the first 1,000 would name the wrong heaviest event.
 *
 * ★ THE TOTALS ARE THE DATABASE'S OWN SUMS (upload-sums, 20261006180000): `event_storage_sums`, a
 * row per event kept by a trigger at every write to `media`, so the filter reads one row an event
 * however many items each holds (a 5,000-event account reads 5,000 rows, not every item she owns).
 * Its `live_*` columns are exactly what the cap counts above; that they equal the items walked is
 * the migration's proof and `storage_sums_drift`'s nightly reconciliation, never this read's.
 *
 * ★ KEYS NEVER REACH THE BROWSER. Each item leaves presigned (stable, like every gallery read): the
 * inline original, which is the tile's fallback and a video's poster, and the small preview when
 * the upload made one.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readAlbumAttribution } from "@/lib/db/queries/album-state";
import { readAllPages } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import { presignDownload } from "@/lib/r2/presign";

type Client = SupabaseClient<Database>;

/** How many items one page of the list carries: a screenful and a half at a desk. */
export const STORAGE_PAGE_SIZE = 40;

/** Where the next page starts: the last item's size and id (the list's own order). */
export type StorageCursor = { bytes: number; id: string };

/** One item, as the list draws it. Never a raw key. */
export type StorageItem = {
  id: string;
  eventId: string;
  type: "photo" | "video";
  bytes: number;
  durationSeconds: number | null;
  /** The raw timestamp, formatted on the client in the viewer's own zone. */
  createdAt: string;
  /** Presigned: the inline original (the tile's fallback, a video's poster). */
  url: string;
  /** Presigned: the small preview the upload made, when it made one. */
  previewUrl: string | null;
  /** Who added it, by the one precedence rule; `isHost` is the host herself. */
  by: { name: string | null; isHost: boolean; isVerified: boolean };
};

/** One of her live events that holds anything, with what it holds. */
export type StorageEventTotal = {
  id: string;
  name: string;
  bytes: number;
  count: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The cursor rides a PostgREST filter string, so it is checked here as well as at the Server
 * Function's boundary: a size is a whole number of bytes and an id is a uuid, and nothing else can
 * reach `.or()`.
 */
function assertCursor(cursor: StorageCursor): void {
  if (
    !Number.isSafeInteger(cursor.bytes) ||
    cursor.bytes < 0 ||
    !UUID.test(cursor.id)
  ) {
    throw new RangeError("storage list: a malformed cursor");
  }
}

const PAGE_COLUMNS =
  "id, event_id, type, file_size_bytes, duration_seconds, created_at, guest_id, original_key, preview_key, events!media_event_id_fkey!inner(host_id, deleted_at)";

type PageRow = {
  id: string;
  event_id: string;
  type: "photo" | "video";
  file_size_bytes: number;
  duration_seconds: number | null;
  created_at: string;
  guest_id: string | null;
  original_key: string;
  preview_key: string | null;
};

/**
 * One page of the host's active items, largest first: across every live event, or one of them.
 * `next` is where the following page starts, or null when this one reached the end.
 */
export async function readStoragePage(
  supabase: Client,
  hostId: string,
  opts: {
    eventId?: string | null;
    after?: StorageCursor | null;
    limit?: number;
  },
): Promise<{ rows: PageRow[]; next: StorageCursor | null }> {
  const { eventId = null, after = null, limit = STORAGE_PAGE_SIZE } = opts;
  if (after) assertCursor(after);
  if (eventId !== null && !UUID.test(eventId)) {
    throw new RangeError("storage list: a malformed event id");
  }
  const page = await readAllPages(
    "storage list: page",
    (cursor: StorageCursor | null, pageLimit) => {
      let q = supabase
        .from("media")
        .select(PAGE_COLUMNS)
        .eq("events.host_id", hostId)
        .is("events.deleted_at", null)
        .neq("status", "removed")
        .order("file_size_bytes", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageLimit);
      if (eventId) q = q.eq("event_id", eventId);
      if (cursor) {
        q = q.or(
          `file_size_bytes.lt.${cursor.bytes},and(file_size_bytes.eq.${cursor.bytes},id.lt.${cursor.id})`,
        );
      }
      return q;
    },
    (row) => ({ bytes: row.file_size_bytes, id: row.id }),
    { budget: limit, after },
  );
  return {
    rows: page.rows.map((row) => ({
      id: row.id,
      event_id: row.event_id,
      type: row.type,
      file_size_bytes: row.file_size_bytes,
      duration_seconds: row.duration_seconds,
      created_at: row.created_at,
      guest_id: row.guest_id,
      original_key: row.original_key,
      preview_key: row.preview_key,
    })),
    next: page.more ? page.after : null,
  };
}

type SumRow = {
  event_id: string;
  live_bytes: number | string;
  live_count: number;
};

/**
 * Every live event of hers that holds anything, with its active bytes and item count, heaviest
 * first: the filter's chips and their totals. Two keyset walks, each read whole: her live events
 * (their names) and her events' sums (one row an event), joined here; a sum whose event is deleted
 * or gone has no live event to join and is not listed.
 */
export async function readStorageEvents(
  supabase: Client,
  hostId: string,
): Promise<StorageEventTotal[]> {
  const [{ rows: events }, { rows: sums }] = await Promise.all([
    readAllPages(
      "storage list: events",
      (after: string | null, pageLimit) => {
        let q = supabase
          .from("events")
          .select("id, name")
          .eq("host_id", hostId)
          .is("deleted_at", null)
          .order("id", { ascending: true })
          .limit(pageLimit);
        if (after !== null) q = q.gt("id", after);
        return q;
      },
      (row) => row.id,
    ),
    readAllPages(
      "storage list: sums",
      (after: string | null, pageLimit) => {
        let q = supabase
          .from("event_storage_sums")
          .select("event_id, live_bytes, live_count")
          .eq("host_id", hostId)
          .gt("live_count", 0)
          .order("event_id", { ascending: true })
          .limit(pageLimit);
        if (after !== null) q = q.gt("event_id", after);
        return q;
      },
      (row) => row.event_id,
    ),
  ]);

  // A bigint may arrive as text; a total is a whole number of bytes either way.
  const totals = new Map(
    (sums as SumRow[]).map((row) => [
      row.event_id,
      { bytes: Number(row.live_bytes), count: Number(row.live_count) },
    ]),
  );
  return events
    .flatMap((e) => {
      const t = totals.get(e.id);
      return t
        ? [{ id: e.id, name: e.name, bytes: t.bytes, count: t.count }]
        : [];
    })
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
}

/**
 * The page's rows as the list draws them: presigned, and credited. Attribution is asked per event,
 * for the guest-added ids alone (the host's own need no read: `guest_id` null IS the host), and
 * never with the address: the list names people, it never shows an email.
 */
export async function toStorageItems(rows: PageRow[]): Promise<StorageItem[]> {
  const guestIdsByEvent = new Map<string, string[]>();
  for (const row of rows) {
    if (row.guest_id === null) continue;
    const ids = guestIdsByEvent.get(row.event_id) ?? [];
    ids.push(row.id);
    guestIdsByEvent.set(row.event_id, ids);
  }
  const identities = new Map<string, UploaderIdentity>();
  await Promise.all(
    [...guestIdsByEvent].map(async ([eventId, ids]) => {
      const found = await readAlbumAttribution(eventId, ids, {
        withEmail: false,
      });
      for (const [id, who] of found) identities.set(id, who);
    }),
  );

  return Promise.all(
    rows.map(async (row) => {
      const [url, previewUrl] = await Promise.all([
        presignDownload({ key: row.original_key, stable: true }),
        row.preview_key
          ? presignDownload({ key: row.preview_key, stable: true })
          : Promise.resolve(null),
      ]);
      const who = identities.get(row.id);
      return {
        id: row.id,
        eventId: row.event_id,
        type: row.type,
        bytes: row.file_size_bytes,
        durationSeconds: row.duration_seconds,
        createdAt: row.created_at,
        url,
        previewUrl,
        by:
          row.guest_id === null
            ? { name: null, isHost: true, isVerified: true }
            : {
                name: who?.displayName ?? null,
                isHost: false,
                isVerified: who?.isVerified ?? false,
              },
      };
    }),
  );
}
