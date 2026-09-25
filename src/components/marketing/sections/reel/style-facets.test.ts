import { describe, expect, it } from "vitest";

import { marketingImage } from "@/lib/constants/marketing-media";
import {
  DEFAULT_STYLE_ID,
  STYLE_CATALOG,
} from "@/lib/reel/engine/style-registry";

import {
  HERO_REEL,
  SCREEN_REEL,
  STYLE_COUNT,
  STYLE_FACETS,
  SWITCHER_CLIP_IDS,
  SWITCHER_INITIAL_STYLE,
  SWITCHER_SEED,
} from "./style-facets";

/**
 * The /reel data pins (Track B, B2). Two guarantees:
 *  1. The page's style data DERIVES from STYLE_CATALOG — registry growth (a 15th
 *     style, or a whole new `kind`) surfaces loudly here instead of silently missing
 *     from the switcher's facet filters.
 *  2. The switcher's live recipe stays FRAME-TRUE to the hero candidate's poster (same
 *     clips + style + seed), so the fallback→canvas swap can never become a content
 *     jump. A media re-render updates the manifest recipe; this pin makes the switcher
 *     constants follow deliberately.
 */

describe("the /reel style facets", () => {
  it("flatten back to the exact catalog (a new kind cannot silently vanish)", () => {
    const flat = STYLE_FACETS.flatMap((f) => f.styles.map((s) => s.id));
    expect(flat).toHaveLength(STYLE_CATALOG.length);
    expect(new Set(flat)).toEqual(new Set(STYLE_CATALOG.map((s) => s.id)));
  });

  it("carry the catalog size the page copy renders", () => {
    expect(STYLE_COUNT).toBe(STYLE_CATALOG.length);
  });

  it("keep the mood/treatment split (both facets non-empty, no overlap)", () => {
    expect(STYLE_FACETS).toHaveLength(2);
    for (const facet of STYLE_FACETS) {
      expect(facet.styles.length).toBeGreaterThan(0);
      for (const style of facet.styles) expect(style.kind).toBe(facet.id);
    }
  });

  it("open on the catalog's default style", () => {
    expect(SWITCHER_INITIAL_STYLE.id).toBe(DEFAULT_STYLE_ID);
  });
});

describe("the /reel live-switcher recipe", () => {
  it("uses 4-6 manifest images that all resolve (a manifest prune fails here, not live)", () => {
    expect(SWITCHER_CLIP_IDS.length).toBeGreaterThanOrEqual(4);
    expect(SWITCHER_CLIP_IDS.length).toBeLessThanOrEqual(6);
    for (const id of SWITCHER_CLIP_IDS) {
      expect(() => marketingImage(id)).not.toThrow();
    }
  });

  it("is frame-true to the fallback poster's render recipe", () => {
    expect(SWITCHER_INITIAL_STYLE.id).toBe(HERO_REEL.recipe.styleId);
    expect(SWITCHER_SEED).toBe(HERO_REEL.recipe.seed);
    expect([...SWITCHER_CLIP_IDS]).toEqual(HERO_REEL.recipe.clipIds);
  });
});

describe("the /reel manifest loops", () => {
  it("keep their ruled orientations (hero portrait beside copy, share landscape in the player frame)", () => {
    expect(HERO_REEL.orientation).toBe("portrait");
    expect(SCREEN_REEL.orientation).toBe("landscape");
  });
});
