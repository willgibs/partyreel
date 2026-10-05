import type { ButtonId } from "../model";

import {
  BTN,
  btn,
  CHIP,
  CHIPS,
  CODE_CHIP,
  ERROR,
  HOVER,
  ICON,
  LIVE,
  OFF,
  TOAST,
} from "./states";

/** A toast's one action (an Undo): sonner's, styled by production as a small pill; each build gives it its shape. */
const TOAST_ACTION = `${TOAST}[data-styled="true"] [data-button]`;

/**
 * WHAT YOU PRESS: every button (production's six variants and the head's two,
 * `on-photo` and `glass`), a chip at rest, and the head's own atoms' shape. Its
 * body at rest, under a pointer, held off and in error; the press, the working
 * state, the focus mark and a chip that is chosen are their own traits, drawn
 * over this.
 *
 * ★ HEIGHTS NEVER MOVE (production's ladder: the 32px button, the 44px call to
 * action), so the three differ by their drawing alone.
 *
 * ★ THE HEAD'S ATOMS KEEP THEIR OWN SURFACES. The shutter's light, the code
 * chip's white, a glass round's Crystal and the white primary are
 * `event-header`'s, wired; a build gives them its corner and nothing else.
 */

const BOX = `
${BTN} {
  border-color: transparent;
  transition: background-color 110ms linear, color 110ms linear, box-shadow 110ms linear, translate 70ms linear, scale 140ms var(--ease-emphasis);
}
/* Positioned for the marks a trait draws on it (a working state, a focus mark), unless it is placed
   already: an unlayered position would outrank a popup's absolute close and drop it into the flow. */
${BTN}:not(.absolute,.fixed,.sticky) { position: relative; }
${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; --i-body: 0 0 #0000; color: var(--foreground); }
${BTN}${OFF} { opacity: 0.38; }
${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 11px; border: 0;
  transition: background-color 110ms linear, color 110ms linear, box-shadow 110ms linear, translate 70ms linear, scale 140ms var(--ease-emphasis);
}
${CHIP}${OFF} { opacity: 0.38; }
${btn("glass")} { --k-ink: oklch(1 0 0); }
/* ★ CRYSTAL'S OWN EDGES, KEPT IN EVERY BUILD. A glass round wears its lip and its hairline as the
   glass utility's box-shadow, which the composition (base.ts) outranks on every atom, so they are its
   body here, read from the same two tokens: the light edge's every reach only turns the tokens. */
${btn("glass")} {
  --i-body: inset 0 1px 0 0 rgb(255 255 255 / var(--glass-lip)), inset 0 0 0 1px rgb(255 255 255 / var(--glass-hairline));
}
`;

/**
 * A KEY (keys and wells): what you press stands up out of the body in a
 * machined bevel, a light edge above and a shade below; the primary is ink
 * with the bevel caught in it.
 */
const KEY_TOKENS = `
:root, .surface-paper {
  --vf-key-face: oklch(0.993 0.001 286); --vf-key-drop: oklch(0 0 0 / 14%); --vf-key-ramp: oklch(1 0 0 / 11%);
}
.dark { --vf-key-face: oklch(0.225 0.004 286); --vf-key-drop: oklch(0 0 0 / 55%); --vf-key-ramp: oklch(1 0 0 / 0%); }
.surface-display {
  --vf-key-face: color-mix(in oklab, var(--display-step), oklch(1 0 0) 5%); --vf-key-drop: oklch(0 0 0 / 45%);
  --vf-key-ramp: oklch(1 0 0 / 0%);
}
`;

/** A key's machining: the light along its top, the shade along its foot, the pixel it stands proud by. */
const BEVEL = (hi: string, lo: string) =>
  `inset 0 1px 0 ${hi}, inset 0 -1px 0 ${lo}, 0 1px 0 0 var(--vf-key-drop)`;

const KEY = `
${KEY_TOKENS}
${BTN} { --k-r: 7px; border-radius: var(--k-r); }
${BTN}[data-size="xs"] { --k-r: 5px; }
${BTN}[data-size="sm"] { --k-r: 6px; }
${BTN}[data-size="lg"] { --k-r: 8px; }
${BTN}[data-size="cta"] { --k-r: 10px; }
${BTN}${ICON}, ${BTN}[data-size="icon-cta"] { --k-r: 999px; }

/* The primary is ink, its face caught by the light from above (a ramp on paper's near-black, where a
   one-pixel line alone was lost) and standing a pixel proud of the card. */
${btn("default")} {
  --k-ink: var(--primary-foreground); background-color: var(--primary); color: var(--k-ink);
  background-image: linear-gradient(var(--vf-key-ramp), transparent 75%);
  --i-body: ${BEVEL("var(--vf-ink-hi)", "var(--vf-ink-lo)")};
}
${btn("default")}${HOVER}${LIVE} { background-color: color-mix(in oklab, var(--primary) 86%, var(--background)); }

/* A quiet key is a face a step up from what it stands on: white on paper, a lit grey in the room
   (an outline there read as a ring, not a key). */
${btn("secondary", "outline")} {
  --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink);
  --i-body: ${BEVEL("var(--vf-key-hi)", "var(--vf-key-lo)")}, inset 0 0 0 1px var(--border);
}
${btn("outline")} { background: var(--vf-key-face); }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: var(--accent); }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--secondary); --i-body: inset 0 0 0 1px var(--border); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: var(--secondary); color: var(--k-ink);
  --i-body: ${BEVEL("var(--vf-key-hi)", "var(--vf-key-lo)")},
    inset 0 0 0 1px color-mix(in oklab, var(--destructive) 38%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 12%, var(--secondary)); }

${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
${BTN}${ERROR} {
  --i-body: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1.5px var(--destructive);
}

${CHIP} {
  border-radius: 6px; background: var(--secondary); color: var(--muted-foreground);
  --i-body: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border);
}
${CHIP}${HOVER}${LIVE} { background: var(--accent); color: var(--foreground); }

/* on a photograph: the white primary a key, the glass round a dial */
${btn("on-photo")} {
  --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink);
  --i-body: inset 0 -1px 0 oklch(0 0 0 / 20%), 0 1px 3px oklch(0 0 0 / 30%);
}
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }

${CODE_CHIP} { border-radius: 9px; --i-body: inset 0 -1px 0 oklch(0 0 0 / 14%), 0 0 0 1px var(--border), var(--shadow-lift); }
/* a toast's Undo: a small key in the screen's own ink */
${TOAST_ACTION} { border-radius: 6px !important; box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo); }
`;

/**
 * A PILL (all rings): drawn in line, a phone camera's round controls: the
 * primary solid ink, an outline a ring you see the page through, a secondary
 * a tonal pill.
 */
const PILL = `
${BTN} { --k-r: 999px; border-radius: var(--k-r); }

${btn("default")} { --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink); }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 84%, var(--background)); }

${btn("outline")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); --i-body: inset 0 0 0 1.5px var(--vf-ring); }
${btn("outline")}${HOVER}${LIVE} { background: var(--vf-wash); --i-body: inset 0 0 0 1.5px var(--vf-ring-strong); }

${btn("secondary")} { --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink); }
${btn("secondary")}${HOVER}${LIVE} { background: var(--accent); }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--vf-wash); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: transparent; color: var(--k-ink);
  --i-body: inset 0 0 0 1.5px color-mix(in oklab, var(--destructive) 55%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 9%, transparent); }

${btn("link")} {
  text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 5px;
  text-decoration-color: var(--vf-ring); border-radius: 4px;
}
${btn("link")}${HOVER}${LIVE} { text-decoration-color: var(--foreground); }
${BTN}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

${CHIP} { border-radius: 999px; padding: 0 12px; background: transparent; color: var(--muted-foreground); --i-body: inset 0 0 0 1.5px var(--vf-ring); }
${CHIP}${HOVER}${LIVE} { background: var(--vf-wash); color: var(--foreground); }

/* on a photograph: the white primary a pill */
${btn("on-photo")} { --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink); --i-body: 0 1px 3px oklch(0 0 0 / 28%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.92 0 0); }

${CODE_CHIP} { border-radius: 12px; --i-body: var(--shadow-lift), 0 0 0 1.5px var(--vf-ring); }
/* a toast's Undo: a small pill, as built */
${TOAST_ACTION} { border-radius: 999px !important; }
`;

/**
 * INK (ink): every action but the primary rests as a quiet tone of its
 * ground with no line and no bevel, so a page of them reads as calm as its
 * type; the primary is the house's ink, near-black on paper and white in the
 * room.
 */
const INK_TONES = `
:root, .surface-paper { --vf-tone-key: 14%; --vf-tone-key-up: 19%; }
.dark, .surface-display { --vf-tone-key: 13%; --vf-tone-key-up: 18%; }
`;
const KEY_TONE = (p: string) =>
  `color-mix(in oklab, var(--foreground) var(${p}), transparent)`;

const INK = `
${BTN} { --k-r: 10px; border-radius: var(--k-r); }
${BTN}[data-size="xs"] { --k-r: 7px; }
${BTN}[data-size="sm"] { --k-r: 8px; }
${BTN}[data-size="lg"] { --k-r: 11px; }
${BTN}[data-size="cta"] { --k-r: 13px; }
${BTN}:is(${ICON},[data-size="icon-cta"]) { --k-r: 999px; }

/* The primary is flat ink: no bevel, no light; ink is the house's one strong value, not a key. */
${btn("default")} { --k-ink: var(--ink-fg); background: var(--ink); color: var(--ink-fg); }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--ink) 86%, var(--background)); }

/* A quiet action is a firm tone, always a step over a tone field (field.ts), so the two never twin. */
${INK_TONES}
${btn("secondary", "outline")} { --k-ink: var(--foreground); background: ${KEY_TONE("--vf-tone-key")}; color: var(--foreground); }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: ${KEY_TONE("--vf-tone-key-up")}; }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--foreground); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone); }

${btn("destructive")} { --k-ink: var(--destructive); background: color-mix(in oklab, var(--destructive) 11%, transparent); color: var(--destructive); }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 17%, transparent); }

${btn("link")} { border-radius: 4px; }
${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 4px; }
${BTN}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

${CHIP} { border-radius: 8px; background: var(--tone); color: var(--muted-foreground); }
${CHIP}${HOVER}${LIVE} { background: var(--tone-up); color: var(--foreground); }

/* on a photograph the ink is white already: a white plate */
${btn("on-photo")} { --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink); --i-body: 0 1px 3px oklch(0 0 0 / 28%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }

${CODE_CHIP} { border-radius: 11px; --i-body: var(--shadow-lift); }
/* a toast's Undo: a small plate of the screen's ink */
${TOAST_ACTION} { border-radius: 8px !important; box-shadow: none; }
`;

export const BUTTON_CSS: Record<ButtonId, string> = {
  key: BOX + KEY,
  pill: BOX + PILL,
  ink: BOX + INK,
};
