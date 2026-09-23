"use client";

import { useCallback, useRef, useState } from "react";

import { useSelection } from "@/components/app/event-feed/use-selection";
import type {
  ReviewTriage,
  ReviewVisualState,
} from "@/components/app/event-feed/use-review-triage";
import type { GridMedia } from "@/components/app/media-grid";
import { readCssMs } from "@/lib/shared/read-css-ms";

/**
 * THE SHIPPED TRIAGE MACHINE, FORKED SO IT CANNOT REACH A SERVER.
 *
 * ★ WHY A FORK AND NOT THE HOOK. `useReviewTriage` imports `approveBulkAction`
 * and `hideBulkAction` as VALUES and calls one on every run, so mounting it on a
 * board would put a real bulk mutation one click from a reviewer. Everything
 * else is copied line for line and stays real: the same `useSelection`
 * primitive (prune, never reset), the same optimistic order (remove first, then
 * reconcile), the same two timings read from the same CSS variables
 * (`--tune-review-exit-ms`, `--tune-review-beat-ms`), the same four visual
 * states and the same urgency flag. The server call becomes a resolved promise
 * with the round trip it really costs, so the beat and the exit play at the
 * pace a host sees.
 *
 * ★ AND THE TOAST COMES OUT AS A CALLBACK. The shipped hook calls sonner, whose
 * `<Toaster>` lives at the app root: fired from inside a board's frame it would
 * land on the lab page instead, outside the picture being judged. Here the run
 * REPORTS what it would say and each preview draws that where the host would
 * see it, which is the whole subject of the `undo` decision.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What the shipped hook would have handed sonner. */
export type LabToast = {
  tone: "success" | "warning";
  text: string;
  /** The ids the act covered, so an Undo option has something to put back. */
  ids: string[];
  kind: "approve" | "hide";
  /** Bumped on every fire so a preview can restart its own exit animation. */
  at: number;
};

/** The round trip the two bulk actions really cost on the alias, in ms. */
const SERVER_MS = 320;

export function useLabTriage({
  items,
  moderationOn = true,
  reducedMotion = false,
  onToast,
}: {
  items: GridMedia[];
  moderationOn?: boolean;
  reducedMotion?: boolean;
  onToast?: (t: LabToast) => void;
}): ReviewTriage & { restore: (ids: string[]) => void } {
  const [pending, setPending] = useState<GridMedia[]>(items);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [caughtUp, setCaughtUp] = useState(false);
  const [beatKind, setBeatKind] = useState<"approve" | "hide">("approve");
  const [busy, setBusy] = useState(false);

  const sel = useSelection(pending.map((p) => p.id));

  // The removed rows, so an Undo preview can put them back in their own order.
  const removed = useRef<Map<string, GridMedia>>(new Map());
  const order = useRef<string[]>(items.map((i) => i.id));

  const run = useCallback(
    async (kind: "approve" | "hide", ids: string[]) => {
      if (ids.length === 0 || busy) return;
      const idSet = new Set(ids);
      let remaining: GridMedia[] = [];

      setBusy(true);
      sel.clear();

      if (!reducedMotion) {
        setExiting(idSet);
        await wait(readCssMs("--tune-review-exit-ms", 150));
      }
      setExiting(new Set());
      setPending((prev) => {
        for (const p of prev) if (idSet.has(p.id)) removed.current.set(p.id, p);
        remaining = prev.filter((p) => !idSet.has(p.id));
        return remaining;
      });

      const isLast = remaining.length === 0;
      if (isLast) {
        setBeatKind(kind);
        sel.exitSelect();
        if (!reducedMotion) {
          setCaughtUp(true);
          await wait(readCssMs("--tune-review-beat-ms", 2500));
          setCaughtUp(false);
        }
      }

      // Where the shipped hook awaits the Server Function. Nothing is called.
      await wait(SERVER_MS);
      setBusy(false);

      onToast?.({
        tone: kind === "approve" ? "success" : "warning",
        text:
          kind === "approve"
            ? `Approved ${ids.length} ${ids.length === 1 ? "photo" : "photos"}`
            : "Hidden from everyone",
        ids,
        kind,
        at: Date.now(),
      });
    },
    [busy, onToast, reducedMotion, sel],
  );

  const approveAll = useCallback(() => {
    void run(
      "approve",
      pending.map((p) => p.id),
    );
  }, [pending, run]);

  /** Board-only: what an Undo on the toast would do, in the order they were in. */
  const restore = useCallback((ids: string[]) => {
    setPending((prev) => {
      const back = ids
        .map((id) => removed.current.get(id))
        .filter((m): m is GridMedia => !!m);
      if (back.length === 0) return prev;
      for (const id of ids) removed.current.delete(id);
      const all = [...prev, ...back];
      const rank = new Map(order.current.map((id, i) => [id, i]));
      return all.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    });
  }, []);

  const reviewUrgent = pending.length > 0 || caughtUp;
  const visualState: ReviewVisualState = !moderationOn
    ? "moderation-off"
    : caughtUp
      ? "beat"
      : pending.length > 0
        ? "pending"
        : "caught-up";

  return {
    pending,
    selected: sel.selected,
    exiting,
    beatKind,
    busy,
    selectMode: sel.selectMode,
    allSelected: sel.allSelected,
    reviewUrgent,
    visualState,
    toggle: sel.toggle,
    selectAll: sel.selectAll,
    enterSelect: sel.enterSelect,
    exitSelect: sel.exitSelect,
    run,
    approveAll,
    restore,
  };
}

/**
 * A triage frozen at one moment, for a picture that must not move under the
 * reviewer (the verb's two bars, the keyboard's focused tile). Same shape, no
 * machine: every handler is a no-op, so nothing here can run either.
 */
export function stillTriage(
  pending: GridMedia[],
  over: Partial<ReviewTriage> = {},
): ReviewTriage {
  return {
    pending,
    selected: new Set(),
    exiting: new Set(),
    beatKind: "approve",
    busy: false,
    selectMode: false,
    allSelected: false,
    reviewUrgent: pending.length > 0,
    visualState: pending.length > 0 ? "pending" : "caught-up",
    toggle: () => {},
    selectAll: () => {},
    enterSelect: () => {},
    exitSelect: () => {},
    run: async () => {},
    approveAll: () => {},
    ...over,
  };
}
