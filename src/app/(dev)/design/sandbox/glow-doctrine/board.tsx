"use client";

import { BoardPage } from "@/components/lab";

import { GlowDoctrineVariants } from "../glow-doctrine-variants";
import { GLOW_DOCTRINE } from "./spec";

/**
 * THE SPILL DOCTRINE BOARD (the glow round, 2026-08-28; on the kit's template
 * since the migration wave, 2026-09-15).
 *
 * What the board ARGUES lives in `spec.ts` now, and only there: the question,
 * the verdict, the one open call, the six candidates and the four departures.
 * What is left here is what a board should be and nothing else, which for a
 * board this settled is one section of evidence.
 *
 * ★ THE VARIANTS FILE STAYS AT THE SANDBOX ROOT, AND THAT IS DELIBERATE. Two
 * production tests read `sandbox/glow-doctrine-variants.tsx` by its exact path
 * (`glow-contract.test.ts` pins the BorderBeam call sites as a list;
 * `border-beam-vendor.test.ts` readFileSync's it to prove no hard-coded radius
 * reaches the library), and three docs cite the same path. Moving the file
 * would break two files outside this track's lane to gain nothing: the board's
 * lane is the argument, not the address. `glow-lab-shared.tsx` and
 * `glow-lab.css` stay for the plainer reason that BOTH glow boards use them.
 *
 * ★ AND THE COMPONENT MOUNTS UNCHANGED. It carries the round's own numbering
 * (01 the laws through 09 the calibration) and its own "if you have ten
 * minutes" opener, which now sits under the template's answer rather than in
 * front of it. Re-cutting a settled round into the kit's parts would re-argue
 * it; the wave moves the argument, it does not move the furniture.
 *
 * NO DECLARED CONTROLS, for the same reason. Every switch this board has
 * (the ground, the strength, the scale, the replay) belongs to one specimen and
 * sits beside it, so hoisting any of them into the dock would put a knob on the
 * page that most of the page ignores.
 */
export function GlowDoctrineBoard() {
  return (
    <BoardPage
      spec={GLOW_DOCTRINE}
      evidence={(id) => (id === "record" ? <GlowDoctrineVariants /> : null)}
    />
  );
}
