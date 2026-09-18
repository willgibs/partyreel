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
 * is contiguous; 2026-09-01: two guest-side sections above the live demo, and
 * the adjacency ruling, which changed layouts, never this order) + the ratified
 * CHAPTER MAP (the mixed-theme ruling). index.ts
 * renders exactly this array (its Record type pins the pairing), so these
 * byte-pins make any reshuffle or re-chaptering a deliberate act. The test
 * imports section-ids (pure) rather than index because the section tree
 * transitively imports lib/demo.ts -> lib/env.ts, which throws in the test
 * runner without NEXT_PUBLIC_* vars.
 */
describe("the home section order", () => {
  it("pins the ratified 15-id sequence", () => {
    expect([...HOME_SECTION_IDS]).toEqual([
      "cinema-hero",
      "trust-strip",
      "decomposition",
      "film-strip",
      "no-app",
      "full-quality",
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

  it("the hero renders the ruled thesis whole", () => {
    // Retuned at the hero's wiring round (2026-09-17). The hero used to derive
    // its H1 halves from SITE_THESIS.split("event") for the kinetic slot; the
    // slot retired with the wall and the headline is the byte-pinned constant
    // rendered verbatim, so what matters now is that the thesis is ONE line
    // short enough to hold the ladder's top step without a bespoke ramp.
    expect(SITE_THESIS).not.toMatch(/\n/);
    expect(SITE_THESIS.length).toBeLessThanOrEqual(64);
  });

  it("the decomposition facts stay pop-in parseable", () => {
    // decomposition renders each pinned fact VERBATIM and animates every
    // integer run inside it as its own digit group (splitFact there splits on
    // the digit runs, so the parts always re-join to the constant). A fact may
    // carry more than one number since Will's `counts=hero` pick put both
    // counts on the band's first line, so the old "exactly one integer" shape
    // is no longer the contract.
    //
    // What still breaks the grammar is a figure a READER sees as one number
    // and the parser splits in two: "1,200" pops as 1 then 200, "3.5" as 3
    // then 5. So the pin is: the band carries at least one number, and no
    // digit run is joined to the next by a lone separator.
    const numeric = DECOMPOSITION_FACTS.filter((fact) => /\d/.test(fact));
    expect(numeric.length).toBeGreaterThan(0);
    for (const fact of numeric) {
      expect(fact).not.toMatch(/\d[.,   ]\d/);
    }
  });
});

describe("the home chapter map", () => {
  it("pins the ratified surface per section (7 dark, 3 paper, 5 dark)", () => {
    expect(HOME_SECTION_SURFACE).toEqual({
      "cinema-hero": "cinema",
      "trust-strip": "cinema",
      decomposition: "cinema",
      "film-strip": "cinema",
      "no-app": "cinema",
      "full-quality": "cinema",
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
