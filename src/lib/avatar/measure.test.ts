import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  contrast,
  FLOOR,
  GROUND,
  luminance,
  meshDepths,
  orbFor,
} from "./gradient";
import { centreLuminance, contrastFromLuminance } from "./measure";

/**
 * THE SHIPPED LOOK'S TRUE CENTRE PIXEL, HELD TO WHAT `gradient.test.ts`'S
 * OWN PROMISE CANNOT PROVE.
 *
 * The stricter measurement round two's board used (`seed-avatar` r2, its own
 * `spec.ts`): the ACTUAL composited colour under a centred initial, not the
 * `contrast(orb.ink, orb.body)` proxy `gradient.test.ts` holds every look to.
 * That proxy is true by construction for every look, `mesh` included
 * (`fitBody`'s own promise), but it is not what a reader's eye or a screen
 * reader's contrast checker meets at the centre of four blended layers.
 * `mesh` is what `Avatar` actually draws (`ui/avatar.tsx`); this is the one
 * number that says the letter clears 4.5:1 honestly. Size-independent by
 * construction: a `background-image`'s centre sits at the same 50% mark
 * whatever the box's own pixel size, so one measurement covers the `Avatar`
 * contract's 24, 32 and 40px sizes and the identity row's 80px alike.
 */

/** A crowd big enough to find a hole in: a thousand real account-id-shaped
 *  seeds, independent of `gradient.test.ts`'s own thousand. */
const SEEDS = Array.from({ length: 1000 }, () => randomUUID());

describe("the shipped look's true centre pixel, not a proxy", () => {
  it("clears the letter floor at the disc's true centre, across a thousand seeds", () => {
    for (const seed of SEEDS) {
      const orb = orbFor(seed);
      const ratio = contrastFromLuminance(
        luminance(orb.ink),
        centreLuminance(orb, "mesh"),
      );
      expect(
        ratio,
        `mesh ${seed} (hue ${orb.hue.toFixed(0)}) puts the letter at ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(FLOOR.letter);
    }
  });

  it("reads better at that true centre than the diagonal it replaced", () => {
    // The board's own framing (spec.ts, round two): "100% clearing 4.5:1
    // against the control's 76%". Reproduced for real here, on this file's
    // own thousand UUIDs, never quoted from the board's own pseudo-UUID run.
    let meshWorst = Infinity;
    let diagonalWorst = Infinity;
    for (const seed of SEEDS) {
      const orb = orbFor(seed);
      const ink = luminance(orb.ink);
      meshWorst = Math.min(
        meshWorst,
        contrastFromLuminance(ink, centreLuminance(orb, "mesh")),
      );
      diagonalWorst = Math.min(
        diagonalWorst,
        contrastFromLuminance(ink, centreLuminance(orb, "diagonal")),
      );
    }
    expect(meshWorst, "mesh's worst seed").toBeGreaterThanOrEqual(
      FLOOR.letter,
    );
    expect(
      diagonalWorst,
      "diagonal's own worst seed, kept for the record rather than reasserted as a floor",
    ).toBeLessThan(FLOOR.letter);
  });

  it("keeps mesh's own highlight inside the same paper gap gradient.test.ts already accepts for lit", () => {
    // The known, accepted gap (spec.ts, round two): a highlight this bright
    // cannot clear 3:1 against the near-white paper ground and still read
    // as lit, the same corner gradient.test.ts's own "keeps the lit pole and
    // the shadow inside the disc's own range" already accepts for `lit`.
    // mesh's `primary` shares it exactly (it IS `lit`, a hair dimmer) —
    // `orb.body` is what carries the disc's own ground/ring promise, held
    // for every look including mesh in gradient.test.ts's "every colour
    // clears its floor", since `background()` never overrides `body` itself
    // for any look.
    for (const seed of SEEDS) {
      const orb = orbFor(seed);
      const { primary } = meshDepths(orb);
      expect(contrast(primary, GROUND.paper)).toBeGreaterThan(1.3);
    }
  });
});
