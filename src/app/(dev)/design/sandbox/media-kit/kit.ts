import {
  MARKETING_IMAGES,
  MARKETING_REELS,
} from "@/lib/constants/marketing-media";

import type { Vertical } from "./bridge";

/**
 * THE TWELVE STAND-INS, as the board reads them (the media-kit track).
 *
 * Nothing here is a second source of truth: the twelve entries and the two reels
 * are READ from `src/lib/constants/marketing-media.ts`. This file adds only what
 * the manifest has no field for yet, which is exactly what the track proposes
 * adding: which vertical a frame serves, and what it is doing in the product.
 *
 * Round two moved everything else out: the staged batch is `candidates.ts`, the
 * per-post mapping is `bridge.ts`, the shoot is `shoot.ts`, the measured exposure
 * is `exposure.ts`. What is left is the join between the manifest and the kit.
 */

export const VERTICALS: readonly { id: Vertical; label: string }[] = [
  { id: "weddings", label: "Weddings" },
  { id: "birthdays", label: "Birthdays" },
  { id: "corporate", label: "Corporate" },
  { id: "conferences", label: "Conferences" },
  { id: "festivals", label: "Festivals" },
  { id: "trips", label: "Trips" },
];

/** The three routes the board argues. One buys time, one buys the rule, one is the plan. */
export type Route = "licensed" | "ours" | "mix";

export type StandIn = {
  id: string;
  vertical: Vertical;
  /** What this frame is doing in the product, which is why it is worth arguing about. */
  job: string;
};

export const STAND_INS: readonly StandIn[] = [
  {
    id: "wedding-golden",
    vertical: "weddings",
    job: "The flagship wedding frame: three blog posts, the hero corridor, the live demo cover",
  },
  {
    id: "reception-table",
    vertical: "weddings",
    job: "The table frame the footer strip and the nav panel both reach for",
  },
  {
    id: "party-balloons",
    vertical: "birthdays",
    job: "The only birthday frame in the manifest, and it has nobody in it",
  },
  {
    id: "concert-confetti",
    vertical: "festivals",
    job: "A clip in the landscape reel recipe, and the footer strip",
  },
  {
    id: "wedding-rings",
    vertical: "weddings",
    job: "The detail shot: one blog post and a dozen gallery mocks",
  },
  {
    id: "reception-hall",
    vertical: "weddings",
    job: "Four blog posts ride this one empty hall, the most reused frame we own",
  },
  {
    id: "party-dj",
    vertical: "festivals",
    job: "A clip in both reel recipes",
  },
  {
    id: "wedding-toast",
    vertical: "weddings",
    job: "Three blog posts, a reel clip and the nav panel",
  },
  {
    id: "festival-lights",
    vertical: "festivals",
    job: "A reel clip and the footer strip; the rainbow grade fights every chapter it lands in",
  },
  {
    id: "festival-crowd",
    vertical: "festivals",
    job: "A clip in both reel recipes",
  },
  {
    id: "wedding-arch",
    vertical: "weddings",
    job: "The footer strip's opening frame, and a venue with nobody in it",
  },
  {
    id: "wedding-petals",
    vertical: "weddings",
    job: "The manifest's only portrait, so it feeds every tall slot in the product",
  },
];

/** The manifest's own entries, so the board shows the real line under each frame. */
export const MANIFEST_BY_ID = new Map(MARKETING_IMAGES.map((m) => [m.id, m]));

export const REELS = MARKETING_REELS;

/** How many of the twelve each vertical holds, for the gap chart. */
export function countByVertical(v: Vertical): number {
  return STAND_INS.filter((s) => s.vertical === v).length;
}
