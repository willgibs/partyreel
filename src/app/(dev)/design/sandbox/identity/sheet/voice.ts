import type { VoiceId } from "../model";

import { BTN, TOAST } from "./states";

/**
 * THE VOICE: HOW LOUDLY THE CAMERA'S LANGUAGE SPEAKS, AS A LAYER OF VARIABLES.
 *
 * ★ A PURE LAYER, SO NOTHING BINDS. Every atom option reads these and never a
 * literal: a label's case, size, weight and tracking, a readout's (what a
 * camera prints: a count, the live mark, a time), how figures are set, the
 * words on a button or a row, what a tooltip or a toast says, a link's mark,
 * and the meter's build. So every atom option renders in every voice, and the
 * voice can be picked first and worn by everything picked after it.
 *
 * Three roles carry it (`ROLES_CSS`): a LABEL names a thing (a field, a tab, a
 * chip, a menu's heading, a link), a READOUT is a value a camera would print,
 * and a WORD is what a press does (a button, a row). A label that holds a
 * sentence (a switch row's name and line) speaks as words, since a sentence in
 * spaced capitals is the instrument voice's whole cost.
 *
 * ★ DECLARED ON EVERY GROUND'S ROOT, NOT ON `:root` ALONE: a label's ink is a
 * ground's token (`--muted-foreground`), and a `var()` inside a custom property
 * resolves where it is declared, so a voice declared once would carry paper's
 * grey into the room. Each ground recomputes it. A meter's colours are the
 * status atoms', set on the meter itself.
 */
const ROOTS = ":root, .surface-paper, .dark";

/** The meter as tape: thin ticks, the measured part in thick ones (r1's). */
const TAPE = `
  --vf-meter-h: 10px; --vf-meter-r: 0px; --vf-meter-mask: none;
  --vf-meter-tick: 1px; --vf-meter-fill-tick: 3px; --vf-meter-pitch: 6px;
`;
/** The meter as frames: twelve frames that fill, as a roll fills. */
const FRAMES = `
  --vf-meter-h: 6px; --vf-meter-r: 0px;
  --vf-meter-mask: repeating-linear-gradient(90deg, #000 0 calc(100% / 12 - 3px), transparent calc(100% / 12 - 3px) calc(100% / 12));
  --vf-meter-tick: 100%; --vf-meter-fill-tick: 100%; --vf-meter-pitch: 100%;
`;
/** The meter as one lit bar. */
const BAR = `
  --vf-meter-h: 4px; --vf-meter-r: 999px; --vf-meter-mask: none;
  --vf-meter-tick: 100%; --vf-meter-fill-tick: 100%; --vf-meter-pitch: 100%;
`;

export const VOICE_CSS: Record<VoiceId, string> = {
  /* r1's voice as drawn: every label, tab, chip, badge and count in small
     spaced capitals, zeros slashed, links arrowed, meters as tape. */
  instrument: `${ROOTS} {
    --vf-label-case: uppercase; --vf-label-size: 10.5px; --vf-label-weight: 600; --vf-label-track: 0.14em; --vf-label-face: var(--font-sans); --vf-label-ink: var(--muted-foreground);
    --vf-readout-case: uppercase; --vf-readout-size: 10.5px; --vf-readout-weight: 600; --vf-readout-track: 0.14em; --vf-readout-face: var(--font-sans);
    --vf-count-size: 11px; --vf-figures: tabular-nums slashed-zero;
    --vf-word-size: 13px; --vf-word-weight: 600; --vf-word-track: 0.005em;
    --vf-say-case: uppercase; --vf-say-size: 10.5px; --vf-say-weight: 600; --vf-say-track: 0.13em;
    --vf-link-mark: "→";
    ${TAPE}
  }`,
  /* The camera in a hand: words in sentence case at reading weight, spaced
     capitals only where a camera prints them (counts, live, time), plain
     figures, meters as frames. */
  camera: `${ROOTS} {
    --vf-label-case: none; --vf-label-size: 13px; --vf-label-weight: 500; --vf-label-track: -0.003em; --vf-label-face: var(--font-sans); --vf-label-ink: currentColor;
    --vf-readout-case: uppercase; --vf-readout-size: 10.5px; --vf-readout-weight: 600; --vf-readout-track: 0.1em; --vf-readout-face: var(--font-sans);
    --vf-count-size: 11.5px; --vf-figures: tabular-nums;
    --vf-word-size: 14px; --vf-word-weight: 500; --vf-word-track: -0.003em;
    --vf-say-case: none; --vf-say-size: 13px; --vf-say-weight: 500; --vf-say-track: 0em;
    --vf-link-mark: "";
    ${FRAMES}
  }`,
  /* The top screen: no capitals anywhere, words quiet in sentence case, every
     count and status set bold in the loud face, meters one lit bar. */
  display: `${ROOTS} {
    --vf-label-case: none; --vf-label-size: 13px; --vf-label-weight: 500; --vf-label-track: -0.005em; --vf-label-face: var(--font-sans); --vf-label-ink: currentColor;
    --vf-readout-case: none; --vf-readout-size: 13px; --vf-readout-weight: 700; --vf-readout-track: -0.01em; --vf-readout-face: var(--font-display, var(--font-sans));
    --vf-count-size: 17px; --vf-figures: tabular-nums;
    --vf-word-size: 14px; --vf-word-weight: 600; --vf-word-track: -0.006em;
    --vf-say-case: none; --vf-say-size: 13px; --vf-say-weight: 500; --vf-say-track: 0em;
    --vf-link-mark: "";
    ${BAR}
  }`,
};

const LABEL = `
  text-transform: var(--vf-label-case); font-size: var(--vf-label-size); font-weight: var(--vf-label-weight);
  letter-spacing: var(--vf-label-track); font-family: var(--vf-label-face); line-height: 1.25;
`;
const READOUT = `
  text-transform: var(--vf-readout-case); font-size: var(--vf-readout-size); font-weight: var(--vf-readout-weight);
  letter-spacing: var(--vf-readout-track); font-family: var(--vf-readout-face); font-variant-numeric: var(--vf-figures);
`;
const SAY = `
  text-transform: var(--vf-say-case); font-size: var(--vf-say-size); font-weight: var(--vf-say-weight);
  letter-spacing: var(--vf-say-track);
`;

/**
 * THE ROLES: which atom speaks which part of the voice. Shared by every
 * option, because the voice is a layer: an option draws the shape and the
 * light, the voice draws the words.
 */
export const ROLES_CSS = `
/* a label: the name of a thing */
[data-slot="label"]:not(.flex-col), [data-slot="form-label"],
[data-slot="dropdown-menu-label"], [data-slot="select-label"],
[data-slot="tabs-trigger"], [data-slot="toggle-group-item"],
[data-slot="responsive-menu-rows"] h2, [data-slot="radio-card"] [data-slot="radio-card-title"],
[data-role="label"] { ${LABEL} }
/* a field's name takes the voice's ink (the instrument's capitals sit a step back) */
[data-slot="label"]:not(.flex-col), [data-slot="form-label"], [data-role="label"] { color: var(--vf-label-ink); }

/* a readout: what a camera prints */
[data-slot="badge"], [data-slot="avatar-group-count"], [data-slot="glyph-count"] [data-n],
[data-role="readout"] { ${READOUT} }
[data-slot="glyph-count"] [data-n] { font-size: var(--vf-count-size); }
[data-role="readout"][data-size="count"] { font-size: var(--vf-count-size); }

/* a word: what a press does */
${BTN}:not([data-variant="link"]) {
  font-size: var(--vf-word-size); font-weight: var(--vf-word-weight); letter-spacing: var(--vf-word-track);
}
${BTN}:is([data-size="xs"],[data-size="sm"]) { font-size: calc(var(--vf-word-size) - 1.5px); }
${BTN}[data-size="cta"] { font-size: calc(var(--vf-word-size) + 1.5px); }

/* a link speaks as a label, with the voice's own mark */
${BTN}[data-variant="link"] { ${LABEL} }
${BTN}[data-variant="link"]::before {
  content: var(--vf-link-mark); order: 2; letter-spacing: 0; text-transform: none;
}

/* what a tooltip or a toast says */
[data-slot="tooltip-content"], ${TOAST} [data-title] { ${SAY} }
${TOAST} [data-button] { ${LABEL} }

/* the meter: its build is the voice's, its colours the status atoms' */
[data-slot="progress"] {
  height: var(--vf-meter-h); border-radius: var(--vf-meter-r);
  -webkit-mask: var(--vf-meter-mask); mask: var(--vf-meter-mask);
  background-color: transparent;
  background-image: repeating-linear-gradient(90deg, var(--vf-meter-track-c, var(--input)) 0 var(--vf-meter-tick), transparent var(--vf-meter-tick) var(--vf-meter-pitch));
}
[data-slot="progress-indicator"] {
  background-color: transparent; border-radius: var(--vf-meter-r);
  background-image: repeating-linear-gradient(90deg, var(--vf-meter-fill-c, var(--foreground)) 0 var(--vf-meter-fill-tick), transparent var(--vf-meter-fill-tick) var(--vf-meter-pitch));
}
`;
