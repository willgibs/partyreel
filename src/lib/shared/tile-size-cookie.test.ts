/**
 * THE ONE SIZE COOKIE, READ BOTH WAYS (`album-columns` r2: three steps, one
 * index shared by host and guest). What is held: a returning viewer's pick
 * survives the switch from widths to steps, and a cookie written by either
 * spelling reads the same pick through either reader, so a masonry surface and
 * a rows surface on one device never disagree about it.
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_ROW_STEP } from "./album-rows";
import {
  DEFAULT_TILE_SIZE,
  resolveRowStep,
  resolveTileSize,
  TILE_SIZES,
} from "./tile-size-cookie";

describe("the step a cookie names", () => {
  it("reads an index as itself", () => {
    expect(resolveRowStep("0")).toBe(0);
    expect(resolveRowStep("1")).toBe(1);
    expect(resolveRowStep("2")).toBe(2);
  });

  it("maps the legacy widths across by what they meant", () => {
    expect(resolveRowStep("300")).toBe(0); // loose: the largest photographs
    expect(resolveRowStep("240")).toBe(1); // the wired default: the middle
    expect(resolveRowStep("180")).toBe(2); // tight: the densest
  });

  it("falls back to the middle for nothing and for garbage", () => {
    for (const raw of [
      undefined,
      null,
      "",
      " ",
      "3",
      "-1",
      "1.5",
      "big",
      "220",
    ])
      expect(resolveRowStep(raw)).toBe(DEFAULT_ROW_STEP);
  });
});

describe("the width a cookie names, while masonry still reads widths", () => {
  it("reads a step index as the width it stands for", () => {
    expect(resolveTileSize("0")).toBe(300);
    expect(resolveTileSize("1")).toBe(240);
    expect(resolveTileSize("2")).toBe(180);
  });

  it("keeps every legacy width, and the default for garbage", () => {
    for (const size of TILE_SIZES)
      expect(resolveTileSize(String(size))).toBe(size);
    for (const raw of [undefined, null, "", "7", "big"])
      expect(resolveTileSize(raw)).toBe(DEFAULT_TILE_SIZE);
  });

  it("round-trips: a width read as a step reads back as the same width", () => {
    for (const size of TILE_SIZES)
      expect(resolveTileSize(String(resolveRowStep(String(size))))).toBe(size);
  });
});
