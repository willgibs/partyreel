import { CARDS, OVERLAYS, QUICK, ROW_ON, ROWS, TOAST, WORK } from "./states";

/**
 * LAYERS: CARDS, AND EVERYTHING THAT OPENS OVER A PAGE (a menu, a popover, a
 * select, a tooltip, a toast, a dialog, a panel, a sheet), in round two's
 * pick, `display` (Will, 2026-10-03: "I like the slightly cleaner design of
 * this one, and black surfaces getting attention on white body when popped
 * in"). Drawn here until `identity-wiring` wires it at the source; then this
 * sheet leaves, and `room.ts` and `edge.ts` stand on production's.
 *
 * Two kinds of layer, by frequency (the floating-layer contract's clocks): the
 * QUICK ones a press opens and the next press closes, which are the camera's
 * own screen, near-black on paper; and the WORK ones a host does something
 * inside (a dialog, a panel, a sheet), which stay in the body. A card lies
 * flat as its tone alone.
 *
 * ★ A POP-OUT READS THE `--vf-pop*` TOKENS, DECLARED ON BOTH GROUNDS. Paper's
 * are declared here (the display); the room's are the `room` ask's
 * (`room.ts`), so the same menu is the display on paper and whichever the
 * room picks beside it, in one document. Inside a pop-out every token is
 * re-declared from them, so whatever a pop-out holds (a row's glyph, a muted
 * line, a separator, a destructive row, a field) reads its own greys.
 */

/** Paper's pop-out: the camera's own screen. */
export const POP_PAPER = `
:root, .surface-paper {
  --vf-pop: var(--vf-display); --vf-pop-step: var(--vf-display-step);
  --vf-pop-fg: var(--vf-display-fg); --vf-pop-muted: var(--vf-display-muted); --vf-pop-faint: oklch(0.56 0.005 286);
  --vf-pop-edge: var(--vf-display-edge); --vf-pop-input: oklch(1 0 0 / 20%);
  --vf-pop-wash: oklch(1 0 0 / 7%); --vf-pop-wash-strong: oklch(1 0 0 / 12%);
  --vf-pop-ring: oklch(1 0 0 / 22%); --vf-pop-ring-strong: oklch(1 0 0 / 46%);
  --vf-pop-key-hi: oklch(1 0 0 / 8%); --vf-pop-key-lo: oklch(0 0 0 / 45%); --vf-pop-well-shade: oklch(0 0 0 / 40%);
  --vf-pop-destructive: oklch(0.7 0.19 24);
  --vf-pop-cursor: oklch(1 0 0 / 50%); --vf-pop-cursor-bg: oklch(1 0 0 / 8%);
  --vf-pop-light: oklch(1 0 0 / 30%);
  --vf-pop-scheme: dark;
}
`;

/** Every token a pop-out's contents read, re-declared from the pop-out's own. */
const POP_TOKENS = `
  --popover: var(--vf-pop); --popover-foreground: var(--vf-pop-fg);
  --foreground: var(--vf-pop-fg); --card: var(--vf-pop-step); --card-foreground: var(--vf-pop-fg);
  --muted: var(--vf-pop-step); --muted-foreground: var(--vf-pop-muted); --faint: var(--vf-pop-faint);
  --accent: var(--vf-pop-wash); --accent-foreground: var(--vf-pop-fg);
  --secondary: var(--vf-pop-step); --secondary-foreground: var(--vf-pop-fg);
  --border: var(--vf-pop-edge); --input: var(--vf-pop-input);
  --primary: var(--vf-pop-fg); --primary-foreground: var(--vf-pop);
  --destructive: var(--vf-pop-destructive); --ring: var(--vf-pop-fg);
  --vf-ring: var(--vf-pop-ring); --vf-ring-strong: var(--vf-pop-ring-strong);
  --vf-wash: var(--vf-pop-wash); --vf-wash-strong: var(--vf-pop-wash-strong);
  --vf-key-hi: var(--vf-pop-key-hi); --vf-key-lo: var(--vf-pop-key-lo); --vf-well-shade: var(--vf-pop-well-shade);
  color-scheme: var(--vf-pop-scheme);
`;

/** Laid out once: a toast's action is a small primary. */
const BASE = `
${TOAST} [data-button] {
  background: var(--primary) !important; color: var(--primary-foreground) !important;
  border: 0 !important; height: 26px !important; padding: 0 10px !important; border-radius: 999px !important;
}
`;

const DISPLAY = `
${CARDS} { border-radius: 12px; background-color: var(--card); box-shadow: none; }
[data-slot="card-footer"] { background: var(--vf-wash); border-color: transparent; }

${QUICK}, [data-slot="tooltip-content"], ${TOAST}[data-styled="true"] { ${POP_TOKENS} }
${QUICK} {
  border-radius: 16px; background: var(--vf-pop); color: var(--vf-pop-fg);
  box-shadow: inset 0 0 0 1px var(--vf-pop-edge), var(--shadow-layer);
}
${ROWS} { border-radius: 10px; }
${ROW_ON} {
  background-color: var(--vf-pop-cursor-bg) !important; color: var(--vf-pop-fg);
  box-shadow: inset 0 0 0 1.5px var(--vf-pop-cursor);
}
[data-slot="dropdown-menu-label"], [data-slot="select-label"] { color: var(--vf-pop-muted); opacity: 1; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: var(--vf-pop-edge); }

${WORK} { background: var(--popover); }
[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"]), [data-slot="dialog-content"] {
  border-radius: 20px; box-shadow: var(--shadow-layer);
}
[data-slot="popup-content"][data-shape="panel"] { border-radius: 20px 0 0 20px; box-shadow: var(--shadow-layer); border: 0; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 22px 22px 0 0; box-shadow: var(--shadow-layer); border: 0; }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; background: var(--background); }
${OVERLAYS} { background: oklch(0 0 0 / 52%); -webkit-backdrop-filter: none; backdrop-filter: none; }

[data-slot="tooltip-content"] {
  border-radius: 10px; background: var(--vf-pop); color: var(--vf-pop-fg);
  box-shadow: inset 0 0 0 1px var(--vf-pop-edge), var(--shadow-layer);
}
[data-slot="tooltip-arrow"] { background: var(--vf-pop); fill: var(--vf-pop); }

${TOAST}[data-styled="true"] {
  border-radius: 16px !important; border: 0 !important; background: var(--vf-pop) !important; color: var(--vf-pop-fg) !important;
  box-shadow: inset 0 0 0 1px var(--vf-pop-edge), var(--shadow-layer) !important;
}
`;

export const LAYERS_CSS = POP_PAPER + BASE + DISPLAY;
