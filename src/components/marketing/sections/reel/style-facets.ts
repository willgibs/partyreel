/**
 * The /reel page's PURE data layer (Track B, B2). Everything here derives from the two
 * single-sources the page is allowed to read at module scope: the style catalog
 * (style-registry, the ONE engine module sanctioned in marketing's initial chunks) and the
 * marketing media manifest. Shared by the SERVER sections, the static fallback, AND the lazy
 * island, so the pre-hydration markup and the live switcher can never disagree about the
 * catalog. Pinned by style-facets.test.ts (registry growth or a manifest prune surfaces
 * loudly in the test run, never as a silently wrong page).
 */

import {
  MARKETING_REELS,
  type MarketingReel,
} from "@/lib/constants/marketing-media";
import {
  STYLE_CATALOG,
  type StyleEntry,
} from "@/lib/reel/engine/style-registry";

export type StyleFacetId = "mood" | "treatment";

export type StyleFacet = {
  id: StyleFacetId;
  label: string;
  styles: StyleEntry[];
};

/**
 * The switcher's two facets, DERIVED from the catalog (never a hand copy). The pin asserts
 * the facets flatten back to the whole catalog: if a third `kind` ever lands in the registry,
 * the filter pair below would silently drop it from the page — the test makes that loud.
 */
export const STYLE_FACETS: StyleFacet[] = [
  {
    id: "mood",
    label: "Moods",
    styles: STYLE_CATALOG.filter((s) => s.kind === "mood"),
  },
  {
    id: "treatment",
    label: "Treatments",
    styles: STYLE_CATALOG.filter((s) => s.kind === "treatment"),
  },
];

/** The full catalog size, for copy ("14 cinematic styles") that must track the registry. */
export const STYLE_COUNT = STYLE_CATALOG.length;

/** The style the switcher opens on (the catalog's first mood — Cinematic). */
export const SWITCHER_INITIAL_STYLE: StyleEntry = STYLE_FACETS[0].styles[0];

/**
 * The live player's fixed recipe half: these three constants are BYTE-MATCHED to the
 * hero-candidate-01 render recipe (the test pins it). Why: the switcher's pre-hydration /
 * reduced-motion fallback shows that candidate's POSTER, and the island's first live render
 * uses the same clips + style + seed — the engine is deterministic per (clips, styleId, seed,
 * orientation), so the poster is FRAME-TRUE to what the canvas draws and the swap reads as
 * the same reel coming alive, not a content jump. A future media re-render updates the
 * manifest recipe, the pin fails, and these follow deliberately.
 */
export const SWITCHER_CLIP_IDS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-petals",
  "party-dj",
  "wedding-toast",
] as const;

export const SWITCHER_SEED = 73;

/** Manifest reel lookup that throws on a bad id, so a prune fails the test, not the page. */
export function marketingReel(id: string): MarketingReel {
  const entry = MARKETING_REELS.find((r) => r.id === id);
  if (!entry) throw new Error(`Unknown marketing reel id: ${id}`);
  return entry;
}

/** The hero's portrait loop (also the switcher fallback's poster source). */
export const HERO_REEL = marketingReel("hero-candidate-01");

/** The guest-share section's landscape loop. */
export const SHARE_REEL = marketingReel("hero-candidate-02");

/** "0:13" from 13.08s: the caption format for loop durations. */
export function formatReelSeconds(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
