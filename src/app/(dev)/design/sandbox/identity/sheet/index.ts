import type { Choice } from "../model";

import { ACTIONS_CSS } from "./actions";
import { FIELDS_CSS } from "./fields";
import { LAYERS_CSS } from "./layers";
import { MATERIAL_CSS } from "./material";
import { PHOTO } from "./states";
import { STATUS_CSS } from "./status";
import { ROLES_CSS, VOICE_CSS } from "./voice";

/**
 * ONE IDENTITY, ONE STYLESHEET OVER PRODUCTION: viewfinder's material, the
 * voice's variables and the roles that wear them, then one build for each
 * atom group. Nothing in `src/components/` is touched: a frame mounts
 * production's own components wearing this, which is what wiring the picks at
 * the source does (`globals.css` and `src/components/ui/`).
 *
 * ★ IT STYLES ATOMS ONLY, BY THE HOOKS THEIR PRIMITIVES WRITE (`data-slot`,
 * `data-variant`, `data-size`, `data-state`, and the atom contract's new
 * hooks), never a screen's own selector, so the wiring never inherits a dead
 * one. A screen part that is not yet an atom is handed the atom it becomes in
 * the scene (`scene/adopt.ts`), not here.
 *
 * ★ UNLAYERED AND LAST, so it outranks production's utilities (which sit in a
 * layer) without a specificity war, and it is in the document from the first
 * paint (a `<style>` the server renders).
 */

/** A container standing on a photograph: white ink, whatever the ground. */
const ON_PHOTO = `
${PHOTO} { color: oklch(1 0 0); --foreground: oklch(1 0 0); --muted-foreground: oklch(1 0 0 / 80%); }
`;

export function sheetFor(c: Choice): string {
  return [
    MATERIAL_CSS,
    VOICE_CSS[c.voice],
    ROLES_CSS,
    ACTIONS_CSS[c.actions],
    FIELDS_CSS[c.fields],
    LAYERS_CSS[c.layers],
    STATUS_CSS[c.status],
    ON_PHOTO,
  ].join("\n");
}
