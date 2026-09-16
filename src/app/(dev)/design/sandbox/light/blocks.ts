import {
  AURORA_REGISTER,
  LIT_FACE,
  PUBLISH_LEAN,
  SHADOW_FAMILY,
  type LightCandidate,
} from "./candidates";
import { type TreatmentId } from "./kit";

/**
 * WHAT PICKING A CARD HANDS THE SITE (round six, the revamp, 2026-09-16).
 *
 * The catalog's Pick sets the board's `treatment` control, and the dock hands
 * the site THIS block, so the real pages below the catalog are wearing exactly
 * the card that is pressed. It is the same apply path every board has had since
 * round two; what is new is that a card drives it rather than a dock switch.
 *
 * ★ HALF THE TWELVE HAVE NO BLOCK, AND THAT IS THE HONEST ANSWER RATHER THAN A
 * GAP. Six of them already run in production (the step, the ring, the footer's
 * seam, the plate's bloom, the Pro card's beam) or are a MOUNT rather than a
 * token (the sweep, the throw, the aurora's two bands, the halo's wrapper): a
 * wiring round types JSX at a call site for those, and no stylesheet can stand
 * in for it. A button that claims to apply something and changes nothing on the
 * page is worse than no button, so a card with no block says so instead.
 *
 * ★ LIFT AND FLOAT SHARE ONE BLOCK, because they are one ruling: one geometry,
 * two sizes, one alpha ramp per ground. Splitting the paste would mean two
 * copies of four alphas in two files with nothing holding them equal. The
 * RULING is still per card, which is the point of the catalog: keep both and
 * the family lands, keep one and the wiring round drops the other's half.
 */
export function blockFor(id: TreatmentId): LightCandidate | null {
  switch (id) {
    case "lift":
    case "float":
      return SHADOW_FAMILY;
    case "face":
      return LIT_FACE;
    case "aurora":
      return AURORA_REGISTER;
    case "bloom":
      return PUBLISH_LEAN;
    default:
      return null;
  }
}

/** Why a card has no block, in the words the dock prints beside it. */
export function noBlockBecause(id: TreatmentId): string {
  switch (id) {
    case "step":
    case "ring":
      return "It already ships on every surface. Naming it is the whole change; not one pixel moves.";
    case "seam":
      return "It already ships on the footer, the film strip and the feature screens.";
    case "beam":
      return "It already ships on the Pro card, and it is ruled.";
    case "throw":
    case "sweep":
    case "halo":
      return "It is a mount rather than a token: a wiring round types the wrapper at the call site.";
    default:
      return "Nothing to apply.";
  }
}
