"use client";

import { CARDS } from "./cards";
import type { DoorOption } from "./door-kit";
import { GLASS } from "./glass";
import { WINDOWS } from "./windows";

/**
 * THE THREE DOORS INTO HER ROOMS, ROUND FOUR: round three's three, each
 * refined to its best version in its own file through one contract
 * (`door-kit.tsx`'s `DoorOption`), so the hub draws whichever the board asks
 * for and a door is whole wherever it is read.
 *
 *  - `glass` (`glass.tsx`): every door in one glass capsule on the cover;
 *  - `cards` (`cards.tsx`): cards standing over the cover's seam;
 *  - `windows` (`windows.tsx`): a small quiet picture of each room.
 */

export type DoorsId = "glass" | "cards" | "windows";

export const DOORS: Record<DoorsId, DoorOption> = {
  glass: GLASS,
  cards: CARDS,
  windows: WINDOWS,
};
