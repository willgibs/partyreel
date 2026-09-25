"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// A small tap-and-hold gesture for entering the gallery album bulk-select (mobile-native; the host
// long-presses a tile to start selecting, seeded with that tile). Called ONCE at the grid level (only
// one press happens at a time), it returns:
//   • handlers      → the pointer handlers to spread onto the GRID. Each press finds its tile through
//                     `resolve` (the event's target to an id, or null for a press on nothing that
//                     holds), so no tile carries a handler of its own.
//   • consumeClick()→ call at the top of the tile's click; returns true if a long-press just fired,
//                     so the host suppresses the click that the browser synthesizes after the hold
//                     (otherwise the press-then-release would ALSO open the lightbox).
// A move beyond the tolerance (a scroll-drag) or an early release cancels the timer, so a normal tap
// and a scroll never trigger select mode. Without `onLongPress` every handler is a no-op, so the guest
// and recovery grids are untouched.
//
// ★ ONE DELEGATED SET, NEVER A BIND PER TILE (the album-window lane). A handler object per tile was a
// new closure per tile per render, which is exactly what a memoized tile cannot compare; the grid's one
// set is stable for its life and reads the latest callback at press time.
export function useLongPress(
  onLongPress: ((id: string) => void) | undefined,
  {
    resolve,
    delayMs = 450,
    moveTolerance = 10,
  }: {
    resolve: (target: EventTarget | null) => string | null;
    delayMs?: number;
    moveTolerance?: number;
  },
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const latest = useRef({ onLongPress, resolve });
  useEffect(() => {
    latest.current = { onLongPress, resolve };
  });

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  }, []);

  // A press still pending when the grid goes must never fire into it.
  useEffect(() => cancel, [cancel]);

  const handlers = useMemo(
    () => ({
      onPointerDown: (e: ReactPointerEvent) => {
        const { onLongPress: fire, resolve: find } = latest.current;
        if (!fire) return;
        // Primary press only (ignore right / middle mouse); touch + pen have button 0.
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const id = find(e.target);
        if (!id) return;
        cancel();
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          fired.current = true;
          timer.current = null;
          latest.current.onLongPress?.(id);
        }, delayMs);
      },
      onPointerMove: (e: ReactPointerEvent) => {
        if (!start.current) return;
        if (
          Math.abs(e.clientX - start.current.x) > moveTolerance ||
          Math.abs(e.clientY - start.current.y) > moveTolerance
        ) {
          cancel();
        }
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
    }),
    [cancel, delayMs, moveTolerance],
  );

  // True (and self-clearing) for exactly the one click that follows a fired long-press.
  const consumeClick = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return true;
    }
    return false;
  }, []);

  return { handlers, consumeClick };
}
