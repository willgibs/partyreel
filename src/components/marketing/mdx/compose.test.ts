import { describe, expect, it } from "vitest";

import { composeMdxComponents } from "./compose";

describe("the MDX composer", () => {
  it("merges the three lane files", () => {
    const map = composeMdxComponents({ a: 1 }, { b: 2 }, { c: 3 });
    expect(Object.keys(map)).toEqual(["a", "b", "c"]);
  });

  it("refuses a name registered in two files", () => {
    expect(() =>
      composeMdxComponents(
        { OverCapGraceDays: 1 },
        { OverCapGraceDays: 2 },
        {},
      ),
    ).toThrow(/registered twice/);
  });
});
