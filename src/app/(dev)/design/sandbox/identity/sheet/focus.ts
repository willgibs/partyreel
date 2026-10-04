import type { FocusId } from "../model";

import { lockAt, locked, MARK_POSITIONS_IN, MARKS } from "./marks";
import {
  BTN,
  btn,
  BUSY,
  CHECK,
  CHIP,
  CODE_CHIP,
  each,
  ERROR,
  FIELDS,
  FOCUS,
  PHOTO,
  RADIO,
  SEGMENT,
  SHUTTER,
  SLIDER_THUMB,
  SWITCH,
  TAB,
} from "./states";

/**
 * THE ONE FOCUS MARK, ON EVERYTHING A KEYBOARD CAN REACH (his r2 note: "some
 * focuses rings, some corners, which is bad"): a button, a chip, a segment, a
 * field, a switch, a check, a radio, a slider's thumb, a tab, the shutter and
 * the code chip all wear the same mark, so the mark reads as the product's and
 * not as each control's.
 *
 * ★ NEVER THE VIEWFINDER'S CORNERS AS THE RECOMMENDATION (Will, r3: "far from
 * sold on the viewfinder focus (don't like it right now)"). They stay as the
 * last option, "the r3 mark", so the fallback is one press away, and nowhere
 * else does a corner appear (`identity.test.ts`).
 *
 * ★ A MARK MUST BE SEEN (WCAG's focus appearance): at least 1.5px at 3:1
 * against what it stands on, on paper, in the room and on a photograph, and
 * in the destructive colour on an atom in error.
 *
 * ★ A FIELD IS FOCUSED EVERY TIME ANYONE TYPES: a browser matches
 * `:focus-visible` on a text field however it was reached, a tap included, so
 * on a field every guest sees the mark, not only a keyboard's user. It is
 * drawn to be lived with.
 *
 * ★ CHROME DRAWS AN `outline` (AND A BORDER) IN WHOLE PIXELS: 1.5px is drawn
 * as 1px, at every device scale (measured: r3's "1.5px" outline was 1px on
 * screen). A line that must be 1.5px is a shadow's spread, which is drawn to
 * the device pixel; an outline is 2px or it is under the floor.
 *
 * ★ A SHADOW'S GAP IS PAINTED, AN OUTLINE'S IS CLEAR. A ring of shadows stands
 * off the control only over a gap painted in some colour (`gap`): the
 * brightest white on paper (a card is whiter than the page, so white is never
 * a moat there); in the room and on the display the `--background` the atom
 * itself reads, which a lit chosen card re-declares a step under its face
 * (`selected.ts`); a near-black on a photograph. An outline's gap is the
 * ground itself, so the shutter, whose own light fills the gap, wears an
 * outline over a light veil (`--fo-veil`).
 *
 * ★ IT ARRIVES IN ONE BEAT AND NEVER MAKES A KEY WAIT (the house's motion: a
 * keyboard's moves are its most frequent): every mark is whole and readable in
 * its first frame and only settles, 140 to 160ms on the house's emphasis
 * curve, out of `--fo-t` (0 to 1, registered here so a keyframe carries it and
 * every length reads it). It never loops, it leaves at once (two marks are
 * never seen together), and under reduced motion the global guard plays the
 * beat in 0.01ms, so it is simply there. A control that is working keeps its
 * working loop: the beat steps aside on `aria-busy` (`loading.ts` animates a
 * field itself).
 *
 * ★ THE SHUTTER WEARS ITS OWN LIGHT 2 TO 5PX OUT (`ui/shutter.css`), painted
 * over anything its box draws, and its face covers its box: every mark stands
 * beyond its light there, as a ring. A working key draws its work inside it
 * (`loading.ts`), so a mark round it stands where it always does.
 *
 * Pseudo-elements by `states.ts`'s table: a mark drawn apart from its control
 * stands on `::after`, on a switch and a tab on `::before`; on a field (no
 * pseudo-element) it is a shadow, the outline or background layers.
 */

/** Every atom a keyboard reaches. */
const ON = [
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
/** The list, each in a state: `at(FOCUS)` is every atom with focus. */
const at = (state: string) => ON.map((s) => `${s}${state}`).join(", ");
const FOCUSED = at(FOCUS);
/** An atom in error, focused: the mark keeps its form in the destructive colour. */
const ERRED = at(ERROR + FOCUS);
/** Focused and not working: where the arrival may run (a working atom keeps its loop). */
const ARRIVING = at(`${FOCUS}:not(${BUSY})`);
/** What sits in a row of its own kind, so its mark is drawn over the neighbour it reaches. */
const GROUPED = [CHIP, SEGMENT, TAB].map((s) => `${s}${FOCUS}`).join(", ");
/** The small toggles: too small to hold a mark inside them, they wear it round them. */
const TOGGLED = [SWITCH, CHECK, RADIO, SLIDER_THUMB]
  .map((s) => `${s}${FOCUS}`)
  .join(", ");
const LINK = `${btn("link")}${FOCUS}`;

/** A length as the mark arrives: `from` in its first frame, `to` once settled (`--fo-t` 0 to 1). */
const settle = (to: string, from: string) =>
  `calc(${to} + (1 - var(--fo-t)) * (${from} - ${to}))`;

/** The gap a painted ring stands over: the ground's token, or the atom's own `--background`. */
const GAP = "var(--fo-gap, var(--background))";
/** The ground's ink at the strength a mark's line is drawn in. */
const LINE = "color-mix(in oklab, var(--foreground) 85%, transparent)";

/**
 * What every mark stands on: production's own ring given up, the beat, a
 * row's neighbour drawn under the mark, and the gap a painted ring needs, per
 * ground (a value that depends on its ground is declared on every ground:
 * `base.ts`).
 */
const BASE = `
@property --fo-t { syntax: "<number>"; inherits: false; initial-value: 1; }
@keyframes fo-arrive { from { --fo-t: 0; } }
:root, .surface-paper { --fo-gap: oklch(1 0 0); }
.dark, .surface-display, .surface-ink { --fo-gap: initial; }
${PHOTO} { --fo-gap: oklch(0.13 0.004 286); --fo-veil: oklch(0 0 0 / 28%); }
${FOCUSED} { outline: none; }
${GROUPED} { z-index: 1; }
`;

/** The beat, for a mark that settles as it arrives (`dur` on the house's emphasis curve). */
const arrive = (dur: string) => `
${ARRIVING} { animation: fo-arrive ${dur} var(--ease-emphasis); }
`;

/**
 * A HALO (new): a ring of light round whatever has focus. A fine line of the
 * ground's ink stands two pixels off the control over a clear band of its
 * ground, with a soft bloom of light round it, lit from above (the house's one
 * light), gathering in from a wider, softer glow as it arrives: on paper an ink
 * line in a soft grey aura, in the room a line of light with its bloom, on a
 * photograph a white line over a near-black band so it reads on any sky. The
 * shutter's own ring of light, without its hue, worn by everything.
 *
 * ★ ON PAPER THE BLOOM IS AN AURA OF THE PAGE'S OWN INK: light cannot show on
 * white, and a white bloom left the halo a hard ring the outline draws too
 * (the fresh-eyes pass: the two landed on one answer on paper). The aura is
 * what parts them: a halo is soft round its line, an outline is a line.
 */
const HALO_TOKENS = `
:root, .surface-paper { --fo-bloom: oklch(0.14 0.004 286 / 10%); }
.dark, .surface-ink { --fo-bloom: oklch(1 0 0 / 18%); }
.surface-display { --fo-bloom: oklch(1 0 0 / 15%); }
${PHOTO} { --fo-bloom: oklch(1 0 0 / 26%); }
`;
const halo = (line: string, at = "2px") => {
  const gap = settle(at, `calc(${at} + 1.5px)`);
  return `0 0 0 ${gap} ${GAP}, 0 0 0 calc(${gap} + 1.5px) ${line},
    0 -1px ${settle("12px", "22px")} calc(${gap} + 1.5px) var(--fo-bloom)`;
};
const HALO = `
${HALO_TOKENS}
${FOCUSED} { --i-focus: ${halo(LINE)}; }
${ERRED} { --i-focus: ${halo("var(--destructive)")}; }
${SHUTTER}${FOCUS} {
  outline: 2px solid ${LINE}; outline-offset: ${settle("7px", "8.5px")};
  --i-focus: 0 0 0 7px var(--fo-veil, transparent), 0 -1px ${settle("12px", "22px")} 9px var(--fo-bloom);
}
${arrive("140ms")}
`;

/**
 * LIT (new; it took the lift's place, whose rise and shadow could not carry
 * 3:1 without a ring and read as chosen on a raised segment): what has focus
 * catches the light from above on its own edge, brightest along its top (the
 * light edge's falloff, worn by a control), and a field lights up under it:
 * white on paper, a step lighter in the room. It catches the light on its own
 * edge. Inside its edge, a rim of light and, within it, a keyline of the
 * ground's ink, so a dark control shows the lit rim and a light one the ink
 * line, whatever it is filled with; a glint of light crosses the edge as it
 * arrives. Nothing is drawn round the control and nothing moves, so it never
 * reaches a neighbour, a track or a photograph. A toggle is too small to hold
 * it inside, and a field that is working draws its line along its floor, so
 * each wears the same two tones round it as a keyline, the shutter beyond its
 * own light; a link's edge is its underline.
 */
const LIT_TOKENS = `
:root, .surface-paper { --fo-hi: oklch(1 0 0); --fo-lo: oklch(0.14 0.004 286); --fo-lit-fill: oklch(1 0 0); }
.dark, .surface-ink { --fo-hi: oklch(1 0 0 / 92%); --fo-lo: oklch(0 0 0); --fo-lit-fill: oklch(0.19 0.004 286); }
.surface-display {
  --fo-hi: oklch(1 0 0 / 92%); --fo-lo: var(--background);
  --fo-lit-fill: color-mix(in oklab, var(--display-step), oklch(1 0 0) 6%);
}
${PHOTO} { --fo-hi: oklch(1 0 0); --fo-lo: oklch(0 0 0); }
`;
/** The glint: a soft light inside the edge that is spent by the time the mark settles. */
const GLINT = `inset 0 0 ${settle("0px", "12px")} ${settle("0px", "1px")} color-mix(in oklab, var(--fo-hi) 45%, transparent)`;
const keyline = (line: string, gap = "1.5px") =>
  `0 0 0 ${gap} ${GAP}, 0 0 0 calc(${gap} + 1.5px) ${line}`;
/* In error the edge is the destructive colour alone, 2px: it stands apart from every fill, so it needs no rim. */
const LIT = `
${LIT_TOKENS}
${FOCUSED} {
  --i-focus: inset 0 1.5px 0 0 var(--fo-hi), inset 0 0 0 1.5px color-mix(in oklab, var(--fo-hi) 45%, transparent),
    inset 0 0 0 3px var(--fo-lo), ${GLINT};
}
/* A field lights up under its edge: white on paper, a step lighter in the room. */
${each(FIELDS, FOCUS)} { background-color: var(--fo-lit-fill); }
${TOGGLED}, ${each(FIELDS, FOCUS + BUSY)} { --i-focus: ${keyline(LINE)}; }
${SHUTTER}${FOCUS} { outline: 2px solid ${LINE}; outline-offset: 6px; --i-focus: 0 0 0 6px var(--fo-veil, transparent); }
${ERRED} { --i-focus: inset 0 0 0 2px var(--destructive), ${GLINT}; }
${[SWITCH, CHECK, RADIO, SLIDER_THUMB].map((s) => `${s}${ERROR}${FOCUS}`).join(", ")} {
  --i-focus: ${keyline("var(--destructive)")};
}
${LINK} {
  --i-focus: 0 0 #0000; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px;
}
${arrive("140ms")}
`;

/**
 * AN OUTLINE CLOSING IN (all rings): a ring of ink that closes in from six
 * pixels to two and a half round whatever has focus, whole from its first
 * frame: the web's own outline, at the 2px a screen really draws. On a
 * photograph a veil under it keeps it read on a bright sky.
 */
const OUTLINE = `
${FOCUSED} { outline: 2px solid var(--foreground); outline-offset: ${settle("2.5px", "6px")}; }
${SHUTTER}${FOCUS} { outline-offset: ${settle("7px", "10.5px")}; }
${PHOTO} :is(${FOCUSED}) { --i-focus: 0 0 0 ${settle("2.5px", "6px")} oklch(0 0 0 / 30%); }
${PHOTO} ${SHUTTER}${FOCUS} { --i-focus: 0 0 0 7px oklch(0 0 0 / 30%); }
${ERRED} { outline-color: var(--destructive); }
${arrive("160ms")}
`;

/**
 * THE CURSOR (ink): the control turns to ink with a thin ring of the inverse
 * inside it, the display's chosen-row cursor worn on the control. What keeps
 * a surface of its own (a toggle, the shutter, the code chip) wears an ink
 * ring round it instead. Inside an ink control the inverse is the ink: a
 * working key's lights and a field's checking line are drawn in it, and the
 * key keeps its working layers (only its colour turns); a field that is
 * working keeps the ink and gives its floor to its working line.
 */
const CURSOR_IN = (c = "var(--ink-fg)") =>
  `inset 0 0 0 2px var(--ink), inset 0 0 0 3.5px ${c}`;
const CURSOR = `
${[BTN, CHIP, SEGMENT, TAB].map((s) => `${s}${FOCUS}:not([data-variant="link"])`).join(", ")} {
  background-color: var(--ink); --k-ink: var(--ink-fg); --i-focus: ${CURSOR_IN()};
}
/* The words turn to the inverse, unless the key is working: its words are the working state's to hide. */
${[BTN, CHIP, SEGMENT, TAB].map((s) => `${s}${FOCUS}:not([data-variant="link"],${BUSY})`).join(", ")} { color: var(--ink-fg); }
${[CHIP, SEGMENT, TAB].map((s) => `${s}${FOCUS}`).join(", ")} { background-image: none; }
${btn("destructive")}${FOCUS} {
  background-color: var(--destructive); color: oklch(1 0 0); --k-ink: oklch(1 0 0);
  --i-focus: inset 0 0 0 2px var(--destructive), inset 0 0 0 3.5px oklch(1 0 0);
}
${LINK} { background-color: var(--ink); color: var(--ink-fg); --i-focus: 0 0 0 4px var(--ink); text-decoration: none; }
${each(FIELDS, FOCUS)} {
  background-color: var(--ink); color: var(--ink-fg); --foreground: var(--ink-fg);
  --i-focus: ${CURSOR_IN("color-mix(in oklab, var(--ink-fg) 55%, transparent)")};
}
${each(FIELDS, FOCUS + "::placeholder")} { color: color-mix(in oklab, var(--ink-fg) 55%, transparent); }
/* A field's own trailing control (the door's eye) turns with it, or it is a grey mark on ink. */
${each(FIELDS, `${FOCUS} ~ button`)} { color: var(--primary-foreground); }
${each(FIELDS, FOCUS + "::selection")} { background: color-mix(in oklab, var(--ink-fg) 30%, transparent); color: var(--ink-fg); }
[data-slot="select-trigger"]${FOCUS} svg { color: var(--ink-fg) !important; opacity: 0.8; }
${each(FIELDS, ERROR + FOCUS)} { --i-focus: ${CURSOR_IN("var(--destructive)")}; }
${each(FIELDS, FOCUS + BUSY)} { --i-focus: 0 0 #0000; }
${TOGGLED}, ${SHUTTER}${FOCUS}, ${CODE_CHIP}${FOCUS} { outline: 2px solid var(--ink); outline-offset: 2px; }
${SHUTTER}${FOCUS} { outline-offset: 7px; }
${PHOTO} ${BTN}${FOCUS}, ${btn("on-photo", "glass")}${FOCUS} {
  background-color: oklch(1 0 0); color: oklch(0.13 0.004 286); --k-ink: oklch(0.13 0.004 286);
  --i-focus: inset 0 0 0 2px oklch(1 0 0), inset 0 0 0 3.5px oklch(0.13 0.004 286);
}
`;

/**
 * THE R3 MARK, KEPT AS THE FALLBACK: the viewfinder's four corners standing
 * out from the control at rest, closing in on focus, the way a camera locks.
 * Never a style and never a loading state anywhere (`identity.test.ts`). A
 * field wears them as its own background layers, so a field that is working
 * keeps its working line and gives up the corners until it is done; the
 * shutter's lock stands beyond its own light.
 */
const CORNERS = `
${[BTN, CHIP, SEGMENT, CHECK, RADIO, SLIDER_THUMB, SHUTTER, CODE_CHIP].map((s) => `${s}::after`).join(", ")} { ${lockAt("10px")} }
${[CHECK, RADIO, SLIDER_THUMB].map((s) => `${s}::after`).join(", ")} { --m-a: 5px; }
${[SWITCH, TAB].map((s) => `${s}::before`).join(", ")} { ${lockAt("9px")} }
${[BTN, CHIP, SEGMENT, CHECK, RADIO, SLIDER_THUMB, SHUTTER, CODE_CHIP].map((s) => `${s}${FOCUS}::after`).join(", ")} { ${locked("4px")} }
${SHUTTER}::after { inset: -14px; }
${SHUTTER}${FOCUS}::after { inset: -8px; }
${[SWITCH, TAB].map((s) => `${s}${FOCUS}::before`).join(", ")} { ${locked("3px")} }
${FIELDS} { --m-c: transparent; --m-a: 8px; --m-w: 1.5px; }
${each(FIELDS, FOCUS)} { --m-c: var(--foreground); }
${each(FIELDS, ERROR + FOCUS)} { --m-c: var(--destructive); }
${each(FIELDS, `${FOCUS}:not(${BUSY})`)} { ${MARKS} background-position: ${MARK_POSITIONS_IN}; }
`;

/** The five, by the ids the board asks with. */
export const FOCUS_CSS: Record<FocusId, string> = {
  halo: BASE + HALO,
  lit: BASE + LIT,
  outline: BASE + OUTLINE,
  cursor: BASE + CURSOR,
  corners: BASE + CORNERS,
};
