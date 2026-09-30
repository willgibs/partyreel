/**
 * THE REVIEW ROOM'S QUEUE, THE PURE HALF: what a verdict's toast says, where an item that comes
 * back (a refused write, an Undo) returns to, which photograph the keys and the peek land on next,
 * and what the host's live album says about the queue: uploads that arrived since the room drew
 * it (held behind the line, never slipped in), and ones decided somewhere else (dropped). The React
 * half is `use-review-triage.ts`; every rule here is a unit test.
 */
import type { GridMedia } from "@/components/app/media-grid";
import { formatKindCount } from "@/lib/format/count";

/** The two verdicts (host-curation `verb=reject`: Reject at the door, Hide kept for the album). */
export type ReviewKind = "approve" | "reject";

/**
 * An item in the room: a grid item and its place in the queue. The server's order is newest first;
 * a later arrival folds in above everything (a smaller rank), and whatever comes back returns to
 * its own place, so the room never reorders under the host.
 */
export type QueueItem = GridMedia & { rank: number };

/** The server's queue as the room first draws it: ranks in its own order, from `from` up. */
export function ranked(items: readonly GridMedia[], from = 0): QueueItem[] {
  return items.map((m, i) => ({ ...m, rank: from + i }));
}

/**
 * Arrivals folded in above the queue: newest first, ranked below `top` (the smallest rank the
 * room has handed out), so they sit at the head in the server's own order.
 */
export function rankedAbove(
  items: readonly GridMedia[],
  top: number,
): QueueItem[] {
  return items.map((m, i) => ({ ...m, rank: top - items.length + i }));
}

/** The queue with `back` returned to their places, none twice. */
export function putBack(
  list: readonly QueueItem[],
  back: readonly QueueItem[],
): QueueItem[] {
  const have = new Set(list.map((i) => i.id));
  const returning = back.filter((b) => !have.has(b.id));
  if (returning.length === 0) return list as QueueItem[];
  return [...list, ...returning].sort((a, b) => a.rank - b.rank);
}

/** "3 photos", "1 video", "4 uploads" (a mix): what a count of the queue's items is called. */
export function uploadsWords(
  items: readonly Pick<GridMedia, "type">[],
): string {
  return formatKindCount(items, "upload");
}

/** A verdict's toast: "Approved 5 photos", "Rejected 1 video". */
export function verdictWords(
  kind: ReviewKind,
  items: readonly Pick<GridMedia, "type">[],
): string {
  return `${kind === "approve" ? "Approved" : "Rejected"} ${uploadsWords(items)}`;
}

/**
 * Where the keys and the peek land once `id` leaves: the next item that stays, else the one before
 * it, else nothing (the queue is empty). `leaving` holds everything on its way out, `id` included.
 */
export function nextAfter(
  ids: readonly string[],
  id: string,
  leaving: ReadonlySet<string>,
): string | null {
  const at = ids.indexOf(id);
  if (at < 0) return null;
  for (let i = at + 1; i < ids.length; i++) {
    if (!leaving.has(ids[i])) return ids[i];
  }
  for (let i = at - 1; i >= 0; i--) {
    if (!leaving.has(ids[i])) return ids[i];
  }
  return null;
}

/** The keys that move the cursor across the grid. */
export type GridKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

export function isGridKey(key: string): key is GridKey {
  return (
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "Home" ||
    key === "End"
  );
}

/**
 * Where a key moves the cursor in a grid of `columns` holding `length` items, from `at` (-1: no
 * cursor yet, so any key lands on the first). Left and right walk the reading order; up and down
 * keep the column, and down from the row above a shorter last row lands on its last item rather
 * than standing still, so every item is reachable.
 */
export function stepIndex(
  at: number,
  key: GridKey,
  columns: number,
  length: number,
): number {
  if (length === 0) return -1;
  if (at < 0 || at >= length) return key === "End" ? length - 1 : 0;
  const cols = Math.max(1, Math.floor(columns));
  switch (key) {
    case "ArrowLeft":
      return Math.max(0, at - 1);
    case "ArrowRight":
      return Math.min(length - 1, at + 1);
    case "ArrowUp":
      return at - cols >= 0 ? at - cols : at;
    case "ArrowDown": {
      if (at + cols < length) return at + cols;
      const lastRow = Math.floor((length - 1) / cols);
      return Math.floor(at / cols) < lastRow ? length - 1 : at;
    }
    case "Home":
      return 0;
    case "End":
      return length - 1;
  }
}

/**
 * WHAT THE HOST'S LIVE ALBUM SAYS ABOUT THE QUEUE, read off its manifest (`review-live.ts`): every
 * upload the server holds waiting, newest first, and the ones it holds decided (approved or hidden).
 * An upload in neither left the album (its guest took it back, or it was removed).
 */
export type LiveQueue = {
  waiting: readonly string[];
  decided: ReadonlySet<string>;
};

/**
 * ★ THE ROOM'S OWN WRITES THAT THE ALBUM HAS NOT READ BACK YET: every upload the room acted on (a
 * verdict, its Undo, an Undo refused), keyed to the serial of the room's latest write on it. While
 * an upload is here the room's own write is its truth, because a poll read before that write
 * landed would contradict it: pull a tile the host just put back, or count an upload the host just
 * decided as new. ★ AND ONLY UNTIL THE ALBUM HAS BEEN ASKED SINCE (the catch-up the room asks for
 * once a write lands; a refused write, nothing to read, at once): from then on the album is its
 * truth again, so an upload decided here that returns to waiting from elsewhere (a second room
 * tab's Undo, a direct write) is an arrival the line counts, and one put back here that is decided
 * elsewhere leaves. Held for ever, both went unseen until a reload.
 */
export type OwnWrites = ReadonlyMap<string, number>;

/** `ids` carry the room's write `serial` now: a later write on one replaces an earlier one's. */
export function ownWrite(
  writes: OwnWrites,
  ids: Iterable<string>,
  serial: number,
): OwnWrites {
  const next = new Map(writes);
  for (const id of ids) next.set(id, serial);
  return next;
}

/**
 * Write `serial` has been read back: those of `ids` still carrying it are the album's again, and
 * one the room has written since keeps the later write's claim. The same map when nothing moved.
 */
export function readBack(
  writes: OwnWrites,
  ids: Iterable<string>,
  serial: number,
): OwnWrites {
  let next: Map<string, number> | null = null;
  for (const id of ids) {
    if (writes.get(id) !== serial) continue;
    next ??= new Map(writes);
    next.delete(id);
  }
  return next ?? writes;
}

/**
 * EVERY UPLOAD THE ROOM COUNTS AS SHOWN: its grid, and what it acted on that the album has not
 * read back yet. One the album holds waiting outside it is NEW, and waits behind the line.
 */
export function knownIds(
  queue: readonly { id: string }[],
  writes: OwnWrites,
): Set<string> {
  const known = new Set(writes.keys());
  for (const { id } of queue) known.add(id);
  return known;
}

/**
 * THE LINE'S UPLOADS (host-curation `arrivals=prompt`): every waiting upload this room has not
 * shown (`knownIds`), newest first. They never join the grid on their own; the line counts them and
 * a tap folds them in, so nothing moves under a selection or a host working down the queue.
 */
export function arrivals(
  waiting: readonly string[],
  known: ReadonlySet<string>,
): string[] {
  return waiting.filter((id) => !known.has(id));
}

/**
 * Which of the room's items left the queue somewhere else: decided on the server (another tab, a
 * co-host's phone), or seen waiting once and gone from the album now (its guest took it back).
 * ★ NEVER ONE THE ROOM'S OWN WRITE STILL SPEAKS FOR (`OwnWrites`): a poll read before the write
 * landed (or before its Undo did) would contradict it and pull a tile the host just put back.
 */
export function departed(
  items: readonly { id: string }[],
  live: LiveQueue,
  seen: ReadonlySet<string>,
  own: { has(id: string): boolean },
): Set<string> {
  const waiting = new Set(live.waiting);
  const out = new Set<string>();
  for (const { id } of items) {
    if (own.has(id)) continue;
    if (live.decided.has(id) || (seen.has(id) && !waiting.has(id))) out.add(id);
  }
  return out;
}
