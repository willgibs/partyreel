"use client";

import { type CSSProperties, useEffect, useState } from "react";

import "@/components/shared/arrival.css";
import { ARRIVAL_GLOW_MS, ARRIVAL_SWEEP_MS } from "@/lib/shared/arrival";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";

/**
 * THE PRODUCT'S ARRIVAL MARKS, ON A PICTURE OF A TILE: the light the album draws when a photograph lands, never a
 * hand copy of it. The album retired its green landed check for two lights (`shared/arrival.css`, `lib/shared/arrival.ts`):
 * `arrived`, the rim and wash that fade when somebody else's photograph appears, and `landed`, the one pass of light
 * across the photograph YOU just sent. This lays the product's own attribute on a layer over the picture's tile, so
 * the sheet that lights the album lights the site, and a retune there moves both.
 *
 * ★ A LAYER, NOT THE TILE. The sheet keys on `[data-media-tile]`, which also carries the album's mount rise
 * (globals.css); on a marketing tile that already enters by its own grammar (`data-mkt-fly`) the two would fight, so
 * the attribute rides an inset layer of its own, `data-static` turning the rise off (the host's opt-out), and the
 * layer inherits the tile's corner, which the sheet's pseudo-elements inherit in turn.
 *
 * ★ A STILL PICTURE REPLAYS IT; A MOVING ONE DOES NOT. The marks are one-shot by design (a light going out, a pass made
 * once). A picture that mounts it once (the album's filling grid, whose own clock mounts and unmounts it) shows the
 * product exactly. A still (`every`) has no clock, and a one-shot that played before anyone scrolled to it would leave
 * a picture of nothing, so it remounts the layer every `every` ms while it is on screen (the loop-pause contract,
 * `useAmbientPause`, which also holds it under reduced motion, where the sheet paints neither mark at all).
 */
export function ArrivalLight({
  kind,
  every,
  offset = 0,
}: {
  kind: "arrived" | "landed";
  /** A still picture's replay period, in ms; omit for a layer its caller mounts per arrival. */
  every?: number;
  /** Where in the period this one plays, so two lights on one picture take turns. */
  offset?: number;
}) {
  const { ref, paused } = useAmbientPause<HTMLSpanElement>();
  const [play, setPlay] = useState(0);
  const looping = every !== undefined && !paused;

  useEffect(() => {
    if (!looping) return;
    let timer = window.setTimeout(function next() {
      setPlay((n) => n + 1);
      timer = window.setTimeout(next, every);
    }, offset);
    return () => window.clearTimeout(timer);
  }, [looping, every, offset]);

  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
    >
      {/* A still waits for its first turn on screen; a mounted-per-arrival layer plays at once. */}
      {(every === undefined || play > 0) && (
        <span
          key={play}
          data-media-tile=""
          data-static=""
          {...(kind === "arrived"
            ? { "data-arrived": "" }
            : { "data-landed": "" })}
          className="absolute inset-0 overflow-hidden rounded-[inherit]"
          style={
            {
              "--arrival-glow-ms": `${ARRIVAL_GLOW_MS}ms`,
              "--arrival-sweep-ms": `${ARRIVAL_SWEEP_MS}ms`,
            } as CSSProperties
          }
        />
      )}
    </span>
  );
}
