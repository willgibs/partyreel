"use client";

/* eslint-disable react-hooks/immutability -- a FLIP + a drag-follow imperatively mutate DOM element
   styles (transform/transition) in a layout effect / pointer handler; that imperative DOM write IS the
   technique (same as use-flip.ts). The lint guards against mutating React-owned values, not the live DOM. */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { runFlip } from "@/lib/shared/use-flip";

// Our own small, dependency-free sortable for a UNIFORM grid (the project dropped framer-motion + ships
// no drag lib). The whole reason hand-rolling beats pulling in dnd-kit here: on a fixed-aspect grid the
// "where does it drop" problem is just two integer divisions (pointToIndex), and we already own a FLIP
// technique (use-flip) + a proven pointer machine (the lightbox swipe). The dragged tile is finger-
// followed via an imperative transform; the OTHER tiles slide to their new slots via a 2-axis FLIP
// (use-flip only translates Y; a grid moves on both axes). Reduced motion skips the slide. Touch grabs
// behind a 450ms press (so a vertical scroll never reorders); mouse grabs immediately. Generic over any
// `{id}` item so a future gallery reorder reuses it verbatim.

// ── Pure geometry + array helpers (exported for unit tests; no DOM) ──────────────────────────────────

/** The grid slot index under a pointer, from the pointer position RELATIVE to the grid's top-left +
 *  the (uniform) tile box + gap. Clamped to [0, count-1] so the last partial row never yields a phantom. */
export function pointToIndex(p: {
  x: number;
  y: number;
  cols: number;
  tileW: number;
  tileH: number;
  gap: number;
  count: number;
}): number {
  const col = Math.min(
    Math.max(Math.floor(p.x / (p.tileW + p.gap)), 0),
    p.cols - 1,
  );
  const row = Math.max(Math.floor(p.y / (p.tileH + p.gap)), 0);
  return Math.min(Math.max(row * p.cols + col, 0), p.count - 1);
}

/** Move one item from `from` to `to`, returning a NEW array (identity unchanged on a no-op). */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= arr.length ||
    to >= arr.length
  ) {
    return arr;
  }
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// ── The hook ─────────────────────────────────────────────────────────────────────────────────────────

const LONG_PRESS_MS = 450; // touch press-to-grab (mirrors use-long-press)
const MOVE_TOLERANCE = 10; // px before a touch press is treated as a scroll, not a grab
const EDGE = 72; // px from a viewport edge that triggers autoscroll
const EDGE_SPEED = 14; // max autoscroll px/frame

type Geom = { cols: number; tileW: number; tileH: number; gap: number };
type DragState = {
  id: string;
  pointerId: number;
  grabOffsetX: number; // pointer - tile.left at grab
  grabOffsetY: number;
  geom: Geom;
  fingerX: number; // latest pointer (client coords)
  fingerY: number;
};

export function useSortableGrid<T extends { id: string }>(opts: {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
}) {
  const { items, onReorder } = opts;
  const [order, setOrder] = useState<T[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [keyboardLiftId, setKeyboardLiftId] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const prevRects = useRef(new Map<string, DOMRect>());
  const orderRef = useRef(order); // kept in lockstep with setOrder INSIDE handlers (never during render)
  const dragRef = useRef<DragState | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const keySnapshot = useRef<T[] | null>(null); // pre-pickup order, for Escape revert

  // Mirror order into orderRef after every commit (a backstop; handlers also set it synchronously).
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // Resync to the prop order when it changes OUTSIDE a drag/keyboard-hold: a commit reorders `items` to
  // match `order` (no-op), an external change (un-reel) re-seeds. Optimistic, so no revert race (the
  // provider updates `reel` synchronously on reorder).
  const itemsKey = items.map((i) => i.id).join(",");
  useEffect(() => {
    if (draggingId !== null || keyboardLiftId !== null) return;
    if (orderRef.current.map((i) => i.id).join(",") !== itemsKey) {
      orderRef.current = items;
      setOrder(items);
    }
  }, [itemsKey, items, draggingId, keyboardLiftId]);

  const orderKey = order.map((i) => i.id).join(",");

  // Apply the dragged tile's follow-transform from its CURRENT slot index, so it sits under the finger
  // no matter how the slot moved when the order changed (no jump on reorder). idx is computed by the
  // caller from the freshest order it has (the layout effect's closure, or orderRef in handlers).
  const applyDragTransform = useCallback((idx: number) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container || idx < 0) return;
    const el = nodes.current.get(drag.id);
    if (!el) return;
    const { cols, tileW, tileH, gap } = drag.geom;
    const slotLeft = (idx % cols) * (tileW + gap);
    const slotTop = Math.floor(idx / cols) * (tileH + gap);
    const c = container.getBoundingClientRect();
    const tx = drag.fingerX - drag.grabOffsetX - (c.left + slotLeft);
    const ty = drag.fingerY - drag.grabOffsetY - (c.top + slotTop);
    el.style.transition = "none";
    el.style.transform = `translate(${tx}px, ${ty}px) scale(1.04)`;
    el.style.zIndex = "30";
    el.style.willChange = "transform";
    el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.28)";
    el.style.cursor = "grabbing";
  }, []);

  const clearDraggedStyle = useCallback((id: string) => {
    const el = nodes.current.get(id);
    if (!el) return;
    el.style.transition = "";
    el.style.transform = "";
    el.style.zIndex = "";
    el.style.willChange = "";
    el.style.boxShadow = "";
    el.style.cursor = "";
    // Re-baseline the FLIP rect to the untransformed box so the NEXT reorder doesn't slide from a stale,
    // transformed position.
    prevRects.current.set(id, el.getBoundingClientRect());
  }, []);

  // FLIP the OTHER tiles to their new slots whenever the order changes; finger-recompute the dragged one
  // (skipped by the pass, so its transformed rect never becomes a baseline). The pass is use-flip's
  // runFlip, the one implementation (2026-09-11); this used to be a second copy of it. Reads the
  // CLOSED-OVER `order` so it's correct in the same paint as the reorder.
  useLayoutEffect(() => {
    const dragId = dragRef.current?.id ?? null;
    runFlip(nodes.current, prevRects.current, {
      skip: (id) => id === dragId,
      onSkip: () => applyDragTransform(order.findIndex((i) => i.id === dragId)),
    });
    // order is intentionally a dep (via orderKey) — the closure must be the post-reorder order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey, applyDragTransform]);

  const measureGeom = useCallback((): Geom | null => {
    const container = containerRef.current;
    if (!container) return null;
    const style = getComputedStyle(container);
    const cols =
      style.gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    const gap = parseFloat(style.columnGap || "0") || 0;
    const first = container.firstElementChild as HTMLElement | null;
    const r = first?.getBoundingClientRect();
    if (!r) return null;
    return { cols, tileW: r.width, tileH: r.height, gap };
  }, []);

  // The live move: recompute the target slot from the finger, reorder if it changed, else re-follow.
  // Computes against orderRef (kept in lockstep below) so consecutive moves in one frame stay consistent.
  const handleMove = useCallback(() => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;
    const c = container.getBoundingClientRect();
    const o = orderRef.current;
    const target = pointToIndex({
      x: drag.fingerX - c.left,
      y: drag.fingerY - c.top,
      cols: drag.geom.cols,
      tileW: drag.geom.tileW,
      tileH: drag.geom.tileH,
      gap: drag.geom.gap,
      count: o.length,
    });
    const current = o.findIndex((i) => i.id === drag.id);
    if (current < 0) return;
    if (target !== current) {
      const next = moveItem(o, current, target);
      orderRef.current = next; // sync (in a handler — allowed) so the next move reads the new order
      setOrder(next); // → FLIP siblings + re-follow (the layout effect)
    } else {
      applyDragTransform(current);
    }
  }, [applyDragTransform]);

  const stopAutoscroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tickAutoscroll = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) {
      stopAutoscroll();
      return;
    }
    const vh = window.innerHeight;
    let dy = 0;
    if (drag.fingerY < EDGE) dy = -EDGE_SPEED * (1 - drag.fingerY / EDGE);
    else if (drag.fingerY > vh - EDGE)
      dy = EDGE_SPEED * (1 - (vh - drag.fingerY) / EDGE);
    if (dy !== 0) {
      window.scrollBy(0, dy);
      handleMove(); // the index shifts as the page scrolls under the finger
      rafRef.current = requestAnimationFrame(tickAutoscroll);
    } else {
      rafRef.current = null;
    }
  }, [handleMove, stopAutoscroll]);

  const beginDrag = useCallback(
    (id: string, pointerId: number, clientX: number, clientY: number) => {
      const el = nodes.current.get(id);
      const geom = measureGeom();
      if (!el || !geom) return;
      const r = el.getBoundingClientRect();
      dragRef.current = {
        id,
        pointerId,
        grabOffsetX: clientX - r.left,
        grabOffsetY: clientY - r.top,
        geom,
        fingerX: clientX,
        fingerY: clientY,
      };
      try {
        el.setPointerCapture(pointerId);
      } catch {
        // setPointerCapture can throw if the pointer already ended; harmless.
      }
      setDraggingId(id);
      applyDragTransform(orderRef.current.findIndex((i) => i.id === id));
    },
    [applyDragTransform, measureGeom],
  );

  const endDrag = useCallback(
    (commit: boolean) => {
      const drag = dragRef.current;
      stopAutoscroll();
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      pressStart.current = null;
      if (!drag) return;
      dragRef.current = null;
      clearDraggedStyle(drag.id);
      setDraggingId(null);
      if (commit) onReorder(orderRef.current.map((i) => i.id));
    },
    [clearDraggedStyle, onReorder, stopAutoscroll],
  );

  // Clean up timers + rAF on unmount.
  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Props the consumer spreads ──

  const registerTile = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    },
    [],
  );

  // Kept separate from the handlers (an object carrying a ref-setter would taint property access during
  // render under react-hooks/refs); a bare callback ref is the standard, lint-clean pattern.
  const setContainerRef = (el: HTMLElement | null) => {
    containerRef.current = el;
  };
  const containerHandlers = {
    onPointerMove: (e: ReactPointerEvent) => {
      // Touch press-to-grab: a move beyond the tolerance before the timer fires = a scroll, cancel it.
      if (!dragRef.current && pressStart.current) {
        if (
          Math.abs(e.clientX - pressStart.current.x) > MOVE_TOLERANCE ||
          Math.abs(e.clientY - pressStart.current.y) > MOVE_TOLERANCE
        ) {
          if (pressTimer.current) clearTimeout(pressTimer.current);
          pressTimer.current = null;
          pressStart.current = null;
        }
        return;
      }
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      e.preventDefault();
      drag.fingerX = e.clientX;
      drag.fingerY = e.clientY;
      handleMove();
      if (rafRef.current === null) tickAutoscroll();
    },
    onPointerUp: (e: ReactPointerEvent) => {
      if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
        endDrag(true);
      } else if (pressStart.current) {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        pressStart.current = null;
      }
    },
    onPointerCancel: () => endDrag(false),
  };

  const tileHandleProps = useCallback(
    (id: string) => ({
      onPointerDown: (e: ReactPointerEvent) => {
        if (e.pointerType === "mouse") {
          if (e.button !== 0) return;
          e.preventDefault();
          beginDrag(id, e.pointerId, e.clientX, e.clientY);
          return;
        }
        // Touch / pen: press-to-grab so a vertical scroll never lifts a tile.
        pressStart.current = { x: e.clientX, y: e.clientY };
        const pid = e.pointerId;
        const x = e.clientX;
        const y = e.clientY;
        pressTimer.current = setTimeout(() => {
          pressTimer.current = null;
          pressStart.current = null;
          beginDrag(id, pid, x, y);
        }, LONG_PRESS_MS);
      },
      onKeyDown: (e: ReactKeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (keyboardLiftId === id) {
            keySnapshot.current = null;
            setKeyboardLiftId(null);
            onReorder(orderRef.current.map((i) => i.id));
          } else if (keyboardLiftId === null) {
            keySnapshot.current = orderRef.current;
            setKeyboardLiftId(id);
          }
          return;
        }
        if (e.key === "Escape" && keyboardLiftId) {
          e.preventDefault();
          if (keySnapshot.current) {
            orderRef.current = keySnapshot.current;
            setOrder(keySnapshot.current);
          }
          keySnapshot.current = null;
          setKeyboardLiftId(null);
          return;
        }
        if (keyboardLiftId === id) {
          const delta =
            e.key === "ArrowLeft" || e.key === "ArrowUp"
              ? -1
              : e.key === "ArrowRight" || e.key === "ArrowDown"
                ? 1
                : 0;
          if (delta !== 0) {
            e.preventDefault();
            const o = orderRef.current;
            const cur = o.findIndex((i) => i.id === id);
            const next = moveItem(o, cur, cur + delta);
            orderRef.current = next;
            setOrder(next);
          }
        }
      },
      tabIndex: 0,
    }),
    [beginDrag, onReorder, keyboardLiftId],
  );

  return {
    /** The live order (drives the render; mutates during a drag). */
    order,
    /** The lifted tile id (drag or keyboard), for `data-dragging` styling. */
    draggingId: draggingId ?? keyboardLiftId,
    registerTile,
    /** Callback ref for the grid container. */
    setContainerRef,
    /** Spread onto the grid container (pointer move/up/cancel). */
    containerHandlers,
    tileHandleProps,
  };
}
