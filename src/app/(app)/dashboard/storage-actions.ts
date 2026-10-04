"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { purgeMediaNow, removeMediaBulk } from "@/lib/db/mutations/media";
import { readHostStorageSummary } from "@/lib/db/queries/storage";
import {
  readStorageEvents,
  readStoragePage,
  toStorageItems,
  type StorageCursor,
  type StorageEventTotal,
  type StorageItem,
} from "@/lib/db/queries/storage-list";
import type { ErrorCode } from "@/lib/errors/codes";
import { BULK_LIMIT_MESSAGE, MAX_BULK_ITEMS } from "@/lib/event/bulk-selection";
import { captureError } from "@/lib/observability/sentry";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * WHAT'S USING SPACE AND WHAT DELETED HOLDS, ON THE SERVER (host-storage r1, Will 2026-09-28; trash-in-storage, Will
 * 2026-10-03: Deleted counts in storage). The size list's read, its one write, and the storage chart's two acts. Each is
 * a public endpoint, so each parses what the client sent, re-checks the user with `getUser()` (through the
 * request-scoped `getRequestAuth`), and leans on RLS and the database's own functions for the rest.
 *
 * ★ A DELETE FREES NOTHING UNTIL IT LEAVES DELETED. Her plan holds her albums and her Deleted together, so the list's
 * act is Delete for good (the album's own Remove, then its own Delete permanently, R2 first), and the chart's are Empty
 * Deleted (`empty_deleted`: every item asked to leave at once, R2 following in the night's purge) and her setting, Make
 * room from Deleted.
 *
 * ★ NOTHING HERE DECIDES A PLAN. The list's goal strip finishes a switch through the change-plan route, which re-reads
 * what she stores and refuses a size that cannot hold it; the Stripe webhook stays the only writer of the tier and the
 * cap (billing-caps.md).
 *
 * ★ NONE OF THEM REVALIDATES. A Server Function's revalidation re-renders the page that called it in the same round
 * trip, and the list and the chart open over the dashboard and the account page, each a page of many reads. Each
 * surface refreshes the page behind it once, when its act lands or its list closes.
 */

type Failure = {
  ok: false;
  code: Extract<ErrorCode, "unauthorized" | "validation" | "unknown">;
  message: string;
};

const SIGN_IN: Failure = {
  ok: false,
  code: "unauthorized",
  message: "Sign in and try again.",
};

/** The first read's extra: what she stores (the cap's one figure), what of it is in Deleted, and her events' totals. */
export type StorageOverview = {
  storedBytes: number;
  deletedBytes: number;
  events: StorageEventTotal[];
};

export type StorageListAnswer =
  | {
      ok: true;
      items: StorageItem[];
      next: StorageCursor | null;
      overview: StorageOverview | null;
    }
  | Failure;

export type DeleteStorageAnswer =
  | { ok: true; deleted: number }
  /** `deletedEvents`: the events whose items did go, before the failure stopped the rest. */
  | (Failure & { deletedEvents: string[] });

export type EmptyDeletedAnswer =
  | {
      ok: true;
      items: number;
      events: number;
      freedBytes: number;
      /** Deleted still holds some: the call's time ran out, or a later batch failed after earlier ones left. */
      more: boolean;
    }
  | Failure;

/**
 * Items each `empty_deleted` call takes: well inside the authenticated role's 8 s statement_timeout, and under the
 * function's own 5,000 ceiling, which is tight at the slow end (about 1 ms a row).
 */
const EMPTY_DELETED_BATCH = 2_000;
/**
 * How long one Empty Deleted keeps calling before it answers with what it freed and `more` (the Advisor's Q24): short
 * enough to answer inside any function limit the dashboard's route runs under (it sets no `maxDuration`), so every
 * batch commits and she presses again, never a generic error after work that already left.
 */
const EMPTY_DELETED_BUDGET_MS = 10_000;

export type MakeRoomAnswer = { ok: true; on: boolean } | Failure;

const askSchema = z.object({
  eventId: z.uuid().nullable().default(null),
  after: z
    .object({
      bytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      id: z.uuid(),
    })
    .nullable()
    .default(null),
  withOverview: z.boolean().default(false),
});

/** A selection is checked before it is parsed: past the cap it is refused in words, and cheaply. */
function tooMany(value: unknown): Failure | null {
  return Array.isArray(value) && value.length > MAX_BULK_ITEMS
    ? { ok: false, code: "validation", message: BULK_LIMIT_MESSAGE }
    : null;
}

const itemsSchema = z
  .array(z.object({ id: z.uuid(), eventId: z.uuid() }))
  .min(1)
  .max(MAX_BULK_ITEMS);

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `empty_deleted` and `profiles.make_room_from_deleted` arrive with
 * migration 20261003220000, so the two calls that name them go through this untyped view of the request's own client
 * (drop the cast then). Still the cookie-bound client: RLS and `auth.uid()` hold exactly as they do for a typed call.
 */
function untyped(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

/**
 * One page of what she stores, largest first (all her events, or one), and on the first read the overview: what she
 * stores and what of it is in Deleted (`host_storage_summary`, the storage guard's own figures), and each event's total.
 */
export async function readStorageListAction(
  ask: unknown,
): Promise<StorageListAnswer> {
  const parsed = askSchema.safeParse(ask ?? {});
  if (!parsed.success) {
    return { ok: false, code: "validation", message: "That isn't a list." };
  }
  const { eventId, after, withOverview } = parsed.data;
  const { supabase, user } = await getRequestAuth();
  if (!user) return SIGN_IN;

  try {
    const [page, events, summary] = await Promise.all([
      readStoragePage(supabase, user.id, { eventId, after }),
      withOverview ? readStorageEvents(supabase, user.id) : null,
      withOverview ? readHostStorageSummary(user.id) : null,
    ]);
    const items = await toStorageItems(page.rows);
    return {
      ok: true,
      items,
      next: page.next,
      overview:
        events && summary
          ? {
              storedBytes: summary.storedBytes,
              deletedBytes: summary.deletedBytes,
              events,
            }
          : null,
    };
  } catch (error) {
    captureError("media", error, { seam: "storage_list_read" });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't load what's using space. Please try again.",
    };
  }
}

/**
 * DELETE FOR GOOD, a selection from the size list: one event at a time, the album's own two acts in order (its bulk
 * Remove, then its Delete permanently, which deletes the objects first and asks `kept_media_ids` before it does), so
 * nothing here re-implements a delete. It stops at the first event that fails and names the events already done, so the
 * list keeps those gone and puts the rest back; a failure after the Remove leaves that event's items in Deleted, which
 * the answer says.
 */
export async function deleteStorageItemsAction(
  items: unknown,
): Promise<DeleteStorageAnswer> {
  const refused = tooMany(items);
  if (refused) return { ...refused, deletedEvents: [] };
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: "Unsupported selection.",
      deletedEvents: [],
    };
  }
  const { user } = await getRequestAuth();
  if (!user) return { ...SIGN_IN, deletedEvents: [] };

  const byEvent = new Map<string, string[]>();
  for (const item of parsed.data) {
    const ids = byEvent.get(item.eventId) ?? [];
    ids.push(item.id);
    byEvent.set(item.eventId, ids);
  }

  let deleted = 0;
  const done: string[] = [];
  for (const [eventId, ids] of byEvent) {
    const removed = await removeMediaBulk(eventId, ids);
    if (!removed.ok) {
      if (removed.code === "unknown") {
        captureError("media", new Error(removed.message), {
          seam: "storage_list_delete",
          step: "remove",
          count: ids.length,
        });
      }
      return {
        ok: false,
        code: removed.code === "unauthorized" ? "unauthorized" : "unknown",
        message: removed.message,
        deletedEvents: done,
      };
    }
    const purged = await purgeMediaNow(eventId, ids);
    if (!purged.ok) {
      if (purged.code === "unknown") {
        captureError("media", new Error(purged.message), {
          seam: "storage_list_delete",
          step: "purge",
          count: ids.length,
        });
      }
      return {
        ok: false,
        code: purged.code === "unauthorized" ? "unauthorized" : "unknown",
        message:
          "Couldn't delete some of those for good. They're in Deleted, where you can try again.",
        deletedEvents: done,
      };
    }
    deleted += purged.data.purged;
    done.push(eventId);
  }
  return { ok: true, deleted };
}

/**
 * EMPTY DELETED, the storage chart's button: everything in her Deleted leaves for good (`empty_deleted`, which asks
 * each item to leave and, with the last of them, takes every deleted event too; the bytes stop counting at once and the
 * night's purge deletes the objects, R2 first). Her own act, authorized inside on `auth.uid()`: the request's client
 * carries her.
 *
 * ★ A BATCH A CALL, UNTIL NOTHING IS LEFT (the Advisor's Q23): one unbounded statement under the authenticated role's
 * 8 s statement_timeout rolls back somewhere past 8,000 items, so a big Deleted could never be emptied. Each call takes
 * `EMPTY_DELETED_BATCH`, and this calls again while the answer says `more`, within a time budget; past it (or past a
 * later call's failure) it answers what it freed with `more`, and the chart says Deleted still holds some.
 */
export async function emptyDeletedAction(): Promise<EmptyDeletedAnswer> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return SIGN_IN;
  const started = Date.now();
  let items = 0;
  let events = 0;
  let freedBytes = 0;
  let more = true;
  let calls = 0;
  while (more) {
    const { data, error } = await untyped(supabase).rpc("empty_deleted", {
      p_limit: EMPTY_DELETED_BATCH,
    });
    calls += 1;
    const answer = data as {
      ok?: unknown;
      items?: unknown;
      events?: unknown;
      freed_bytes?: unknown;
      more?: unknown;
    } | null;
    if (error || answer?.ok !== true) {
      captureError("media", error ?? new Error("empty_deleted refused"), {
        seam: "empty_deleted",
        calls,
      });
      // What earlier batches took has left for good already: say so, and that some is left.
      if (calls > 1) return { ok: true, items, events, freedBytes, more: true };
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't empty Deleted. Please try again.",
      };
    }
    const took = Number(answer.items ?? 0);
    items += took;
    events += Number(answer.events ?? 0);
    freedBytes += Number(answer.freed_bytes ?? 0);
    more = answer.more === true;
    // A batch that took nothing cannot make progress by asking again (rows another purge holds right now).
    if (
      more &&
      (took === 0 || Date.now() - started > EMPTY_DELETED_BUDGET_MS)
    ) {
      break;
    }
  }
  return { ok: true, items, events, freedBytes, more };
}

/**
 * HER SETTING, Make room from Deleted: hers to write (the column's one grant), on her own row under RLS, so nothing
 * here can reach anyone else's. Read back from the write itself, so the switch shows what the database holds.
 */
export async function setMakeRoomFromDeletedAction(
  on: unknown,
): Promise<MakeRoomAnswer> {
  if (typeof on !== "boolean") {
    return { ok: false, code: "validation", message: "That isn't a setting." };
  }
  const { supabase, user } = await getRequestAuth();
  if (!user) return SIGN_IN;
  const { data, error } = await untyped(supabase)
    .from("profiles")
    .update({ make_room_from_deleted: on })
    .eq("id", user.id)
    .select("make_room_from_deleted")
    .maybeSingle();
  const row = data as { make_room_from_deleted?: unknown } | null;
  if (error || typeof row?.make_room_from_deleted !== "boolean") {
    captureError(
      "account",
      error ?? new Error("make_room_from_deleted unread"),
      {
        seam: "make_room_setting",
      },
    );
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't save that. Please try again.",
    };
  }
  return { ok: true, on: row.make_room_from_deleted };
}
