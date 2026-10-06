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
 * INK AND TONE (value): no line, no shadow and no light on any control.
 * Every part is a value of its ground's own ink, and the stronger the value,
 * the more it acts: a field is the faintest tone, a quiet key a firmer one,
 * the primary solid ink, and what is chosen a firmer tone than its neighbours.
 * The calmest page, as flat as a print, the way a phone's own settings are,
 * and the one set that leaves every light on a screen to Afterglow.
 *
 * ★ A FIELD NEVER TWINS A KEY (r4's cost: "a quiet tone can read as a field
 * when it sits beside one"): three things part them, and each is shared
 * geometry the set only leans on. Value: a field is always a full tone step
 * under the quietest key. Shape: a field is the 8px surface, a key rides the
 * action ladder at 0.4 of its height. Type: a field's words sit left in the
 * body's weight, a key's are centred in its own.
 *
 * ★ WHAT IS CHOSEN IS A FIRMER TONE, AND THE PRIMARY ALONE IS INK: the chosen
 * segment, tab, chip and card are each a step firmer than their neighbours,
 * so a choice reads pressed in, as a latched key does. A lighter chosen with
 * no edge and no shadow washed out on paper (the first pass: a white card
 * melted into the white card it sat on), and an ink chosen weighed as much as
 * the page's one ink key (the fresh-eyes pass: the ink "Private" beside Set
 * password), so this set gives his lighter lean up for a value that reads at
 * arm's length, and names it in its costs.
 *
 * ★ OFF IS A RING OF TONE, NEVER A DISC: a check and a radio that are off are
 * a ring of the ground's ink (a value drawn round, not a line), since a grey
 * disc read as chosen, or as held off.
 *
 * ★ AN ERROR IS THE ONE LINE IN THE SET: a field or a key that is wrong takes
 * the destructive colour's ring, since a value alone cannot say "wrong".
 */

/**
 * THE KEYS' TWO TONES, on every ground (exported with the button family:
 * the house's mix takes these very keys, `house.ts`). Always a full tone step
 * over a tone field.
 */
export const KEY_TOKENS = `
:root, .surface-paper {
  --tn-key: color-mix(in oklab, var(--foreground) 11%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 14%, transparent);
  --tn-key-soft: color-mix(in oklab, var(--foreground) 5.5%, transparent);
  --tn-key-soft-up: color-mix(in oklab, var(--foreground) 9%, transparent);
  --tn-danger: color-mix(in oklab, var(--destructive), oklch(0 0 0) 20%);
}
.dark {
  --tn-key: color-mix(in oklab, var(--foreground) 12%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 15%, transparent);
  --tn-key-soft: color-mix(in oklab, var(--foreground) 6.5%, transparent);
  --tn-key-soft-up: color-mix(in oklab, var(--foreground) 10%, transparent);
  --tn-danger: var(--destructive);
}
.surface-display {
  --tn-key: color-mix(in oklab, var(--foreground) 13%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 16%, transparent);
  --tn-key-soft: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tn-key-soft-up: color-mix(in oklab, var(--foreground) 12%, transparent);
  --tn-danger: var(--destructive);
}
`;

const TOKENS = `
:root, .surface-paper {
  --tn-field: color-mix(in oklab, var(--foreground) 4.5%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 7%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 6%, transparent);
  --tn-chosen: color-mix(in oklab, var(--foreground) 16%, var(--card));
  --tn-press: oklch(0 0 0 / 12%); --tn-seam: oklch(0.14 0.004 286 / 12%);
  --tn-card: color-mix(in oklab, var(--foreground) 4.5%, var(--card));
  --tn-card-up: color-mix(in oklab, var(--foreground) 7%, var(--card));
  --tn-card-on: color-mix(in oklab, var(--foreground) 11%, var(--card));
  --tn-ring: color-mix(in oklab, var(--foreground) 46%, transparent);
  --tn-ring-up: color-mix(in oklab, var(--foreground) 62%, transparent);
  --tn-off: color-mix(in oklab, var(--foreground) 16%, transparent);
  --tn-off-up: color-mix(in oklab, var(--foreground) 22%, transparent);
  --tn-thumb: oklch(1 0 0);
  --tn-band: var(--card);
}
.dark {
  --tn-field: color-mix(in oklab, var(--foreground) 6%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 9%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 6%, transparent);
  --tn-chosen: color-mix(in oklab, var(--foreground) 20%, var(--card));
  --tn-press: oklch(0 0 0 / 45%); --tn-seam: oklch(0 0 0 / 35%);
  --tn-card: color-mix(in oklab, var(--foreground) 4%, var(--card));
  --tn-card-up: color-mix(in oklab, var(--foreground) 6.5%, var(--card));
  --tn-card-on: color-mix(in oklab, var(--foreground) 11%, var(--card));
  --tn-ring: color-mix(in oklab, var(--foreground) 38%, transparent);
  --tn-ring-up: color-mix(in oklab, var(--foreground) 55%, transparent);
  --tn-off: color-mix(in oklab, var(--foreground) 19%, transparent);
  --tn-off-up: color-mix(in oklab, var(--foreground) 25%, transparent);
  --tn-thumb: oklch(0.96 0.002 286);
  --tn-band: var(--card);
}
.surface-display {
  --tn-field: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 11%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tn-chosen: color-mix(in oklab, var(--foreground) 22%, var(--display));
  --tn-press: oklch(0 0 0 / 40%); --tn-seam: oklch(0 0 0 / 35%);
  --tn-card: color-mix(in oklab, var(--foreground) 5%, var(--display));
  --tn-card-up: color-mix(in oklab, var(--foreground) 8%, var(--display));
  --tn-card-on: color-mix(in oklab, var(--foreground) 13%, var(--display));
  --tn-ring: color-mix(in oklab, var(--foreground) 34%, transparent);
  --tn-ring-up: color-mix(in oklab, var(--foreground) 52%, transparent);
  --tn-off: color-mix(in oklab, var(--foreground) 21%, transparent);
  --tn-off-up: color-mix(in oklab, var(--foreground) 27%, transparent);
  --tn-thumb: oklch(0.93 0.002 286);
  --tn-band: var(--display);
}
`;

const WRONG = "inset 0 0 0 1.5px var(--destructive)";

/* ── a field: the faintest tone ──────────────────────────────────────── */

const FIELD = `
${FIELDS} { background-color: var(--tn-field); caret-color: currentColor; }
${each(FIELDS, HOVER + LIVE)} { background-color: var(--tn-field-up); }
${each(FIELDS, FOCUS)} { background-color: var(--tn-field-up); }
${each(FIELDS, ERROR)} { --i-body: ${WRONG}; }
`;

/* ── the button family: one ink key, everything else a tone ──────────── */

const QUIET = btn("secondary");

export const TONE_BUTTONS = `
${btn("default")} { background: var(--ink); color: var(--ink-fg); }
${btn("default")}${HOVER}${LIVE} { background: var(--ink-up); }
${QUIET} { background: var(--tn-key); color: var(--foreground); }
${QUIET}${HOVER}${LIVE} { background: var(--tn-key-up); }
/* The outline tier is the softer tone, so the family keeps four steps: ink, a tone, a softer tone, clear. */
${btn("outline")} { background: var(--tn-key-soft); color: var(--foreground); }
${btn("outline")}${HOVER}${LIVE} { background: var(--tn-key-soft-up); }
${btn("ghost")} { background: transparent; color: var(--foreground); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone-2); }
/* Its words a step deeper than the red on paper, so they read on their own tint (4.0:1 was short). */
${btn("destructive")} { background: color-mix(in oklab, var(--destructive) 11%, transparent); color: var(--tn-danger); }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 17%, transparent); }
${BTN}${ERROR} { --i-body: ${WRONG}; }
/* Off, a key recedes: clear, its words quiet (an ink key at 40% read as a heavy slab, and a faint tone
   read as an empty field beside one). */
${BTN}${OFF}:not(${btn("ghost", "link")}) {
  opacity: 1; background: transparent; color: var(--faint); --i-body: inset 0 0 0 1px var(--tone-2);
}

${CHIP} { background: var(--tn-key); }
${CHIP}${HOVER}${LIVE} { background: var(--tn-key-up); color: var(--foreground); }

/* On a photograph the white Add keeps its surface, flat. */
${btn("on-photo")} { background: oklch(1 0 0); color: oklch(0.13 0.004 286); --i-body: 0 1px 3px 0 oklch(0 0 0 / 24%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }
`;

/* ── what is chosen: the stronger value ──────────────────────────────── */

const PICKED = [`${SEGMENT}${ON}`, `${TAB}${TAB_ON}`].join(", ");

const CHOSEN = `
${SEGMENTS}, ${TABS} { background: var(--tn-track); box-shadow: none; }
/* Pressed in: a firmer tone with a shade inside its top, so chosen reads as pressed and never as a hover. */
${PICKED}, ${CHIP}${ON} { background: var(--tn-chosen); color: var(--foreground); --i-sel: inset 0 1px 2px 0 var(--tn-press); }
${CHIP}:not(${ON})${HOVER}${LIVE} { background: color-mix(in oklab, var(--foreground) 13%, transparent); }
${RADIO_CARD} { background: var(--tn-card) !important; }
${RADIO_CARD}${HOVER} { background: var(--tn-card-up) !important; }
/* A chosen card is a firmer tone; its inner panel is the card's own surface, so it reads as set into it. */
${RADIO_CARD}${CARD_ON} { background: var(--tn-card-on) !important; --background: var(--card); --i-sel: inset 0 1px 3px 0 var(--tn-press); }
`;

/* ── the toggles: a tone that turns to ink ───────────────────────────── */

const TOGGLES = `
${SWITCH} { background: var(--tn-off); }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { background: var(--tn-off-up); }
${SWITCH}${SWITCH_ON} { background: var(--ink); }
${SWITCH}${ERROR} { --i-body: ${WRONG}; }
/* One thumb on both grounds and both states: white, its seam keeping it whole on an inked track. */
${THUMB} { background: var(--tn-thumb); box-shadow: 0 0 0 1px var(--tn-seam); }

/* Off, a ring of tone; on, ink. */
${CHECK}, ${RADIO} { background: transparent; --i-body: inset 0 0 0 2px var(--tn-ring); }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: inset 0 0 0 2px var(--tn-ring-up); }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 0 0 2px transparent; }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: ${WRONG}; }

[data-slot="slider-track"] { background: var(--tn-off); box-shadow: none; }
[data-slot="slider-range"] { background: var(--ink); }
${SLIDER_THUMB} { background: var(--tn-thumb); --i-body: 0 0 0 1px var(--tn-seam); }
`;

export const TONE_CSS =
  KEY_TOKENS + TOKENS + FIELD + TONE_BUTTONS + CHOSEN + TOGGLES;
