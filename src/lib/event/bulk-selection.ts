/**
 * THE MOST ITEMS ONE BULK ACTION TAKES (the 1,000-row round, 2026-09-23).
 *
 * WHY A CAP: the hub's bulk verbs (Approve, Hide, Show, Delete, Delete forever) are Server
 * Functions, which are public endpoints, and each took an id list of any length. The writes chunk
 * their lists now (`mutations/media.ts`), so no length breaks a request, but an endpoint that loops
 * over whatever it is handed is a work amplifier; a named ceiling, refused in words, is the honest
 * shape.
 *
 * WHY 2,000: it is the export's own cap (`MAX_EXPORT_ITEMS`), and the album bar's Download already
 * refuses a bigger selection, so one selection meets one limit whichever verb the host picks.
 *
 * Pure (no server imports): the actions refuse with it and the Review room batches with it.
 */
import { MAX_EXPORT_ITEMS } from "@/lib/export/build-manifest";

/** The most ids one bulk action accepts. */
export const MAX_BULK_ITEMS = MAX_EXPORT_ITEMS;

/** The refusal a selection past the cap gets, in words the host can act on (no em-dashes). */
export const BULK_LIMIT_MESSAGE = `Select up to ${MAX_BULK_ITEMS.toLocaleString("en-US")} items at a time.`;

/**
 * Run one bulk action over `ids` in consecutive batches of at most `MAX_BULK_ITEMS`, stopping at
 * the first refusal. For the one caller that must reach past the cap: the Review room's Approve
 * all, whose queue is whatever the guests sent (a held wedding can wait on thousands), so it can
 * never be refused for its size. The batches run in order, one action each; an empty list still
 * makes one call, so the caller's result is the action's own.
 */
export async function inBulkBatches<R extends { ok: boolean }>(
  ids: readonly string[],
  run: (batch: string[]) => Promise<R>,
): Promise<R> {
  let result = await run(ids.slice(0, MAX_BULK_ITEMS));
  for (
    let start = MAX_BULK_ITEMS;
    result.ok && start < ids.length;
    start += MAX_BULK_ITEMS
  ) {
    result = await run(ids.slice(start, start + MAX_BULK_ITEMS));
  }
  return result;
}
