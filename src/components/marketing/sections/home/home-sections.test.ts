import { describe, expect, it } from "vitest";

import {
  DECOMPOSITION_FACTS,
  SITE_THESIS,
} from "@/lib/constants/marketing-voice";

import { HOME_SECTION_IDS } from "./section-ids";

/**
 * The ratified home order (Will, 2026-08-25: album/curation split, pricing
 * after the reel). index.ts renders exactly this array (its Record type pins
 * the pairing), so this byte-pin makes any reshuffle a deliberate act. The
 * test imports section-ids (pure) rather than index because the section tree
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
      "reel-teaser",
      "privacy",
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
