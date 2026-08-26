import { describe, expect, it } from "vitest";

import { FEATURE_GROUPS, HIGHLIGHT_REEL } from "@/lib/constants/features";
import { FEATURE_PRESENTATION } from "@/lib/constants/features-layout";

describe("features constants", () => {
  it("groups have unique ids and non-empty headers + features", () => {
    const ids = FEATURE_GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const group of FEATURE_GROUPS) {
      expect(group.eyebrow.trim()).not.toBe("");
      expect(group.heading.trim()).not.toBe("");
      expect(group.subhead.trim()).not.toBe("");
      expect(group.features.length).toBeGreaterThan(0);
    }
  });

  it("every feature has title + body + longBody; titles unique across groups", () => {
    const all = FEATURE_GROUPS.flatMap((group) => group.features);
    const titles = all.map((feature) => feature.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const feature of all) {
      expect(feature.title.trim()).not.toBe("");
      expect(feature.body.trim()).not.toBe("");
      expect(feature.longBody.trim()).not.toBe("");
    }
  });

  it("highlight reel has title + body + points", () => {
    expect(HIGHLIGHT_REEL.title.trim()).not.toBe("");
    expect(HIGHLIGHT_REEL.body.trim()).not.toBe("");
    expect(HIGHLIGHT_REEL.points.length).toBeGreaterThan(0);
  });

  it("every group has a /features presentation (no group renders unstyled)", () => {
    for (const groupItem of FEATURE_GROUPS) {
      expect(FEATURE_PRESENTATION[groupItem.id]).toBeDefined();
    }
  });

  it("contains no em-dashes (copy policy guard for this file)", () => {
    const copy =
      JSON.stringify(FEATURE_GROUPS) + JSON.stringify(HIGHLIGHT_REEL);
    expect(copy).not.toContain("—");
  });
});
