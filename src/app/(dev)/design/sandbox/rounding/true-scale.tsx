"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * TRUE PIXELS INSIDE A ZOOMED TILE (round seven, the stepped review,
 * 2026-09-16).
 *
 * ★ A CORNER IS A FIXED NUMBER OF PIXELS, SO A SCALED SPECIMEN IS NOT EVIDENCE.
 * This whole board exists to decide whether 8px reads as a corner and whether
 * 16px still reads as pressable beside it; at `zoom: 0.27` those are 2px and
 * 4px and every family looks like A. The step surface draws every option tile
 * inside a `FitStage fit="zoom"` (a 1440 canvas fitted to a ~400px tile), which
 * is exactly right for a palette and fatal here.
 *
 * So this box reads the zoom its ancestors impose and divides it straight back
 * out: `zoom` multiplies down the tree, so an inner `zoom: 1 / z` returns the
 * subtree to 1:1 on the glass, and because `zoom` is a LAYOUT property (unlike
 * a transform) the parent still measures this box correctly, which keeps
 * `FitStage`'s height right. A `width: 100%` child then resolves to exactly the
 * pixels the reader can see. Outside a zoomed ancestor (the board page, a
 * step's stage) the measurement is 1 and this renders nothing but a div.
 *
 * ★ COPIED FROM `sandbox/type-scale/true-scale.tsx` ON PURPOSE, NOT IMPORTED.
 * Two boards needing it is the kit's signal, not a reason to reach across a
 * lane: type-scale's board retires the day its ruling lands and this one would
 * break with it. The Handoff asks for `TrueScale` in `components/lab` so both
 * copies can go.
 */
export function TrueScale({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  // The probe is never itself compensated, so what it measures is always the
  // ancestors' zoom and never its own.
  const probe = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    const read = () => {
      // `currentCSSZoom` is the effective zoom of every ancestor, which is
      // exactly this number; the ratio is the fallback, since `offsetWidth` is
      // in the element's own layout pixels and the rect is in the glass's.
      const own = (el as Element & { currentCSSZoom?: number }).currentCSSZoom;
      const measured =
        typeof own === "number" && own > 0
          ? own
          : el.offsetWidth > 0
            ? el.getBoundingClientRect().width / el.offsetWidth
            : 1;
      // A hair of tolerance: a device-pixel rounding upstream must not start a
      // measure-render loop between this box and the stage measuring it.
      setZoom((z) => (Math.abs(measured - z) > 0.002 ? measured : z));
    };
    read();
    // ★ THE OBSERVED BOX IS THE DEVICE-PIXEL ONE, AND THE DEFAULT WOULD NEVER
    // FIRE. An ancestor's `zoom` does not change this element's own layout
    // size, so a plain ResizeObserver hears nothing when a tile's stage
    // resolves its scale; the device-pixel content box is what changes. The
    // fallback is the ordinary box, for a browser that refuses the option.
    const ro = new ResizeObserver(read);
    try {
      ro.observe(el, { box: "device-pixel-content-box" });
    } catch {
      ro.observe(el);
    }
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  return (
    <div ref={probe} className={cn("min-w-0", className)} {...rest}>
      <div style={zoom === 1 ? undefined : { zoom: 1 / zoom }}>{children}</div>
    </div>
  );
}
