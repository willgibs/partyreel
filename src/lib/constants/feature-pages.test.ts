import { describe, expect, it } from "vitest";

import { FEATURE_PAGES, featurePage } from "./feature-pages";

/**
 * The feature-pages registry contract: the nav panel, hub, footer, sitemap, and
 * six routes all key off this shape, so drift fails here first. The page
 * order and the copy lengths were pinned here too until the "less is more"
 * reset (2026-09-12); the registry is its own order and copy is not a test.
 */
describe("the feature-pages registry", () => {
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

  it("carries no em-dashes (the copy policy)", () => {
    expect(JSON.stringify(FEATURE_PAGES)).not.toContain("—");
  });

  it("featurePage throws on a bad slug (typos fail at build)", () => {
    expect(() => featurePage("nope")).toThrow(/Unknown feature page/);
    expect(featurePage("album").navLabel).toBe("The live album");
  });
});
