import { describe, expect, it } from "vitest";

import { MARKETING_CTA } from "./marketing-nav";
import { DEMO_CTA_LABEL, GOLDEN_LINES, SITE_THESIS } from "./marketing-voice";

/**
 * Will's golden set is RATIFIED VERBATIM (voice round 2, 2026-07-08): these byte-match pins make
 * a rewrite a deliberate act (edit the pin AND the source, with a ruling) instead of copy drift
 * inside some section build. The CTA pin guards the primary conversion label the same way.
 */

describe("the marketing voice single-source", () => {
  it("byte-matches the eight golden lines", () => {
    expect(GOLDEN_LINES).toEqual({
      thesis: "The whole event, in one place, forever",
      album: "Every photo comes to you first",
      reel: "The whole event, cut down to the highlights",
      pricing: "Start free, upgrade when you host again",
      reelThesis: "Every event ends with a reel",
      liveDemo: "Watch your album fill up",
      arc: "From the first scan to the final cut",
      curation: "Every moment, and you decide what stays",
    });
  });

  it("the site thesis is one of the golden lines (the grouping pick chooses which)", () => {
    expect(Object.values(GOLDEN_LINES)).toContain(SITE_THESIS);
  });

  it('the primary CTA is "Start free" and stays internal', () => {
    expect(MARKETING_CTA.label).toBe("Start free");
    expect(MARKETING_CTA.href.startsWith("/")).toBe(true);
  });

  it("no golden line uses banned identity language", () => {
    for (const line of Object.values(GOLDEN_LINES)) {
      expect(/\bnight\b/i.test(line), line).toBe(false);
    }
    expect(/\bnight\b/i.test(DEMO_CTA_LABEL)).toBe(false);
  });
});
