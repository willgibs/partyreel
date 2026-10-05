import type { LoadingId } from "../model";

import { BTN, BUSY, each, FIELDS, ICON } from "./states";

/**
 * WHAT WORKING LOOKS LIKE: a key pressed and waiting on the server (Save,
 * Unlock, Create), and a field checking what was typed (a custom link being
 * looked up). `aria-busy="true"` is the atom contract's hook, what a wired atom
 * sets while it works.
 *
 * ★ NEVER THE VIEWFINDER'S HUNT (Will, r2: the corners "and loading state"
 * read as a dev tool): no mark searches, nothing frames or circles the
 * control. Every option is drawn INSIDE the key it works in, so nothing it
 * does reaches the lane a focus mark stands in round the key.
 *
 * ★ THE WORDS STAY (the round's direction: "anything taking longer should
 * provide clear state feedback"): a wait that hides what is working reads as
 * broken on party wifi, so every option keeps the key's words, and a wired key
 * says what it is doing in them ("Saving", "Unlocking").
 *
 * ★ STILL, IT STILL READS AS WORKING. Under reduced motion every loop plays
 * once and rests on its base style (globals.css's guard), so each base style
 * is drawn to say "working" on its own: three lights, an arc a third round, a
 * segment part way along its track.
 */

const BUSY_BTN = `${BTN}${BUSY}:not([data-variant="link"])`;
const ROUND = `:is(${ICON},[data-size="icon-cta"])`;

/** Laid out once: the loops every option may run. */
const BASE = `
${BTN}${BUSY} { cursor: progress; }
@property --vf-breath { syntax: "<number>"; inherits: false; initial-value: 1; }
@property --vf-spin { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes vf-breathe-dots { from { opacity: 0.35; } to { opacity: 1; } }
@keyframes vf-breathe-num { from { --vf-breath: 0.35; } to { --vf-breath: 1; } }
@keyframes vf-spin { to { --vf-spin: 1turn; } }
@keyframes vf-slide { from { background-position: -43% 100%, 0 100%; } to { background-position: 143% 100%, 0 100%; } }
@keyframes vf-slide-floor { from { background-position: -43% 100%; } to { background-position: 143% 100%; } }
@keyframes vf-fill-round { from { background-size: 0 2px, 12px 2px; } to { background-size: 12px 2px, 12px 2px; } }
`;

/** Three lights in a row, in an ink, `size` each with `gap` between. */
const lights = (ink: string, size: number, gap: number) =>
  [0, 1, 2]
    .map(
      (i) =>
        `radial-gradient(circle closest-side, ${ink} 90%, transparent) ${i * (size + gap)}px 50% / ${size}px ${size}px no-repeat`,
    )
    .join(", ");

/**
 * THREE LIGHTS BREATHING (keys): its words stay and three small lights breathe
 * after them in the key's own ink, a key saying "Save..." while it saves (a
 * round key, too small for its words and its lights, gives its glyph to them);
 * a field checking what was typed breathes three lights at its end, where its
 * answer will be.
 */
const DOTS = `
${BUSY_BTN}::before {
  content: ""; order: 2; flex: none; width: 16px; height: 4px; pointer-events: none;
  background: ${lights("var(--k-ink, var(--foreground))", 4, 2)};
  animation: vf-breathe-dots 700ms ease-in-out infinite alternate;
}
${BTN}${BUSY}${ROUND} > * { display: none; }
${each(FIELDS, BUSY)} {
  --vf-dot: color-mix(in oklab, var(--foreground) calc(var(--vf-breath) * 70%), transparent);
  background-image:
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent),
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent),
    radial-gradient(circle closest-side, var(--vf-dot) 90%, transparent);
  background-size: 4px 4px; background-repeat: no-repeat;
  background-position: right 26px center, right 20px center, right 14px center;
  animation: vf-breathe-num 700ms ease-in-out infinite alternate;
}
`;

/**
 * AN ARC RUNNING ROUND (all rings): a small arc turns inside the key before
 * its words, which dim a little while it works, as a phone's own control
 * does; a round key's glyph gives way to it. A field checking what was typed
 * runs a light along its floor.
 */
const ARC = `
${BUSY_BTN} { color: color-mix(in oklab, var(--k-ink, var(--foreground)) 70%, transparent); }
${BUSY_BTN}::before {
  content: ""; order: -1; flex: none; width: 14px; height: 14px; border-radius: 999px; padding: 1.75px; pointer-events: none;
  background: conic-gradient(from var(--vf-spin), var(--k-ink, var(--foreground)) 0 32%, transparent 32% 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: vf-spin 900ms linear infinite;
}
${BTN}${BUSY}${ROUND} > * { display: none; }
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: 30% 2px; background-repeat: no-repeat; background-position: 35% 100%;
  animation: vf-slide-floor 1.1s linear infinite;
}
`;

/**
 * A TRACK FILLING (ink): the key keeps its words and a segment of its own ink
 * runs along a faint track at its foot, edge to edge and clipped by its
 * corners, the meters' line worn by a key; it slides rather than fills, so it
 * never claims a progress the server is not sending. A round key's track is
 * short and centred under its glyph. A field checking what was typed runs the
 * same segment along its floor.
 */
const TRACK = `
${BUSY_BTN} {
  --vf-track: color-mix(in oklab, currentColor 26%, transparent);
  background-image: linear-gradient(currentColor 0 0), linear-gradient(var(--vf-track) 0 0);
  background-repeat: no-repeat;
  background-size: 30% 3px, 100% 3px;
  background-position: 35% 100%, 0 100%;
  animation: vf-slide 1.3s var(--ease-in-out-strong) infinite;
}
${BTN}${BUSY}${ROUND} {
  background-size: 5px 2px, 12px 2px;
  background-position: calc(50% - 6px) calc(100% - 6px), calc(50% - 6px) calc(100% - 6px);
  animation: vf-fill-round 1.3s var(--ease-in-out-strong) infinite;
}
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(var(--foreground) 0 0);
  background-repeat: no-repeat; background-size: 30% 2px; background-position: 35% 100%;
  animation: vf-slide-floor 1.3s var(--ease-in-out-strong) infinite;
}
`;

export const LOADING_CSS: Record<LoadingId, string> = {
  dots: BASE + DOTS,
  arc: BASE + ARC,
  track: BASE + TRACK,
};
