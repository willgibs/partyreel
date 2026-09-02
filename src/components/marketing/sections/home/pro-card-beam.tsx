"use client";

import type { ReactNode } from "react";

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
 * ★ NO borderRadius PROP, deliberately. Omitting it makes the library read the
 * child's own computed radius, so the ring is whatever the object is. Passing a
 * literal is what put a 16px ring around a 3.6px card in the lab and made the
 * two read as different shapes.
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
  return (
    <BorderBeam
      size="pulse-outside"
      colorVariant="partyreel"
      strength={0.7}
      theme="dark"
    >
      {children}
    </BorderBeam>
  );
}
