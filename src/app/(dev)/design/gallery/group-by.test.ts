import { describe, expect, it } from "vitest";

import { groupByKey } from "./group-by";

describe("groupByKey", () => {
  it("merges items sharing a key into one group even when they are not adjacent", () => {
    const groups = groupByKey(["a1", "b1", "c1", "b2", "a2"], (s) => s[0]);
    expect(groups.map(([k]) => k)).toEqual(["a", "b", "c"]);
    expect(groups.find(([k]) => k === "b")?.[1]).toEqual(["b1", "b2"]);
    expect(groups.find(([k]) => k === "a")?.[1]).toEqual(["a1", "a2"]);
  });

  it("keeps the order in which a key first appears", () => {
    expect(groupByKey(["z", "m", "a", "z"], (s) => s).map(([k]) => k)).toEqual(["z", "m", "a"]);
  });

  it("returns no group for no items", () => {
    expect(groupByKey([], (s: string) => s)).toEqual([]);
  });
});
