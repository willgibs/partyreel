import { describe, expect, it } from "vitest";

import { pickIndicatorTarget } from "@/components/marketing/chrome/nav-indicator-target";

const t = (
  hoverIndex: number | null,
  focusIndex: number | null,
  openIndex: number | null,
) => pickIndicatorTarget({ hoverIndex, focusIndex, openIndex });

describe("pickIndicatorTarget", () => {
  it("hides when nothing is hovered, focused, or open", () => {
    expect(t(null, null, null)).toBe(null);
  });

  it("hover wins over focus and open (the cursor gets the first answer)", () => {
    expect(t(1, 2, 3)).toBe(1);
    expect(t(0, 2, 3)).toBe(0); // index 0 must not be mistaken for absent
  });

  it("focus wins over open when the cursor is away (keyboard users see it too)", () => {
    expect(t(null, 2, 3)).toBe(2);
    expect(t(null, 0, 3)).toBe(0);
  });

  it("falls back to the open panel — this is what parks it while the cursor is inside the panel", () => {
    expect(t(null, null, 3)).toBe(3);
    expect(t(null, null, 0)).toBe(0);
  });
});
