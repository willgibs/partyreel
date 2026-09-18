"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * THE TRUE-SIZE BOX, IN THE KIT AT LAST (2026-09-17).
 *
 * A step's option tile is a 1440 canvas zoomed into the tile's width
 * (`OptionTiles` in step.tsx draws every option inside a `FitStage
 * fit="zoom"`), which is right for a page seen from far away and fatal for
 * anything judged in pixels: a hairline, a shadow, a corner. Four boards each
 * grew a private copy of the fix (brand-voice, type-scale, rounding, light), and
 * the fifth time it was needed was the floating-surfaces radius step, where two
 * corners that differ by four pixels arrived as the same thumbnail and Will
 * answered "seem to be the same option... If there's meant to be a difference,
 * please pop this question back up." So the box lives here now, built from the
 * one copy whose reads SETTLE (the stage resolves its zoom a pass after this
 * mounts, and no observer reports an ancestor's zoom). The boards' own copies
 * leave with their boards or move onto this one as they are next touched.
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
