"use client";

import { BoardPage } from "@/components/lab";

import { GlowMomentsVariants } from "../glow-moments-variants";
import { GLOW_MOMENTS } from "./spec";

/**
 * SPILL PLACEMENTS (the glow round, 2026-08-28; on the kit's template since the
 * migration wave, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now: the question, the verdict, the
 * one open call, the thirteen placements as recorded and the four departures.
 * What is left here is the evidence, which for a board whose ruling merged two
 * weeks ago is one section holding the moments as they were built.
 *
 * ★ THE VARIANTS FILE STAYS AT THE SANDBOX ROOT, AND THAT IS DELIBERATE. Two
 * production tests read `sandbox/glow-moments-variants.tsx` by its exact path
 * (`glow-contract.test.ts` pins the BorderBeam call sites as a list;
 * `border-beam-vendor.test.ts` readFileSync's it to prove no hard-coded radius
 * reaches the library), and three docs cite the same path. Moving the file
 * would break two files outside this track's lane to gain nothing.
 * `glow-lab-shared.tsx` and `glow-lab.css` stay for the plainer reason that
 * BOTH glow boards use them.
 *
 * ★ AND THE REJECTS MOUNT UNCHANGED, which is the board's method rather than
 * its inertia: a placement you have seen and turned down stays turned down.
 * Three of the fourteen moments are dead and all three are still built.
 *
 * NO DECLARED CONTROLS: every switch on this board (the lights on moment 13,
 * Publish on moment 07, the frame counter on 04) belongs to one specimen and
 * sits beside it, so hoisting one into the dock would put a knob on the page
 * that the other thirteen moments ignore.
 */
export function GlowMomentsBoard() {
  return (
    <BoardPage
      spec={GLOW_MOMENTS}
      evidence={(id) => (id === "record" ? <GlowMomentsVariants /> : null)}
    />
  );
}
