"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * TRUE PIXELS, WHATEVER THE SURFACE ABOVE IS DOING (round seven, the stepped
 * review, 2026-09-16).
 *
 * ★ A SPECIMEN WHOSE SIZE IS BEING JUDGED MAY NOT BE SCALED, and on this board
 * that is the whole point rather than a preference. Will, on round four: "the
 * iframe previews throw off anything related to size, making those reviews
 * particularly difficult (such as type scale, the whole point is reviewing
 * accurate sizing)."
 *
 * ★ AND THE STEP SURFACE ZOOMS ITS TILES. `OptionTiles` draws every option
 * inside a `FitStage fit="zoom"`, which is exactly right for a palette or a
 * corner radius and fatal for type: a 1440 canvas inside a 290px tile is CSS
 * `zoom: 0.2`, and a 16px card title lands at three pixels. So this box reads
 * the zoom its ancestors impose and divides it straight back out. `zoom`
 * multiplies down the tree, so an inner `zoom: 1 / z` returns the subtree to
 * 1:1 on the glass; because `zoom` is a LAYOUT property (unlike a transform)
 * the parent still measures this box correctly, which is what keeps
 * `FitStage`'s height right. The box is then handed exactly the pixels the
 * reader can actually see, and the specimen inside clips what does not fit,
 * which is what every card on this board already does.
 *
 * Outside a zoomed ancestor (the board page, a step's stage) the measurement
 * is 1 and this renders nothing but a div.
 */
export function TrueScale({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
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
    // FIRE (measured, 2026-09-16: the compensation silently did nothing). An
    // ancestor's `zoom` does not change this element's own layout size, so a
    // plain ResizeObserver hears nothing when a tile's stage resolves its
    // scale; the device-pixel content box is what actually changes. The
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
    <div ref={probe} className={cn("min-w-0", className)}>
      <div style={zoom === 1 ? undefined : { zoom: 1 / zoom }}>{children}</div>
    </div>
  );
}
