"use client";

// The river's own sheet: the rest state, the masks and the pour's first frame.
// It declares no keyframe (the flow is one rAF loop), so nothing in it can
// collide with a keyframe anywhere else.
import "./river.css";

import { type CSSProperties, useEffect, useMemo, useRef } from "react";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  boxOf,
  buildCards,
  frameAt,
  originOf,
  phaseAt,
  restOf,
  REVEAL_MS,
  revealEase,
  RIVER_FADES,
  riverClock,
  riverGeo,
} from "./river-engine";

/**
 * THE RIVER: a flow of photographs falling through a box, arriving from above
 * the frame, straightening as they land and dissolving out through the bottom.
 * Its first production home is the guest album's empty state (Will's
 * `guest-photos=ghost`, 2026-09-18), where the placement fades it; the visual
 * itself is always at full luminance and never carries a layer over a
 * photograph (bible 1). The arithmetic lives in `river-engine.ts`.
 *
 * ★ DECORATIVE, ENTIRELY. aria-hidden, every image `alt=""`, nothing in it
 * focusable, no link and no code, and it takes no pointer: the words a
 * placement needs sit beside it or over it, never inside it. The empty
 * state's contract holds all of that (`gallery-empty-state.test.tsx`).
 *
 * ★ IT TAKES ITS WIDTH FROM ITS CONTAINER and its height from `ratio`. Every
 * length is a percentage of the flow's box or of the card's own, so the
 * server paints the rest state correctly at a width it cannot know, a resize
 * needs no listener, and the loop never measures anything.
 *
 * ★ IT COSTS NOTHING WHEN NOBODY IS LOOKING: one rAF loop, stopped off screen
 * and on a hidden tab (useAmbientPause, the home hero's precedent), never
 * started under reduced motion, and writing transform and opacity alone.
 */

export type RiverFrame = {
  /** A small local still: the river serves it as is, at every size. */
  src: string;
  /** The crop, when the centre would throw the subject away (a landscape
   *  cut to a square loses its sides). CSS `object-position`. */
  position?: string;
};

/**
 * The gap the rest / entrance split leaves, closed (the home hero's
 * NOSCRIPT_RULE). The sheet paints the pour's first frame, every card
 * collapsed, inside `no-preference`; a reader with motion allowed and
 * scripting off has nothing to run the loop that would undo it. A <noscript>
 * body is parsed as markup only for that reader, later in the document than
 * the sheet, so this rule wins there and nowhere else.
 */
const NOSCRIPT_RULE =
  "<style>@media (prefers-reduced-motion:no-preference){.rvr-card{transform:var(--rvr-rest);opacity:var(--rvr-rest-o)}}</style>";

/** The dissolves, handed to the sheet from the one place the dead line reads. */
const FADES = {
  "--rvr-fade-t": `${RIVER_FADES.top * 100}%`,
  "--rvr-fade-b0": `${RIVER_FADES.bottom0 * 100}%`,
  "--rvr-fade-b1": `${RIVER_FADES.bottom1 * 100}%`,
  "--rvr-fade-x": `${RIVER_FADES.side * 100}%`,
} as CSSProperties;

export function River({
  frames,
  ratio = 1,
  className,
}: {
  /** The photographs, in launch order: one card each, so none is ever doubled
   *  in view. Neighbours are the two a reader sees together, so order them
   *  for contrast. */
  frames: readonly RiverFrame[];
  /** The box's height over its width. */
  ratio?: number;
  className?: string;
}) {
  const count = frames.length;
  const geo = useMemo(() => riverGeo(ratio), [ratio]);
  const cards = useMemo(() => buildCards(count), [count]);
  const clock = useMemo(() => riverClock(count), [count]);

  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLDivElement>();
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // The last opacity written per card, so the loop only writes the ones that
  // changed: most of the flow sits at a flat 1, and writing it again is a style
  // recalculation nobody asked for.
  const lastO = useRef<number[]>([]);
  /**
   * ★ THE CLOCK LIVES OUTSIDE THE EFFECT, and that is the whole pause (the home
   * hero's lesson). The loop tears down whenever `paused` flips, and a clock
   * declared inside it would restart at zero on every return: the river would
   * pour again each time a guest scrolled back to it. Held here, it resumes on
   * the frame it stopped on.
   */
  const elapsed = useRef(0);

  useEffect(() => {
    const els = nodes.current;
    if (reduced) {
      // Reduced motion is authoritative even when it arrives mid-visit: drop
      // the two properties the loop wrote so the sheet's rest state takes back
      // over. Never the style attribute: the rest state IS inline custom
      // properties on the same elements.
      for (const el of els) {
        if (!el) continue;
        el.style.removeProperty("transform");
        el.style.removeProperty("opacity");
      }
      lastO.current = [];
      return;
    }
    if (paused) return;

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // A long frame (a tab switch the observer has not caught yet, a janky
      // device) advances the clock by one frame's worth, never a teleport.
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      // The pour: one tween of the launch offsets from nothing to their steady
      // spacing. The clock term runs the whole time, so there is no handoff
      // between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const c = cards[i];
        const f = frameAt(c, phaseAt(c, elapsed.current, reveal, clock), geo);
        if (f.gone) {
          // Nothing of it can be seen, so it stops costing anything until the
          // modulo brings it back to the top.
          if (lastO.current[i] !== 0) {
            el.style.opacity = "0";
            lastO.current[i] = 0;
          }
          continue;
        }
        el.style.transform = f.transform;
        if (f.opacity !== lastO.current[i]) {
          el.style.opacity = String(f.opacity);
          lastO.current[i] = f.opacity;
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards, clock, geo, paused, reduced]);

  return (
    <div
      ref={pauseRef}
      aria-hidden
      // Mirrored for whoever is debugging it; the loop reads the hook.
      data-paused={paused ? "" : undefined}
      className={cn("rvr", className)}
      style={{ aspectRatio: `1 / ${ratio}` }}
    >
      <div
        className="rvr-stream"
        style={{ ...FADES, "--rvr-origin": originOf(geo) } as CSSProperties}
      >
        <div className="rvr-flow">
          {cards.map((c, i) => {
            const frame = frames[c.photo];
            const rest = restOf(c, geo, clock);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                // The lift: two photographs overlapping is the one place a
                // photograph takes a shadow (bible 10), declared by its role.
                className="rvr-card bg-muted shadow-lift"
                style={
                  {
                    ...boxOf(c, geo),
                    "--rvr-rest": rest.transform,
                    "--rvr-rest-o": rest.opacity,
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a small local still, served as is: the optimizer would buy nothing for a decorative frame */}
                <img
                  src={frame.src}
                  alt=""
                  // Every frame is on screen within the pour, so it loads now
                  // rather than lazily: a lazy image inside a card that is born
                  // clipped above the box would arrive mid-flight, as a blank
                  // frame that fills in. Low priority, so it never races the
                  // page for the network, and decoded off the main thread.
                  loading="eager"
                  fetchPriority="low"
                  decoding="async"
                  draggable={false}
                  className="rvr-img"
                  style={
                    frame.position
                      ? { objectPosition: frame.position }
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
      {/* The one reader the rest / entrance split cannot reach: motion
          allowed, scripting off. See NOSCRIPT_RULE. */}
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_RULE }} />
    </div>
  );
}
