import type { LoadingId } from "../model";

import { BTN, BUSY, each, FIELDS, ICON, PHOTO } from "./states";

/**
 * WHAT WORKING LOOKS LIKE: a key pressed and waiting on the server (Save,
 * Unlock, Create), and a field checking what was typed (a custom link being
 * looked up). `aria-busy="true"` is the atom contract's hook, what a wired atom
 * sets while it works.
 *
 * ★ NEVER THE VIEWFINDER'S HUNT (Will, r2: the corners "and loading state"
 * read as a dev tool): no mark searches, nothing frames the control. Each
 * option is a light the control itself gives off.
 *
 * ★ STILL, IT STILL READS AS WORKING. Under reduced motion every loop plays
 * once and rests on its base style (globals.css's guard), so each base style
 * is drawn to say "working" on its own: three lights, an arc a quarter round, a
 * track part filled.
 */

const BUSY_BTN = `${BTN}${BUSY}:not([data-variant="link"])`;

/** Laid out once: the loops every option may run. */
const BASE = `
${BTN}${BUSY} { cursor: progress; }
@property --vf-breath { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --vf-spin { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes vf-breathe-dots { from { opacity: 0.4; } to { opacity: 1; } }
@keyframes vf-breathe-num { from { --vf-breath: 0.35; } to { --vf-breath: 1; } }
@keyframes vf-spin { to { --vf-spin: 1turn; } }
@keyframes vf-floor-run { from { background-position: -40% calc(100% - 3px); } to { background-position: 140% calc(100% - 3px); } }
@keyframes vf-fill {
  from { background-size: 0 2px, calc(100% - 20px) 2px; }
  to { background-size: calc(100% - 20px) 2px, calc(100% - 20px) 2px; }
}
@keyframes vf-fill-round { from { background-size: 0 2px, 12px 2px; } to { background-size: 12px 2px, 12px 2px; } }
@keyframes vf-fill-line { from { background-size: 0% 2px; } to { background-size: 100% 2px; } }
`;

/**
 * THREE LIGHTS BREATHING (keys): the key keeps its width and its words give
 * way to three lights in its own ink; a field checking what was typed breathes
 * three small lights at its end, where its answer will be.
 */
const DOTS = `
${BUSY_BTN} { color: transparent; }
${BUSY_BTN} > * { visibility: hidden; }
${BUSY_BTN}::before {
  content: ""; position: absolute; left: 50%; top: 50%; width: 22px; height: 6px; margin: -3px 0 0 -11px; pointer-events: none;
  background:
    radial-gradient(circle closest-side, var(--k-ink, var(--foreground)) 90%, transparent) 0 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink, var(--foreground)) 90%, transparent) 8px 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink, var(--foreground)) 90%, transparent) 16px 0 / 6px 6px no-repeat;
  animation: vf-breathe-dots 700ms ease-in-out infinite alternate;
}
${each(FIELDS, BUSY)} {
  --vf-dot: color-mix(in oklab, var(--foreground) calc(var(--vf-breath) * 70%), transparent);
  background-image:
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent),
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent),
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent);
  background-size: 5px 5px; background-repeat: no-repeat;
  background-position: right 28px center, right 20px center, right 12px center;
  animation: vf-breathe-num 700ms ease-in-out infinite alternate;
}
`;

/**
 * AN ARC RUNNING ROUND (all rings): a quarter of a ring runs round the key
 * a few pixels out, the way a phone's control works, and its words stay; a
 * field checking what was typed runs a light along its floor.
 */
const ARC = `
${BUSY_BTN}::before {
  content: ""; position: absolute; inset: -4px; border-radius: 999px; padding: 1.5px; pointer-events: none;
  background: conic-gradient(from var(--vf-spin), var(--foreground) 0 24%, transparent 24% 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: vf-spin 900ms linear infinite;
}
${BUSY_BTN}::before { border-radius: calc(var(--k-r, 10px) + 4px); }
${PHOTO} ${BUSY_BTN}::before { background: conic-gradient(from var(--vf-spin), oklch(1 0 0) 0 24%, transparent 24% 100%); }
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: 28% 2px; background-repeat: no-repeat; background-position: 12% calc(100% - 3px);
  animation: vf-floor-run 1.1s linear infinite;
}
`;

/**
 * A TRACK FILLING (ink): the key keeps its words and a line of its own ink
 * fills a faint track along its floor from the left, a meter of the work (the
 * same frames status's meters fill in); a field checking what was typed fills
 * a line along its floor.
 */
const TRACK = `
${BUSY_BTN} {
  --vf-track: color-mix(in oklab, currentColor 28%, transparent);
  background-image: linear-gradient(currentColor 0 0), linear-gradient(var(--vf-track) 0 0);
  background-repeat: no-repeat;
  background-size: calc((100% - 20px) * 0.42) 2px, calc(100% - 20px) 2px;
  background-position: 10px calc(100% - 5px), 10px calc(100% - 5px);
  animation: vf-fill 1.3s var(--ease-in-out-strong) infinite;
}
${BTN}${BUSY}:is(${ICON},[data-size="icon-cta"]) {
  background-size: 5px 2px, 12px 2px;
  background-position: calc(50% - 6px) calc(100% - 6px), calc(50% - 6px) calc(100% - 6px);
  animation-name: vf-fill-round;
}
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(var(--foreground) 0 0);
  background-repeat: no-repeat; background-size: 42% 2px; background-position: 0 100%;
  animation: vf-fill-line 1.3s var(--ease-in-out-strong) infinite;
}
`;

export const LOADING_CSS: Record<LoadingId, string> = {
  dots: BASE + DOTS,
  arc: BASE + ARC,
  track: BASE + TRACK,
};
