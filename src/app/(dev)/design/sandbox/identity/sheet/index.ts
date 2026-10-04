import type { AskId, Choice } from "../model";

import { BASE_CSS } from "./base";
import { BUTTON_CSS } from "./button";
import { EDGE_CSS } from "./edge";
import { FIELD_CSS } from "./field";
import { FOCUS_CSS } from "./focus";
import { LOADING_CSS } from "./loading";
import { PRESS_CSS } from "./press";
import { ROOM_CSS } from "./room";
import { SELECTED_CSS } from "./selected";
import { PHOTO } from "./states";
import { TOGGLES_CSS } from "./toggles";

/**
 * ONE MIX, ONE STYLESHEET OVER PRODUCTION: the tokens and the composition the
 * traits share, then each trait's pick, then the room's pop-out (graphite, as
 * picked) and the light edge's reach. Nothing in `src/components/` is touched:
 * a frame mounts production's own components wearing this, which is what
 * wiring a pick at the source does (`globals.css` and `src/components/ui/`).
 *
 * ★ THE ORDER IS THE COMPOSITION'S (`states.ts`): a body (the field, the
 * button), then toggles, then what is chosen, then a press, then working,
 * then focus last, so where two traits want one plain property the later,
 * more transient state wins, as it does under a finger.
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

/** Each ask's sheets, by option, in the order they are laid down. */
export const SHEETS_BY_ASK: {
  readonly [A in AskId]: Record<Choice[A], string>;
} = {
  field: FIELD_CSS,
  button: BUTTON_CSS,
  toggles: TOGGLES_CSS,
  selected: SELECTED_CSS,
  press: PRESS_CSS,
  loading: LOADING_CSS,
  focus: FOCUS_CSS,
  edge: EDGE_CSS,
};

export function sheetFor(c: Choice): string {
  return [
    BASE_CSS,
    FIELD_CSS[c.field],
    BUTTON_CSS[c.button],
    TOGGLES_CSS[c.toggles],
    SELECTED_CSS[c.selected],
    PRESS_CSS[c.press],
    LOADING_CSS[c.loading],
    FOCUS_CSS[c.focus],
    ROOM_CSS,
    EDGE_CSS[c.edge],
    ON_PHOTO,
  ].join("\n");
}
