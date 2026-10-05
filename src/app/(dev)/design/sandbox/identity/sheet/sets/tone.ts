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
 * the primary solid ink, and what is chosen the strongest value in its place.
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
 * ★ WHAT IS CHOSEN IS THE STRONGER VALUE: the chosen segment and a chip that
 * is on are ink, a chosen card a firmer tone than the cards beside it, its
 * inner panel the card's own white. A lighter chosen with no edge and no
 * shadow washed out on paper (the first pass: a white card melted into the
 * white card it sat on), so this set gives his lighter lean up for a value
 * that reads at arm's length, and names it in its costs.
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
  --tn-key: color-mix(in oklab, var(--foreground) 10%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 14%, transparent);
}
.dark {
  --tn-key: color-mix(in oklab, var(--foreground) 11%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 15%, transparent);
}
.surface-display {
  --tn-key: color-mix(in oklab, var(--foreground) 13%, transparent);
  --tn-key-up: color-mix(in oklab, var(--foreground) 17%, transparent);
}
`;

const TOKENS = `
:root, .surface-paper {
  --tn-field: color-mix(in oklab, var(--foreground) 5.5%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 7%, transparent);
  --tn-card: color-mix(in oklab, var(--foreground) 4.5%, var(--card));
  --tn-card-up: color-mix(in oklab, var(--foreground) 7%, var(--card));
  --tn-card-on: color-mix(in oklab, var(--foreground) 11%, var(--card));
  --tn-ring: color-mix(in oklab, var(--foreground) 28%, transparent);
  --tn-ring-up: color-mix(in oklab, var(--foreground) 45%, transparent);
  --tn-off: color-mix(in oklab, var(--foreground) 16%, transparent);
  --tn-off-up: color-mix(in oklab, var(--foreground) 22%, transparent);
  --tn-thumb: oklch(1 0 0);
  --tn-band: var(--card);
}
.dark {
  --tn-field: color-mix(in oklab, var(--foreground) 6.5%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 9.5%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 7%, transparent);
  --tn-card: color-mix(in oklab, var(--foreground) 4%, var(--card));
  --tn-card-up: color-mix(in oklab, var(--foreground) 6.5%, var(--card));
  --tn-card-on: color-mix(in oklab, var(--foreground) 11%, var(--card));
  --tn-ring: color-mix(in oklab, var(--foreground) 32%, transparent);
  --tn-ring-up: color-mix(in oklab, var(--foreground) 50%, transparent);
  --tn-off: color-mix(in oklab, var(--foreground) 19%, transparent);
  --tn-off-up: color-mix(in oklab, var(--foreground) 25%, transparent);
  --tn-thumb: oklch(0.93 0.002 286);
  --tn-band: var(--card);
}
.surface-display {
  --tn-field: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tn-field-up: color-mix(in oklab, var(--foreground) 11%, transparent);
  --tn-track: color-mix(in oklab, var(--foreground) 8%, transparent);
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

const QUIET = btn("outline", "secondary");

export const TONE_BUTTONS = `
${btn("default")} { background: var(--ink); color: var(--ink-fg); }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--ink) 86%, var(--background)); }
${QUIET} { background: var(--tn-key); color: var(--foreground); }
${QUIET}${HOVER}${LIVE} { background: var(--tn-key-up); }
${btn("ghost")} { background: transparent; color: var(--foreground); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone-2); }
${btn("destructive")} { background: color-mix(in oklab, var(--destructive) 11%, transparent); color: var(--destructive); }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 17%, transparent); }
${BTN}${ERROR} { --i-body: ${WRONG}; }

${CHIP} { background: var(--tn-key); }
${CHIP}${HOVER}${LIVE} { background: var(--tn-key-up); color: var(--foreground); }
${CHIP}${ON} { background: var(--ink); color: var(--ink-fg); }

/* On a photograph the white Add keeps its surface, flat. */
${btn("on-photo")} { background: oklch(1 0 0); color: oklch(0.13 0.004 286); --i-body: 0 1px 3px 0 oklch(0 0 0 / 24%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }
`;

/* ── what is chosen: the stronger value ──────────────────────────────── */

const PICKED = [`${SEGMENT}${ON}`, `${TAB}${TAB_ON}`].join(", ");

const CHOSEN = `
${SEGMENTS}, ${TABS} { background: var(--tn-track); box-shadow: none; }
${PICKED} { background: var(--ink); color: var(--ink-fg); }
${RADIO_CARD} { background: var(--tn-card) !important; }
${RADIO_CARD}${HOVER} { background: var(--tn-card-up) !important; }
/* A chosen card is a firmer tone; its inner panel is the card's own surface, so it reads as set into it. */
${RADIO_CARD}${CARD_ON} { background: var(--tn-card-on) !important; --background: var(--card); }
`;

/* ── the toggles: a tone that turns to ink ───────────────────────────── */

const TOGGLES = `
${SWITCH} { background: var(--tn-off); }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { background: var(--tn-off-up); }
${SWITCH}${SWITCH_ON} { background: var(--ink); }
${SWITCH}${ERROR} { --i-body: ${WRONG}; }
${THUMB} { background: var(--tn-thumb); box-shadow: none; }
${SWITCH}${SWITCH_ON} ${THUMB} { background: var(--ink-fg); }

/* Off, a ring of tone; on, ink. */
${CHECK}, ${RADIO} { background: transparent; --i-body: inset 0 0 0 2px var(--tn-ring); }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: inset 0 0 0 2px var(--tn-ring-up); }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 0 0 2px transparent; }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: ${WRONG}; }

[data-slot="slider-track"] { background: var(--tn-off); box-shadow: none; }
[data-slot="slider-range"] { background: var(--ink); }
/* The thumb is ink with a band of its ground round it: a value, never a line. */
${SLIDER_THUMB} { background: var(--ink); --i-body: 0 0 0 3px var(--tn-band); }
`;

export const TONE_CSS =
  KEY_TOKENS + TOKENS + FIELD + TONE_BUTTONS + CHOSEN + TOGGLES;
