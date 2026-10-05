import type { Choice, LoadingId, SetId } from "../model";

import { BASE_CSS } from "./base";
import { CALLS_CSS } from "./calls";
import { LOADING_CSS } from "./loading";
import { HOUSE_CSS } from "./sets/house";
import { KEYS_CSS } from "./sets/keys";
import { TONE_CSS } from "./sets/tone";
import { SETTLED_CSS } from "./settled";
import { PHOTO } from "./states";

/**
 * ONE FRAME, ONE STYLESHEET OVER PRODUCTION: the base every set stands on,
 * then the set (its field, buttons, chosen things and toggles, drawn by one
 * hand), then his r4 picks (the halo, the shrink, the floating edge), then the
 * working state, then the carried call this board takes other than as built
 * (`calls.ts`). Nothing in `src/components/` is touched: a frame mounts
 * production's own components wearing this, which is what wiring a pick at
 * the source does (`globals.css` and `src/components/ui/`).
 *
 * ★ THE ORDER IS THE COMPOSITION'S: the set's bodies first, then the settled
 * marks over them, then working last of the transient states, so where two
 * want one plain property the more transient state wins, as it does under a
 * finger.
 *
 * ★ IT STYLES ATOMS ONLY, BY THE HOOKS THEIR PRIMITIVES WRITE (`data-slot`,
 * `data-variant`, `data-size`, `data-state`, and the atom contract's hooks),
 * never a screen's own selector, so the wiring never inherits a dead one. A
 * screen part that is not yet an atom is handed the atom it becomes in the
 * scene (`scene/adopt.ts`), not here.
 *
 * ★ UNLAYERED AND LAST, so it outranks production's utilities (which sit in a
 * layer) without a specificity war, and it is in the document from the first
 * paint (a `<style>` the server renders).
 */

/** A container standing on a photograph: white ink, whatever the ground. */
const ON_PHOTO = `
${PHOTO} { color: oklch(1 0 0); --foreground: oklch(1 0 0); --muted-foreground: oklch(1 0 0 / 80%); }
`;

/** Each set's sheet, by its id. */
export const SET_CSS: Record<SetId, string> = {
  keys: KEYS_CSS,
  house: HOUSE_CSS,
  tone: TONE_CSS,
};

/** Each working state's sheet, by its id. */
export const WORKING_CSS: Record<LoadingId, string> = LOADING_CSS;

export function sheetFor(c: Choice): string {
  return [
    BASE_CSS,
    SET_CSS[c.set],
    SETTLED_CSS,
    WORKING_CSS[c.loading],
    CALLS_CSS,
    ON_PHOTO,
  ].join("\n");
}
