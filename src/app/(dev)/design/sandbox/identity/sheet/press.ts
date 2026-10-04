import type { PressId } from "../model";

import {
  BTN,
  btn,
  CHIP,
  CODE_CHIP,
  ICON,
  LIVE,
  PRESS,
  SEGMENT,
  SHUTTER,
  TAB,
} from "./states";

/**
 * WHAT A PRESS FEELS LIKE, under the finger, on every action: a button (the
 * six variants, the white key and the glass rounds on a photograph), a chip, a
 * segment, a tab, the shutter and the code chip. Its own variables only
 * (`--i-press`, `--i-press-y`, `--i-press-s`), so a press composes with the
 * body it presses (a key's bevel, a pill's ring, an ink key) and the focus
 * mark round it.
 *
 * ★ IMMEDIATE (the round's direction: "everything should feel as
 * immediate/responsive/snappy"): a press lands in the frame the finger does
 * (`transition-duration: 0ms` on the pressed state) and lets go at the house's
 * speed (the rest state's own transitions, under 200ms). A transition runs on
 * the state it arrives at, so the two are written apart.
 *
 * ★ A PRESS LETS GO SMOOTHLY: its shadow layers rest as their transparent
 * twins (the same shape), since a box-shadow list only interpolates against a
 * list of its own shape; a press written against nothing would snap back.
 *
 * ★ THE PRESS STANDS UNDER THE FOCUS AND THE CHOICE: the composition draws it
 * below `--i-sel` and `--i-focus`, so a key held from the keyboard keeps its
 * mark and a chosen key keeps its shape (its own top light leaves as it goes
 * down: `selected.ts`).
 */

/** Every action a finger presses. */
const PRESSABLE = [BTN, CHIP, SEGMENT, TAB, SHUTTER, CODE_CHIP];
/** The same, held down (and not off or working: a held key that cannot act stays still). */
const held = (...sels: string[]) =>
  sels.map((s) => `${s}${PRESS}${LIVE}`).join(", ");
const HELD = held(...PRESSABLE);
/** What carries a body: every action but a link, which is its words alone. */
const BODIED = PRESSABLE.map((s) =>
  s === BTN ? `${BTN}:not([data-variant="link"])` : s,
);

/** One shadow layer: `[inset?, geometry, colour]`. */
type Layer = readonly [inset: boolean, geometry: string, colour: string];
const layers = (ls: readonly Layer[], on = true): string =>
  ls
    .map(
      ([inset, g, c]) =>
        `${inset ? "inset " : ""}${g} ${on ? c : "transparent"}`,
    )
    .join(", ");

/* ── SINK ────────────────────────────────────────────────────────────── */

/**
 * The key in its hole: the rim's shade along its top edge (over its bevel's
 * light), the shade falling a little way down its face, and its face dimmed
 * a step, as a key sunk below the light is.
 */
const SUNK: readonly Layer[] = [
  [true, "0 1px 0 0", "var(--sink-edge)"],
  [true, "0 1px 3px 0", "var(--sink-shade)"],
  [true, "0 0 0 999px", "var(--sink-dim)"],
];

/**
 * How deep a hole reads, on each ground and on each face: a light key on
 * paper takes a soft grey; a key in the room, or on the display, a deep one;
 * ink's key (near-black on paper) loses the light along its top; a white key
 * (ink in the room, the white key on a photograph, the code chip) greys.
 */
const SINK_TOKENS = `
:root, .surface-paper {
  --sink-edge: oklch(0 0 0 / 13%); --sink-shade: oklch(0 0 0 / 12%); --sink-dim: oklch(0 0 0 / 4.5%);
  --sink-ink-edge: oklch(0 0 0 / 75%); --sink-ink-shade: oklch(0 0 0 / 60%); --sink-ink-dim: transparent;
}
.dark, .surface-display {
  --sink-edge: oklch(0 0 0 / 55%); --sink-shade: oklch(0 0 0 / 50%); --sink-dim: oklch(0 0 0 / 22%);
  --sink-ink-edge: oklch(0 0 0 / 26%); --sink-ink-shade: oklch(0 0 0 / 30%); --sink-ink-dim: oklch(0 0 0 / 9%);
}
`;

/**
 * SINK (keys): the key travels a pixel into the page, the rim's shade falls
 * across its top and its face dims a step, as a real key does; it rises back
 * at the house's speed.
 */
const SINK = `
${SINK_TOKENS}
${BODIED.join(", ")} { --i-press: ${layers(SUNK, false)}; }
${HELD} { --i-press-y: 1px; transition-duration: 0ms; }
${held(...BODIED)} { --i-press: ${layers(SUNK)}; }
${held(btn("default"))} {
  --sink-edge: var(--sink-ink-edge); --sink-shade: var(--sink-ink-shade); --sink-dim: var(--sink-ink-dim);
}
${held(btn("on-photo"), CODE_CHIP)} {
  --sink-edge: oklch(0 0 0 / 26%); --sink-shade: oklch(0 0 0 / 30%); --sink-dim: oklch(0 0 0 / 9%);
}
${held(btn("glass"))} {
  --sink-edge: oklch(0 0 0 / 50%); --sink-shade: oklch(0 0 0 / 40%); --sink-dim: oklch(0 0 0 / 22%);
}
`;

/* ── SHRINK ──────────────────────────────────────────────────────────── */

/**
 * SHRINK (all rings): the control gives a little under the finger, the way a
 * phone's own controls do, by about the same two pixels at every size: a
 * small round gives more, the full-width call to action less, so the give is
 * felt alike on a chip and on the 44px key.
 */
const SHRINK = `
${HELD} { --i-press-s: 0.96; transition-duration: 0ms; }
${held(`${BTN}:is([data-size="xs"],[data-size="sm"])`, CHIP, SEGMENT, TAB)} { --i-press-s: 0.95; }
${held(`${BTN}[data-size="cta"]`)} { --i-press-s: 0.98; }
${held(`${BTN}:is(${ICON},[data-size="icon-cta"])`, CODE_CHIP)} { --i-press-s: 0.92; }
${held(SHUTTER)} { --i-press-s: 0.94; }
`;

/* ── BLINK ───────────────────────────────────────────────────────────── */

/**
 * BLINK (ink): the control snaps to ink under the finger and fades back as it
 * lifts, the way a camera's screen blacks out on the shutter. What is ink
 * already turns to the other ink (a negative, ringed in ink so it keeps its
 * edge): the primary, the white key on a photograph, the code chip; a delete
 * flashes its own red; a glass round, the photograph's ink, white; a link
 * stands on a plate of ink. The shutter, whose face is its own, blacks out
 * whole.
 *
 * ★ ONE FLAT FLASH: a ring of the flash's own colour covers the body's lines
 * (a key's bevel, a pill's ring), which would otherwise draw a lit edge across
 * the ink.
 *
 * The fade back is longer than a hover's and front-loaded: the ink leaves at
 * once and its last trace settles, an afterimage rather than a crossfade.
 */
const FLASH: readonly Layer[] = [[true, "0 0 0 1.5px", "var(--blink-ring)"]];
const BLINK = `
:root, .surface-paper { --blink-out: brightness(0); }
.dark, .surface-display { --blink-out: brightness(0) invert(1); }
${BODIED.join(", ")} {
  --i-press: ${layers(FLASH, false)};
  transition: background-color 180ms var(--ease-emphasis), color 180ms var(--ease-emphasis), box-shadow 180ms var(--ease-emphasis),
    translate 70ms linear, scale 140ms var(--ease-emphasis);
}
${HELD} { transition-duration: 0ms; }
${held(...BODIED)} { --blink-ring: var(--ink); --i-press: ${layers(FLASH)}; }
${held(...BODIED.filter((s) => s !== SHUTTER && s !== CODE_CHIP))} { background: var(--ink); color: var(--ink-fg); }
${held(btn("default"))} { background: var(--ink-fg); color: var(--ink); }
${held(btn("on-photo"), CODE_CHIP)} {
  background: oklch(0.13 0.004 286); color: oklch(1 0 0); --blink-ring: oklch(1 0 0 / 70%);
}
${held(btn("destructive"))} { background: var(--destructive); color: oklch(1 0 0); --blink-ring: var(--destructive); }
${held(btn("glass"))} { background: oklch(1 0 0); color: oklch(0.13 0.004 286); --blink-ring: oklch(1 0 0); }
${held(btn("link"))} {
  background: var(--ink); color: var(--ink-fg); text-decoration-color: transparent; --i-press: 0 0 0 3px var(--ink);
}
${held(SHUTTER)} { filter: var(--blink-out); }
`;

export const PRESS_CSS: Record<PressId, string> = {
  sink: SINK,
  shrink: SHRINK,
  blink: BLINK,
};
