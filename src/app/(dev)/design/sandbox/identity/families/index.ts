import type { FamilyId } from "../model";

import { CRYSTAL_CSS } from "./crystal";
import { EDITORIAL_CSS } from "./editorial";
import { MEDIA_BASE_CSS } from "./media";
import { SOFT_CSS } from "./soft";
import { TODAY_CSS } from "./today";
import { VIEWFINDER_CSS } from "./viewfinder";

/**
 * EACH FAMILY IS ONE STYLESHEET OVER PRODUCTION: its token set first (the
 * grounds, the text steps, the corners and the light, so every surface built
 * on a token follows), then its atoms by the hooks their primitives already
 * write (`data-slot`, `data-variant`, `data-size`, `data-state`), then the few
 * parts of the three screens that are not atoms yet. Nothing in
 * `src/components/` is touched: the frame mounts production and wears the
 * sheet, which is exactly what wiring the pick at the source would do.
 *
 * Every family sheet carries today's pinned states and today's media atoms
 * under its own, so a family that leaves something alone shows production's
 * there rather than nothing.
 */
const BASE = MEDIA_BASE_CSS + TODAY_CSS;

export const FAMILY_CSS: Record<FamilyId, string> = {
  today: BASE,
  editorial: BASE + EDITORIAL_CSS,
  soft: BASE + SOFT_CSS,
  crystal: BASE + CRYSTAL_CSS,
  viewfinder: BASE + VIEWFINDER_CSS,
};
