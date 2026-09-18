"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { BorderBeam } from "@/components/vendor/border-beam";

/**
 * THE PRO CARD'S BEAM (lab moment 12, surface `pro`: "the reference
 * implementation").
 *
 * BEAM, not SPILL, and the distinction is the whole point. Spill is light
 * falling FROM a lit thing onto what is near it; a beam marks an object because
 * it IS the live subject. Beam law 3 says a beam ends when its state ends,
 * which would forbid a permanent one -- so this is the doctrine's ONE standing
 * exception, named so it stays an exception rather than becoming a precedent:
 * a premium object at rest.
 *
 * ★ THE GROUND IS WHY THIS ONE SHIPS AND THE OTHER TWO BEAM SURFACES DID NOT.
 * "Ink takes the beam, paper takes spill." The home pricing teaser sits in the
 * closing CINEMA chapter, so the card is on near-black in every session. The
 * QR plate and the help palette were dropped because they are near-white in
 * production despite dark lab specimens.
 *
 * ★ THE RING IS THE CARD'S OWN CORNER, MEASURED HERE, ZERO INCLUDED (Will,
 * 2026-09-17: "We need to always ensure that the beam border and card border
 * have matching radii. In this example, the Pro card is off."). The library
 * reads the child's radius too, but it refuses a ZERO and falls back to its own
 * 16px with no error, which is what he saw on the light board: a card whose
 * radius token did not exist computed square and wore a round ring. So the
 * wrapper measures the card and passes the number, and a square card gets a
 * square ring. Never pass a literal: that is what put a 16px ring around a
 * 3.6px card in the lab the first time.
 *
 * ★ theme IS PASSED EXPLICITLY. BorderBeam resolves 'auto' from
 * prefers-color-scheme, i.e. the OS, not next-themes -- so on a forced-dark
 * marketing chapter viewed by a light-mode OS, 'auto' would pick the wrong
 * palette. Never let this one default.
 *
 * colorVariant="partyreel" is our own five hues through oklchToSrgb at
 * effect-grade chroma: the LIVE register of the lamp set, not a rival palette.
 * It only carries our hues at the pulse sizes; `sm` and `line` alias the
 * vendor's `colorful`.
 */
export function ProCardBeam({ children }: { children: ReactNode }) {
  const beam = useRef<HTMLDivElement>(null);
  // Undefined until measured, which hands the first server-rendered frame to
  // the library's own read; the layout effect lands before the first paint.
  const [radius, setRadius] = useState<number>();

  useLayoutEffect(() => {
    const card = beam.current?.firstElementChild;
    if (!card) return;
    const read = () => setRadius(cornerOf(card));
    read();
    // A breakpoint can change the card's corner without remounting it.
    const watch = new ResizeObserver(read);
    watch.observe(card);
    return () => watch.disconnect();
  }, []);

  return (
    <BorderBeam
      ref={beam}
      size="pulse-outside"
      colorVariant="partyreel"
      strength={0.7}
      theme="dark"
      borderRadius={radius}
    >
      {children}
    </BorderBeam>
  );
}

/** The card's computed corner in pixels; an unreadable one is square, never a default. */
export function cornerOf(card: Element): number {
  const px = parseFloat(getComputedStyle(card).borderTopLeftRadius);
  return Number.isFinite(px) ? px : 0;
}
