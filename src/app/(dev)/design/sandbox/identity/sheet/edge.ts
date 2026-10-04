import type { EdgeId } from "../model";

import { btn, CARDS, QUICK, TOAST } from "./states";

/**
 * THE LIGHT EDGE, CARRIED (Will, on display: "I also really did like the
 * light edge and wouldn't mind an exploration around potentially keeping that
 * infused beyond media cards. It makes the media card themselves look much
 * more rich").
 *
 * The edge is production's own (`[data-lit]`, globals.css's "THE BRIGHT
 * EDGE"): one pixel of light catching the bevel of a surface lit from above,
 * brightest along the top, falling away down the sides and spent before the
 * bottom, in the surface's own foreground at a low alpha. Today it is worn by
 * media alone (a photograph, a player, a framed screen, the code's card), and
 * only on a dark ground. The three reaches:
 *
 *  - `media`: as built, nothing more;
 *  - `floating`: everything that floats: every pop-out on both grounds (a
 *    menu, a popover, a select, the Add's rows, a tooltip, a toast; the
 *    display is dark on paper too) and, in the room, every dialog, panel and
 *    sheet (on paper those are white, and a light surface takes none);
 *  - `every`: floating, plus every card in the room (the card atom and the
 *    hand-made cards that end in the house ring), the cover's glass rounds'
 *    own lip of light brighter, every dark key's top light turned up to the
 *    light's strength, and on paper the dark things too: the photographs and
 *    the ink keys, lit in white.
 *
 * ★ THE EDGE REPLACES THE HAIRLINE, IT IS NEVER A THIRD OUTLINE (the bright
 * edge's own rule): a lit surface gives up its ring, so it ends in light above
 * and its shadow below. The ring goes by its own variable (`--tw-ring-shadow`,
 * the one every `ring-*` utility composes), never by the whole `box-shadow`:
 * the layer's shadow stays, and a focus ring still draws while the surface
 * holds focus (the Add's Cancel). A toast ends in a border, not a ring, so its
 * border turns clear and the light lands on it (`data-lit="border"`'s rule).
 *
 * ★ THE LIGHT FALLS ON A FREE EDGE ONLY. A layer that floats free (a menu, a
 * tooltip, a toast, a dialog, a card) is lit as a photograph is, all round
 * with the falloff. A layer standing on an edge of the screen is lit along the
 * edge it stands free by: a bottom sheet along its top, a desk's panel down
 * its left (from its top, spent before its foot). A whole screen (Settings in
 * a hand, a plan's cover, a full-screen dialog) is the page, and takes none:
 * light along the window's own edge is a line, not a bevel.
 *
 * ★ A LIGHT SURFACE TAKES NONE: a card, a dialog or a sheet on paper is never
 * lit (on paper the foreground is ink: a dark rim). The display is dark on
 * both grounds, so a pop-out takes the light on paper too, in its ground's own
 * strength (`--vf-pop-light`, `room.ts`: three tenths on the display, two
 * fifths on graphite).
 *
 * ★ ON A PSEUDO-ELEMENT THE HOST DOES NOT USE: `::after` on a layer and a card
 * (none draws one), `::before` on a toast (sonner's `::after` is its gap's hit
 * area, and its `::before` exists only while a toast is swiped or removed,
 * when the light steps aside). No atom is lit, so the traits' pseudo-elements
 * (`states.ts`) are never touched.
 */

/* ── the light ─────────────────────────────────────────────────────────── */

/** Production's falloff over the whole box, in a light of the host's choosing (`--vf-lit`). */
const FALLOFF = `radial-gradient(135% 100% at 50% 0%,
    color-mix(in oklab, var(--vf-lit) 100%, transparent) 0%,
    color-mix(in oklab, var(--vf-lit) 44%, transparent) 36%,
    color-mix(in oklab, var(--vf-lit) 13%, transparent) 66%,
    transparent 92%)`;

/** The same falloff down a side, from the top corner: brightest at the top, spent before the foot. */
const DOWN = `radial-gradient(100% 100% at 0% 0%,
    color-mix(in oklab, var(--vf-lit) 100%, transparent) 0%,
    color-mix(in oklab, var(--vf-lit) 44%, transparent) 36%,
    color-mix(in oklab, var(--vf-lit) 13%, transparent) 66%,
    transparent 92%)`;

/**
 * The one pixel the light is drawn on: the box less its padding box, through
 * a clear border of one pixel on the edges that are lit (the bright edge's own
 * mask, both spellings, since Safari composites on the prefixed one). It sits
 * on the box that owns the corner, the corner inherited, so the light and the
 * corner are one arc; `--vf-lit-at` pushes it out over a border.
 *
 * ★ A BORDER, NOT A PADDING: the browser draws a border of under a device
 * pixel as one whole device pixel, and rounds a padding to the pixel grid, so
 * production's padding ring is drawn as nothing once a screen is scaled under
 * about half (the lab's step draws two laptops at 48%: measured, the light
 * gone at both device scales while a box-shadow hairline stayed). At 1:1 the
 * two are the same pixel.
 */
const ON = (widths: string, light: string) => `
  content: ""; position: absolute; inset: var(--vf-lit-at, 0); border-radius: inherit;
  border: solid transparent; border-width: ${widths}; pointer-events: none; z-index: 1;
  background: ${light} border-box;
  -webkit-mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  mask-image: linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  -webkit-mask-clip: padding-box, border-box; mask-clip: padding-box, border-box;
  -webkit-mask-composite: xor; mask-composite: exclude;
`;

/** All round: what floats free. */
const ALL_ROUND = ON("1px", FALLOFF);
/** Along its top: a sheet risen from the foot. */
const ALONG_TOP = ON("1px 0 0", FALLOFF);
/** Down its left: a desk's panel standing on the right edge. */
const DOWN_LEFT = ON("0 0 0 1px", DOWN);

/* ── the grounds ───────────────────────────────────────────────────────── */

/** A selector list's parts, split on the commas outside any parentheses. */
const parts = (list: string): string[] =>
  list.split(/,(?![^(]*\))/).map((s) => s.trim());

/** A selector list, each part with a suffix (a pseudo-element, a state). */
const each = (list: string, suffix: string): string =>
  parts(list)
    .map((s) => `${s}${suffix}`)
    .join(", ");

/**
 * Where the light's pseudo-element needs a positioned host: a static one. An
 * unlayered `position` would outrank a host's own `absolute`, `fixed` or
 * `sticky` utility (which sits in a layer) and pull it into the flow.
 */
const STATIC = ":not(.absolute,.fixed,.sticky)";

/** In the room and not on a paper island inside it: theme.css's own fence for `dark`. */
const inRoom = (list: string): string =>
  parts(list)
    .map((s) => `:is(.dark ${s}):not(.surface-paper ${s})`)
    .join(", ");

/** On paper: everything the room's fence leaves out. */
const onPaper = (list: string, suffix = ""): string =>
  parts(list)
    .map((s) => `${s}:not(:is(.dark *):not(.surface-paper *))${suffix}`)
    .join(", ");

/**
 * The room's own light on a work layer or a card: its foreground, at the
 * strength that gives its rim the brightness a graphite pop-out's has (one rim
 * per ground: at production's media 30% a dialog's rim on its darker surface
 * read at a third of a menu's, the fresh-eyes pass measured).
 */
const ROOM_LIGHT = "color-mix(in oklab, var(--foreground) 46%, transparent)";

/* ── what floats ───────────────────────────────────────────────────────── */

/** Every pop-out that ends in the display's ring: a menu, a popover, a select, the Add's rows, the palette, a tooltip. */
const POP = `${QUICK}, [data-slot="tooltip-content"]`;

/** A work layer floating free: a centred dialog (the popup's and the Dialog atom's; a takeover has no shape). */
const FREE_WORK = [
  '[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"])',
  '[data-slot="dialog-content"][data-shape]',
].join(", ");

/** A work layer risen from the foot: the popup's sheet, a bottom Sheet. */
const RISEN = [
  '[data-slot="popup-content"][data-shape="sheet"]',
  '[data-slot="sheet-content"][data-side="bottom"]',
].join(", ");

/** A work layer standing on the right edge: the popup's panel, a right Sheet. */
const STANDING = [
  '[data-slot="popup-content"][data-shape="panel"]',
  '[data-slot="sheet-content"][data-side="right"]',
].join(", ");

/** The one responsive Sheet: a bottom sheet in a hand, a panel from 40rem (the Sheet's own breakpoint). */
const RESPONSIVE = '[data-slot="sheet-content"][data-side="responsive"]';

/** A toast's light, while sonner is not swiping or removing it (its `::before` is its own then). */
const TOAST_LIT = `${TOAST}[data-styled="true"]:not([data-swiping="true"]):not([data-removed="true"])`;

/**
 * ★ ON PAPER THE LIGHT STEPS ONE PIXEL IN. A light reads as light only where
 * it is the brightest thing at its edge. In the room it is (the display's top
 * pixel lit over the room's black), but paper is brighter than any light the
 * display can catch, so on the display's outer pixel it read as a grey rim
 * between the page and the screen (measured: 86 between the panel's 14 and the
 * page's 235). One pixel inside, with the display's own edge still cutting it
 * from the page, it is a lip of light on the screen's bevel, as Crystal wears
 * its own; the corner stays concentric (one pixel tighter).
 */
const PAPER_STEP = `
${onPaper(POP, "::after")} { inset: 1px; border-radius: calc(var(--vf-lit-r) - 1px); }
${onPaper(TOAST_LIT, "::before")} { --vf-lit-at: 0px; border-radius: calc(var(--border-radius, var(--radius-float)) - 1px); }
`;

const FLOATING = `
${POP} { --vf-lit: var(--vf-pop-light); --vf-lit-r: var(--radius-float); }
${each(POP, STATIC)} { position: relative; }
[data-slot="tooltip-content"] { --vf-lit-r: calc(var(--radius-float) - 6px); }
${each(POP, ":not(:focus-visible)")} { --tw-ring-shadow: 0 0 #0000; }
${each(POP, "::after")} { ${ALL_ROUND} }

${TOAST}[data-styled="true"] { --vf-lit: var(--vf-pop-light); --vf-lit-at: -1px; border-color: transparent; }
${TOAST_LIT}::before { ${ALL_ROUND} }
${PAPER_STEP}

${inRoom(`${FREE_WORK}, ${RISEN}, ${STANDING}, ${RESPONSIVE}`)} { --vf-lit: ${ROOM_LIGHT}; }
${each(inRoom(FREE_WORK), "::after")} { ${ALL_ROUND} }
${each(inRoom(RISEN), "::after")} { ${ALONG_TOP} }
${each(inRoom(STANDING), "::after")} { ${DOWN_LEFT} }
@media (width < 40rem) { ${each(inRoom(RESPONSIVE), "::after")} { ${ALONG_TOP} } }
@media (width >= 40rem) { ${each(inRoom(RESPONSIVE), "::after")} { ${DOWN_LEFT} } }
`;

/* ── every dark surface ────────────────────────────────────────────────── */

/**
 * ★ EVERY DARK SURFACE ON PAPER TOO: on paper the dark things are photographs
 * and ink keys, and both are lit from above here in the light's own white
 * (production lights media on dark grounds alone because its light is the
 * foreground, which on paper is ink; a white light has no such rim). An ink
 * key's top light is the same light, a step brighter.
 */
const PAPER_DARK = `
${onPaper("[data-lit]")} { --vf-lit: oklch(1 0 0 / 34%); --vf-lit-at: calc(-1 * var(--lit-border, 0px)); }
${onPaper("[data-lit]", "::after")} { ${ALL_ROUND} }
${onPaper(btn("default"))} { --vf-ink-hi: oklch(1 0 0 / 34%); }
`;

/**
 * ★ AND EVERY DARK KEY: a key in the room or on the display is a dark surface
 * too, and its top light is this same light (`base.ts`'s `--vf-key-hi`, a
 * raised choice's `--sel-key-hi`), so every reach turns it up to the light's
 * own strength, where floating leaves it a key's quiet bevel.
 */
const DARK_KEYS = `
.dark, .surface-display { --vf-key-hi: oklch(1 0 0 / 30%); --sel-key-hi: oklch(1 0 0 / 30%); }
.surface-paper { --vf-key-hi: oklch(1 0 0 / 85%); --sel-key-hi: oklch(1 0 0); }
.surface-paper .surface-display { --vf-key-hi: oklch(1 0 0 / 30%); --sel-key-hi: oklch(1 0 0 / 30%); }
`;

const EVERY = `
${PAPER_DARK}
${DARK_KEYS}
${inRoom(CARDS)} { --vf-lit: ${ROOM_LIGHT}; --tw-ring-shadow: 0 0 #0000; }
${each(inRoom(CARDS), STATIC)} { position: relative; }
${each(inRoom(CARDS), "::after")} { ${ALL_ROUND} }
/* Crystal's own lip of light, brighter, and the ring under it fainter, so a
   glass round over a photograph is lit from above as the photographs are. */
${btn("glass")} { --glass-lip: 0.5; --glass-hairline: 0.04; }
`;

/** Crystal's own lip and hairline are the glass round's body in every reach (`button.ts`). */
export const EDGE_CSS: Record<EdgeId, string> = {
  media: "",
  floating: FLOATING,
  every: FLOATING + EVERY,
};
