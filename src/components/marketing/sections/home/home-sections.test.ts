import { describe, expect, it } from "vitest";

import {
  DECOMPOSITION_FACTS,
  SITE_THESIS,
} from "@/lib/constants/marketing-voice";

import {
  HOME_SECTION_IDS,
  HOME_SECTION_SURFACE,
  homeSurfaceChunks,
} from "./section-ids";

/**
 * The ratified home order (Will, 2026-08-25: album/curation split, pricing
 * after the reel; 2026-08-26: privacy up beside curation so the paper chapter
 * is contiguous) + the ratified CHAPTER MAP (the mixed-theme ruling). index.ts
 * renders exactly this array (its Record type pins the pairing), so these
 * byte-pins make any reshuffle or re-chaptering a deliberate act. The test
 * imports section-ids (pure) rather than index because the section tree
 * transitively imports lib/demo.ts -> lib/env.ts, which throws in the test
 * runner without NEXT_PUBLIC_* vars.
 */
describe("the home section order", () => {
  it("pins the ratified 13-id sequence", () => {
    expect([...HOME_SECTION_IDS]).toEqual([
      "cinema-hero",
      "trust-strip",
      "decomposition",
      "film-strip",
      "live-demo",
      "album",
      "curation",
      "privacy",
      "reel-teaser",
      "events-teaser",
      "pricing-teaser",
      "faq",
      "cinema-close",
    ]);
  });

  it("the hero can split the ruled thesis around its kinetic slot", () => {
    // cinema-hero derives its H1 halves from SITE_THESIS.split("event") so the
    // byte-pinned constant stays the only copy source; a thesis rewrite that
    // drops the slot word must revisit the hero, not silently break it.
    expect(SITE_THESIS.split("event")).toHaveLength(2);
  });

  it("the decomposition facts stay count-up parseable", () => {
    // decomposition renders each pinned fact verbatim with its number
    // animating: leading text, ONE integer, trailing text.
    const numeric = DECOMPOSITION_FACTS.filter((fact) => /\d/.test(fact));
    expect(numeric.length).toBeGreaterThan(0);
    for (const fact of numeric) {
      expect(fact).toMatch(/^\D*\d+\D*$/);
    }
  });
});

describe("the home chapter map", () => {
  it("pins the ratified surface per section (5 dark, 3 paper, 5 dark)", () => {
    expect(HOME_SECTION_SURFACE).toEqual({
      "cinema-hero": "cinema",
      "trust-strip": "cinema",
      decomposition: "cinema",
      "film-strip": "cinema",
      "live-demo": "cinema",
      album: "paper",
      curation: "paper",
      privacy: "paper",
      "reel-teaser": "cinema",
      "events-teaser": "cinema",
      "pricing-teaser": "cinema",
      faq: "cinema",
      "cinema-close": "cinema",
    });
  });

  it("keeps the cinema bookends (the page opens and closes in the cinema)", () => {
    expect(HOME_SECTION_SURFACE["cinema-hero"]).toBe("cinema");
    expect(HOME_SECTION_SURFACE["cinema-close"]).toBe("cinema");
  });

  it("chunking preserves the pinned order byte-for-byte", () => {
    expect(homeSurfaceChunks().flatMap((chunk) => chunk.ids)).toEqual([
      ...HOME_SECTION_IDS,
    ]);
  });

  it("forms exactly one paper chapter (chapter cuts, not stripes)", () => {
    const chunks = homeSurfaceChunks();
    expect(chunks.filter((chunk) => chunk.surface === "paper")).toHaveLength(1);
    expect(chunks).toHaveLength(3);
  });
});
