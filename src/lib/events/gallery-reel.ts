/**
 * THE LIVE REEL'S FACTS ON THE GALLERY PAYLOAD.
 *
 * The live reel stores nothing: every viewer's device composes it from the album's own payload. So
 * the one thing the server must say is WHETHER this viewer's album has a reel, and the handful of
 * facts only the server may decide: the host's switch (`events.show_reel`), the host's default mood
 * (`events.reel_style_id`), the platform lever (`ops_flags.live_reel_enabled`), and, for the cut
 * creator, what the host's plan allows (video, the watermark, the cut's length cap). Everything
 * tier-shaped is derived HERE from the tier the server read, never on the client (CLAUDE.md:
 * never trust the client for tier or entitlements).
 *
 * ★ THE MINIMUM IS TWO, AND IT IS COUNTED ON THE DEVICE. Two items are enough: the engine bounces
 * them back and forth (live/source.test.ts pins 2 clips alternating). The count is the payload's own
 * reel-eligible items (`isReelEligible`: approved, not a cut, something drawable), so a cut never
 * counts toward it and the tile appears the moment the doorbell delivers the second photograph.
 *
 * ★ NOTHING BELOW `full`. A teaser or a locked viewer is still at the door; the reel is part of
 * the album the door is paying for, so the server sends no facts at all (`null`), and the host's
 * plan never leaks to a viewer who has not been let in.
 *
 * Pure and client-safe: the page, the poll route and the provider all read it.
 */
import type { GridMedia } from "@/components/app/media-grid";
import {
  MAX_REEL_SECONDS,
  videosAllowedForTier,
  type Tier,
} from "@/lib/constants/tiers";
import type { GalleryAccess } from "@/lib/events/gallery-access";
import { isReelEligible } from "@/lib/reel/live/items";

/**
 * An album item as the gallery payload carries it: the grid's own shape, plus
 * `media.reel_eligible` ("plays in the live reel", false only for a cut someone added to the
 * album). WRITE-ONCE at `create_media*`, so it rides OUTSIDE the ETag fingerprint, like the
 * dimensions. Absent means eligible: a payload from before the column must not empty the reel.
 */
export type GalleryItem = GridMedia & { reelEligible?: boolean };

/** What the host's plan lets the on-device cut creator do. */
export type CutFacts = {
  /** A video may be saved to the album (the cut is a video): paid plans only. */
  videoAllowed: boolean;
  /** The free plan's small mark on a cut. */
  watermark: boolean;
  /** The cut's length cap in seconds (tiers.ts's MAX_REEL_SECONDS, mirroring tier_limits()). */
  maxSeconds: number;
};

export type GalleryReel = {
  /** The host's switch, default on. */
  showReel: boolean;
  /** The platform lever (`ops_flags.live_reel_enabled`). */
  liveReelEnabled: boolean;
  /** The host's default mood; null is the default mood. A viewer's own pick overrides it locally. */
  styleId: string | null;
  /** Null where the host's plan could not be read: the creator is then simply not offered. */
  cut: CutFacts | null;
};

/** The live reel exists for a guest from this many reel-eligible items. */
export const LIVE_REEL_MINIMUM = 2;

/** The creator's facts for a plan. Pure, so a tier is the whole input. */
export function cutFactsForTier(tier: Tier): CutFacts {
  return {
    videoAllowed: videosAllowedForTier(tier),
    watermark: tier === "free",
    maxSeconds: MAX_REEL_SECONDS[tier],
  };
}

/**
 * The reel facts for one viewer. `null` below full access: the reel is part of the album a door is
 * guarding. `tier` null (the read failed) keeps the reel and drops only the creator, since a wrong
 * guess either stamps a paying host's cut with the free mark or lifts it off a free one.
 */
export function reelFactsFor(input: {
  access: GalleryAccess;
  showReel: boolean;
  liveReelEnabled: boolean;
  styleId: string | null;
  tier: Tier | null;
}): GalleryReel | null {
  if (input.access !== "full") return null;
  return {
    showReel: input.showReel,
    liveReelEnabled: input.liveReelEnabled,
    styleId: input.styleId,
    cut: input.tier ? cutFactsForTier(input.tier) : null,
  };
}

/** How many items could play: the payload's approved, non-cut, drawable ones. */
export function reelEligibleCount(items: readonly GalleryItem[]): number {
  let n = 0;
  for (const item of items) if (isReelEligible(item)) n += 1;
  return n;
}

/**
 * ★ WHETHER THE REEL EXISTS FOR THIS VIEWER, RIGHT NOW. Every gate in one place: full access (the
 * facts are null otherwise), the host's switch, the platform lever, and two reel-eligible items.
 * Below it there is no tile, no view and no `?reel`: the reel is simply absent until the minimum is
 * reached, with no empty state of its own.
 */
export function liveReelAvailable(
  reel: GalleryReel | null,
  items: readonly GalleryItem[],
): boolean {
  if (!reel || !reel.showReel || !reel.liveReelEnabled) return false;
  return reelEligibleCount(items) >= LIVE_REEL_MINIMUM;
}
