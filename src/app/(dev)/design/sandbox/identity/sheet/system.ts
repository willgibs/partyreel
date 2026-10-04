import type { SystemId } from "../model";

import { INK_CSS } from "./ink";
import { KEYS_CSS } from "./keys";
import { MARK_POSITIONS_IN } from "./marks";
import { RINGS_CSS } from "./rings";

/**
 * ACTIONS AND FIELDS, ONE SYSTEM (Will, identity r2: "exploring the keys plus
 * wells direction together versus all rings, plus a new third idea"): every
 * button, chip, segment and link, and every field, switch, check, radio,
 * slider and tab, drawn by one hand, with ONE focus mark across all of them.
 *
 * ★ EVERY STATE, EVERY BUILD: rest, hover, press, focus, off, loading
 * (`aria-busy`) and error (`aria-invalid`), the states `states.ts` pins.
 * Heights never move for an action (production's ladder: the 32px button, the
 * 44px call to action); a field grows to 40px in every build (r2's carried
 * call), so the three differ by their drawing alone.
 *
 * ★ NO CORNERS AS A STYLE, NO HUNTING: the viewfinder's four marks survive
 * only as `keys`' focus mark (the lock, `marks.ts`), and nothing loads by
 * moving them (`identity.test.ts` holds both).
 *
 * ★ THE HEAD'S ATOMS KEEP THEIR OWN SURFACES. The shutter's light, the code
 * chip's white, a glass round's Crystal and the white primary are
 * `event-header`'s, wired; a system gives them its shape, its press and its
 * focus mark, never a new material.
 */

/**
 * Laid out once for every build: the stand-ins (production has no check,
 * radio, slider or radio card primitive yet: `views/atoms.tsx`) and the loops
 * a build may run.
 */
const BASE = `
[data-slot="checkbox"], [data-slot="radio-group-item"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 18px; height: 18px; padding: 0; border: 0; outline: none; cursor: pointer; color: var(--primary-foreground);
  transition: background-color 120ms linear, box-shadow 120ms linear, scale 120ms var(--ease-emphasis);
}
[data-slot="checkbox-indicator"] { display: none; align-items: center; justify-content: center; }
[data-slot="checkbox-indicator"] svg { width: 12px; height: 12px; stroke-width: 3.2; }
[data-slot="checkbox"][data-state="checked"] [data-slot="checkbox-indicator"] { display: flex; }
[data-slot="radio-group-indicator"] { display: none; width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
[data-slot="radio-group-item"][data-state="checked"] [data-slot="radio-group-indicator"] { display: block; }
[data-slot="slider"] {
  position: relative; display: flex; align-items: center; width: 100%; height: 26px; touch-action: none; cursor: pointer;
}
[data-slot="slider-track"] { position: relative; flex: 1; overflow: hidden; }
[data-slot="slider-range"] { position: absolute; inset-block: 0; left: 0; }
[data-slot="slider-thumb"] {
  position: absolute; top: 50%; translate: -50% -50%; outline: none; cursor: grab;
  transition: box-shadow 120ms linear, scale 120ms var(--ease-emphasis), background-color 120ms linear;
}
[data-slot="radio-card"] { position: relative; cursor: pointer; transition: background-color 120ms linear, box-shadow 120ms linear, color 120ms linear; }
[data-slot="tabs-list"] { position: relative; }
[data-slot="tabs-trigger"] { position: relative; flex: none; }
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
@property --vf-spin { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes vf-spin { to { --vf-spin: 1turn; } }
@keyframes vf-breathe-dots { from { opacity: 0.45; } to { opacity: 1; } }
@keyframes vf-field-scan {
  from { background-position: ${MARK_POSITIONS_IN}, -60% calc(100% - 1px); }
  to { background-position: ${MARK_POSITIONS_IN}, 160% calc(100% - 1px); }
}
@keyframes vf-field-scan-one {
  from { background-position: -60% calc(100% - 3px); }
  to { background-position: 160% calc(100% - 3px); }
}
`;

/**
 * ★ REDUCED MOTION IS THE GLOBAL GUARD'S (globals.css): every loop here runs
 * once at 0.01ms and rests on its base style, which is drawn to read as
 * loading on its own (three lights, an arc, a lit band), never as nothing.
 */
export const SYSTEM_CSS: Record<SystemId, string> = {
  keys: BASE + KEYS_CSS,
  rings: BASE + RINGS_CSS,
  ink: BASE + INK_CSS,
};
