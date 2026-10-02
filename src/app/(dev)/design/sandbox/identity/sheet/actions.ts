import type { ActionsId } from "../model";

import { lockAt, locked, MARKS } from "./marks";
import {
  BTN,
  btn,
  BUSY,
  CHIP,
  CHIPS,
  ERROR,
  FOCUS,
  HOVER,
  ICON,
  LIVE,
  OFF,
  ON,
  PHOTO,
  PRESS,
  SEGMENT,
  SEGMENTS,
} from "./states";

/**
 * ACTIONS: BUTTONS, ICON BUTTONS, LINKS, CHIPS, SEGMENTED CONTROLS, AND THE
 * HEAD'S ATOMS (the shutter, the white primary and the glass round on a
 * photograph, the code chip). Three builds over the same hooks, each drawing
 * every state: rest, hover, press, focus, off, loading (`aria-busy`) and
 * error (`aria-invalid`).
 *
 * Heights never move: every build keeps production's ladder (32px, the 44px
 * call to action), so a screen keeps its layout and only its atoms change.
 */

/** Laid out once for every build: the head's atoms are stand-ins with no classes of their own. */
const BASE = `
[data-slot="shutter"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 64px; height: 64px; flex: none; padding: 0; border: 0; border-radius: 999px; outline: none;
  cursor: pointer; color: oklch(0.13 0.004 286); background: transparent;
  transition: scale 140ms var(--ease-emphasis), filter 120ms linear;
}
[data-slot="shutter"] svg { position: relative; z-index: 1; width: 22px; height: 22px; }
[data-slot="shutter"]::before { content: ""; position: absolute; inset: 0; border-radius: 999px; pointer-events: none; }
[data-slot="shutter"]${PRESS} { scale: 0.94; }
[data-slot="code-chip"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; flex: none; padding: 0; border: 0; outline: none; cursor: pointer;
  background: oklch(1 0 0); color: oklch(0.13 0.004 286);
}
[data-slot="code-chip"] svg { width: 20px; height: 20px; }
${btn("on-photo", "glass")} {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; outline: none; cursor: pointer; white-space: nowrap;
}
${btn("glass")} { color: oklch(1 0 0); }
@property --vf-spin { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes vf-spin { to { --vf-spin: 1turn; } }
@keyframes vf-scan { from { background-position: -100% 0, 0 0; } to { background-position: 200% 0, 0 0; } }
@keyframes vf-hunt { from { inset: 0; } to { inset: 3px; } }
`;

/* ── KEYS: r1's keys, refined ─────────────────────────────────────────── */

/**
 * KEYS: rounded rectangles (about a fifth of their height) in a machined
 * bevel, a light edge above and a shade below, that travel a pixel when
 * pressed; round dials for every icon; the lock on focus. The house's keys.
 */
const KEYS = `
${BTN} {
  --k-r: 7px; position: relative; border-radius: var(--k-r); border-color: transparent;
  transition: background-color 90ms linear, color 90ms linear, box-shadow 90ms linear, translate 70ms linear;
}
${BTN}[data-size="xs"] { --k-r: 5px; }
${BTN}[data-size="sm"] { --k-r: 6px; }
${BTN}[data-size="lg"] { --k-r: 8px; }
${BTN}[data-size="cta"] { --k-r: 10px; }
${BTN}${ICON} { --k-r: 999px; }
${BTN}::after { ${lockAt("10px")} }
${BTN}${FOCUS} { outline: none; }
${BTN}${FOCUS}::after { ${locked("4px")} }
${BTN}${PRESS}${LIVE} { translate: 0 1px; scale: none; }

${btn("default")} {
  --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo);
}
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 86%, var(--background)); }
${btn("default")}${PRESS}${LIVE} { box-shadow: inset 0 1px 2px oklch(0 0 0 / 38%); }

${btn("secondary", "outline")} {
  --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border);
}
${btn("outline")} { background: var(--card); }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: var(--accent); }
${btn("secondary", "outline")}${PRESS}${LIVE} {
  box-shadow: inset 0 1px 2px var(--vf-key-lo), inset 0 0 0 1px var(--border);
}

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--secondary); box-shadow: inset 0 0 0 1px var(--border); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: var(--secondary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo),
    inset 0 0 0 1px color-mix(in oklab, var(--destructive) 38%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 12%, var(--secondary)); }

${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground); }
${btn("link")}::before { transition: translate 140ms var(--ease-emphasis); }
${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
${btn("link")}${HOVER}${LIVE}::before { translate: 3px 0; }

${BTN}${OFF} { opacity: 0.36; }
${BTN}${BUSY} { cursor: progress; color: transparent; }
${BTN}${BUSY}:not([data-variant="link"])::before {
  content: ""; position: absolute; left: 50%; top: 50%; width: 22px; height: 6px; margin: -3px 0 0 -11px; pointer-events: none;
  background:
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 0 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 8px 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 16px 0 / 6px 6px no-repeat;
  animation: vf-breathe-dots 700ms ease-in-out infinite alternate;
}
@keyframes vf-breathe-dots { from { opacity: 0.45; } to { opacity: 1; } }
${BTN}${ERROR} {
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1.5px var(--destructive);
}

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 10px; border: 0; border-radius: 6px;
  background: var(--secondary); color: var(--muted-foreground);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border);
  transition: background-color 90ms linear, color 90ms linear, translate 70ms linear;
}
${CHIP}${HOVER}${LIVE} { background: var(--accent); color: var(--foreground); }
${CHIP}${PRESS}${LIVE} { translate: 0 1px; scale: none; }
${CHIP}${ON} {
  background: var(--primary); color: var(--primary-foreground);
  box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo);
}
${CHIP}::after { ${lockAt("9px")} }
${CHIP}${FOCUS} { outline: none; box-shadow: inset 0 0 0 1px var(--border); }
${CHIP}${ON}${FOCUS} { box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo); }
${CHIP}${FOCUS}::after { ${locked("4px")} }
${CHIP}${OFF} { opacity: 0.36; }

${SEGMENTS} {
  gap: 2px; padding: 3px; border-radius: 10px; background: var(--muted);
  box-shadow: inset 0 1px 2px var(--vf-well-shade), inset 0 0 0 1px var(--border);
}
${SEGMENT} {
  position: relative; height: 30px; min-width: 32px; padding: 0 10px; border: 0; border-radius: 7px; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); }
${SEGMENT}${ON} {
  background: var(--card); color: var(--foreground);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border), var(--shadow-lift);
}
${SEGMENT}::after { ${lockAt("8px")} }
${SEGMENT}${FOCUS} { outline: none; }
${SEGMENT}${FOCUS}::after { ${locked("3px")} }
${SEGMENT}${OFF} { opacity: 0.36; }

/* on a photograph: a white key, a smoked dial, the lock in white */
${btn("on-photo")} {
  --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink);
  box-shadow: inset 0 -1px 0 oklch(0 0 0 / 20%), 0 1px 3px oklch(0 0 0 / 30%);
}
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }
${btn("glass")} {
  --k-ink: oklch(1 0 0); background: oklch(0.1 0 0 / 42%);
  -webkit-backdrop-filter: blur(12px) saturate(1.3); backdrop-filter: blur(12px) saturate(1.3);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 24%), inset 0 0 0 1px oklch(1 0 0 / 16%);
}
${btn("glass")}${HOVER}${LIVE} { background: oklch(0.1 0 0 / 58%); }
${PHOTO} ${BTN}::after, ${PHOTO} [data-slot="shutter"]::after { --m-c: oklch(1 0 0); }

/* the shutter: a domed white release inside its own ring */
[data-slot="shutter"] {
  background: radial-gradient(closest-side, oklch(1 0 0) 0, oklch(0.94 0 0) calc(100% - 9px), oklch(0.84 0 0) calc(100% - 7px), transparent calc(100% - 6.5px));
  box-shadow: inset 0 0 0 3px oklch(1 0 0 / 55%);
}
[data-slot="shutter"]${HOVER} { filter: brightness(1.04); }
[data-slot="shutter"]::after { ${lockAt("10px")} --m-c: oklch(1 0 0); }
[data-slot="shutter"]${FOCUS}::after { ${locked("4px")} }
[data-slot="shutter"][data-state="sending"] { box-shadow: none; }
[data-slot="shutter"][data-state="sending"]::before {
  background: conic-gradient(oklch(1 0 0) calc(var(--progress, 0) * 1turn), oklch(1 0 0 / 24%) 0);
  -webkit-mask: radial-gradient(closest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
  mask: radial-gradient(closest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
}
[data-slot="shutter"][data-state="done"] { box-shadow: inset 0 0 0 3px oklch(1 0 0); }

[data-slot="code-chip"] {
  border-radius: 9px;
  box-shadow: inset 0 -1px 0 oklch(0 0 0 / 14%), 0 0 0 1px var(--border), var(--shadow-lift);
}
[data-slot="code-chip"]::after { ${lockAt("9px")} }
[data-slot="code-chip"]${FOCUS}::after { ${locked("4px")} }
[data-slot="code-chip"]${PRESS} { translate: 0 1px; }
`;

/* ── RINGS: a phone camera's round controls ───────────────────────────── */

/**
 * RINGS: pills and circles, the controls of the camera everybody holds. The
 * primary is solid ink; an outline is a ring you see through; a secondary a
 * tonal pill; focus is a ring that closes in from six pixels to two (marks
 * cannot sit on a rounded field, so the whole build locks with a ring);
 * loading is an arc that runs round the control.
 */
const RINGS = `
${BTN} {
  position: relative; border-radius: 999px; border-color: transparent;
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear,
    scale 140ms var(--ease-emphasis), outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${BTN}${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
${BTN}${PRESS}${LIVE} { scale: 0.96; }

${btn("default")} { --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink); box-shadow: none; }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 84%, var(--background)); }

${btn("outline")} {
  --k-ink: var(--foreground); background: transparent; color: var(--k-ink);
  box-shadow: inset 0 0 0 1.5px var(--vf-ring);
}
${btn("outline")}${HOVER}${LIVE} { background: var(--vf-wash); box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
${btn("outline")}${PRESS}${LIVE} { background: var(--vf-wash-strong); }

${btn("secondary")} { --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink); box-shadow: none; }
${btn("secondary")}${HOVER}${LIVE} { background: var(--accent); }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--vf-wash); }
${btn("ghost")}${PRESS}${LIVE} { background: var(--vf-wash-strong); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: transparent; color: var(--k-ink);
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--destructive) 55%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 9%, transparent); }

${btn("link")} {
  height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground);
  text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 5px;
  text-decoration-color: var(--vf-ring); border-radius: 4px;
}
${btn("link")}${HOVER}${LIVE} { text-decoration-color: var(--foreground); }

${BTN}${OFF} { opacity: 0.35; }
${BTN}${BUSY} { cursor: progress; }
${BTN}${BUSY}:not([data-variant="link"])::before {
  content: ""; position: absolute; inset: -4px; border-radius: 999px; padding: 1.5px; pointer-events: none;
  background: conic-gradient(from var(--vf-spin), var(--foreground) 0 24%, transparent 24% 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: vf-spin 900ms linear infinite;
}
${PHOTO} ${BTN}${BUSY}::before { background: conic-gradient(from var(--vf-spin), oklch(1 0 0) 0 24%, transparent 24% 100%); }
${BTN}${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 12px; border: 0; border-radius: 999px;
  background: transparent; color: var(--muted-foreground); box-shadow: inset 0 0 0 1.5px var(--vf-ring);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: background-color 120ms linear, color 120ms linear, scale 140ms var(--ease-emphasis), outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${CHIP}${HOVER}${LIVE} { background: var(--vf-wash); color: var(--foreground); }
${CHIP}${PRESS}${LIVE} { scale: 0.96; }
${CHIP}${ON} { background: var(--primary); color: var(--primary-foreground); box-shadow: none; }
${CHIP}${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
${CHIP}${OFF} { opacity: 0.35; }

${SEGMENTS} { gap: 0; padding: 3px; border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring); }
${SEGMENT} {
  position: relative; height: 30px; min-width: 34px; padding: 0 10px; border: 0; border-radius: 999px; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  outline: 1.5px solid transparent; outline-offset: 5px;
  transition: background-color 140ms var(--ease-in-out-strong), color 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); }
${SEGMENT}${ON} { background: var(--primary); color: var(--primary-foreground); }
${SEGMENT}${FOCUS} { outline-color: var(--foreground); outline-offset: 2px; }
${SEGMENT}${OFF} { opacity: 0.35; }

${btn("on-photo")} { --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink); box-shadow: 0 1px 3px oklch(0 0 0 / 28%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.92 0 0); }
${btn("glass")} {
  --k-ink: oklch(1 0 0); background: oklch(0.1 0 0 / 32%);
  -webkit-backdrop-filter: blur(14px) saturate(1.3); backdrop-filter: blur(14px) saturate(1.3);
  box-shadow: inset 0 0 0 1.5px oklch(1 0 0 / 45%);
}
${btn("glass")}${HOVER}${LIVE} { background: oklch(0.1 0 0 / 48%); box-shadow: inset 0 0 0 1.5px oklch(1 0 0 / 75%); }
${PHOTO} ${BTN}${FOCUS} { outline-color: oklch(1 0 0); }

/* the shutter: a phone's, a white disc inside a white ring with a gap between */
[data-slot="shutter"] {
  background: radial-gradient(closest-side, oklch(1 0 0) calc(100% - 8px), transparent calc(100% - 7.5px));
  box-shadow: inset 0 0 0 4px oklch(1 0 0);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: scale 140ms var(--ease-emphasis), outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="shutter"]${FOCUS} { outline-color: oklch(1 0 0); outline-offset: 3px; }
[data-slot="shutter"][data-state="sending"] { box-shadow: none; }
[data-slot="shutter"][data-state="sending"]::before {
  background: conic-gradient(oklch(1 0 0) calc(var(--progress, 0) * 1turn), oklch(1 0 0 / 28%) 0);
  -webkit-mask: radial-gradient(closest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
  mask: radial-gradient(closest-side, transparent calc(100% - 4px), #000 calc(100% - 4px));
}

[data-slot="code-chip"] {
  border-radius: 12px; box-shadow: var(--shadow-lift);
  outline: 1.5px solid var(--vf-ring); outline-offset: 3px;
  transition: outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear, scale 140ms var(--ease-emphasis);
}
[data-slot="code-chip"]${HOVER} { outline-color: var(--vf-ring-strong); }
[data-slot="code-chip"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2px; }
[data-slot="code-chip"]${PRESS} { scale: 0.95; }
`;

/* ── CORNERS: the viewfinder's own frame ──────────────────────────────── */

/**
 * A FRAME COUNTER IN ONE GRADIENT: 24 ticks round the shutter, each lit once
 * the upload's progress passes it. A tick's alpha is a clamp on `--progress`,
 * so the ring is pure CSS over the contract's one variable, with no element
 * of its own (the component that wires it owes nothing but the hook).
 */
const FRAME_COUNTER = Array.from({ length: 24 }, (_, i) => {
  const a = i * 15;
  return `oklch(1 0 0 / calc(0.32 + 0.68 * clamp(0, (var(--progress, 0) * 24 - ${i}) * 100, 1))) ${a}deg ${a + 4}deg, transparent ${a + 4}deg ${a + 15}deg`;
}).join(", ");

/**
 * CORNERS: the primary is a crisp ink plate; every other action is drawn as
 * four corner marks, the frame a camera puts round what it focuses on, that
 * close in when pressed and thicken when focused. A chosen chip is a plate, a
 * chosen segment wears the frame, and loading hunts the way autofocus does.
 */
const CORNERS = `
${BTN} {
  position: relative; border-radius: 3px; border-color: transparent;
  transition: background-color 90ms linear, color 90ms linear, translate 70ms linear;
}
${BTN}${ICON} { border-radius: 3px; }
${BTN}:not([data-variant="link"])::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  --m-c: transparent; --m-a: 6px; --m-w: 1.5px; ${MARKS}
  transition: inset 120ms var(--ease-emphasis);
}
${BTN}::after { ${lockAt("10px")} --m-w: 2px; --m-a: 8px; }
${BTN}${FOCUS} { outline: none; }
${BTN}${FOCUS}::after { ${locked("5px")} }
${BTN}${PRESS}${LIVE} { translate: 0 1px; scale: none; }

${btn("default")} { --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink); box-shadow: none; }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 85%, var(--background)); }

${btn("secondary", "outline")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("secondary", "outline")}::before { --m-c: var(--vf-ring-strong); }
${btn("secondary")}::before { --m-a: 4px; }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: var(--vf-wash); }
${btn("secondary", "outline")}${HOVER}${LIVE}::before { --m-c: var(--foreground); }
${btn("secondary", "outline", "ghost", "destructive")}${PRESS}${LIVE}::before { inset: 2px; }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--vf-wash); }
${btn("ghost")}${HOVER}${LIVE}::before { --m-c: var(--vf-ring-strong); }

${btn("destructive")} { --k-ink: var(--destructive); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("destructive")}::before { --m-c: color-mix(in oklab, var(--destructive) 70%, transparent); }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 8%, transparent); }

${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground); }
${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }

${BTN}${OFF} { opacity: 0.35; }
${BTN}${BUSY} { cursor: progress; }
${BTN}${BUSY}:not([data-variant="link"])::before { --m-c: var(--k-ink); animation: vf-hunt 650ms ease-in-out infinite alternate; }
${BTN}${ERROR} { background-color: color-mix(in oklab, var(--destructive) 8%, transparent); }
${btn("default")}${ERROR} { background-color: var(--primary); }
${BTN}${ERROR}:not([data-variant="link"])::before { --m-c: var(--destructive); }
${btn("default")}${ERROR}::before { inset: -4px; }

${CHIPS} { gap: 4px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 10px; border: 0; border-radius: 2px;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  --m-c: var(--vf-ring); --m-a: 5px; --m-w: 1.5px; ${MARKS}
  transition: color 90ms linear, translate 70ms linear;
}
${CHIP}${HOVER}${LIVE} { color: var(--foreground); --m-c: var(--foreground); }
${CHIP}${PRESS}${LIVE} { translate: 0 1px; scale: none; }
${CHIP}${ON} { background-color: var(--primary); color: var(--primary-foreground); --m-c: transparent; }
${CHIP}::after { ${lockAt("9px")} --m-w: 2px; }
${CHIP}${FOCUS} { outline: none; }
${CHIP}${FOCUS}::after { ${locked("4px")} }
${CHIP}${OFF} { opacity: 0.35; }

${SEGMENTS} { gap: 2px; padding: 0; border-radius: 0; background: transparent; box-shadow: none; }
${SEGMENT} {
  position: relative; height: 30px; min-width: 34px; padding: 0 10px; border: 0; border-radius: 0; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  --m-c: transparent; --m-a: 7px; --m-w: 1.5px; ${MARKS}
  transition: color 90ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); --m-c: var(--vf-ring); }
${SEGMENT}${ON} { color: var(--foreground); --m-c: var(--foreground); background-color: var(--vf-wash); }
${SEGMENT}${FOCUS} { outline: none; --m-w: 2px; --m-c: var(--foreground); }
${SEGMENT}${OFF} { opacity: 0.35; }

${btn("on-photo")} { --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink); box-shadow: 0 1px 3px oklch(0 0 0 / 30%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.92 0 0); }
${btn("glass")} {
  --k-ink: oklch(1 0 0); border-radius: 3px; background: oklch(0.1 0 0 / 36%);
  -webkit-backdrop-filter: blur(12px) saturate(1.3); backdrop-filter: blur(12px) saturate(1.3);
}
${btn("glass")}::before { --m-c: oklch(1 0 0 / 80%); }
${btn("glass")}${HOVER}${LIVE} { background: oklch(0.1 0 0 / 52%); }
${PHOTO} ${BTN}::after, ${PHOTO} [data-slot="shutter"]::after { --m-c: oklch(1 0 0); }

/* the shutter: a white disc inside a counter of 24 frames, the lit ones its progress */
[data-slot="shutter"] { background: radial-gradient(closest-side, oklch(1 0 0) calc(100% - 9px), transparent calc(100% - 8.5px)); }
[data-slot="shutter"][data-state="done"] { --progress: 1; }
[data-slot="shutter"]::before {
  background: conic-gradient(${FRAME_COUNTER});
  -webkit-mask: radial-gradient(closest-side, transparent calc(100% - 5px), #000 calc(100% - 5px));
  mask: radial-gradient(closest-side, transparent calc(100% - 5px), #000 calc(100% - 5px));
}
[data-slot="shutter"]::after { ${lockAt("10px")} --m-c: oklch(1 0 0); --m-w: 2px; }
[data-slot="shutter"]${FOCUS}::after { ${locked("3px")} }

[data-slot="code-chip"] { border-radius: 2px; box-shadow: var(--shadow-lift); }
[data-slot="code-chip"]::before {
  content: ""; position: absolute; inset: -5px; pointer-events: none;
  --m-c: var(--vf-ring-strong); --m-a: 7px; --m-w: 1.5px; ${MARKS}
  transition: inset 140ms var(--ease-emphasis);
}
[data-slot="code-chip"]${HOVER}::before { --m-c: var(--foreground); }
[data-slot="code-chip"]${FOCUS} { outline: none; }
[data-slot="code-chip"]${FOCUS}::before { --m-c: var(--foreground); --m-w: 2px; inset: -4px; }
[data-slot="code-chip"]${PRESS}::before { inset: -2px; }
`;

/**
 * ★ REDUCED MOTION IS THE GLOBAL GUARD'S (globals.css): every loop here runs
 * once at 0.01ms and rests on its base style, which is drawn to read as
 * loading on its own (a scan bar, an arc, a pair of marks), never as nothing.
 */
export const ACTIONS_CSS: Record<ActionsId, string> = {
  keys: BASE + KEYS,
  rings: BASE + RINGS,
  corners: BASE + CORNERS,
};
