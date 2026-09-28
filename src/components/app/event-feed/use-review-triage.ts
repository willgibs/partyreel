"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  approveBulkAction,
  hideBulkAction,
  returnToReviewAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { type GridMedia } from "@/components/app/media-grid";
import { showUndoToast } from "@/components/shared/undo-toast";
import { inBulkBatches } from "@/lib/event/bulk-selection";
import { readCssMs } from "@/lib/shared/read-css-ms";

import {
  arrivals,
  departed,
  knownIds,
  nextAfter,
  ownWrite,
  putBack,
  ranked,
  rankedAbove,
  readBack,
  verdictWords,
  type LiveQueue,
  type OwnWrites,
  type QueueItem,
  type ReviewKind,
} from "./review-queue";
import { useSelection } from "./use-selection";

// THE REVIEW ROOM'S STATE MACHINE (host-curation's seven, wired by curation-wiring). A verdict LEADS
// with its result: the tiles leave at once, the server's write runs underneath, a refusal puts them
// back with a sentence, and a landed verdict's toast offers Undo. The grid holds only what the host
// has seen: uploads that arrive mid-review wait behind a line ("3 new") until a tap folds them in,
// and an upload decided somewhere else leaves quietly. The peek is state here, so the keys, the
// grid and the verdict on the peek all move one cursor. The pure rules are `review-queue.ts`.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Warm the browser cache for just-approved photos so the album reveal paints from cache instead
// of a cold R2 fetch (the gallery re-presigns the SAME key in the SAME stable bucket → a cache
// hit). Fire-and-forget; videos load their own poster fragments, so we only warm photos.
function preloadPhotos(media: GridMedia[]) {
  if (typeof window === "undefined") return;
  for (const m of media) {
    if (m.type !== "photo") continue;
    const img = new Image();
    img.src = m.url;
    void img.decode?.().catch(() => {});
  }
}

function union(set: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(set);
  for (const id of ids) next.add(id);
  return next;
}

function without(set: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(set);
  for (const id of ids) next.delete(id);
  return next;
}

/** The room's one toast: a later verdict's replaces an earlier one, with its Undo. */
export const VERDICT_TOAST_ID = "review-verdict";

// What the Review section currently shows:
//   pending        → the triage grid (and the line, when uploads arrived since it was drawn)
//   beat           → the all-caught-up success beat
//   caught-up      → the slim "all caught up" line
//   moderation-off → the "turn on review" discovery teaser
export type ReviewVisualState =
  | "pending"
  | "beat"
  | "caught-up"
  | "moderation-off";

/**
 * THE ROOM'S WRITES: the Server Functions, each read when it is called (a test's module mock names
 * only what it calls), or the Library's fakes, so its specimen of the room acts without a server.
 */
export type ReviewWrites = {
  approve: typeof approveBulkAction;
  reject: typeof hideBulkAction;
  undo: typeof returnToReviewAction;
};

export const REVIEW_WRITES: ReviewWrites = {
  approve: (...a) => approveBulkAction(...a),
  reject: (...a) => hideBulkAction(...a),
  undo: (...a) => returnToReviewAction(...a),
};

/**
 * THE LIVE QUEUE the room reads from the host's album (`review-live.ts`): what the server holds
 * waiting and decided, the tiles of uploads the room has not shown, and a catch-up to ask for once
 * a write lands, settled once the album has answered it (the moment the room's write is the album's
 * to speak for again, `OwnWrites`). Null off the room (the Library's specimen), where only a server
 * render moves it.
 */
export type ReviewLive = LiveQueue & {
  media: (ids: readonly string[]) => Promise<GridMedia[]>;
  sync: () => Promise<void>;
};

export type ReviewTriage = ReturnType<typeof useReviewTriage>;

export function useReviewTriage({
  eventId,
  items,
  moderationOn,
  live = null,
  writes = REVIEW_WRITES,
}: {
  eventId: string;
  items: GridMedia[];
  moderationOn: boolean;
  live?: ReviewLive | null;
  writes?: ReviewWrites;
}) {
  const [pending, setPending] = useState<QueueItem[]>(() => ranked(items));
  const [exiting, setExiting] = useState<Set<string>>(() => new Set());
  const [caughtUp, setCaughtUp] = useState(false);
  const [beatKind, setBeatKind] = useState<ReviewKind>("approve");
  const [bulkRuns, setBulkRuns] = useState(0);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [folding, setFolding] = useState(false);
  // What the room acted on that the album has not read back yet (`OwnWrites`): the room's own write
  // is each one's truth until then, and each write's serial says which write a read-back settles.
  const [unread, setUnread] = useState<OwnWrites>(() => new Map());
  const writeSerial = useRef(0);
  // Every upload the room counts as shown, its grid and its unread writes: one the server holds
  // waiting outside it is NEW, and waits behind the line (`knownIds`).
  const known = knownIds(pending, unread);
  // Every upload the live album has said was waiting: one of them gone from it now was taken back.
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  // Tiles a server render of the queue handed over for uploads the room has not shown yet.
  const [held, setHeld] = useState<ReadonlyMap<string, GridMedia>>(
    () => new Map(),
  );

  // The multi-select sub-state is the shared primitive (the same machine the album's bulk select
  // uses). Its universe is the queue, so an upload that leaves it leaves the selection too (prune,
  // never reset).
  const sel = useSelection(pending.map((p) => p.id));

  // Ids whose verdict (or whose Undo) is in the air, so a second press (a double tap, a held key)
  // never acts on one twice, and never races its own Undo.
  const inFlight = useRef(new Set<string>());
  // The smallest rank handed out: an arrival folds in above it (`rankedAbove`).
  const topRank = useRef(0);

  // ★ A SERVER RENDER OF THE QUEUE never overrules the room, and is never ignored either. What it
  // no longer holds (and this room did not act on) was decided somewhere else, so it leaves; what it
  // holds that this room has not shown waits behind the line, its tile in hand for the fold. The
  // React "adjust state on a prop change DURING render" idiom, guarded so it runs only on a real
  // change, so it never clobbers an optimistic state between renders.
  const itemsKey = items.map((i) => i.id).join(",");
  const [syncedKey, setSyncedKey] = useState(itemsKey);
  if (itemsKey !== syncedKey) {
    setSyncedKey(itemsKey);
    const served = new Set(items.map((i) => i.id));
    const gone = pending
      .filter((p) => !served.has(p.id) && !unread.has(p.id))
      .map((p) => p.id);
    if (gone.length > 0) {
      // Off the grid, so out of `known`: one that comes back into the queue (an Undo in another
      // tab, a restore) is new again, behind the line.
      setPending((prev) => prev.filter((p) => !gone.includes(p.id)));
    }
    const fresh = items.filter((i) => !known.has(i.id) && !held.has(i.id));
    if (fresh.length > 0) {
      setHeld(
        (prev) => new Map([...prev, ...fresh.map((i) => [i.id, i] as const)]),
      );
    }
  }

  // ★ THE LIVE ALBUM, THE SAME WAY: every snapshot (the first included) grows what has been seen
  // waiting, and drops from the grid what left the queue somewhere else (never what the room's own
  // unread write speaks for). ★ AGAIN WHEN A WRITE IS READ BACK, against the snapshot that read it:
  // an upload put back here and decided elsewhere meanwhile leaves the moment the album is its
  // truth again, not at the album's next change.
  const liveWaiting = live?.waiting ?? null;
  const [syncedWaiting, setSyncedWaiting] = useState<readonly string[] | null>(
    null,
  );
  const [syncedUnread, setSyncedUnread] = useState<OwnWrites>(unread);
  if (live && (liveWaiting !== syncedWaiting || unread !== syncedUnread)) {
    setSyncedWaiting(liveWaiting);
    setSyncedUnread(unread);
    const nextSeen = union(seen, live.waiting);
    if (nextSeen.size !== seen.size) setSeen(nextSeen);
    const gone = departed(pending, live, nextSeen, unread);
    if (gone.size > 0) {
      setPending((prev) => prev.filter((p) => !gone.has(p.id)));
      if (peekId && gone.has(peekId)) setPeekId(null);
    }
  }

  // The line's uploads: the live album's waiting ones this room has not shown, and any a server
  // render handed over that the album has neither decided nor seen leave since.
  const liveNew = live ? arrivals(live.waiting, known) : [];
  const waitingNow = new Set(live?.waiting ?? []);
  const heldNew = [...held.keys()].filter(
    (id) =>
      !known.has(id) &&
      !liveNew.includes(id) &&
      !live?.decided.has(id) &&
      !(live && seen.has(id) && !waitingNow.has(id)),
  );
  const newIds = [...liveNew, ...heldNew];

  // The latest of each, for the async code below (a verdict's exit and its server round trip span
  // renders). Layout effects, so a key pressed right after a render reads that render.
  const pendingRef = useRef(pending);
  const newIdsRef = useRef(newIds);
  const liveRef = useRef(live);
  const heldRef = useRef(held);
  useLayoutEffect(() => {
    pendingRef.current = pending;
    newIdsRef.current = newIds;
    liveRef.current = live;
    heldRef.current = held;
  });

  /** The room writes `ids` (a verdict, its Undo, an Undo refused): its truth until read back. */
  function own(ids: readonly string[]): number {
    const serial = ++writeSerial.current;
    setUnread((prev) => ownWrite(prev, ids, serial));
    return serial;
  }

  /**
   * Ask the album to catch up on write `serial`, and once it has answered, the album speaks for
   * those uploads again. Off the room (no live album, the Library's specimen) nothing can read a
   * write back, so the room's own writes stay its truth against every server render.
   */
  function askAlbum(ids: readonly string[], serial: number) {
    const asked = liveRef.current?.sync();
    if (!asked) return;
    // A catch-up that failed settles too: the album's own poll and doorbell ask again, and the
    // write is theirs to report from then on.
    const settled = () => setUnread((prev) => readBack(prev, ids, serial));
    void asked.then(settled, settled);
  }

  /**
   * ONE VERDICT, ON ANY NUMBER OF UPLOADS: the bar's and Approve all's (`bulk`, which clears the
   * selection and holds the bar while it runs), the keys' and the peek's (one upload, holding
   * nothing, so a host can press through a queue as fast as they can read it).
   */
  function commit(
    kind: ReviewKind,
    ids: readonly string[],
    bulk: boolean,
  ): Promise<void> {
    const list = pendingRef.current;
    const want = new Set(ids);
    const acted = list.filter(
      (p) => want.has(p.id) && !inFlight.current.has(p.id),
    );
    if (acted.length === 0) return Promise.resolve();
    const actedIds = acted.map((p) => p.id);
    const idSet = new Set(actedIds);
    for (const id of actedIds) inFlight.current.add(id);
    const leaving = new Set(inFlight.current);
    // The queue is empty once this verdict, every other one in the air and the line are done: the
    // beat is a promise the room keeps only when nothing is waiting behind the line either.
    const isLast =
      list.every((p) => leaving.has(p.id)) && newIdsRef.current.length === 0;
    const reduced = prefersReducedMotion();

    const verdict = own(actedIds);
    if (bulk) {
      sel.clear();
      setBulkRuns((n) => n + 1);
    }
    // The peek moves on from what leaves it: to the next upload that stays, or it closes.
    const order = list.map((p) => p.id);
    setPeekId((prev) =>
      prev && idSet.has(prev) ? nextAfter(order, prev, leaving) : prev,
    );

    // Fire the write NOW so the server round trip overlaps the exit and the beat. In batches of
    // MAX_BULK_ITEMS, the most one action takes: Approve all hands over the WHOLE queue, and a
    // held queue is whatever the guests sent, so its size can never be a refusal.
    const action = inBulkBatches(actedIds, (batch) =>
      kind === "approve"
        ? writes.approve(eventId, batch)
        : writes.reject(eventId, batch),
    ).catch(() => ({
      ok: false as const,
      message: "Couldn't update those. Please try again.",
    }));
    if (kind === "approve") preloadPhotos(acted);

    // Set when the verdict is taken back (refused, or undone) before its tiles left, so they stay.
    const act = { reverted: false, removed: false };

    // 1) The exit: the tiles fade and scale out, THEN leave the list (instant under reduced
    //    motion). The JS wait reads the same --tune-review-exit-ms the CSS uses. 2) When this
    //    verdict empties the queue, the all-caught-up beat plays in place.
    const leave = async () => {
      if (!reduced) {
        setExiting((prev) => union(prev, actedIds));
        await wait(readCssMs("--tune-review-exit-ms", 150));
        setExiting((prev) => without(prev, actedIds));
      }
      if (act.reverted) return;
      setPending((prev) => prev.filter((p) => !idSet.has(p.id)));
      act.removed = true;
      if (!isLast) return;
      setBeatKind(kind);
      sel.exitSelect();
      if (reduced) return;
      setCaughtUp(true);
      await wait(readCssMs("--tune-review-beat-ms", 2500));
      setCaughtUp(false);
    };

    // 3) The server's answer: a refusal puts the tiles back where they were, with a sentence; a
    //    landed verdict names itself on the room's one toast, with its Undo (the confirmation under
    //    reduced motion too, where no beat plays), and asks the host's album to catch up.
    const settle = action.then((result) => {
      for (const id of actedIds) inFlight.current.delete(id);
      if (bulk) setBulkRuns((n) => n - 1);
      if (!result.ok) {
        act.reverted = true;
        setExiting((prev) => without(prev, actedIds));
        if (act.removed) setPending((prev) => putBack(prev, acted));
        setCaughtUp(false);
        // Nothing the room wrote is left to read back: the album's word stands at once (and a batch
        // of a split verdict that did land leaves the grid when the album says so).
        setUnread((prev) => readBack(prev, actedIds, verdict));
        toast.error(
          result.message || "Couldn't update those. Please try again.",
        );
        return;
      }
      askAlbum(actedIds, verdict);
      // The Undo is the room's next write on these uploads: its own serial, read back on its own.
      let undoWrite = 0;
      showUndoToast({
        id: VERDICT_TOAST_ID,
        message: verdictWords(kind, acted),
        tone: kind === "approve" ? "success" : "warning",
        onUndo: () => {
          act.reverted = true;
          for (const id of actedIds) inFlight.current.add(id);
          undoWrite = own(actedIds);
          setExiting((prev) => without(prev, actedIds));
          setCaughtUp(false);
          setPending((prev) => putBack(prev, acted));
        },
        undo: async () => {
          try {
            return await inBulkBatches(actedIds, (batch) =>
              writes.undo(
                eventId,
                batch,
                kind === "approve" ? "approved" : "hidden",
              ),
            );
          } finally {
            for (const id of actedIds) inFlight.current.delete(id);
          }
        },
        onUndoFailed: () => {
          // The verdict stands: off the grid again, and the album is asked what it holds.
          setPending((prev) => prev.filter((p) => !idSet.has(p.id)));
          askAlbum(actedIds, own(actedIds));
        },
        onUndone: () => askAlbum(actedIds, undoWrite),
      });
    });

    return Promise.all([leave(), settle]).then(() => {});
  }

  /** The bar's verdict on a selection (or any ids). */
  function run(kind: ReviewKind, ids: string[]): Promise<void> {
    return commit(kind, ids, true);
  }

  /** The fast path: approve every upload on screen, exactly what the host saw. */
  function approveAll() {
    void run(
      "approve",
      pendingRef.current.map((p) => p.id),
    );
  }

  /** One upload's verdict: the keys' and the peek's. */
  function decide(kind: ReviewKind, id: string): Promise<void> {
    return commit(kind, [id], false);
  }

  /**
   * THE LINE'S TAP: every upload waiting behind it joins the head of the queue, in the server's
   * order. Resolves with the ids that joined, so the room can put the keyboard's cursor on the
   * first. An upload whose tile cannot be had (taken back while the line counted it) stays out,
   * and the next snapshot drops it from the count.
   */
  async function foldIn(): Promise<string[]> {
    const ids = newIdsRef.current;
    if (ids.length === 0 || folding) return [];
    setFolding(true);
    try {
      const inHand = heldRef.current;
      const missing = ids.filter((id) => !inHand.has(id));
      const fetched =
        missing.length > 0 && liveRef.current
          ? await liveRef.current.media(missing)
          : [];
      const byId = new Map<string, GridMedia>(
        fetched.map((m) => [m.id, m] as const),
      );
      for (const id of ids) {
        const m = inHand.get(id);
        if (m) byId.set(id, m);
      }
      const media = ids.flatMap((id) => {
        const m = byId.get(id);
        return m ? [{ ...m, status: "pending" as const }] : [];
      });
      if (media.length === 0) return [];
      const joined = rankedAbove(media, topRank.current);
      topRank.current -= media.length;
      const joinedIds = joined.map((m) => m.id);
      setPending((prev) => putBack(prev, joined));
      setHeld((prev) => {
        const next = new Map(prev);
        for (const id of joinedIds) next.delete(id);
        return next;
      });
      return joinedIds;
    } catch {
      toast.error("Couldn't load the new uploads. Please try again.");
      return [];
    } finally {
      setFolding(false);
    }
  }

  // The peek shows an upload that is in the queue, or nothing.
  const peek =
    peekId !== null && pending.some((p) => p.id === peekId) ? peekId : null;

  // Urgent = stays at the top of the stack: a live queue, the line, or the beat riding out.
  const waiting = pending.length > 0 || newIds.length > 0;
  const visualState: ReviewVisualState = !moderationOn
    ? "moderation-off"
    : caughtUp
      ? "beat"
      : waiting
        ? "pending"
        : "caught-up";

  const queue: GridMedia[] = pending;
  return {
    pending: queue,
    selected: sel.selected,
    exiting,
    beatKind,
    busy: bulkRuns > 0,
    selectMode: sel.selectMode,
    allSelected: sel.allSelected,
    reviewUrgent: waiting || caughtUp,
    visualState,
    toggle: sel.toggle,
    selectAll: sel.selectAll,
    enterSelect: sel.enterSelect,
    exitSelect: sel.exitSelect,
    run,
    approveAll,
    decide,
    /** The upload the peek shows, or null. */
    peekId: peek,
    setPeekId,
    /** How many uploads wait behind the line. */
    arrivals: newIds.length,
    foldIn,
    folding,
  };
}
