import type { LoadingId } from "../model";

import { BTN, BUSY, ICON } from "./states";

/**
 * WHAT A KEY SHOWS WHILE IT WORKS ON WHAT YOU PRESSED (round five's own ask:
 * Will, r4: "Leaning towards option 2, the arc running round ... The arc
 * looping is an intuitive state, looks clean beside the copy, harder to miss
 * and clearly shows why the button is being held. Each option should try to
 * cleanly communicate that state, at whatever level of creativity or
 * information-density they'd like"). Never three lights, never a track along
 * the foot. `aria-busy="true"` is the atom contract's hook, what a wired atom
 * sets while it works.
 *
 * ★ THREE DENSITIES OF ONE ARC: that it works (the arc), what it is doing (the
 * arc and its working words), and how long it has been at it (those words
 * keeping time). The arc is the same in all three, so the choice is how much a
 * waiting key says, never how it spins.
 *
 * ★ EVERY OPTION KEEPS ITS WORDS IN VIEW (r4's direction: a wait that hides
 * what is working reads as broken on party wifi), and every one draws inside
 * the key, so nothing it does reaches the band the halo stands in round it.
 * The words are the scene's to change (a wired key renders its own;
 * `scene/working-words.ts` hands a key the words it carries in
 * `data-working`, and its time).
 *
 * ★ STILL, EACH STILL SAYS "WORKING". Under reduced motion every loop plays
 * once and rests on its base style (globals.css's guard, and `.identity-still`
 * for a frame's twin), so the arc is drawn to read as working stopped: a ring
 * a third filled, on its faint whole ring.
 *
 * ★ ONE PSEUDO-ELEMENT: a button's `::before` is the working state's, alone
 * (a set's light stands on `::after`, and the halo draws no element). A field
 * takes no pseudo-element, so a field checking what was typed draws in its
 * status slot (`[data-slot="field-status"]`, the proposed hook a wired field
 * puts where its answer will be, a tick or a cross), and its line under it
 * says what it checks.
 */

const WORKING = `${BTN}${BUSY}:not([data-variant="link"])`;
const ROUND = `:is(${ICON},[data-size="icon-cta"])`;
const FIELD_BUSY = '[data-slot="input"][aria-busy="true"]';
const STATUS = `${FIELD_BUSY} ~ [data-slot="field-status"]`;

/** A ring's mask: the box less its content box, so a background is drawn as a ring. */
const RING_MASK = `
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
`;

/**
 * THE ARC, REFINED: a third of a ring in the key's own ink running round a
 * faint full ring of the same ink, so its still is a ring a third filled
 * rather than a fragment; sized to the icon step of its key (12, 14, 16, as
 * every icon pairs with its text), and standing where a leading icon stands,
 * which it replaces, so a key with an icon keeps its width. One turn in 800ms,
 * linear: a spinner that eases reads as stalling between turns.
 */
const arcBody = (size = "var(--arc)") => `
  content: ""; flex: none; width: ${size}; height: ${size}; border-radius: 999px; padding: var(--arc-w, 1.75px);
  pointer-events: none; box-sizing: border-box;
  background: conic-gradient(currentColor 0 30%, color-mix(in oklab, currentColor 22%, transparent) 30% 100%);
  ${RING_MASK}
  animation: id-spin 800ms linear infinite;
`;

const BASE = `
@keyframes id-spin { to { rotate: 1turn; } }
${BTN} { --arc: 14px; }
${BTN}:is([data-size="xs"],[data-size="sm"],[data-size="icon-xs"],[data-size="icon-sm"]) { --arc: 12px; --arc-w: 1.5px; }
${BTN}:is([data-size="cta"],[data-size="icon-cta"]) { --arc: 16px; --arc-w: 2px; }
${BTN}${BUSY} { cursor: progress; }
[data-slot="field-wrap"] { position: relative; }
[data-slot="field-status"] {
  position: absolute; top: 0; bottom: 0; right: 12px; display: none; align-items: center; gap: 6px;
  color: var(--muted-foreground); pointer-events: none;
}
${STATUS} { display: flex; }
${WORKING}::before { ${arcBody()} order: -1; }
${WORKING} > svg:first-child { display: none; }
${BTN}${BUSY}${ROUND} > * { display: none; }
${STATUS}::after { ${arcBody("14px")} }
`;

/**
 * KEEPING TIME, IN THE CAMERA'S VOICE: past two seconds a working key adds its
 * wait as a readout after its words ("Saving 0:04"), the label step's tabular
 * figures a camera prints (design-system.md: "a readout is the camera's
 * voice"), a step quieter than the words; a field checking prints it before
 * its arc. A quick save never shows it.
 */
const TIME = `
[data-working-time] {
  font-size: 11px; line-height: 1; letter-spacing: 0.04em; font-variant-numeric: tabular-nums;
  font-weight: 600; opacity: 0.62; margin-inline-start: 2px;
}
[data-slot="field-status"] [data-working-time] { margin-inline-start: 0; opacity: 0.8; }
`;

export const LOADING_CSS: Record<LoadingId, string> = {
  arc: BASE,
  words: BASE,
  time: BASE + TIME,
};
