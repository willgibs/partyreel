"use client";

import { GLASS } from "./cards-glass";
import { KEYS } from "./cards-keys";
import { POINTS } from "./cards-points";
import { SEAM_TAKE } from "./cards-seam";
import type { DoorOption } from "./door-kit";

/**
 * THE FOUR TAKES ON THE CARDS, ROUND FIVE: round four's cards over the seam
 * (his pick), each polished to one designer's best idea in its own file
 * through one contract (`door-kit.tsx`'s `DoorOption`) on one row and fold
 * (`card-kit.tsx`), every one speaking Afterglow's language (his desk-4 pick:
 * a state is a point and its word, colour only the screen's one light).
 *
 *  - `keys` (`cards-keys.tsx`): the house's own keys, lit from above;
 *  - `glass` (`cards-glass.tsx`): glass over the photograph, one capsule stuck;
 *  - `seam` (`cards-seam.tsx`): the cover's own light falling on the doors;
 *  - `points` (`cards-points.tsx`): each state on its glyph, a phone's tab bar.
 */

export type DoorsId = "keys" | "glass" | "seam" | "points";

export const DOORS: Record<DoorsId, DoorOption> = {
  keys: KEYS,
  glass: GLASS,
  seam: SEAM_TAKE,
  points: POINTS,
};
