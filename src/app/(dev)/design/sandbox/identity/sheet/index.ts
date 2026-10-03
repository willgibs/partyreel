import type { Choice } from "../model";

import { EDGE_CSS } from "./edge";
import { LAYERS_CSS } from "./layers";
import { MATERIAL_CSS } from "./material";
import { ROOM_CSS } from "./room";
import { PHOTO } from "./states";
import { STATUS_CSS } from "./status";
import { SYSTEM_CSS } from "./system";
import { ROLES_CSS, VOICE_CSS } from "./voice";

/**
 * ONE IDENTITY, ONE STYLESHEET OVER PRODUCTION: viewfinder's material, round
 * two's three picks (the voice, the layers, status), then this round's open
 * parts: one system for actions and fields, the room's pop-out, and how far
 * the light edge reaches. Nothing in `src/components/` is touched: a frame
 * mounts production's own components wearing this, which is what wiring a
 * pick at the source does (`globals.css` and `src/components/ui/`).
 *
 * ★ ROUND TWO'S PICKS ARE DRAWN HERE UNTIL `identity-wiring` WIRES THEM (the
 * voice, `layers.ts`'s display, `status.ts`'s lights): once production wears
 * them, `SETTLED` goes and every frame stands on production's own.
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

/** Round two's picks, until production wears them. */
const SETTLED = [VOICE_CSS, ROLES_CSS, LAYERS_CSS, STATUS_CSS];

export function sheetFor(c: Choice): string {
  return [
    MATERIAL_CSS,
    ...SETTLED,
    SYSTEM_CSS[c.system],
    ROOM_CSS[c.room],
    EDGE_CSS[c.edge],
    ON_PHOTO,
  ].join("\n");
}
