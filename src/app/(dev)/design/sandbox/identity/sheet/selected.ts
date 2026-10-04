import type { SelectedId } from "../model";

import {
  CARD_ON,
  CHIP,
  HOVER,
  LIVE,
  OFF,
  ON,
  PRESS,
  RADIO_CARD,
  SEGMENT,
  TAB,
  TAB_ON,
  TABS,
} from "./states";

/**
 * A CHOSEN THING AMONG OTHERS: the segment that is on in a segmented control
 * (what the link opens, a layout), a chip that is on (a filter), the radio
 * card that is chosen (the door's gate), the tab you are on, and a picture
 * chosen among pictures (Create's four looks). The track it sits in is the
 * field's (`field.ts`: a well, a ring, a tone), so a choice is always drawn on
 * the mix's own way of holding a value.
 *
 * ★ HIS NOTE IS THE BRIEF (r3: "tend to like a lighter surface for active
 * selection items"): two of the four are lighter surfaces, and they part on
 * what makes them lighter. RAISED is an object: the chosen one rises out of
 * the well as a key, its face catching the light from above, on its own small
 * shadow. LIGHTER is light: the chosen one stays flush where it is and is lit,
 * flat, the brightest thing in its track. Beside them an ink pill and a tone
 * frame.
 *
 * ★ LIGHTER THAN THE TRACK ON EVERY GROUND, so each surface is a token on
 * each ground: on paper white (a key's face shaded a hair toward its foot, the
 * step flat white); in the room a lit grey above the card the well sits in
 * (the card's own tone reads as a hole in the well, not a key); on the display
 * a step above the display's own step, which is its well. A chosen CARD is a
 * large area, so it steps less than a segment does, and its captions keep
 * 4.5:1 (`--sel-*-card`).
 *
 * ★ A LIT CARD IS A GROUND OF ITS OWN: what stands on it (the door's password
 * panel, a focus mark's gap) reads `--background`, so a raised or lighter card
 * re-declares it a step under its own face; the room's black would read as a
 * pit in a lit card. Ink and the frame keep the field's card, and its ground.
 *
 * ★ A CHOICE CROSSFADES: a chosen layer and its unchosen twin are the same
 * shadows, the twin's transparent, so a new pick fades in rather than
 * jumping (a box-shadow list only interpolates against a list of its shape).
 */

/** One layer of a chosen mark: `[inset?, geometry, colour]`. */
type Layer = readonly [inset: boolean, geometry: string, colour: string];

/** A mark's layers, lit or as their transparent twin (the same shape, for the crossfade). */
const layers = (ls: readonly Layer[], on = true): string =>
  ls
    .map(
      ([inset, g, c]) =>
        `${inset ? "inset " : ""}${g} ${on ? c : "transparent"}`,
    )
    .join(", ");

/** Every chosen thing that sits in a track: a segment, a chip, a tab. */
const PICKS = [SEGMENT, CHIP, TAB].join(", ");
/** The same, chosen. */
const PICKED = [`${SEGMENT}${ON}`, `${CHIP}${ON}`, `${TAB}${TAB_ON}`].join(
  ", ",
);
/**
 * A segment or a tab waiting under a pointer, which shows where the choice
 * would stand. A chip's own pointer is the button's (`button.ts`): a chip at
 * rest is an action's body, and only its being on is this trait's.
 */
const WAITING_HOVER = [
  `${SEGMENT}:not(${ON})${HOVER}${LIVE}`,
  `${TAB}:not(${TAB_ON})${HOVER}${LIVE}`,
].join(", ");
/** A chosen card. */
const CARD_PICKED = `${RADIO_CARD}${CARD_ON}`;

/**
 * A PICTURE CHOSEN AMONG PICTURES (Create's four looks), not an atom yet: the
 * hooks the scene's adopt rule hands it (proposed, `[data-look]`), declared
 * here until `states.ts` names them. Its mark stands behind it as a plate
 * (`::before`, the chosen pseudo-element, as on a radio card), so the picture
 * itself is never retinted, and the picker's own ring gives way to it.
 */
const SWATCH = '[data-slot="swatch"]';
const SWATCH_ON = `${SWATCH}${CARD_ON}`;
const SWATCH_TILE = '[data-slot="swatch-tile"]';
const SWATCH_LABEL = '[data-slot="swatch-label"]';

/**
 * The lit surfaces, on each ground. Paper's key and step are both white (white
 * is as light as paper goes), so on paper the two part by form: the key's face
 * shades a hair toward its foot and stands on a shadow, the step is flat white
 * with a hairline that keeps it read on a white ground (a ring's track is the
 * card itself).
 */
const TOKENS = `
:root, .surface-paper {
  --sel-key-top: oklch(1 0 0);
  --sel-key: oklch(0.982 0.001 286);
  --sel-key-card: oklch(0.996 0.001 286);
  --sel-key-hi: oklch(1 0 0);
  --sel-key-lo: oklch(0 0 0 / 9%);
  --sel-key-rim: oklch(0.14 0.004 286 / 9%);
  --sel-key-drop: oklch(0 0 0 / 14%);
  --sel-key-fall: oklch(0 0 0 / 9%);
  --sel-key-ground: oklch(0.972 0.002 286);
  --sel-lit: oklch(1 0 0);
  --sel-lit-card: oklch(1 0 0);
  --sel-lit-rim: oklch(0.14 0.004 286 / 10%);
  --sel-lit-ground: oklch(0.972 0.002 286);
}
.dark {
  --sel-key-top: oklch(0.36 0.005 286);
  --sel-key: oklch(0.315 0.005 286);
  --sel-key-card: oklch(0.235 0.005 286);
  --sel-key-hi: oklch(1 0 0 / 12%);
  --sel-key-lo: oklch(0 0 0 / 40%);
  --sel-key-rim: oklch(1 0 0 / 5%);
  --sel-key-drop: oklch(0 0 0 / 60%);
  --sel-key-fall: oklch(0 0 0 / 50%);
  --sel-key-ground: oklch(0.185 0.004 286);
  --sel-lit: oklch(0.45 0.005 286);
  --sel-lit-card: oklch(0.31 0.005 286);
  --sel-lit-rim: transparent;
  --sel-lit-ground: oklch(0.235 0.004 286);
}
.surface-display {
  --sel-key-top: color-mix(in oklab, var(--display-step), oklch(1 0 0) 19%);
  --sel-key: color-mix(in oklab, var(--display-step), oklch(1 0 0) 14%);
  --sel-key-card: var(--sel-key);
  --sel-key-hi: oklch(1 0 0 / 12%);
  --sel-key-lo: oklch(0 0 0 / 32%);
  --sel-key-rim: oklch(1 0 0 / 5%);
  --sel-key-drop: oklch(0 0 0 / 45%);
  --sel-key-fall: oklch(0 0 0 / 35%);
  --sel-key-ground: var(--display);
  --sel-lit: color-mix(in oklab, var(--display-step), oklch(1 0 0) 27%);
  --sel-lit-card: var(--sel-lit);
  --sel-lit-rim: transparent;
  --sel-lit-ground: var(--display);
}
`;

/**
 * Laid out once: an unchosen segment and tab, quiet in their track, and the
 * plate a picture's mark stands on. A segment and a tab take their track's own
 * corner (`inherit`), whichever field drew the track (`field.ts` draws a tab
 * list's as a segmented control's), so a ring's pill holds pills and a well
 * holds rounded keys.
 */
const BASE = `
${TOKENS}
${SEGMENT} {
  position: relative; height: 30px; min-width: 32px; padding: 0 10px; border: 0; white-space: nowrap;
  border-radius: inherit;
  background: transparent; color: var(--muted-foreground);
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear, translate 70ms linear, scale 140ms var(--ease-emphasis);
}
${TABS} { height: auto; }
${TAB} {
  height: 30px; padding: 0 12px; border: 0; border-radius: inherit; background: transparent;
  color: var(--muted-foreground);
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear, translate 70ms linear, scale 140ms var(--ease-emphasis);
}
${RADIO_CARD} { transition: background-color 140ms linear, box-shadow 140ms linear; }
${WAITING_HOVER} { color: var(--foreground); }
${SEGMENT}${OFF}, ${TAB}${OFF} { opacity: 0.38; }
${PICKED} { color: var(--foreground); }

${SWATCH} {
  position: relative; isolation: isolate;
  --ink: var(--primary); --ink-fg: var(--primary-foreground);
  --tone: color-mix(in oklab, var(--foreground) 8%, transparent);
}
${SWATCH}::before {
  content: ""; position: absolute; inset: -8px -10px -6px; z-index: -1; border-radius: 16px; pointer-events: none;
  background: transparent; transition: background-color 140ms linear, box-shadow 140ms linear;
}
${SWATCH_ON} ${SWATCH_TILE} { outline-color: transparent; }
${SWATCH_ON} ${SWATCH_LABEL} { color: var(--foreground); }
`;

/* ── RAISED ──────────────────────────────────────────────────────────── */

/** A key: a light along its top, a hairline, a shade along its foot, and its own small shadow. */
const KEY: readonly Layer[] = [
  [true, "0 1px 0 0", "var(--sel-key-hi)"],
  [true, "0 0 0 1px", "var(--sel-key-rim)"],
  [true, "0 -1px 0 0", "var(--sel-key-lo)"],
  [false, "0 1px 1px 0", "var(--sel-key-drop)"],
  [false, "0 2px 5px -1px", "var(--sel-key-fall)"],
];
/**
 * A chosen card's key: the same, over a band of its own face along the top,
 * which covers the well's shade under it (a risen key keeps no recess), on a
 * longer, softer shadow for its size.
 */
const CARD_KEY: readonly Layer[] = [
  KEY[0],
  KEY[1],
  [true, "0 3px 0 0", "var(--sel-key-card)"],
  KEY[2],
  [false, "0 1px 2px 0", "var(--sel-key-drop)"],
  [false, "0 6px 14px -6px", "var(--sel-key-fall)"],
];
/** A key's face, lit from above. */
const FACE =
  "linear-gradient(var(--sel-key-top), var(--sel-key)) var(--sel-key)";

/** The same, held down: whatever the press does, the key's top leaves the light. */
const PICKED_HELD = [`${SEGMENT}${ON}`, `${CHIP}${ON}`, `${TAB}${TAB_ON}`]
  .map((s) => `${s}${PRESS}${LIVE}`)
  .join(", ");

/**
 * KEYS' RAISED KEY: the chosen one rises out of its well as a lighter key,
 * its face lit from above, bevelled, on a small shadow of its own; under a
 * pointer a waiting one starts to rise (a faint key where it would stand),
 * and held down its top leaves the light (a press's ink never carries it).
 */
const RAISED = `
${PICKS} { --i-sel: ${layers(KEY, false)}; }
${PICKED} { background: ${FACE}; --i-sel: ${layers(KEY)}; }
${PICKED_HELD} { --sel-key-hi: transparent; }
${WAITING_HOVER} { background: color-mix(in oklab, var(--sel-key) 30%, transparent); }
${RADIO_CARD} { --i-sel: ${layers(CARD_KEY, false)}; }
${CARD_PICKED} {
  background: var(--sel-key-card) !important; --background: var(--sel-key-ground);
  --i-sel: ${layers(CARD_KEY)};
}
${SWATCH}::before { box-shadow: ${layers(KEY, false)}; }
${SWATCH_ON}::before { background: ${FACE}; box-shadow: ${layers(KEY)}; }
`;

/* ── LIGHTER ─────────────────────────────────────────────────────────── */

const LIT: readonly Layer[] = [[true, "0 0 0 1px", "var(--sel-lit-rim)"]];

/**
 * A STILL LIGHTER STEP: the chosen one stays flush and is lit, flat and with
 * no shadow, the brightest thing in its track; a chosen card keeps its well
 * (a lit well, not a key). Under a pointer, a little light.
 */
const LIGHTER = `
${PICKS}, ${RADIO_CARD} { --i-sel: ${layers(LIT, false)}; }
${PICKED} { background: var(--sel-lit); --i-sel: ${layers(LIT)}; }
${WAITING_HOVER} { background: color-mix(in oklab, var(--sel-lit) 35%, transparent); }
${CARD_PICKED} {
  background: var(--sel-lit-card) !important; --background: var(--sel-lit-ground);
  --i-sel: ${layers(LIT)};
}
${SWATCH}::before { box-shadow: ${layers(LIT, false)}; }
${SWATCH_ON}::before { background: var(--sel-lit); box-shadow: ${layers(LIT)}; }
`;

/* ── INK ─────────────────────────────────────────────────────────────── */

const RING: readonly Layer[] = [[true, "0 0 0 2px", "var(--ink)"]];

/**
 * AN INK PILL: the chosen one is solid ink, near-black on paper and white in
 * the room; a chosen card, too large to fill, is ringed in ink instead, and a
 * chosen picture stands on an ink plate. Under a pointer, a tone.
 */
const INK = `
${PICKED} { background: var(--ink); color: var(--ink-fg); }
${WAITING_HOVER} { background: var(--tone); }
${RADIO_CARD} { --i-sel: ${layers(RING, false)}; }
${CARD_PICKED} { --i-sel: ${layers(RING)}; }
${SWATCH_ON}::before { background: var(--ink); }
${SWATCH_ON} ${SWATCH_LABEL} { color: var(--ink-fg); }
`;

/* ── FRAME ───────────────────────────────────────────────────────────── */

const FRAMED: readonly Layer[] = [[true, "0 0 0 1.5px", "var(--foreground)"]];

/**
 * A TONE FRAME: the chosen one is drawn rather than filled, a thin frame of
 * its ink round a faint tone; under a pointer the frame is drawn faintly
 * where it would close.
 */
const FRAME = `
${PICKS}, ${RADIO_CARD} { --i-sel: ${layers(FRAMED, false)}; }
${PICKED} { background: var(--tone); --i-sel: ${layers(FRAMED)}; }
${WAITING_HOVER} { --i-sel: inset 0 0 0 1.5px color-mix(in oklab, var(--foreground) 22%, transparent); }
${CARD_PICKED} { background: var(--tone) !important; --i-sel: ${layers(FRAMED)}; }
${SWATCH}::before { box-shadow: ${layers(FRAMED, false)}; }
${SWATCH_ON}::before { background: var(--tone); box-shadow: ${layers(FRAMED)}; }
`;

export const SELECTED_CSS: Record<SelectedId, string> = {
  raised: BASE + RAISED,
  lighter: BASE + LIGHTER,
  ink: BASE + INK,
  frame: BASE + FRAME,
};
