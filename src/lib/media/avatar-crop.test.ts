import { describe, expect, it } from "vitest";

import { computeCropRect } from "@/lib/media/avatar-crop";

describe("computeCropRect", () => {
  it("captures the whole image for a square source at zoom 1", () => {
    expect(
      computeCropRect({
        srcW: 1000,
        srcH: 1000,
        viewport: 300,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }),
    ).toEqual({ sx: 0, sy: 0, side: 1000 });
  });

  it("centre-crops a landscape source (trims left/right)", () => {
    expect(
      computeCropRect({
        srcW: 2000,
        srcH: 1000,
        viewport: 300,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }),
    ).toEqual({ sx: 500, sy: 0, side: 1000 });
  });

  it("centre-crops a portrait source (trims top/bottom)", () => {
    expect(
      computeCropRect({
        srcW: 1000,
        srcH: 2000,
        viewport: 300,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }),
    ).toEqual({ sx: 0, sy: 500, side: 1000 });
  });

  it("shrinks the captured square as zoom increases", () => {
    expect(
      computeCropRect({
        srcW: 1000,
        srcH: 1000,
        viewport: 300,
        zoom: 2,
        offsetX: 0,
        offsetY: 0,
      }),
    ).toEqual({ sx: 250, sy: 250, side: 500 });
  });

  it("pans the captured square opposite the drag (viewport chosen for an exact scale)", () => {
    // viewport 1000, minEdge 1000, zoom 2 → displayScale = 2 px/src-px.
    // offsetX +100 css px → source shift = 100/2 = 50; cx = 500 - 50 = 450; sx = 450 - 250 = 200.
    expect(
      computeCropRect({
        srcW: 1000,
        srcH: 1000,
        viewport: 1000,
        zoom: 2,
        offsetX: 100,
        offsetY: 0,
      }),
    ).toEqual({ sx: 200, sy: 250, side: 500 });
  });

  it("clamps the square inside the image (a huge pan can't leave the bounds)", () => {
    const r = computeCropRect({
      srcW: 1000,
      srcH: 1000,
      viewport: 300,
      zoom: 2,
      offsetX: 100_000,
      offsetY: -100_000,
    });
    expect(r.side).toBe(500);
    expect(r.sx).toBe(0); // clamped to the left edge
    expect(r.sy).toBe(500); // clamped to the bottom edge (1000 - 500)
  });

  it("treats zoom < 1 as 1 (cover-fit floor)", () => {
    expect(
      computeCropRect({
        srcW: 1000,
        srcH: 1000,
        viewport: 300,
        zoom: 0.5,
        offsetX: 0,
        offsetY: 0,
      }),
    ).toEqual({ sx: 0, sy: 0, side: 1000 });
  });
});
