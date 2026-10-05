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
 * ★ EVERY OPTION KEEPS ITS WORDS IN VIEW (r4's direction: a wait that hides
 * what is working reads as broken on party wifi), and every one draws inside
 * the key, so nothing it does reaches the band the halo stands in round it.
 *
 * ★ STILL, EACH STILL SAYS "WORKING". Under reduced motion every loop plays
 * once and rests on its base style (globals.css's guard, and `.identity-still`
 * for a frame's twin), so each base is drawn to read as working on its own: an
 * arc a third of the way round its faint ring, a beam stopped a third of the
 * way round the key's edge, a key still held down.
 *
 * ★ ONE PSEUDO-ELEMENT: a button's `::before` is the working state's, alone
 * (a set's light stands on `::after`, and the halo draws no element). A field
 * takes no pseudo-element, so a field checking what was typed draws in its
 * status slot (`[data-slot="field-status"]`, the proposed hook a wired field
 * puts where its answer will be, a tick or a cross) and its wrapper
 * (`[data-slot="field-wrap"]`).
 */

const WORKING = `${BTN}${BUSY}:not([data-variant="link"])`;
const ROUND = `:is(${ICON},[data-size="icon-cta"])`;
const FIELD_BUSY = '[data-slot="input"][aria-busy="true"]';
const STATUS = `${FIELD_BUSY} ~ [data-slot="field-status"]`;
const WRAP = '[data-slot="field-wrap"]';

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
@property --id-orbit { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes id-orbit { to { --id-orbit: 1turn; } }
${BTN} { --arc: 14px; }
${BTN}:is([data-size="xs"],[data-size="sm"],[data-size="icon-xs"],[data-size="icon-sm"]) { --arc: 12px; --arc-w: 1.5px; }
${BTN}:is([data-size="cta"],[data-size="icon-cta"]) { --arc: 16px; --arc-w: 2px; }
${BTN}${BUSY} { cursor: progress; }
${WRAP} { position: relative; }
[data-slot="field-status"] {
  position: absolute; top: 0; bottom: 0; right: 12px; display: none; align-items: center; gap: 6px;
  color: var(--muted-foreground); font-size: 12px; pointer-events: none;
}
${STATUS} { display: flex; }
`;

/** The arc before the words, in a leading icon's place. */
const ARC_ON_KEYS = `
${WORKING}::before { ${arcBody()} order: -1; }
${WORKING} > svg:first-child { display: none; }
${BTN}${BUSY}${ROUND} > * { display: none; }
${STATUS}::after { ${arcBody("14px")} }
`;

const ARC = BASE + ARC_ON_KEYS;

/**
 * THE WORDS SAY IT: the same arc, and the key's words turn to what it is
 * doing ("Unlocking", "Saving", "Creating your event"), as production's own
 * keys already say "Saving…" and "Removing…" while they wait. The words are
 * the scene's to change (a wired key renders its working words; the scene
 * swaps them where the key carries `data-working`); a field says what it is
 * checking in its status slot, beside the arc.
 */
const WORDS = `
${BASE}
${ARC_ON_KEYS}
${STATUS}::before { content: attr(data-working); }
`;

/**
 * A BEAM ROUND ITS EDGE: a light runs round the key's own edge while it
 * works, a comet's tail into a bright head, over a faint ring of the same
 * light, and ends when the work lands: the house's beam (the light doctrine's
 * "a beam marks the live subject ... and ends when the state ends"), drawn in
 * the key's own ink, never a lamp's hue. Its words stay whole; stopped, it is
 * a ring of light a third of the way round. A field checking runs it round
 * the field.
 */
const beam = (w = "1.5px") => `
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: ${w}; pointer-events: none; z-index: 2;
  background: conic-gradient(from var(--id-orbit),
    color-mix(in oklab, currentColor 16%, transparent) 0 52%,
    color-mix(in oklab, currentColor 45%, transparent) 76%,
    currentColor 93%,
    color-mix(in oklab, currentColor 16%, transparent) 96% 100%);
  ${RING_MASK}
  animation: id-orbit 1.5s linear infinite;
`;
const EDGE = `
${BASE}
${WORKING}::before { ${beam()} }
${BTN}${BUSY}:is([data-size="cta"],[data-size="icon-cta"])::before { padding: 2px; }
${WRAP}:has(> ${FIELD_BUSY})::after { ${beam()} border-radius: 8px; color: var(--foreground); }
`;

/**
 * HELD DOWN UNTIL IT LANDS: the key keeps the press it was given (its shrink,
 * held, and its face a shade down) for as long as it works, with the arc in
 * its icon's place: the key you pressed is visibly still down, which is the
 * plainest way to say why it will not take another press. A field checking
 * holds its words a step quieter, the arc at its end.
 */
const HELD = `
${BASE}
${ARC_ON_KEYS}
${WORKING} { --i-press-s: 0.96; --i-press: inset 0 0 0 999px color-mix(in oklab, var(--foreground) 7%, transparent); }
${WORKING}:is([data-size="xs"],[data-size="sm"]) { --i-press-s: 0.95; }
${WORKING}[data-size="cta"] { --i-press-s: 0.98; }
${FIELD_BUSY} { color: var(--muted-foreground); }
`;

export const LOADING_CSS: Record<LoadingId, string> = {
  arc: ARC,
  words: WORDS,
  edge: EDGE,
  held: HELD,
};
