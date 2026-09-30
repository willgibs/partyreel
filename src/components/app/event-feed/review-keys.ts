"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { layerIsUp } from "@/components/ui/layer-is-up";

import { isGridKey, nextAfter, stepIndex } from "./review-queue";
import type { ReviewTriage } from "./use-review-triage";

/**
 * THE QUEUE FROM THE KEYBOARD (host-curation `keys=arrows`, Will: "Let's not include the hints row
 * ... but include the common keyboard controls if a user simply expects them to work").
 *
 * The grid:   the arrows move the cursor (the focused tile), Home and End to either end; Enter
 *             approves the upload under it and Backspace (or Delete) rejects it, the cursor moving
 *             on to the next before the tile leaves, so a host presses through a queue as fast as
 *             they read it; Space opens the peek, as a Mac's Quick Look does.
 * The peek:   left and right walk it through the queue, Enter and Backspace give the verdict on the
 *             photograph it shows (and it moves on), Space or Escape (the peek's own) close it.
 * Selecting:  the arrows still move, Space and Enter toggle the tile natively (a checkbox's keys),
 *             and Escape leaves select mode. A key never gives a verdict on a selection: that is
 *             the bar's press, never a stray Backspace's.
 *
 * ★ THE KEYS ARE THE ROOM'S ONLY WHERE THE HOST IS IN THE ROOM: on a tile, in the peek, or (on the
 * room's own page, `claimPage`) with nothing focused at all, where an arrow puts the cursor on the
 * first tile. A key on any other control (the line, the bar, a toast's Undo, a field) is that
 * control's, a modifier chord is the browser's, and another layer up (a dialog, a menu) owns its
 * keys. A specimen of the room among others (the Library) never claims the page.
 */
export function useReviewKeys({
  rootRef,
  triage,
  claimPage,
}: {
  rootRef: RefObject<HTMLElement | null>;
  triage: ReviewTriage;
  claimPage: boolean;
}) {
  // The latest triage for the listener, written in a layout effect so a key pressed right after a
  // render reads that render (a verdict's exit and the next press can be milliseconds apart).
  const triageRef = useRef(triage);
  useLayoutEffect(() => {
    triageRef.current = triage;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const root = rootRef.current;
      const t = triageRef.current;
      if (!root || t.visualState !== "pending") return;

      const target = e.target instanceof Element ? e.target : null;
      const onBody =
        !target ||
        target === document.body ||
        target === document.documentElement;
      const peek = root.querySelector("[data-review-peek]");
      const inPeek = !!(peek && target && peek.contains(target));
      // Another layer is up (a dialog, a confirm, a menu): its keys are its own. The peek is this
      // room's own layer, never "another".
      if (!inPeek && layerIsUp({ except: "[data-review-peek]" })) return;

      if (t.peekId) {
        if (!inPeek && !(claimPage && onBody)) return;
        const shown = t.peekId;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const ids = t.pending
            .map((p) => p.id)
            .filter((id) => !t.exiting.has(id));
          const next =
            ids[ids.indexOf(shown) + (e.key === "ArrowRight" ? 1 : -1)];
          if (next) t.setPeekId(next);
          e.preventDefault();
          return;
        }
        // Enter or Space on one of the peek's own buttons is that button's: they are the keys a
        // button acts on. Every other key there is still the peek's, so Backspace on a focused
        // Reject or on the close rejects the photograph shown, as the help promises.
        if (
          inPeek &&
          (e.key === "Enter" || e.key === " ") &&
          target?.closest("button")
        ) {
          return;
        }
        if (e.key === "Enter") {
          void t.decide("approve", shown);
        } else if (e.key === "Backspace" || e.key === "Delete") {
          void t.decide("reject", shown);
        } else if (e.key === " ") {
          t.setPeekId(null);
        } else {
          return;
        }
        e.preventDefault();
        return;
      }

      const tileEl = target?.closest<HTMLElement>("[data-tile-id]") ?? null;
      const onTile = !!(tileEl && root.contains(tileEl));
      if (!onTile && !(claimPage && onBody)) return;

      if (e.key === "Escape") {
        if (!t.selectMode) return;
        t.exitSelect();
        e.preventDefault();
        return;
      }

      const tiles = [
        ...root.querySelectorAll<HTMLElement>(
          "[data-tile-id]:not([data-exiting])",
        ),
      ];
      const ids = tiles.map((el) => el.dataset.tileId ?? "");
      const current = onTile ? (tileEl?.dataset.tileId ?? null) : null;
      const at = current ? ids.indexOf(current) : -1;

      if (isGridKey(e.key)) {
        const next = stepIndex(at, e.key, columnsOf(root), ids.length);
        if (next >= 0) focusTile(tiles[next]);
        e.preventDefault();
        return;
      }

      // Selecting: Space and Enter are the tile's own (it toggles); nothing else acts.
      if (!current || t.selectMode) return;

      if (e.key === "Enter" || e.key === "Backspace" || e.key === "Delete") {
        // The cursor moves on BEFORE the tile leaves, so the next press lands on the next upload.
        const leaving = new Set([current, ...t.exiting]);
        const next = nextAfter(ids, current, leaving);
        void t.decide(e.key === "Enter" ? "approve" : "reject", current);
        if (next) focusTile(tiles[ids.indexOf(next)]);
        e.preventDefault();
        return;
      }
      if (e.key === " ") {
        t.setPeekId(current);
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [rootRef, claimPage]);
}

/** How many columns the queue lays out in: the uniform grid's own tracks, read off the page. */
function columnsOf(root: Element): number {
  const grid = root.querySelector<HTMLElement>("[data-review-grid]");
  if (!grid) return 1;
  const tracks = getComputedStyle(grid)
    .gridTemplateColumns.split(" ")
    .filter((t) => t && t !== "none");
  return Math.max(1, tracks.length);
}

/** Puts the keyboard's cursor on a tile and brings it into view, never jumping the page. */
function focusTile(tile: HTMLElement | undefined) {
  const button = tile?.querySelector<HTMLElement>("[data-tile-button]");
  if (!button || !tile) return;
  button.focus({ preventScroll: true });
  tile.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}
