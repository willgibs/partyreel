import { describe, expect, it } from "vitest";

import {
  FEATURE_PAGE_SLUGS,
  FEATURE_PAGES,
  featurePage,
} from "./feature-pages";

/**
 * The feature-pages registry contract: the nav panel, hub, footer, sitemap, and
 * six routes all key off this shape, so drift fails here first.
 */
describe("the feature-pages registry", () => {
  it("pins the ratified six-page carve in buyer-journey order", () => {
    expect(FEATURE_PAGE_SLUGS).toEqual([
      "album",
      "qr",
      "curation",
      "sharing",
      "guests",
      "privacy",
    ]);
  });

  it("every page carries the full identity layer, non-blank", () => {
    for (const page of FEATURE_PAGES) {
      expect(page.slug.trim()).not.toBe("");
      expect(page.navLabel.trim()).not.toBe("");
      expect(page.navDescription.trim()).not.toBe("");
      expect(page.h1.trim()).not.toBe("");
      expect(page.heroSub.trim()).not.toBe("");
      expect(page.directoryLine.trim()).not.toBe("");
    }
  });

  it("keeps the directory lines in one length band, so the doors wrap alike", () => {
    // Six doors in a grid read as a set only if their lines land on the same
    // number of rows. Measured at 1440 (a ~320px door, ~44 characters a line):
    // 88 characters still fits two lines, so three lines is 92-110.
    for (const page of FEATURE_PAGES) {
      expect(page.directoryLine.length, page.slug).toBeGreaterThanOrEqual(92);
      expect(page.directoryLine.length, page.slug).toBeLessThanOrEqual(110);
    }
  });

  it("panel one-liners stay panel-sized", () => {
    for (const page of FEATURE_PAGES) {
      expect(page.navDescription.length).toBeLessThanOrEqual(48);
    }
  });

  it("carries no em-dashes (the copy policy)", () => {
    expect(JSON.stringify(FEATURE_PAGES)).not.toContain("—");
  });

  it("featurePage throws on a bad slug (typos fail at build)", () => {
    expect(() => featurePage("nope")).toThrow(/Unknown feature page/);
    expect(featurePage("album").navLabel).toBe("The live album");
  });
});
