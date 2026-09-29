/**
 * THE SIZE LIST'S RULES, pure (host-storage r1, Will 2026-09-28): the order, the filter, the
 * selection, the goal strip's arithmetic and the words its numbers print in. The list
 * (`storage-list.tsx`) is this machine and a surface; these are what its tests pin.
 *
 * ★ LARGEST FIRST, ACROSS EVERY EVENT (`order=flat`), and a filter for All or one event (his note:
 * "users likely have different preferences, so offering that ability is a great mini feature").
 * The server orders every page by `(size desc, id desc)`; an item put back by Undo takes its place
 * in that same order, never the end of the list.
 *
 * ★ THE STRIP COUNTS WHAT THE CHECK COUNTS (`goal=live`). The storage guard reads what is STORED
 * (`host_active_bytes()`), so an item only selected still counts against the size: the strip
 * counts the selection toward the goal so the host watches it close, but its button removes first
 * ("Remove and switch") while anything is only selected, and switches once nothing is.
 */
import type { StorageItem } from "@/lib/db/queries/storage-list";

/** The list's name, on its head and its rows' group, in the shell and the body alike. */
export const LIST_TITLE = "What’s using space";

/** "all", or one event's id. */
export type Filter = "all" | (string & {});

/** What the list keeps of an item it has selected or removed: enough to count, group and name it. */
export type Picked = Pick<StorageItem, "id" | "eventId" | "bytes" | "type">;

export const pick = (item: StorageItem): Picked => ({
  id: item.id,
  eventId: item.eventId,
  bytes: item.bytes,
  type: item.type,
});

/** The list's order, the server's own: largest first, then the id, descending. */
export function largestFirst(
  a: Pick<StorageItem, "bytes" | "id">,
  b: Pick<StorageItem, "bytes" | "id">,
): number {
  return b.bytes - a.bytes || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

export function totalBytes(items: Iterable<{ bytes: number }>): number {
  let sum = 0;
  for (const item of items) sum += item.bytes;
  return sum;
}

/** The items a filter shows, in the list's order, less what this visit removed. */
export function shownItems(
  loaded: readonly StorageItem[],
  filter: Filter,
  removed: ReadonlyMap<string, Picked>,
): StorageItem[] {
  return loaded
    .filter(
      (item) =>
        !removed.has(item.id) && (filter === "all" || item.eventId === filter),
    )
    .sort(largestFirst);
}

/** A selection or a removal, grouped by the event each item belongs to. */
export function byEvent(items: Iterable<Picked>): Map<string, Picked[]> {
  const groups = new Map<string, Picked[]>();
  for (const item of items) {
    const group = groups.get(item.eventId) ?? [];
    group.push(item);
    groups.set(item.eventId, group);
  }
  return groups;
}

/**
 * THE GOAL STRIP'S NUMBERS. `gap` is what stood between what she stored BEFORE this visit's
 * removals and the size she chose (the plain cap, never the upload headroom: billing-caps.md);
 * `freed` is what this visit removed plus what is selected; the strip is `done` once the two meet.
 * `pending` is how many of the freed are only selected, which is what makes the button read
 * "Remove and switch". (Counting from what she stores NOW would count every removal twice.)
 */
export type GoalCount = {
  gap: number;
  freed: number;
  remaining: number;
  done: boolean;
  pending: number;
  /** How far along, 0 to 100, for the bar. */
  percent: number;
};

export function goalCount(input: {
  storedBytes: number;
  capBytes: number;
  removedBytes: number;
  selectedBytes: number;
  selectedCount: number;
}): GoalCount {
  const gap = Math.max(0, input.storedBytes - input.capBytes);
  const freed = input.removedBytes + input.selectedBytes;
  const remaining = Math.max(0, gap - freed);
  const done = remaining === 0;
  return {
    gap,
    freed,
    remaining,
    done,
    pending: input.selectedCount,
    percent: gap === 0 ? 100 : Math.min(100, Math.floor((freed / gap) * 100)),
  };
}

/** What the strip's button does next: nothing yet, remove then switch, or switch. */
export type GoalStep = "counting" | "remove-and-switch" | "switch";

export function goalStep(count: GoalCount): GoalStep {
  if (!count.done) return "counting";
  return count.pending > 0 ? "remove-and-switch" : "switch";
}

/**
 * A selection's name, for the toast and the bar: "3 photos", "1 video", "4 items" for a mix.
 * "Items", not the Review room's "uploads", because the list is also the host's own files.
 */
export function itemsWords(items: readonly Pick<Picked, "type">[]): string {
  const n = items.length;
  const videos = items.filter((i) => i.type === "video").length;
  const noun = videos === 0 ? "photo" : videos === n ? "video" : "item";
  return `${n.toLocaleString("en-US")} ${noun}${n === 1 ? "" : "s"}`;
}

/** A video's length, the way a player reads it: 0:42, 12:07, 1:02:07. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * When it was added, short: "Jun 14", with the year once it is not this year's ("Jun 14, 2025").
 * Formatted in the VIEWER's zone (the list renders on the client), so a late-evening upload reads
 * as the day it was where she is.
 */
export function addedLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
