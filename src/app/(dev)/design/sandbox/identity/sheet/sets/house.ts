import { LIGHT_ON } from "../settled";
import {
  CARD_ON,
  CHECK,
  CHECKED,
  CHIP,
  ERROR,
  HOVER,
  LIVE,
  ON,
  RADIO,
  RADIO_CARD,
  SEGMENT,
  SEGMENTS,
  SLIDER_THUMB,
  SWITCH,
  SWITCH_ON,
  TAB,
  TAB_ON,
  TABS,
  THUMB,
} from "../states";

import { WELL_FIELD, WELL_TOKENS } from "./keys";
import { KEY_TOKENS, TONE_BUTTONS } from "./tone";

/**
 * THE HOUSE'S OWN MIX: sunk where you type, flat where you press, afloat
 * where it moves. Each depth is given to the one part whose job it says, and
 * his r4 picks set the rest:
 *  - A FIELD IS A PLACE, so it is the well, and nothing else is (keys and
 *    wells' own, exactly: his favourite part of that foundation, a field
 *    never mistaken for a key).
 *  - WHAT YOU PRESS IS A WORD, so it is flat: ink and tone's keys, exactly,
 *    and the tracks and cards a choice stands in are flat tones too (his
 *    shrink is the press a flat key wants, and Afterglow's own decks draw
 *    every key flat). Its depth is the press itself.
 *  - WHAT IS CHOSEN FLOATS: the chosen segment, tab, chip and card, each an
 *    object standing over its track. The edge's own rule (r4, edge=floating)
 *    at the atom's scale: on paper the lighter surface he leans to, on the
 *    house's own lift; in the room graphite with the bright edge, a small
 *    pop-out, exactly as every menu stands over the room. A thumb is a white
 *    object on both grounds (its seam keeps it whole on an inked track), and
 *    a check and a radio wait as a ring of tone and fill with ink.
 *
 * ★ BORROWED, NEVER RETYPED: the well and the keys are imported from their own
 * sets, so the mix is literally those parts, and a change to either reaches it.
 */

const TOKENS = `
:root, .surface-paper {
  --hs-track: color-mix(in oklab, var(--foreground) 7%, transparent);
  --hs-card: color-mix(in oklab, var(--foreground) 4.5%, var(--card));
  --hs-card-up: color-mix(in oklab, var(--foreground) 7%, var(--card));
  --hs-off: color-mix(in oklab, var(--foreground) 15%, transparent);
  --hs-off-up: color-mix(in oklab, var(--foreground) 21%, transparent);
  --hs-float: oklch(1 0 0); --hs-float-line: oklch(0.14 0.004 286 / 9%);
  --hs-lift-near: oklch(0 0 0 / 8%); --hs-lift-far: oklch(0 0 0 / 14%);
  --hs-light: oklch(1 0 0 / 0%); --hs-thumb: oklch(1 0 0); --hs-seam: oklch(0.14 0.004 286 / 9%);
  --hs-ring: color-mix(in oklab, var(--foreground) 28%, transparent);
  --hs-ring-up: color-mix(in oklab, var(--foreground) 45%, transparent);
}
.dark {
  --hs-track: color-mix(in oklab, var(--foreground) 7%, transparent);
  --hs-card: color-mix(in oklab, var(--foreground) 4%, var(--card));
  --hs-card-up: color-mix(in oklab, var(--foreground) 6.5%, var(--card));
  --hs-off: color-mix(in oklab, var(--foreground) 16%, transparent);
  --hs-off-up: color-mix(in oklab, var(--foreground) 22%, transparent);
  --hs-float: var(--display); --hs-float-line: oklch(0 0 0 / 0%);
  --hs-lift-near: oklch(0 0 0 / 50%); --hs-lift-far: oklch(0 0 0 / 55%);
  --hs-light: var(--display-light); --hs-thumb: oklch(0.96 0.002 286); --hs-seam: oklch(0 0 0 / 25%);
  --hs-ring: color-mix(in oklab, var(--foreground) 32%, transparent);
  --hs-ring-up: color-mix(in oklab, var(--foreground) 50%, transparent);
}
.surface-display {
  --hs-track: color-mix(in oklab, var(--foreground) 9%, transparent);
  --hs-card: color-mix(in oklab, var(--foreground) 5%, var(--display));
  --hs-card-up: color-mix(in oklab, var(--foreground) 8%, var(--display));
  --hs-off: color-mix(in oklab, var(--foreground) 18%, transparent);
  --hs-off-up: color-mix(in oklab, var(--foreground) 24%, transparent);
  --hs-float: var(--display-step); --hs-float-line: oklch(0 0 0 / 0%);
  --hs-lift-near: oklch(0 0 0 / 40%); --hs-lift-far: oklch(0 0 0 / 45%);
  --hs-light: var(--display-light); --hs-thumb: oklch(0.96 0.002 286); --hs-seam: oklch(0 0 0 / 25%);
  --hs-ring: color-mix(in oklab, var(--foreground) 34%, transparent);
  --hs-ring-up: color-mix(in oklab, var(--foreground) 52%, transparent);
}
`;

/** The lift, and its clear twin of the same shape, so a choice crossfades. */
const LIFT = (on: boolean) =>
  on
    ? `0 0 0 1px var(--hs-float-line), 0 1px 2px 0 var(--hs-lift-near), 0 3px 10px -1px var(--hs-lift-far)`
    : `0 0 0 1px transparent, 0 1px 2px 0 transparent, 0 3px 10px -1px transparent`;

/**
 * A card afloat: its line INSIDE its box and its lift only below it, since a radio card stands in a
 * wrapper that clips (the door's dormant steps), which cut an edge drawn outside the box away.
 */
const CARD_LIFT = (on: boolean) =>
  on
    ? `inset 0 0 0 1px var(--hs-float-line), 0 1px 2px 0 var(--hs-lift-near), 0 6px 8px -6px var(--hs-lift-far)`
    : `inset 0 0 0 1px transparent, 0 1px 2px 0 transparent, 0 6px 8px -6px transparent`;

/** A thumb: white on both grounds, its seam keeping it whole on an inked track, on its lift. */
const THUMBED = `0 0 0 1px var(--hs-seam), 0 1px 2px 0 var(--hs-lift-near), 0 3px 8px -1px var(--hs-lift-far)`;

/** The bright edge on what floats: clear on paper, the display's light in the room. */
const LIT = LIGHT_ON("1px", `radial-gradient(135% 100% at 50% 0%,
    var(--hs-light) 0%, color-mix(in oklab, var(--hs-light) 44%, transparent) 36%,
    color-mix(in oklab, var(--hs-light) 13%, transparent) 66%, transparent 92%)`);

/* ── what is chosen floats over a flat track ─────────────────────────── */

const PICKED = [`${SEGMENT}${ON}`, `${TAB}${TAB_ON}`].join(", ");

const CHOSEN = `
${SEGMENTS}, ${TABS} { background: var(--hs-track); box-shadow: none; }
${SEGMENT}, ${TAB} { --i-sel: ${LIFT(false)}; }
${PICKED} { background: var(--hs-float); color: var(--foreground); --i-sel: ${LIFT(true)}; }
${SEGMENT}${ON}::before, ${TAB}${TAB_ON}::after { ${LIT} display: block; }

${RADIO_CARD} { background: var(--hs-card) !important; --i-sel: ${CARD_LIFT(false)}; }
${RADIO_CARD}${HOVER} { background: var(--hs-card-up) !important; }
/* Afloat, a card stands over the rest: what stands on it reads its face. */
${RADIO_CARD}${CARD_ON} { background: var(--hs-float) !important; --background: var(--hs-float); --i-sel: ${CARD_LIFT(true)}; }
${RADIO_CARD}${CARD_ON}::after { ${LIT} }

/* A chip that is on floats as the chosen segment does: one language for what is chosen. */
${CHIP}${ON} { background: var(--hs-float); color: var(--foreground); --i-body: ${LIFT(true)}; }
${CHIP}${ON}::after { ${LIT} }
`;

/* ── the toggles: flat tracks, white thumbs, rings that fill with ink ── */

const TOGGLES = `
${SWITCH} { background: var(--hs-off); }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { background: var(--hs-off-up); }
${SWITCH}${SWITCH_ON} { background: var(--ink); }
${SWITCH}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${THUMB} { background: var(--hs-thumb); box-shadow: ${THUMBED}; }

/* A check and a radio wait as a ring of tone, never a floating disc (which read as on), and fill with ink. */
${CHECK}, ${RADIO} { background: transparent; --i-body: inset 0 0 0 2px var(--hs-ring); }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: inset 0 0 0 2px var(--hs-ring-up); }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 0 0 2px transparent; }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: inset 0 0 0 2px var(--destructive); }

[data-slot="slider-track"] { background: var(--hs-off); box-shadow: none; }
[data-slot="slider-range"] { background: var(--ink); }
${SLIDER_THUMB} { background: var(--hs-thumb); --i-body: ${THUMBED}; }
`;

export const HOUSE_CSS =
  WELL_TOKENS + KEY_TOKENS + TOKENS + WELL_FIELD + TONE_BUTTONS + CHOSEN + TOGGLES;
