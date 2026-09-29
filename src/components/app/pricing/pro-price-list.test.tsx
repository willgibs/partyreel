/**
 * THE FIT BAR'S LINE: what she stores of a size, and how full that makes it (build 17's red-team:
 * floored at 1%, 97.9 MB of 2 TB read "1% full"). Under one percent it says so; from one percent it
 * rounds; past the size it says how far over, in the storage flow's one rounding (up).
 */
import { describe, expect, it } from "vitest";

import { fitBarLine } from "./pro-price-list";

const MB = 1024 ** 2;
const GB = 1024 ** 3;
const TB = 1024 ** 4;

describe("fitBarLine", () => {
  it("★ says under 1% when what she stores is under one percent of the size", () => {
    expect(fitBarLine(97.9 * MB, 2 * TB)).toBe(
      "97.9 MB of 2 TB · under 1% full",
    );
    // Just under one percent is still under it, never rounded up to "1% full".
    expect(fitBarLine(0.996 * GB, 100 * GB)).toBe(
      "1020 MB of 100 GB · under 1% full",
    );
  });

  it("rounds from one percent to the size itself", () => {
    expect(fitBarLine(1 * GB, 100 * GB)).toBe("1 GB of 100 GB · 1% full");
    expect(fitBarLine(42.4 * GB, 100 * GB)).toBe(
      "42.4 GB of 100 GB · 42% full",
    );
    expect(fitBarLine(100 * GB, 100 * GB)).toBe("100 GB of 100 GB · 100% full");
  });

  it("past the size, says how far over", () => {
    expect(fitBarLine(120 * GB, 100 * GB)).toBe(
      "120 GB of 100 GB · over by 20 GB",
    );
  });
});
