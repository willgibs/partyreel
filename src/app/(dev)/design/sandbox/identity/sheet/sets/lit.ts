import { LIGHT_ON } from "../settled";
import {
  BTN,
  btn,
  CARD_ON,
  CHECK,
  CHECKED,
  CHIP,
  each,
  ERROR,
  FIELDS,
  FOCUS,
  HOVER,
  LIVE,
  OFF,
  ON,
  RADIO,
  RADIO_CARD,
  SEGMENT,
  SEGMENTS,
  SLIDER_THUMB,
  SWITCH,
  SWITCH_ON,
  TAB,
  TAB_ON,
  TABS,
  THUMB,
} from "../states";

/**
 * LIT EDGES (light): no hairline of a fixed weight and no drop shadow
 * anywhere on a control. Every edge is drawn by the house's one light from
 * above: what stands up wears the bright edge production gives a photograph
 * (one pixel of light along its top, falling away down its sides), what is
 * sunk catches the light on its far lip under a shade at its top. The floating
 * edge he picked (r4: edge=floating) carried down to the atoms, so a key in
 * the room is a small graphite pop-out.
 *
 * ★ ON PAPER THE SAME EDGE PRINTS AS ITS SHADE (Will, desk 4: Afterglow "is
 * very tough to nail on anything light. It's washed out easily"; the first
 * pass proved it, a white chosen card melting into the white card under it).
 * Light cannot show on paper, so there a raised part's edge is the light's
 * other side, a pixel of ink graded from faint at its top to firm at its
 * foot, where the light falls away from it: crisp at arm's length, and never
 * a ring of one weight. The ink key, paper's one dark key, takes the light
 * itself, as the display does.
 *
 * ★ ONE PIXEL, ONE PSEUDO-ELEMENT: the bright edge's own mask over a clear
 * border (`LIGHT_ON`), worn on a key's `::after` (a button's `::before` is the
 * working state's, and the halo draws no element), its gradient the ground's
 * (`--lt-edge`): the light in the room, the graded ink on paper.
 */

/** The bright edge's falloff in a colour: brightest at the top centre, spent before the foot. */
const fall = (c: string) => `radial-gradient(135% 100% at 50% 0%,
    ${c} 0%, color-mix(in oklab, ${c} 44%, transparent) 36%,
    color-mix(in oklab, ${c} 13%, transparent) 66%, transparent 92%)`;

/** The same edge printed in ink: faint at its top, firm at its foot. */
const graded = (top: string, foot: string) =>
  `linear-gradient(to bottom, ${top}, ${foot})`;

const INK = "oklch(0.14 0.004 286";

const TOKENS = `
:root, .surface-paper {
  --lt-pane: oklch(0.95 0.002 286); --lt-pane-deep: oklch(0.915 0.003 286); --lt-pane-in: oklch(0.975 0.001 286);
  --lt-pane-shade: ${INK} / 14%); --lt-pane-shade-up: ${INK} / 22%); --lt-pane-lip: oklch(1 0 0 / 100%);
  --lt-key: oklch(0.958 0.002 286); --lt-key-up: oklch(0.938 0.003 286); --lt-chosen: oklch(1 0 0);
  --lt-edge: ${graded(`${INK} / 8%)`, `${INK} / 26%)`)};
  --lt-edge-up: ${graded(`${INK} / 13%)`, `${INK} / 34%)`)};
  --lt-edge-dark: ${fall("oklch(1 0 0 / 38%)")};
  --lt-thumb: oklch(1 0 0); --lt-thumb-on: oklch(1 0 0);
}
.dark {
  --lt-pane: oklch(0.105 0.003 286); --lt-pane-deep: oklch(0.09 0.003 286); --lt-pane-in: oklch(0.125 0.003 286);
  --lt-pane-shade: oklch(0 0 0 / 60%); --lt-pane-shade-up: oklch(0 0 0 / 75%); --lt-pane-lip: oklch(1 0 0 / 10%);
  --lt-key: oklch(0.235 0.004 286); --lt-key-up: oklch(0.262 0.004 286); --lt-chosen: oklch(0.33 0.004 286);
  --lt-edge: ${fall("oklch(1 0 0 / 34%)")};
  --lt-edge-up: ${fall("oklch(1 0 0 / 46%)")};
  --lt-edge-dark: ${fall("oklch(1 0 0 / 0%)")};
  --lt-thumb: oklch(0.36 0.004 286); --lt-thumb-on: oklch(0.2 0.004 286);
}
.surface-display {
  --lt-pane: color-mix(in oklab, var(--display), oklch(0 0 0) 32%); --lt-pane-deep: color-mix(in oklab, var(--display), oklch(0 0 0) 40%);
  --lt-pane-in: color-mix(in oklab, var(--display), oklch(0 0 0) 20%);
  --lt-pane-shade: oklch(0 0 0 / 50%); --lt-pane-shade-up: oklch(0 0 0 / 65%); --lt-pane-lip: oklch(1 0 0 / 10%);
  --lt-key: var(--display-step); --lt-key-up: color-mix(in oklab, var(--display-step), oklch(1 0 0) 7%);
  --lt-chosen: color-mix(in oklab, var(--display-step), oklch(1 0 0) 14%);
  --lt-edge: ${fall("var(--display-light)")};
  --lt-edge-up: ${fall("var(--display-light)")};
  --lt-edge-dark: ${fall("oklch(1 0 0 / 0%)")};
  --lt-thumb: color-mix(in oklab, var(--display-step), oklch(1 0 0) 16%); --lt-thumb-on: var(--display);
}
`;

/** A sunk part: the shade at its top, the light on its far lip. */
const SUNK = (shade = "var(--lt-pane-shade)") =>
  `inset 0 1px 0 0 ${shade}, inset 0 -1px 0 0 var(--lt-pane-lip)`;

/** What stands up: the ground's edge (or the one given) on `::after`. */
const edged = (sel: string, edge = "var(--lt-edge)") => `
${each(sel, "::after")} { ${LIGHT_ON("1px", edge)} }
`;

/* ── a field: a pane under the light ─────────────────────────────────── */

const FIELD = `
${FIELDS} { background-color: var(--lt-pane); --i-body: ${SUNK()}; }
${each(FIELDS, HOVER + LIVE)} { --i-body: ${SUNK("var(--lt-pane-shade-up)")}; }
${each(FIELDS, FOCUS)} { background-color: var(--lt-pane-in); --i-body: ${SUNK("var(--lt-pane-shade-up)")}; }
${each(FIELDS, ERROR)} { --i-body: inset 0 0 0 1.5px var(--destructive); }
`;

/* ── the button family: faces whose edges catch the light ────────────── */

const QUIET = btn("outline", "secondary", "destructive");

const BUTTONS = `
${btn("default")} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 -1px 0 0 oklch(0 0 0 / 14%); }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--ink) 88%, var(--background)); }
${edged(btn("default"), "var(--lt-edge-dark)")}

${QUIET} { background: var(--lt-key); color: var(--foreground); }
${QUIET}${HOVER}${LIVE} { background: var(--lt-key-up); }
${each(`${QUIET}${HOVER}${LIVE}`, "::after")} { background: var(--lt-edge-up) border-box; }
${btn("destructive")} { color: var(--destructive); }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 10%, var(--lt-key)); }
${edged(QUIET)}

${btn("ghost")} { background: transparent; color: var(--foreground); }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone-2); }

/* Off, a key loses its edge: a flat face, quieter. */
${btn("default")}${OFF}::after, ${QUIET}${OFF}::after { opacity: 0; }
${BTN}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

${CHIP} { background: var(--lt-key); }
${CHIP}${HOVER}${LIVE} { background: var(--lt-key-up); color: var(--foreground); }
${edged(`${CHIP}:not(${ON})`)}
${CHIP}${ON} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 -1px 0 0 oklch(0 0 0 / 14%); }
${edged(`${CHIP}${ON}`, "var(--lt-edge-dark)")}

/* On a photograph the white Add keeps its surface, its foot in shade as a white key's is. */
${btn("on-photo")} {
  background: oklch(1 0 0); color: oklch(0.13 0.004 286);
  --i-body: inset 0 -1px 0 0 oklch(0 0 0 / 12%), 0 1px 3px 0 oklch(0 0 0 / 28%);
}
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.94 0 0); }
`;

/* ── what is chosen: the lightest face, its edge caught ──────────────── */

const PICKED = [`${SEGMENT}${ON}`, `${TAB}${TAB_ON}`].join(", ");

const CHOSEN = `
${SEGMENTS}, ${TABS} { background: var(--lt-pane); box-shadow: ${SUNK()}; }
${PICKED} { background: var(--lt-chosen); color: var(--foreground); }
${TAB}${TAB_ON}::after { display: block; }
${edged(PICKED)}

${RADIO_CARD} { background: var(--lt-pane) !important; --i-body: ${SUNK()}; }
${RADIO_CARD}${HOVER} { --i-body: ${SUNK("var(--lt-pane-shade-up)")}; }
${RADIO_CARD}${CARD_ON} {
  background: var(--lt-chosen) !important; --background: var(--lt-pane-in);
  --i-body: inset 0 0 0 0 transparent, inset 0 0 0 0 transparent;
}
${edged(`${RADIO_CARD}${CARD_ON}`)}
`;

/* ── the toggles: panes that fill with ink, thumbs whose edges are caught ─ */

const TOGGLES = `
${SWITCH} { background: var(--lt-pane-deep); --i-body: ${SUNK()}; }
${SWITCH}${HOVER}${LIVE}:not(${SWITCH_ON}) { --i-body: ${SUNK("var(--lt-pane-shade-up)")}; }
${SWITCH}${SWITCH_ON} { background: var(--ink); --i-body: inset 0 1px 0 0 oklch(0 0 0 / 20%), inset 0 -1px 0 0 oklch(1 0 0 / 14%); }
${SWITCH}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${THUMB} { background: var(--lt-thumb); box-shadow: none; }
${SWITCH}${SWITCH_ON} ${THUMB} { background: var(--lt-thumb-on); }
${THUMB}::after { ${LIGHT_ON("1px", "var(--lt-edge)")} }

${CHECK}, ${RADIO} { background: var(--lt-pane-deep); --i-body: ${SUNK("var(--lt-pane-shade-up)")}; }
${CHECK}${HOVER}${LIVE}:not(${CHECKED}), ${RADIO}${HOVER}${LIVE}:not(${CHECKED}) { --i-body: ${SUNK(`color-mix(in oklab, var(--foreground) 34%, transparent)`)}; }
${CHECK}${CHECKED}, ${RADIO}${CHECKED} { background: var(--ink); color: var(--ink-fg); --i-body: inset 0 1px 0 0 oklch(0 0 0 / 20%), inset 0 -1px 0 0 oklch(1 0 0 / 14%); }
${CHECK}${ERROR}, ${RADIO}${ERROR} { --i-body: inset 0 0 0 1.5px var(--destructive); }

[data-slot="slider-track"] { background: var(--lt-pane-deep); box-shadow: ${SUNK()}; }
[data-slot="slider-range"] { background: var(--ink); }
${SLIDER_THUMB} { background: var(--lt-thumb); }
${SLIDER_THUMB}::after { ${LIGHT_ON("1px", "var(--lt-edge)")} }
`;

export const LIT_CSS = TOKENS + FIELD + BUTTONS + CHOSEN + TOGGLES;
