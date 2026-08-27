import { describe, expect, it } from "vitest";

import { getAllSlugs } from "./help";

/**
 * Slugs referenced as PLAIN LITERALS in client components (which must never
 * import this node-only module) get pinned here so a help-article rename can't
 * silently strand them. Current referrers: the nav's Resources featured card
 * (chrome/mega-panel.tsx), the guests page's GoDeeper, and the legal privacy
 * draft's data pointer.
 */
describe("help slugs referenced by literal", () => {
  it("the Resources featured article exists", () => {
    expect(getAllSlugs()).toContain("how-partyreel-works");
  });

  it("the R5 seed articles exist (guests GoDeeper + the legal data pointer)", () => {
    expect(getAllSlugs()).toContain("profiles-guest-lists-and-following");
    expect(getAllSlugs()).toContain("your-data-and-deleting-your-account");
  });
});
