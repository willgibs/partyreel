import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ROUND TWO'S ONE FIXTURE: a brand-new host, on the way in for the first time.
 *
 * ★ SUBTRACTIVE. Round one fixtured three arrivals (a new host, a returning
 * one, a guest at somebody else's event) because it drew nine seams across the
 * whole door. Round two draws one seam, the tour between a fresh account and
 * the app, so the returning host's memory (`BACK`, a past event with 186
 * photos) and the guest's borrowed event (`GUEST_EVENT`) are gone with the
 * asks that needed them. What is left is the one thing `tour` actually shows:
 * an event that has not happened yet, because a host mid-tour has not run one.
 */
export const FIRST_EVENT = {
  name: "Nadia's Housewarming",
  /** Rendered through the product's own `formatEventDate`. */
  date: "2026-10-03",
} as const;

/**
 * EIGHT PHOTOGRAPHS FOR THE ALBUM THAT IS STILL FILLING, distinct from the
 * eight `first-event`'s own board reaches for, so a reader flipping between
 * boards sees the same library used two different ways rather than the same
 * grid twice. Landscape-leaning on purpose: `stage`'s grid is four wide at
 * 1440 and a photograph cropped square from a landscape original keeps its
 * subject centred.
 */
export const FILLING_IDS = [
  "party-balloons",
  "wedding-toast",
  "festival-crowd",
  "party-dj",
  "concert-confetti",
  "wedding-arch",
  "festival-lights",
  "wedding-golden",
] as const;

/** Confirms every id above is real, at import time rather than at a 404. */
FILLING_IDS.forEach((id) => {
  if (!MARKETING_IMAGES.some((m) => m.id === id)) {
    throw new Error(`app-door/fixtures: unknown marketing image id "${id}"`);
  }
});
