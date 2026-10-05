import {
  BTN,
  btn,
  CARD_ON,
  CHECK,
  CHECKED,
  CHIP,
  each,
  ERROR,
  FIELDS,
  FOCUS,
  HOVER,
  LIVE,
  OFF,
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

/**
 * KEYS AND WELLS, FINISHED (relief): what holds a value is sunk a step under
 * its ground, what you press stands a step above it, and one light falls from
 * above. His favourite foundation (r3: "keys and wells is my favorite
 * foundation"; r2: "I like wells, especially recessed inputs for subtle
 * difference against page color"), finished: the r4 build's 2px bevels and
 * gradients ran heavy at 2x (a 2008 key), so every edge here is one hairline
 * at one alpha and every depth one soft shade.
 *
 * ★ ONE RECIPE FOR EACH OF THE TWO DEPTHS, READ BY EVERY ATOM:
 *  - THE WELL (a field, a segment's track, a radio card at rest, a switch's
 *    track, a check, a radio, a slider's track): a step under its ground, a
 *    soft shade inside its top, a faint rim, and the light catching its far
 *    lip; in use it lifts toward the card, still sunk.
 *  - THE KEY (every button, a chip, the chosen segment, a chosen radio card, a
 *    switch's thumb, a slider's thumb): a face a hair above its ground, lit
 *    from above, one hairline round it and a contact shade under it.
 *
 * ★ WHAT IS CHOSEN RISES AS A LIGHTER KEY FROM ITS WELL (his r3 lean: "a
 * lighter surface for active selection items"), as a camera's latching key
 * would read; a chip that is on is an ink key, as everything that is on is
 * ink. In the room depth is light first: a key is a lit grey standing on the
 * near-black, a well a pit deeper than the card.
 */

/* ── the two depths, on every ground ─────────────────────────────────── */

/**
 * THE WELL, on every ground (exported: the house's mix takes this very well,
 * `house.ts`). A step under its ground, a soft shade inside its top, a faint
 * rim, a lip of light at its foot; `-deep` for a switch's track and a
 * slider's, a step further down; `-in` the well in use, lifted toward the card.
 */
export const WELL_TOKENS = `
:root, .surface-paper {
  --kw-well: oklch(0.955 0.002 286); --kw-well-deep: oklch(0.928 0.003 286);
  --kw-well-shade: oklch(0 0 0 / 7%); --kw-well-rim: oklch(0.14 0.004 286 / 8%);
  --kw-well-rim-up: oklch(0.14 0.004 286 / 15%); --kw-well-lip: oklch(1 0 0 / 75%);
  --kw-well-in: oklch(0.985 0.001 286);
}
.dark {
  --kw-well: oklch(0.12 0.003 286); --kw-well-deep: oklch(0.105 0.003 286);
  --kw-well-shade: oklch(0 0 0 / 55%); --kw-well-rim: oklch(1 0 0 / 7%);
  --kw-well-rim-up: oklch(1 0 0 / 13%); --kw-well-lip: oklch(1 0 0 / 7%);
  --kw-well-in: oklch(0.14 0.003 286);
}
.surface-display {
  --kw-well: color-mix(in oklab, var(--display), oklch(0 0 0) 32%); --kw-well-deep: color-mix(in oklab, var(--display), oklch(0 0 0) 40%);
  --kw-well-shade: oklch(0 0 0 / 45%); --kw-well-rim: oklch(1 0 0 / 7%);
  --kw-well-rim-up: oklch(1 0 0 / 14%); --kw-well-lip: oklch(1 0 0 / 8%);
  --kw-well-in: color-mix(in oklab, var(--display), oklch(0 0 0) 20%);
}
`;

const KEY_TOKENS = `
:root, .surface-paper {
  --kw-face: oklch(1 0 0); --kw-face-foot: oklch(0.979 0.001 286); --kw-face-up: oklch(0.973 0.002 286);
  --kw-line: oklch(0.14 0.004 286 / 12%); --kw-line-up: oklch(0.14 0.004 286 / 19%);
  --kw-top: oklch(1 0 0 / 0%); --kw-drop: oklch(0.14 0.004 286 / 9%);
  --kw-grey: oklch(0.948 0.002 286); --kw-grey-foot: oklch(0.928 0.003 286); --kw-grey-up: oklch(0.92 0.003 286);
  --kw-ink: oklch(0.25 0.005 286); --kw-ink-foot: oklch(0.15 0.004 286); --kw-ink-up: oklch(0.31 0.005 286);
  --kw-ink-rim: oklch(0.1 0.004 286); --kw-ink-top: oklch(1 0 0 / 17%); --kw-ink-drop: oklch(0 0 0 / 22%);
  --kw-thumb: oklch(1 0 0); --kw-seam: oklch(0.14 0.004 286 / 14%);
  --kw-socket-rim: oklch(0.14 0.004 286 / 44%); --kw-track-rim: oklch(0.14 0.004 286 / 15%);
  --kw-rail: color-mix(in oklab, var(--foreground) 12%, transparent);
  --kw-off-face: oklch(1 0 0); --kw-off-line: oklch(0.14 0.004 286 / 7%);
}
.dark {
  --kw-face: oklch(0.285 0.004 286); --kw-face-foot: oklch(0.245 0.004 286); --kw-face-up: oklch(0.305 0.004 286);
  --kw-line: oklch(0 0 0 / 60%); --kw-line-up: oklch(0 0 0 / 75%);
  --kw-top: oklch(1 0 0 / 11%); --kw-drop: oklch(0 0 0 / 50%);
  --kw-grey: oklch(0.225 0.004 286); --kw-grey-foot: oklch(0.2 0.004 286); --kw-grey-up: oklch(0.25 0.004 286);
  --kw-ink: oklch(0.985 0.001 286); --kw-ink-foot: oklch(0.955 0.002 286); --kw-ink-up: oklch(1 0 0);
  --kw-ink-rim: oklch(0 0 0 / 30%); --kw-ink-top: oklch(1 0 0 / 0%); --kw-ink-drop: oklch(0 0 0 / 55%);
  --kw-thumb: oklch(0.96 0.002 286); --kw-seam: oklch(0 0 0 / 35%);
  --kw-socket-rim: oklch(1 0 0 / 34%); --kw-track-rim: oklch(1 0 0 / 16%);
  --kw-rail: oklch(0.25 0.004 286);
  --kw-off-face: oklch(0.2 0.004 286); --kw-off-line: oklch(0 0 0 / 40%);
}
.surface-display {
  --kw-face: color-mix(in oklab, var(--display-step), oklch(1 0 0) 6%); --kw-face-foot: var(--display-step);
  --kw-face-up: color-mix(in oklab, var(--display-step), oklch(1 0 0) 10%);
  --kw-line: oklch(0 0 0 / 50%); --kw-line-up: oklch(0 0 0 / 65%);
  --kw-top: oklch(1 0 0 / 11%); --kw-drop: oklch(0 0 0 / 45%);
  --kw-grey: var(--display-step); --kw-grey-foot: color-mix(in oklab, var(--display-step), oklch(0 0 0) 8%);
  --kw-grey-up: color-mix(in oklab, var(--display-step), oklch(1 0 0) 6%);
  --kw-ink: var(--display-foreground); --kw-ink-foot: color-mix(in oklab, var(--display-foreground), oklch(0 0 0) 8%);
  --kw-ink-up: oklch(1 0 0); --kw-ink-rim: oklch(0 0 0 / 40%); --kw-ink-top: oklch(1 0 0 / 0%); --kw-ink-drop: oklch(0 0 0 / 45%);
  --kw-thumb: oklch(0.96 0.002 286); --kw-seam: oklch(0 0 0 / 35%);
  --kw-socket-rim: oklch(1 0 0 / 36%); --kw-track-rim: oklch(1 0 0 / 18%);
  --kw-rail: color-mix(in oklab, var(--display-step), oklch(1 0 0) 6%);
  --kw-off-face: var(--display-step); --kw-off-line: oklch(0 0 0 / 35%);
}
`;

/** The well's inside: a shade at its top, its rim, the light on its far lip (the house reads it too). */
export const SUNK = (rim = "var(--kw-well-rim)") =>
  `inset 0 1px 2px 0 var(--kw-well-shade), inset 0 0 0 1px ${rim}, inset 0 -1px 0 0 var(--kw-well-lip)`;

/** A key's machining: its top light, its hairline, its contact shade. */
const KEYED = (line = "var(--kw-line)", top = "var(--kw-top)") =>
  `inset 0 1px 0 0 ${top}, 0 0 0 1px ${line}, 0 1px 2px 0 var(--kw-drop)`;
const INKED = `inset 0 1px 0 0 var(--kw-ink-top), 0 0 0 1px var(--kw-ink-rim), 0 1px 2px 0 var(--kw-ink-drop)`;

const FACE = "linear-gradient(var(--kw-face), var(--kw-face-foot))";
const GREY = "linear-gradient(var(--kw-grey), var(--kw-grey-foot))";
const INK = "linear-gradient(var(--kw-ink), var(--kw-ink-foot))";

/* ── a field: the well ───────────────────────────────────────────────── */

export const WELL_FIELD = `
${FIELDS} { background-color: var(--kw-well); --i-body: ${SUNK()}; }
${each(FIELDS, HOVER + LIVE)} { --i-body: ${SUNK("var(--kw-well-rim-up)")}; }
${each(FIELDS, FOCUS)} { background-color: var(--kw-well-in); --i-body: ${SUNK("var(--kw-well-rim-up)")}; }
${each(FIELDS, ERROR)} { --i-body: ${SUNK("var(--destructive)")}; }
`;

/* ── the button family: keys ─────────────────────────────────────────── */

const BUTTONS = `
${btn("default")} { background-image: ${INK}; background-color: var(--kw-ink-foot); color: var(--ink-fg); --i-body: ${INKED}; }
${btn("default")}${HOVER}${LIVE} { background-image: linear-gradient(var(--kw-ink-up), var(--kw-ink)); }

${btn("outline")} { background-image: ${FACE}; background-color: var(--kw-face-foot); color: var(--foreground); --i-body: ${KEYED()}; }
${btn("secondary")} { background-image: ${GREY}; background-color: var(--kw-grey-foot); color: var(--foreground); --i-body: ${KEYED()}; }
${btn("outline", "secondary")}${HOVER}${LIVE} { --i-body: ${KEYED("var(--kw-line-up)")}; }
${btn("outline")}${HOVER}${LIVE} { background-image: linear-gradient(var(--kw-face-up), var(--kw-face-up)); }
${btn("secondary")}${HOVER}${LIVE} { background-image: linear-gradient(var(--kw-grey-up), var(--kw-grey-up)); }

${btn("ghost")} { background: transparent; color: var(--foreground); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone-2); }

${btn("destructive")} {
  background-image: ${FACE}; background-color: var(--kw-face-foot); color: var(--destructive);
  --i-body: ${KEYED("color-mix(in oklab, var(--destructive) 34%, transparent)")};
}
${btn("destructive")}${HOVER}${LIVE} { background-image: linear-gradient(color-mix(in oklab, var(--destructive) 7%, var(--kw-face)), color-mix(in oklab, var(--destructive) 7%, var(--kw-face))); }

/* Off, a key settles flush and recedes: its face plain, its hairline half as firm, its words quiet, no
   shade under it (the fresh-eyes passes: an ink key at 40% read as a slab heavier than the live keys,
   and a grey face beside a well read as a second, empty field). */
${BTN}${OFF}:not(${btn("ghost", "link")}) {
  opacity: 1; background-image: none; background-color: var(--kw-off-face); color: var(--faint);
  --i-body: inset 0 1px 0 0 transparent, 0 0 0 1px var(--kw-off-line), 0 1px 2px 0 transparent;
}
${BTN}${ERROR} { --i-body: inset 0 1px 0 0 var(--kw-top), 0 0 0 1.5px var(--destructive), 0 1px 2px 0 var(--kw-drop); }

/* A chip waits in a small well of its own and rises as a lighter key when it is on: the one language
   for what is chosen, as a segment rises from its track (never ink beside a segment's white key). */
${CHIP} { background: var(--kw-well); --i-body: ${SUNK()}; }
${CHIP}${HOVER}${LIVE} { color: var(--foreground); --i-body: ${SUNK("var(--kw-well-rim-up)")}; }
${CHIP}${ON} {
  background-image: ${FACE}; background-color: var(--kw-face-foot); color: var(--foreground);
  --i-body: inset 0 1px 0 0 var(--kw-top), 0 0 0 1px var(--kw-line), 0 1px 2px 0 var(--kw-drop);
}

/* On a photograph the white Add keeps its surface (the head's own), machined as a key. */
${btn("on-photo")} {
  background-image: linear-gradient(oklch(1 0 0), oklch(0.95 0.002 286)); background-color: oklch(0.95 0.002 286);
  color: oklch(0.13 0.004 286); --i-body: inset 0 -1px 0 0 oklch(0 0 0 / 10%), 0 1px 3px 0 oklch(0 0 0 / 30%);
}
${btn("on-photo")}${HOVER}${LIVE} { background-image: linear-gradient(oklch(0.97 0 0), oklch(0.93 0.002 286)); }
`;

/* ── what is chosen: a lighter key risen from its well ───────────────── */

/** A key's layers and their clear twins, the same shape, so a choice crossfades. */
const RISEN = (on: boolean) =>
  on
    ? `inset 0 1px 0 0 var(--kw-top), 0 0 0 1px var(--kw-line), 0 1px 2px 0 var(--kw-drop)`
    : `inset 0 1px 0 0 transparent, 0 0 0 1px transparent, 0 1px 2px 0 transparent`;
/**
 * A card's key: its hairline INSIDE its box and its lift only below it. A radio card stands in a
 * wrapper that clips (the door's dormant steps collapse with `overflow: hidden`), and an edge drawn
 * outside the box was cut away there (the fresh-eyes pass: a white card on white, with no edge).
 */
const CARD_RISEN = (on: boolean) =>
  on
    ? `inset 0 1px 0 0 var(--kw-top), inset 0 0 0 1px var(--kw-line), 0 1px 2px 0 var(--kw-drop), 0 5px 7px -6px var(--kw-drop)`
    : `inset 0 1px 0 0 transparent, inset 0 0 0 1px transparent, 0 1px 2px 0 transparent, 0 5px 7px -6px transparent`;

const PICKED = [`${SEGMENT}${ON}`, `${TAB}${TAB_ON}`].join(", ");

const CHOSEN = `
${SEGMENTS}, ${TABS} { background: var(--kw-well); box-shadow: ${SUNK()}; }
${SEGMENT}, ${TAB} { --i-sel: ${RISEN(false)}; }
${PICKED} { background-image: ${FACE}; background-color: var(--kw-face-foot); color: var(--foreground); --i-sel: ${RISEN(true)}; }

${RADIO_CARD} { background: var(--kw-well) !important; --i-body: ${SUNK()}; --i-sel: ${CARD_RISEN(false)}; }
${RADIO_CARD}${HOVER} { --i-body: ${SUNK("var(--kw-well-rim-up)")}; }
/* Risen, a card leaves its well: its face covers the shade, and what stands on it reads its face. */
${RADIO_CARD}${CARD_ON} {
  background: var(--kw-face) !important; --background: var(--kw-face-foot);
  --i-body: inset 0 0 0 0 transparent, inset 0 0 0 0 transparent, inset 0 0 0 0 transparent; --i-sel: ${CARD_RISEN(true)};
}
`;

/* ── the toggles: wells that fill with ink, thumbs that are keys ─────── */

const TOGGLES = `
${SWITCH} { background: var(--kw-well-deep); --i-body: ${SUNK("var(--kw-track-rim)")}; }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { --i-body: ${SUNK("var(--kw-well-rim-up)")}; }
${SWITCH}${SWITCH_ON} { background: var(--ink); --i-body: inset 0 1px 2px 0 oklch(0 0 0 / 28%), inset 0 0 0 1px transparent, inset 0 -1px 0 0 oklch(1 0 0 / 14%); }
${SWITCH}${ERROR} { --i-body: ${SUNK("var(--destructive)")}; }
/* One thumb on both grounds and both states: a white key, its seam keeping it whole on an inked track
   (a grey thumb read as held off in the room, and a black one on white as a hole). */
${THUMB} { background: var(--kw-thumb); box-shadow: 0 0 0 1px var(--kw-seam), 0 1px 2px 0 var(--kw-drop); }

${CHECK}, ${RADIO} { background: var(--kw-well-in); --i-body: ${SUNK("var(--kw-socket-rim)")}; }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: ${SUNK("color-mix(in oklab, var(--foreground) 32%, transparent)")}; }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} {
  background: var(--ink); color: var(--ink-fg);
  --i-body: inset 0 1px 2px 0 oklch(0 0 0 / 28%), inset 0 0 0 1px transparent, inset 0 -1px 0 0 oklch(1 0 0 / 14%);
}
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: ${SUNK("var(--destructive)")}; }

/* A slider's track is a rail, flat: a well six pixels tall drew two hairlines and nothing between. */
[data-slot="slider-track"] { background: var(--kw-rail); box-shadow: none; }
[data-slot="slider-range"] { background: var(--ink); }
${SLIDER_THUMB} { background: var(--kw-thumb); --i-body: 0 0 0 1px var(--kw-seam), 0 1px 2px 0 var(--kw-drop); }
`;

export const KEYS_CSS =
  WELL_TOKENS + KEY_TOKENS + WELL_FIELD + BUTTONS + CHOSEN + TOGGLES;
