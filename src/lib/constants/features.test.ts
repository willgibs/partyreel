import { describe, expect, it } from "vitest";

import {
  FEATURE_GROUPS,
  HIGHLIGHT_REEL,
  HOME_FEATURES,
} from "@/lib/constants/features";

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

  it("HOME_FEATURES is exactly the featured subset (non-empty)", () => {
    expect(HOME_FEATURES.length).toBeGreaterThan(0);
    expect(HOME_FEATURES.every((feature) => feature.featured)).toBe(true);
    const featuredCount = FEATURE_GROUPS.flatMap(
      (group) => group.features,
    ).filter((feature) => feature.featured).length;
    expect(HOME_FEATURES.length).toBe(featuredCount);
  });

  it("highlight reel has title + body + points", () => {
    expect(HIGHLIGHT_REEL.title.trim()).not.toBe("");
    expect(HIGHLIGHT_REEL.body.trim()).not.toBe("");
    expect(HIGHLIGHT_REEL.points.length).toBeGreaterThan(0);
  });
});
