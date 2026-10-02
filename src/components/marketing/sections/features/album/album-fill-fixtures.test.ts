import { describe, expect, it } from "vitest";

import { isMarketingImageId } from "@/lib/constants/marketing-media";

import {
  type AlbumFixture,
  EVERYWHERE_FIXTURES,
  EVERYWHERE_FRAME_H,
  EVERYWHERE_SEED_COUNT,
} from "./album-fill-fixtures";

/**
 * The fixture invariants the stage relies on. Each fails SILENTLY in the
 * browser: a column whose seeds fall short of the clip shows a black hole at
 * the frame's foot until the first arrival; a duplicate id in the table puts
 * the same photograph on screen twice; a bad id throws at render.
 *
 * ★ THE TABLE THEY HOLD IS THE ONE THAT RENDERS. Two of these (no photograph
 * twice, an arrival for every column) were written for the album page's hero
 * table, which the live stream replaced and which then stood on here with
 * nothing drawing it. The scars stayed and moved to the everywhere pair's
 * table, the only one a stage still draws.
 */
function columnSeedHeights(fixtures: readonly AlbumFixture[], seeds: number) {
  const sums = [0, 0, 0];
  fixtures.slice(0, seeds).forEach((f) => (sums[f.col] += f.h));
  return sums;
}

describe("the filling album's fixtures", () => {
  it("point only at manifest images", () => {
    for (const f of EVERYWHERE_FIXTURES) {
      expect(isMarketingImageId(f.id), f.id).toBe(true);
    }
  });

  it("never show the same photograph twice", () => {
    const ids = EVERYWHERE_FIXTURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("seed every column past the clip, so arrivals push rather than grow", () => {
    for (const sum of columnSeedHeights(
      EVERYWHERE_FIXTURES,
      EVERYWHERE_SEED_COUNT,
    )) {
      expect(sum).toBeGreaterThanOrEqual(EVERYWHERE_FRAME_H);
    }
  });

  it("land arrivals across every column, so no column sits still", () => {
    const cols = new Set(
      EVERYWHERE_FIXTURES.slice(EVERYWHERE_SEED_COUNT).map((f) => f.col),
    );
    expect(cols.size).toBe(3);
  });
});
