import { describe, expect, it } from "vitest";

import { renderHash, type RenderHashInput } from "./render-hash";

const BASE: RenderHashInput = {
  orderedApprovedIds: ["a", "b", "c"],
  styleId: "classic",
  orientation: "portrait",
  seed: 42,
  lengthSeconds: null,
  coverMediaId: null,
  watermark: false,
};

describe("renderHash (the reel-render cache key)", () => {
  it("is stable for identical inputs", () => {
    expect(renderHash(BASE)).toBe(renderHash({ ...BASE }));
  });

  it("changes when the ORDER of the same set changes", () => {
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, orderedApprovedIds: ["b", "a", "c"] }),
    );
  });

  it("changes when MEMBERSHIP changes (an id added / dropped by approval)", () => {
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, orderedApprovedIds: ["a", "b"] }),
    );
  });

  it("changes for style, orientation, seed, length, cover, and watermark each", () => {
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, styleId: "punchy" }),
    );
    // A treatment styleId differs from a mood (a genuinely different composition).
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, styleId: "parallax" }),
    );
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, orientation: "landscape" }),
    );
    expect(renderHash(BASE)).not.toBe(renderHash({ ...BASE, seed: 43 }));
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, lengthSeconds: 15 }),
    );
    expect(renderHash(BASE)).not.toBe(
      renderHash({ ...BASE, coverMediaId: "b" }),
    );
    expect(renderHash(BASE)).not.toBe(renderHash({ ...BASE, watermark: true }));
  });

  it("returns a 64-char hex sha256 digest", () => {
    expect(renderHash(BASE)).toMatch(/^[0-9a-f]{64}$/);
  });
});
