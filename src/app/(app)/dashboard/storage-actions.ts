"use server";

import { z } from "zod";

import { removeMediaBulk, restoreMedia } from "@/lib/db/mutations/media";
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
 * WHAT'S USING SPACE, ON THE SERVER: the size list's read and its two writes (host-storage r1, Will
 * 2026-09-28; the list itself is `components/app/storage/`). Each is a public endpoint, so each
 * parses what the client sent, re-checks the user with `getUser()` (through the request-scoped
 * `getRequestAuth`), and leans on RLS for the rest: the reads are the request's own client
 * (`storage-list.ts`), and the writes are the album's own, `removeMediaBulk` (column-locked, one
 * event at a time) and `restore_media` (the only door back out of Deleted).
 *
 * ★ NOTHING HERE DECIDES A PLAN. The list's goal strip finishes a switch through the change-plan
 * route, which re-reads what the host stores and refuses a size that cannot hold it; the Stripe
 * webhook stays the only writer of the tier and the cap (billing-caps.md).
 *
 * ★ NONE OF THEM REVALIDATES. A Server Function's revalidation re-renders the page that called it in
 * the same round trip, and the list is opened over the dashboard and the account page, each a page
 * of many reads. The list moves by its own acts and refreshes the page behind it once, as it closes.
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

/** The first read's extra: what she stores (the cap's one figure) and her events' totals. */
export type StorageOverview = {
  storedBytes: number;
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

export type RemoveStorageAnswer =
  | { ok: true; removed: number }
  /** `removedEvents`: the events whose items did go, before the failure stopped the rest. */
  | (Failure & { removedEvents: string[] });

export type RestoreStorageAnswer =
  | {
      ok: true;
      restored: string[];
      /** Ids the restore refused (no room, gone), with the first refusal's words. */
      refused: string[];
      message: string | null;
    }
  | Failure;

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

const idsSchema = z.array(z.uuid()).min(1).max(MAX_BULK_ITEMS);

/**
 * One page of what she stores, largest first (all her events, or one), and on the first read the
 * overview: the figure the storage guard reads (`host_storage_summary`) and each event's total.
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
        events && summary ? { storedBytes: summary.activeBytes, events } : null,
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
 * Remove a selection to Deleted, one event at a time through the album's own bulk remove. It stops
 * at the first event that fails and names the events already done, so the list keeps those gone and
 * puts the rest back.
 */
export async function removeStorageItemsAction(
  items: unknown,
): Promise<RemoveStorageAnswer> {
  const refused = tooMany(items);
  if (refused) return { ...refused, removedEvents: [] };
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: "Unsupported selection.",
      removedEvents: [],
    };
  }
  const { user } = await getRequestAuth();
  if (!user) return { ...SIGN_IN, removedEvents: [] };

  const byEvent = new Map<string, string[]>();
  for (const item of parsed.data) {
    const ids = byEvent.get(item.eventId) ?? [];
    ids.push(item.id);
    byEvent.set(item.eventId, ids);
  }

  let removed = 0;
  const done: string[] = [];
  for (const [eventId, ids] of byEvent) {
    const result = await removeMediaBulk(eventId, ids);
    if (!result.ok) {
      if (result.code === "unknown") {
        captureError("media", new Error(result.message), {
          seam: "storage_list_remove",
          count: ids.length,
        });
      }
      return {
        ok: false,
        code: result.code === "unauthorized" ? "unauthorized" : "unknown",
        message: result.message,
        removedEvents: done,
      };
    }
    removed += result.data.count;
    done.push(eventId);
  }
  return { ok: true, removed };
}

/** How many restores run at once: each is one RPC, and an Undo is rarely more than a screenful. */
const RESTORE_CONCURRENCY = 4;

/**
 * Undo's reversal: each item back out of Deleted through `restore_media`, which checks it is hers,
 * that its event still stands and that her plan has room (the BASE cap). What it refuses stays in
 * Deleted and is named, so the list takes exactly those away again.
 */
export async function restoreStorageItemsAction(
  ids: unknown,
): Promise<RestoreStorageAnswer> {
  const refusedAtTheDoor = tooMany(ids);
  if (refusedAtTheDoor) return refusedAtTheDoor;
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: "Unsupported selection." };
  }
  const { user } = await getRequestAuth();
  if (!user) return SIGN_IN;

  const queue = [...new Set(parsed.data)];
  const restored: string[] = [];
  const refused: string[] = [];
  let message: string | null = null;
  const lane = async () => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      const result = await restoreMedia(id);
      if (result.ok) {
        restored.push(id);
        continue;
      }
      refused.push(id);
      message ??= result.message ?? null;
      // As `restoreMediaAction` does: a full plan, a slot or a deleted event is an expected
      // refusal; only `unknown` is worth a look.
      if (result.code === "unknown") {
        captureError("media", new Error(result.message), {
          seam: "storage_list_restore",
        });
      }
    }
  };
  await Promise.all(Array.from({ length: RESTORE_CONCURRENCY }, lane));
  return { ok: true, restored, refused, message };
}
