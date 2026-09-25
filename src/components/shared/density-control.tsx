"use client";

/**
 * THE ALBUM'S DENSITY (`album-columns` r2, Will's `steps=both`: "The View
 * menu's slider on every screen, and pinch as the shortcut wherever there is a
 * touch screen or a trackpad"), with his note on it: three steps at most, so a
 * dense step never loads a ton of media at once (`album-rows.ts`' `ROW_CLASSES`).
 *
 * Two parts, one step:
 *   - `DensityMenuGroup`, the slider, a group of the one View menu at every
 *     width (`view-menu.tsx`'s `kind: "density"`);
 *   - `useDensityGestures`, the shortcut: a pinch on a touch screen, a trackpad
 *     pinch or ctrl and the wheel, read on the album grid itself. The grid
 *     anchors the change on the photograph under the fingers or the pointer, so
 *     the album grows or shrinks around what you were looking at.
 *
 * Both only ever step: photographs per row, never pixels (`control=slider`: "a
 * fine pixel slider means images may not cleanly fill the gallery edge to
 * edge").
 */
import { useEffect, useRef } from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import {
  isRowStep,
  ROW_STEP_COUNT,
  type RowStep,
} from "@/lib/shared/album-rows";
import { ROW_STEP_LABEL } from "@/lib/shared/tile-size-cookie";
import { cn } from "@/lib/utils";

/** The stops, left to right: the densest first (the Photos and Finder slider's own direction: smaller to the left). */
const STOPS: readonly RowStep[] = Array.from(
  { length: ROW_STEP_COUNT },
  (_, i) => (ROW_STEP_COUNT - 1 - i) as RowStep,
);

/** "5 a row": a step in the words it means, where the album's width is known. */
export function perRowLabel(n: number): string {
  return `${n} a row`;
}

/** Nine small squares: the densest end of the track. */
function DenseGlyph() {
  return (
    <span aria-hidden className="grid size-3.5 shrink-0 grid-cols-3 gap-px">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="rounded-[1px] bg-current" />
      ))}
    </span>
  );
}

/** One square: the largest end. */
function LargeGlyph() {
  return (
    <span aria-hidden className="size-3.5 shrink-0 rounded-[2px] bg-current" />
  );
}

/**
 * THE SLIDER, AS A GROUP OF THE VIEW MENU: three stops on a drawn track.
 *
 * ★ EACH STOP IS A MENU RADIO ITEM, SO THE MENU'S OWN KEYBOARD REACHES IT. A
 * slider thumb inside a menu is unreachable (a menu owns Tab and moves between
 * its items with the arrows), so the stops are the menu's items, laid on a
 * line: the arrows walk them, Enter picks, and a screen reader hears "3 a row,
 * radio, checked, 2 of 3". A pick keeps the menu open, so the album re-lays
 * behind it while the reader watches and tries the next.
 */
export function DensityMenuGroup({
  label,
  value,
  onChange,
  perRow,
  hint,
  disabled = false,
}: {
  label: string;
  value: RowStep;
  onChange: (step: RowStep) => void;
  /** Photographs per row at each step for the album's width, when the caller knows it. */
  perRow?: (step: RowStep) => number;
  /** A trailing note beside the label (default: the current step, in its words). */
  hint?: string;
  disabled?: boolean;
}) {
  const words = (s: RowStep) =>
    perRow ? perRowLabel(perRow(s)) : ROW_STEP_LABEL[s];
  return (
    <MenuPrimitive.Group data-density-control>
      <DropdownMenuLabel className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        <span className="text-micro text-muted-foreground tabular-nums">
          {hint ?? words(value)}
        </span>
      </DropdownMenuLabel>
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-2 text-muted-foreground">
        <DenseGlyph />
        <MenuPrimitive.RadioGroup
          aria-label={label}
          value={String(value)}
          onValueChange={(v) => {
            const n = Number(v);
            if (isRowStep(n)) onChange(n);
          }}
          className="relative flex h-6 flex-1 items-center justify-between"
        >
          <span
            aria-hidden
            className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border"
          />
          {STOPS.map((s) => (
            <MenuPrimitive.RadioItem
              key={s}
              value={String(s)}
              disabled={disabled}
              aria-label={words(s)}
              // Keep the menu open: the album re-lays behind it as you try each.
              onSelect={(e) => e.preventDefault()}
              className={cn(
                "group/stop relative flex size-6 cursor-pointer items-center justify-center rounded-full outline-hidden",
                "data-highlighted:ring-2 data-highlighted:ring-ring data-disabled:pointer-events-none data-disabled:opacity-50",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "rounded-full transition-[width,height,background-color] duration-150 ease-emphasis",
                  "size-1.5 bg-muted-foreground/60 group-data-[state=checked]/stop:size-3.5 group-data-[state=checked]/stop:bg-foreground",
                )}
              />
            </MenuPrimitive.RadioItem>
          ))}
        </MenuPrimitive.RadioGroup>
        <LargeGlyph />
      </div>
    </MenuPrimitive.Group>
  );
}

/** A point on screen a gesture happened at: the grid anchors its change on the photograph there. */
export type FocalPoint = { x: number; y: number };

/**
 * How far a gesture must travel for one step: a pinch's spread by a quarter,
 * or about a notch of a wheel (a trackpad pinch arrives as many small ctrl-wheel
 * deltas, so it sums them).
 */
const PINCH_STEP = 1.25;
const WHEEL_STEP = 60;

/**
 * THE SHORTCUT: a pinch, a trackpad pinch, or ctrl and the wheel, over the
 * album and only there. Spreading makes the photographs bigger (a sparser
 * step), as everywhere. `onStep` gets the next step and where the gesture was.
 *
 * ★ IT TAKES OVER THE PAGE'S ZOOM ONLY OVER THE ALBUM. The wheel listener is
 * native and non-passive (React's is passive, and a pinch that cannot
 * `preventDefault` zooms the whole page); Safari's trackpad pinch is its own
 * `gesture*` events, handled the same way; a touch pinch needs the grid's
 * `touch-action: pan-y` (the caller's), which keeps a one-finger scroll the
 * browser's and hands two fingers to the album. The viewer is a layer of its
 * own, so its pinch-zoom is untouched.
 */
export function useDensityGestures(
  el: HTMLElement | null,
  {
    step,
    onStep,
  }: {
    step: RowStep;
    onStep: ((next: RowStep, at: FocalPoint) => void) | undefined;
  },
) {
  const latest = useRef({ step, onStep });
  useEffect(() => {
    latest.current = { step, onStep };
  });
  const enabled = !!onStep;

  useEffect(() => {
    if (!el || !enabled) return;
    const nudge = (bigger: boolean, at: FocalPoint) => {
      const { step: now, onStep: fire } = latest.current;
      const next = now + (bigger ? -1 : 1);
      if (!fire || !isRowStep(next)) return false;
      latest.current = { ...latest.current, step: next };
      fire(next, at);
      return true;
    };

    // Ctrl and the wheel, and a trackpad pinch (Chrome, Firefox and Edge send
    // it as a ctrl-wheel with small deltas).
    let wheel = 0;
    let wheelAt = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // A pause is a new gesture: stale travel must not tip the next one.
      if (e.timeStamp - wheelAt > 400) wheel = 0;
      wheelAt = e.timeStamp;
      wheel += e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
      if (Math.abs(wheel) < WHEEL_STEP) return;
      nudge(wheel < 0, { x: e.clientX, y: e.clientY });
      wheel = 0;
    };

    // Safari's trackpad pinch.
    type GestureLike = Event & {
      scale: number;
      clientX: number;
      clientY: number;
    };
    let gestureBase = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureBase = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as GestureLike;
      const ratio = g.scale / gestureBase;
      if (ratio > PINCH_STEP || ratio < 1 / PINCH_STEP) {
        nudge(ratio > 1, { x: g.clientX, y: g.clientY });
        gestureBase = g.scale;
      }
    };

    // Two fingers on a touch screen.
    const points = new Map<number, FocalPoint>();
    let spreadAt = 0;
    const spread = () => {
      const [a, b] = [...points.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const mid = (): FocalPoint => {
      const [a, b] = [...points.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size === 2) spreadAt = spread();
    };
    const onMove = (e: PointerEvent) => {
      if (!points.has(e.pointerId)) return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size !== 2 || spreadAt === 0) return;
      const ratio = spread() / spreadAt;
      if (ratio > PINCH_STEP || ratio < 1 / PINCH_STEP) {
        nudge(ratio > 1, mid());
        spreadAt = spread();
      }
    };
    const onUp = (e: PointerEvent) => {
      points.delete(e.pointerId);
      if (points.size < 2) spreadAt = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGestureStart);
    el.addEventListener("gesturechange", onGestureChange);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGestureStart);
      el.removeEventListener("gesturechange", onGestureChange);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [el, enabled]);
}
