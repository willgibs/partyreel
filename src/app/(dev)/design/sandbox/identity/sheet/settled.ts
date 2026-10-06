import {
  BTN,
  btn,
  BUSY,
  CHECK,
  CHIP,
  CODE_CHIP,
  ERROR,
  FIELDS,
  FOCUS,
  ICON,
  LIVE,
  PHOTO,
  PRESS,
  QUICK,
  RADIO,
  SEGMENT,
  SHUTTER,
  SLIDER_THUMB,
  SWITCH,
  TAB,
  TOAST,
} from "./states";

/**
 * HIS R4 PICKS, WORN BY EVERY SET (Will, desk 3, 2026-10-05: focus=halo,
 * press=shrink, edge=floating), drawn from r4's own option code while
 * `identity-wiring` takes them into production. They are the same in every
 * frame, so two sets differ by their own constructions alone.
 *
 * ★ EACH WRITES ITS OWN LAYER (`states.ts`): the halo `--i-focus`, the press
 * `--i-press-s`, so they compose with whatever body a set draws.
 */

/* ── focus: the halo ─────────────────────────────────────────────────── */

/** Every atom a keyboard reaches. */
const REACHED = [
  BTN,
  CHIP,
  SEGMENT,
  ...FIELDS.split(","),
  SWITCH,
  CHECK,
  RADIO,
  SLIDER_THUMB,
  TAB,
  SHUTTER,
  CODE_CHIP,
];
const at = (state: string) => REACHED.map((s) => `${s}${state}`).join(", ");
const FOCUSED = at(FOCUS);
const ERRED = at(ERROR + FOCUS);
const ARRIVING = at(`${FOCUS}:not(${BUSY})`);
const GROUPED = [CHIP, SEGMENT, TAB].map((s) => `${s}${FOCUS}`).join(", ");

/** A length as the mark arrives: `from` in its first frame, `to` once settled (`--fo-t` 0 to 1). */
const settle = (to: string, from: string) =>
  `calc(${to} + (1 - var(--fo-t)) * (${from} - ${to}))`;
const GAP = "var(--fo-gap, var(--background))";
const LINE = "color-mix(in oklab, var(--foreground) 85%, transparent)";

/**
 * A HALO: a fine line of ink stands 2px off the control over a clear band of
 * its ground, in a soft aura (grey on paper, light in the room, white on a
 * photograph), gathering in as it arrives (140ms on the house's emphasis
 * curve, whole in its first frame). r4's `focus.halo`, unchanged.
 */
const halo = (line: string, off = "2px") => {
  const gap = settle(off, `calc(${off} + 1.5px)`);
  return `0 0 0 ${gap} ${GAP}, 0 0 0 calc(${gap} + 1.5px) ${line},
    0 -1px ${settle("12px", "22px")} calc(${gap} + 1.5px) var(--fo-bloom)`;
};

const HALO = `
@property --fo-t { syntax: "<number>"; inherits: false; initial-value: 1; }
@keyframes fo-arrive { from { --fo-t: 0; } }
:root, .surface-paper { --fo-gap: oklch(1 0 0); --fo-bloom: oklch(0.14 0.004 286 / 10%); }
.dark, .surface-display, .surface-ink { --fo-gap: initial; }
.dark, .surface-ink { --fo-bloom: oklch(1 0 0 / 18%); }
.surface-display { --fo-bloom: oklch(1 0 0 / 15%); }
${PHOTO} { --fo-gap: oklch(0.13 0.004 286); --fo-veil: oklch(0 0 0 / 28%); --fo-bloom: oklch(1 0 0 / 26%); }
${FOCUSED} { outline: none; --i-focus: ${halo(LINE)}; }
/* In a track, the same halo with its clear band at 1px, so its line stays inside the track's 3px padding
   rather than crossing the track's own edge (the fresh-eyes pass: the focused tab's line stood past its
   track). Over its neighbours, it draws on top. */
${GROUPED} { z-index: 1; --i-focus: ${halo(LINE, "1px")}; }
${ERRED} { --i-focus: ${halo("var(--destructive)")}; }
${SHUTTER}${FOCUS} {
  outline: 2px solid ${LINE}; outline-offset: ${settle("7px", "8.5px")};
  --i-focus: 0 0 0 7px var(--fo-veil, transparent), 0 -1px ${settle("12px", "22px")} 9px var(--fo-bloom);
}
${ARRIVING} { animation: fo-arrive 140ms var(--ease-emphasis); }
`;

/* ── a press: it shrinks ─────────────────────────────────────────────── */

const PRESSABLE = [BTN, CHIP, SEGMENT, TAB, SHUTTER, CODE_CHIP];
const held = (...sels: string[]) =>
  sels.map((s) => `${s}${PRESS}${LIVE}`).join(", ");

/**
 * SHRINK: the control gives under the finger by about two pixels at every
 * size, from a chip to the 44px key, the way a phone's own controls do; it
 * lands in the frame the finger does and lets go at the house's speed. r4's
 * `press.shrink`, unchanged.
 */
const SHRINK = `
${held(...PRESSABLE)} { --i-press-s: 0.96; transition-duration: 0ms; }
${held(`${BTN}:is([data-size="xs"],[data-size="sm"])`, CHIP, SEGMENT, TAB)} { --i-press-s: 0.95; }
${held(`${BTN}[data-size="cta"]`)} { --i-press-s: 0.98; }
${held(`${BTN}:is(${ICON},[data-size="icon-cta"])`, CODE_CHIP)} { --i-press-s: 0.92; }
${held(SHUTTER)} { --i-press-s: 0.94; }
`;

/* ── the edge: everything that floats ────────────────────────────────── */

const FALLOFF = `radial-gradient(135% 100% at 50% 0%,
    color-mix(in oklab, var(--vf-lit) 100%, transparent) 0%,
    color-mix(in oklab, var(--vf-lit) 44%, transparent) 36%,
    color-mix(in oklab, var(--vf-lit) 13%, transparent) 66%,
    transparent 92%)`;
const DOWN = `radial-gradient(100% 100% at 0% 0%,
    color-mix(in oklab, var(--vf-lit) 100%, transparent) 0%,
    color-mix(in oklab, var(--vf-lit) 44%, transparent) 36%,
    color-mix(in oklab, var(--vf-lit) 13%, transparent) 66%,
    transparent 92%)`;

/**
 * The one pixel the light is drawn on, the bright edge's own mask over a
 * clear border (a border, never a padding: a padding is rounded to the pixel
 * grid and drew nothing under half zoom). Exported: the lit-edges set and
 * the house's floating thumbs draw the same light on an atom (`sets/`).
 */
export const LIGHT_ON = (widths: string, light: string = FALLOFF) => `
  content: ""; position: absolute; inset: var(--vf-lit-at, 0); border-radius: inherit;
  border: solid transparent; border-width: ${widths}; pointer-events: none; z-index: 1;
  background: ${light} border-box;
  -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  -webkit-mask-clip: padding-box, border-box; mask-clip: padding-box, border-box;
  -webkit-mask-composite: xor; mask-composite: exclude;
`;
const ALL_ROUND = LIGHT_ON("1px");
const ALONG_TOP = LIGHT_ON("1px 0 0");
const DOWN_LEFT = LIGHT_ON("0 0 0 1px", DOWN);

const parts = (list: string): string[] =>
  list.split(/,(?![^(]*\))/).map((s) => s.trim());
const each = (list: string, suffix: string): string =>
  parts(list)
    .map((s) => `${s}${suffix}`)
    .join(", ");
const STATIC = ":not(.absolute,.fixed,.sticky)";
const inRoom = (list: string): string =>
  parts(list)
    .map((s) => `:is(.dark ${s}):not(.surface-paper ${s})`)
    .join(", ");
const onPaper = (list: string, suffix = ""): string =>
  parts(list)
    .map((s) => `${s}:not(:is(.dark *):not(.surface-paper *))${suffix}`)
    .join(", ");
const ROOM_LIGHT = "color-mix(in oklab, var(--foreground) 46%, transparent)";
const POP = `${QUICK}, [data-slot="tooltip-content"]`;
const FREE_WORK = [
  '[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"])',
  '[data-slot="dialog-content"][data-shape]',
].join(", ");
const RISEN = [
  '[data-slot="popup-content"][data-shape="sheet"]',
  '[data-slot="sheet-content"][data-side="bottom"]',
].join(", ");
const STANDING = [
  '[data-slot="popup-content"][data-shape="panel"]',
  '[data-slot="sheet-content"][data-side="right"]',
].join(", ");
const RESPONSIVE = '[data-slot="sheet-content"][data-side="responsive"]';
const TOAST_LIT = `${TOAST}[data-styled="true"]:not([data-swiping="true"]):not([data-removed="true"])`;

/**
 * FLOATING: every pop-out takes the bright edge in place of its hairline, on
 * paper too (a lip one pixel inside the display's edge there); in the room
 * every dialog, sheet and panel takes it on its free edge; cards stay flat.
 * r4's `edge.floating`, reading production's own `--display-light` (graphite
 * and its light are wired now).
 */
const FLOATING = `
${POP} { --vf-lit: var(--display-light); --vf-lit-r: var(--radius-float); }
${each(POP, STATIC)} { position: relative; }
[data-slot="tooltip-content"] { --vf-lit-r: calc(var(--radius-float) - 6px); }
${each(POP, ":not(:focus-visible)")} { --tw-ring-shadow: 0 0 #0000; }
${each(POP, "::after")} { ${ALL_ROUND} }
${TOAST}[data-styled="true"] { --vf-lit: var(--display-light); --vf-lit-at: -1px; border-color: transparent; }
${TOAST_LIT}::before { ${ALL_ROUND} }
${onPaper(POP, "::after")} { inset: 1px; border-radius: calc(var(--vf-lit-r) - 1px); }
${onPaper(TOAST_LIT, "::before")} { --vf-lit-at: 0px; border-radius: calc(var(--border-radius, var(--radius-float)) - 1px); }
${inRoom(`${FREE_WORK}, ${RISEN}, ${STANDING}, ${RESPONSIVE}`)} { --vf-lit: ${ROOM_LIGHT}; }
${each(inRoom(FREE_WORK), "::after")} { ${ALL_ROUND} }
${each(inRoom(RISEN), "::after")} { ${ALONG_TOP} }
${each(inRoom(STANDING), "::after")} { ${DOWN_LEFT} }
@media (width < 40rem) { ${each(inRoom(RESPONSIVE), "::after")} { ${ALONG_TOP} } }
@media (width >= 40rem) { ${each(inRoom(RESPONSIVE), "::after")} { ${DOWN_LEFT} } }
`;

/** Crystal's own lip and hairline stay the glass round's body in every set. */
const GLASS = `
${btn("glass")} {
  --i-body: inset 0 1px 0 0 rgb(255 255 255 / var(--glass-lip)), inset 0 0 0 1px rgb(255 255 255 / var(--glass-hairline));
}
`;

/** The three, as one sheet. */
export const SETTLED_CSS = HALO + SHRINK + FLOATING + GLASS;
