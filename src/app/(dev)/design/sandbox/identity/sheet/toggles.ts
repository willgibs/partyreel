import type { TogglesId } from "../model";

import {
  CHECK,
  CHECKED,
  ERROR,
  HOVER,
  LIVE,
  OFF,
  PRESS,
  RADIO,
  SLIDER,
  SLIDER_THUMB,
  SWITCH,
  SWITCH_ON,
  THUMB,
} from "./states";

/**
 * WHAT YOU FLIP OR SET: a switch (an email first, a reminder), a check, a
 * radio (a gate's dot), a slider (a hold, a size). Off, on, under a pointer,
 * held down, held off and in error; the focus mark is the focus trait's.
 *
 * ★ ON READS AT ARM'S LENGTH: in every family on is ink, the house's one
 * strong value (near-black on paper, white in the room), and off is quieter
 * than any action, so a column of settings is read by its inked rows.
 *
 * ★ A SWITCH'S THUMB IS ONE OBJECT: it slides on the house's move curve, and
 * under a finger it widens toward where it will go (a held switch's give),
 * then settles as it lands. The thumb is the switch's own part, not an atom,
 * so it moves by its own `translate`; the switch itself composes.
 *
 * ★ A THUMB'S GREY IS ITS GROUND'S (`--vf-thumb`, `base.ts`), never a `.dark`
 * literal: a frame can hold paper and the room in one document.
 */

/** Laid out once for every family: the moves, and what is held off. */
const BASE = `
${SWITCH} { border: 0; transition: background-color 160ms var(--ease-in-out-strong), box-shadow 120ms linear; }
${THUMB} {
  transition: translate 180ms var(--ease-in-out-strong), width 120ms var(--ease-emphasis), background-color 120ms linear, box-shadow 120ms linear;
}
${SWITCH}${OFF}, ${CHECK}${OFF}, ${RADIO}${OFF}, ${SLIDER}${OFF} { opacity: 0.4; cursor: not-allowed; }
${CHECK}, ${RADIO} { transition: background-color 120ms linear, box-shadow 120ms linear, color 120ms linear; }
[data-slot="slider-range"] { border-radius: 999px; }
${SLIDER_THUMB} { transition: box-shadow 120ms linear, background-color 120ms linear; }
`;

/**
 * A thumb's travel, by its switch: `pad` from either end, so a held thumb
 * widens by `give` toward its far end and lands back.
 */
const travel = (w: number, thumb: number, pad: number, give = 4) => `
${SWITCH} { width: ${w}px; }
${THUMB} { width: ${thumb}px; height: ${thumb}px; translate: ${pad}px 0; }
${SWITCH}${SWITCH_ON} ${THUMB} { translate: ${w - thumb - pad}px 0; }
${SWITCH}${PRESS}${LIVE} ${THUMB} { width: ${thumb + give}px; }
${SWITCH}${SWITCH_ON}${PRESS}${LIVE} ${THUMB} { translate: ${w - thumb - pad - give}px 0; }
`;

/* ── WELLS ───────────────────────────────────────────────────────────── */

/**
 * WELLS THAT FILL WITH INK (keys and wells): a switch is a well its thumb, a
 * small rimmed key, slides along, and the well fills with ink when it is on; a
 * check and a radio are sockets that fill with ink; a slider's track is a well
 * the ink fills along, its thumb a key. The ink keeps the well's shade along
 * its top and a lit lip at its foot, so it reads as poured in, not painted on.
 * A switch's well is a step deeper and ringed a step firmer than a field's, so
 * off still reads as a switch on a white card.
 */
const WELL_TOKENS = `
:root, .surface-paper {
  --vf-switch-well: oklch(0.92 0.003 286); --vf-knob-rim: oklch(0 0 0 / 30%);
  --vf-socket: oklch(1 0 0); --vf-socket-rim: oklch(0 0 0 / 34%);
}
.dark {
  --vf-switch-well: oklch(0.075 0.003 286); --vf-knob-rim: oklch(0 0 0 / 55%);
  --vf-socket: oklch(0.075 0.003 286); --vf-socket-rim: oklch(1 0 0 / 24%);
}
.surface-display {
  --vf-switch-well: color-mix(in oklab, var(--display), oklch(0 0 0) 35%); --vf-knob-rim: oklch(0 0 0 / 50%);
  --vf-socket: color-mix(in oklab, var(--display), oklch(0 0 0) 35%); --vf-socket-rim: oklch(1 0 0 / 26%);
}
`;
const WELLS = `
${WELL_TOKENS}
${travel(42, 18, 3)}
${SWITCH} {
  height: 24px; border-radius: 999px; background: var(--vf-switch-well);
  --i-body: inset 0 0 0 1px var(--input), inset 0 1px 3px var(--vf-well-shade);
}
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { --i-body: inset 0 0 0 1px var(--vf-ring-strong), inset 0 1px 3px var(--vf-well-shade); }
${SWITCH}${SWITCH_ON} {
  background: var(--primary);
  --i-body: inset 0 0 0 1px transparent, inset 0 1px 3px oklch(0 0 0 / 30%), inset 0 -1px 0 oklch(1 0 0 / 16%);
}
${SWITCH}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive), inset 0 1px 3px var(--vf-well-shade); }
/* The thumb is a small key: its rim carries the contrast a white key on a light well could not. */
${THUMB} {
  border-radius: 999px; background: var(--vf-thumb);
  box-shadow: 0 1px 2px oklch(0 0 0 / 28%), 0 0 0 1px var(--vf-knob-rim), inset 0 -1px 0 oklch(0 0 0 / 8%);
}
${SWITCH}${SWITCH_ON} ${THUMB} { background: var(--primary-foreground); }

/* A check and a radio are sockets: white on paper with a firm rim (a well inside a well read as
   nothing on a chosen card), a deep well in the room; each fills with ink. */
${CHECK}, ${RADIO} { width: 18px; height: 18px; background: var(--vf-socket); --i-body: inset 0 0 0 1px var(--vf-socket-rim), inset 0 1px 2px var(--vf-well-shade); }
${CHECK} { border-radius: 5px; }
${RADIO} { border-radius: 999px; }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) {
  --i-body: inset 0 0 0 1px var(--vf-ring-strong), inset 0 1px 2px var(--vf-well-shade);
}
${CHECK}${CHECKED}, ${RADIO}${CHECKED} {
  background: var(--primary); color: var(--primary-foreground);
  --i-body: inset 0 0 0 1px transparent, inset 0 1px 2px oklch(0 0 0 / 30%);
}
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive), inset 0 1px 2px var(--vf-well-shade); }

${SLIDER} { --thumb-size: 20px; }
[data-slot="slider-track"] {
  height: 8px; border-radius: 999px; background: var(--muted);
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="slider-range"] { background: var(--primary); box-shadow: inset 0 1px 2px oklch(0 0 0 / 30%); }
${SLIDER_THUMB} {
  border-radius: 999px; background: var(--vf-thumb);
  --i-body: 0 1px 3px oklch(0 0 0 / 30%), 0 0 0 0.5px oklch(0 0 0 / 10%), inset 0 -1px 0 oklch(0 0 0 / 8%);
}
${SLIDER_THUMB}${HOVER} { --i-body: 0 2px 6px oklch(0 0 0 / 32%), 0 0 0 0.5px oklch(0 0 0 / 12%), inset 0 -1px 0 oklch(0 0 0 / 8%); }
`;

/* ── CIRCLES ─────────────────────────────────────────────────────────── */

/**
 * CIRCLES (all rings): drawn in line. A switch is a pill of a 1.5px ring with
 * an empty socket for a knob, and on the ring darkens and the knob alone is
 * inked; a check and a radio
 * are circles of the same ring, a check filling with ink round its tick, a
 * radio keeping its ring round an ink dot (so the two part at a glance); a
 * slider is a line with an ink line along it and a ringed thumb.
 */
const CIRCLES = `
${travel(44, 18, 4)}
${SWITCH} { height: 26px; border-radius: 999px; background: transparent; --i-body: inset 0 0 0 1.5px var(--vf-ring-strong); }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { --i-body: inset 0 0 0 1.5px var(--foreground); }
${SWITCH}${SWITCH_ON} { background: transparent; --i-body: inset 0 0 0 1.5px var(--foreground); }
${SWITCH}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }
/* Off, the knob is an empty socket in the ring (a grey disc read as held off); on, the ring stays and
   the knob alone is inked: the one family whose on is drawn, not filled. */
${THUMB} { border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) ${THUMB} { box-shadow: inset 0 0 0 1.5px var(--foreground); }
${SWITCH}${SWITCH_ON} ${THUMB} { background: var(--foreground); box-shadow: none; }

${CHECK}, ${RADIO} {
  width: 20px; height: 20px; border-radius: 999px; background: transparent;
  --i-body: inset 0 0 0 1.5px var(--vf-ring-strong);
}
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE} { --i-body: inset 0 0 0 1.5px var(--foreground); }
${CHECK}${CHECKED} { background: var(--primary); color: var(--primary-foreground); --i-body: inset 0 0 0 1.5px var(--primary); }
${RADIO} { color: var(--foreground); }
${RADIO}${CHECKED} { --i-body: inset 0 0 0 1.5px var(--foreground); }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

${SLIDER} { --thumb-size: 22px; }
[data-slot="slider-track"] { height: 2px; border-radius: 999px; background: var(--vf-ring-strong); box-shadow: none; }
[data-slot="slider-range"] { background: var(--foreground); }
${SLIDER_THUMB} { border-radius: 999px; background: var(--card); --i-body: inset 0 0 0 1.5px var(--foreground); }
${SLIDER_THUMB}${HOVER} { --i-body: inset 0 0 0 2.5px var(--foreground); }
`;

/* ── TONE ────────────────────────────────────────────────────────────── */

/**
 * TONE TO INK (ink): every toggle rests as a tone with no line (a radio a
 * ring of tone) and turns to solid ink when it is on. Off keeps a firm step of
 * tone and a lit thumb, so a row of off switches still reads as switches.
 */
const TONE = `
${travel(44, 20, 3)}
${SWITCH} { height: 26px; border-radius: 999px; background: color-mix(in oklab, var(--foreground) 20%, transparent); --i-body: 0 0 #0000; }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { background: color-mix(in oklab, var(--foreground) 26%, transparent); }
${SWITCH}${SWITCH_ON} { background: var(--ink); }
${SWITCH}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${THUMB} { border-radius: 999px; background: var(--vf-thumb); box-shadow: 0 1px 2px oklch(0 0 0 / 24%); }
${SWITCH}${SWITCH_ON} ${THUMB} { background: var(--ink-fg); }

${CHECK} { width: 20px; height: 20px; border-radius: 6px; background: color-mix(in oklab, var(--foreground) 20%, transparent); color: var(--ink-fg); --i-body: 0 0 #0000; }
/* A radio off is a ring of tone, not a disc: a disc of tone read as a filled choice on a well card. */
${RADIO} {
  width: 20px; height: 20px; border-radius: 999px; background: transparent; color: var(--ink-fg);
  --i-body: inset 0 0 0 2px color-mix(in oklab, var(--foreground) 24%, transparent);
}
${CHECK}${HOVER}${LIVE}:not(${CHECKED}) { background: color-mix(in oklab, var(--foreground) 26%, transparent); }
${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: inset 0 0 0 2px color-mix(in oklab, var(--foreground) 34%, transparent); }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} { background: var(--ink); --i-body: 0 0 #0000; }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

${SLIDER} { --thumb-size: 18px; }
[data-slot="slider-track"] { height: 6px; border-radius: 999px; background: var(--tone-up); box-shadow: none; }
[data-slot="slider-range"] { background: var(--ink); }
${SLIDER_THUMB} { border-radius: 999px; background: var(--ink); --i-body: 0 0 0 2px var(--ink-fg), 0 1px 3px 2px oklch(0 0 0 / 18%); }
${SLIDER_THUMB}${HOVER} { --i-body: 0 0 0 2px var(--ink-fg), 0 2px 6px 2px oklch(0 0 0 / 22%); }
`;

export const TOGGLES_CSS: Record<TogglesId, string> = {
  wells: BASE + WELLS,
  circles: BASE + CIRCLES,
  tone: BASE + TONE,
};
