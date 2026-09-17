"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * WHERE A PICTURE IS DRAWN, AND AT WHAT SIZE (round eight, 2026-09-17).
 *
 * ★ THIS FILE IS WHY ROUND EIGHT EXISTS. Will's notes on round seven were six
 * ways of saying one thing: the card did not show him what it was asking. Two
 * of the causes were mechanical and they live here.
 *
 * 1. A STEP'S OPTION TILE IS A 1440 CANVAS ZOOMED INTO ABOUT 300 PIXELS
 *    (`OptionTiles` in the kit's step.tsx draws every option inside a
 *    `FitStage fit="zoom"`). That is right for a page seen from far away and
 *    fatal for a shadow: an 8 pixel blur at `zoom: 0.2` is a pixel and a half,
 *    and a one pixel hairline is nothing at all. `TrueFit` reads the zoom its
 *    ancestors impose and divides it back out, so the tile shows the specimen
 *    at the pixels it ships at; only when the tile is narrower than the
 *    specimen does it scale down, and then by exactly as much as it must.
 *
 * 2. A TILE AND THE STAGE UNDER IT ARE THE SAME SECTION, DRAWN BY THE SAME
 *    FUNCTION, and they want different pictures: the tile a tight crop of the
 *    one thing that differs, the stage the whole scene with its legend. The
 *    board cannot be told which it is drawing (the kit hands `evidence` a
 *    state, not a place), so both are rendered and board.css shows one:
 *    `TileOnly` inside `.lab-tile-view`, `StageOnly` everywhere else. Pure CSS,
 *    so the first paint is already the right one. What is hidden costs nothing
 *    that matters: a crop mounts on approach and `display: none` never
 *    approaches, and a lamp that is not displayed is paused by its own
 *    observer.
 *
 * ★ THE FOURTH COPY OF THE TRUE-SIZE BOX, ON PURPOSE. brand-voice, type-scale
 * and rounding each carry one, and the ROADMAP already asks for its home in
 * `src/components/lab`. A board that retires at its own ruling cannot be
 * another board's import, so until the kit grows it this is built from
 * brand-voice's, the only copy whose reads SETTLE (the stage resolves its zoom
 * a pass after this mounts, and no observer reports an ancestor's zoom).
 */

type Zoomed = Element & { currentCSSZoom?: number };

/**
 * TRUE PIXELS, AND A FIT ONLY WHEN THERE IS NO ROOM.
 *
 * `natural` is the width the specimen is composed at. With room for it the
 * child is laid out at exactly that width, centred, at 1:1 on the glass; with
 * less (a phone's single column) it is zoomed down to the room there is.
 * `zoom` is a LAYOUT property, unlike a transform, so the stage around this
 * still measures a true height.
 */
export function TrueFit({
  natural,
  className,
  children,
}: {
  natural: number;
  className?: string;
  children: React.ReactNode;
}) {
  const probe = useRef<HTMLDivElement | null>(null);
  const [k, setK] = useState(1);
  // The settle compares reads frame by frame, which is faster than a render,
  // so the last value lives in a ref beside the state.
  const held = useRef(1);

  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    const read = () => {
      const rect = el.getBoundingClientRect();
      const own = (el as Zoomed).currentCSSZoom;
      // `currentCSSZoom` is every ancestor's zoom multiplied out; the ratio is
      // the fallback, since offsetWidth is in layout pixels and the rect is in
      // the glass's.
      const z =
        typeof own === "number" && own > 0
          ? own
          : el.offsetWidth > 0
            ? rect.width / el.offsetWidth
            : 1;
      const fit = rect.width > 0 ? Math.min(1, rect.width / natural) : 1;
      const next = fit / z;
      // A hair of tolerance, or a device-pixel rounding upstream starts a
      // measure and render loop between this box and the stage measuring it.
      if (Math.abs(next - held.current) > 0.002) {
        held.current = next;
        setK(next);
      }
    };
    // ★ THE ZOOM IS NOT THERE ON THE FIRST TICK. `Stage` resolves its scale in
    // its own layout effect, one pass after this mounts, so a single read
    // measures 1 and leaves the specimen at a fifth of its size for ever. The
    // first reads ride a short frame schedule and stop once the number holds:
    // three frames in practice, thirty at the outside. A settle, not a poll.
    let frames = 0;
    let steady = 0;
    let last = -1;
    let raf = 0;
    const settle = () => {
      read();
      steady = held.current === last ? steady + 1 : 0;
      last = held.current;
      if (++frames < 30 && steady < 3) raf = requestAnimationFrame(settle);
    };
    settle();
    const ro = new ResizeObserver(read);
    const stage = el.closest("[data-stage-fit]");
    if (stage) ro.observe(stage);
    ro.observe(el);
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [natural]);

  return (
    <div ref={probe} data-lab-specimen="" className={cn("min-w-0", className)}>
      <div
        className="mx-auto"
        style={{ width: natural, zoom: k === 1 ? undefined : k }}
      >
        {children}
      </div>
    </div>
  );
}

/** Drawn only inside a step's option tile (board.css, `[data-lgt-only]`). */
export function TileOnly({ children }: { children: React.ReactNode }) {
  return <div data-lgt-only="tile">{children}</div>;
}

/** Drawn everywhere except inside a step's option tile: the stage, the board. */
export function StageOnly({ children }: { children: React.ReactNode }) {
  return <div data-lgt-only="stage">{children}</div>;
}

/**
 * ARMED: the whole specimen is on the screen, or Replay was pressed.
 *
 * ★ A ONE-SHOT THAT RUNS BELOW THE FOLD IS THE SAME BUG AS ONE THAT NEVER RUNS.
 * The stage sits under the tiles, so at first paint it is partly off the
 * screen, and the engine's own pause margin (25 percent of the viewport AHEAD
 * of the reader) would spend the pass before he scrolls to it. Measured at
 * 1440 by 900: two thirds of the stage's photograph is already showing while
 * the question is still being read, so "most of it" armed the pass for nobody.
 * All of it on the screen is "he has scrolled to it" (every specimen armed this
 * way is shorter than a phone's window). It latches, because a mark that
 * replayed every time it was scrolled past would be a loop with extra steps.
 */
export function useArmed(
  runId: number,
): [(el: HTMLElement | null) => void, boolean] {
  const [seen, setSeen] = useState(false);
  const io = useRef<IntersectionObserver | null>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    io.current?.disconnect();
    io.current = null;
    if (!el) return;
    const next = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.intersectionRatio >= 0.95)) {
          setSeen(true);
          next.disconnect();
        }
      },
      { threshold: [0.95] },
    );
    next.observe(el);
    io.current = next;
  }, []);
  return [ref, seen || runId > 0];
}

/**
 * ONE CORNER, FOUR TIMES THE SIZE, ALWAYS ON THE SCREEN.
 *
 * ★ NOT THE KIT'S LOUPE, AND THE DIFFERENCE IS THE POINT. The Loupe is a hover
 * lens, and its own header says it must never be the only way to see a
 * difference. Round seven hid the lit face behind one and the note came back
 * "genuinely cannot see it in action here". This is a fixed inset: the same
 * children rendered a second time, inert, scaled from their own top left
 * corner inside a clipped box, so the enlargement is on the screen before
 * anybody reaches for anything.
 *
 * A transform, not `zoom`: the copy must not re-lay-out (a zoomed copy of a
 * fluid specimen would be a different specimen), and nothing in here is fixed
 * or sticky, which is the one thing a transform's containing block breaks.
 */
export function CornerInset({
  times = 4,
  size = 168,
  pad = 8,
  width,
  children,
}: {
  times?: number;
  /** The inset's side, in CSS pixels. It shows size / times of the specimen. */
  size?: number;
  /** Bare ground kept around the corner, in the specimen's own pixels: an edge
   *  is only an edge against something. */
  pad?: number;
  /** The width the specimen is laid out at, so the copy matches the original. */
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      inert
      className="relative shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/15"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width,
          // Right to left: scaled from its own corner, then moved in by the pad.
          transform: `translate(${pad * times}px, ${pad * times}px) scale(${times})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
