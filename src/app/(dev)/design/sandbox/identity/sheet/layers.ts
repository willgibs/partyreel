import type { LayersId } from "../model";

import { MARKS } from "./marks";
import { CARDS, OVERLAYS, QUICK, ROW_ON, ROWS, TOAST, WORK } from "./states";

/**
 * LAYERS: CARDS, AND EVERYTHING THAT OPENS OVER A PAGE (a menu, a popover, a
 * select, a tooltip, a toast, a dialog, a panel, a sheet), and the code on
 * its white mat. Three materials, each opaque: glass stays media chrome (the
 * glass ruling), so no build here blurs what is under a panel.
 *
 * Two kinds of layer, by frequency (the floating-layer contract's clocks): the
 * QUICK ones a press opens and the next press closes, and the WORK ones a
 * host does something inside. A build may treat them alike or apart.
 */

/** Laid out once: the code mat is a stand-in; a toast's action is a small primary in every build. */
const BASE = `
${TOAST} [data-button] {
  background: var(--primary) !important; color: var(--primary-foreground) !important;
  border: 0 !important; height: 26px !important; padding: 0 10px !important; border-radius: 999px !important;
}
[data-slot="code-mat"] { position: relative; display: inline-flex; padding: 10px; background: oklch(1 0 0); line-height: 0; }
[data-slot="code-mat"] svg { display: block; }
`;

/* ── MATTE: r1's body panels, refined ─────────────────────────────────── */

/**
 * MATTE: every layer in the body's own material. A card is the body's step
 * with a hairline and a light edge above; a floating panel the same, lifted
 * by the layer's shadow; a highlighted row carries a small ink tick at its
 * left, the camera's menu cursor; a tooltip is an ink capsule.
 */
const MATTE = `
${CARDS} {
  border-radius: 8px; background-color: var(--card);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 0 0 1px var(--border);
}
[data-slot="card-footer"] { background: transparent; border-color: var(--border); }

${QUICK} {
  border-radius: 12px; background: var(--popover); color: var(--popover-foreground);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 0 0 1px var(--border), var(--shadow-layer);
}
${ROWS} { border-radius: 7px; }
${ROW_ON} {
  background-color: var(--accent) !important; color: var(--accent-foreground);
  background-image: linear-gradient(var(--foreground) 0 0); background-size: 2px 12px;
  background-position: 3px 50%; background-repeat: no-repeat;
}
[data-slot="dropdown-menu-label"], [data-slot="select-label"] { color: var(--muted-foreground); opacity: 1; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: var(--border); }

${WORK} { background: var(--popover); }
[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"]), [data-slot="dialog-content"] {
  border-radius: 14px; box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 0 0 1px var(--border), var(--shadow-layer);
}
[data-slot="popup-content"][data-shape="panel"] { border-radius: 14px 0 0 14px; box-shadow: inset 1px 0 0 var(--border), var(--shadow-layer); border: 0; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 16px 16px 0 0; box-shadow: inset 0 1px 0 var(--border), var(--shadow-layer); border: 0; }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; background: var(--background); }
${OVERLAYS} { background: oklch(0 0 0 / 46%); -webkit-backdrop-filter: none; backdrop-filter: none; }

[data-slot="tooltip-content"] { border-radius: 7px; background: var(--foreground); color: var(--background); box-shadow: var(--shadow-layer); }
[data-slot="tooltip-arrow"] { background: var(--foreground); fill: var(--foreground); }

${TOAST}[data-styled="true"] {
  border-radius: 12px !important; border: 0 !important; background: var(--popover) !important; color: var(--popover-foreground) !important;
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 0 0 1px var(--border), var(--shadow-layer) !important;
}

[data-slot="code-mat"] { border-radius: 10px; box-shadow: 0 0 0 1px var(--border), var(--shadow-lift); }
${TOAST} [data-button] { border-radius: 7px !important; }
`;

/* ── DISPLAY: the camera's own screen ─────────────────────────────────── */

/**
 * THE DISPLAY: every QUICK layer (a menu, a popover, a select, a tooltip, a
 * toast, the Add's rows) is the camera's own screen, the same near-black on
 * paper and in the room, its chosen row a light cursor box. A card lies flat
 * as its tone alone, with no line. A WORK layer (a dialog, a panel, a sheet)
 * stays in the body, since a host works there.
 *
 * ★ THE DISPLAY RE-DECLARES THE TOKENS INSIDE IT, so every part a panel holds
 * (a row's glyph, a muted line, a separator, a destructive row) reads the
 * screen's own greys without a rule of its own.
 */
const DISPLAY_TOKENS = `
  --popover: var(--vf-display); --popover-foreground: var(--vf-display-fg);
  --foreground: var(--vf-display-fg); --card: var(--vf-display-step); --card-foreground: var(--vf-display-fg);
  --muted: var(--vf-display-step); --muted-foreground: var(--vf-display-muted); --faint: oklch(0.56 0.005 286);
  --accent: oklch(1 0 0 / 9%); --accent-foreground: var(--vf-display-fg);
  --secondary: var(--vf-display-step); --secondary-foreground: var(--vf-display-fg);
  --border: var(--vf-display-edge); --input: oklch(1 0 0 / 20%);
  --primary: var(--vf-display-fg); --primary-foreground: var(--vf-display);
  --destructive: oklch(0.7 0.19 24); --ring: var(--vf-display-fg);
  --vf-ring: oklch(1 0 0 / 22%); --vf-ring-strong: oklch(1 0 0 / 46%);
  --vf-wash: oklch(1 0 0 / 7%); --vf-wash-strong: oklch(1 0 0 / 12%);
  --vf-key-hi: oklch(1 0 0 / 8%); --vf-key-lo: oklch(0 0 0 / 45%); --vf-well-shade: oklch(0 0 0 / 40%);
  color-scheme: dark;
`;
const DISPLAY = `
${CARDS} { border-radius: 12px; background-color: var(--card); box-shadow: none; }
[data-slot="card-footer"] { background: var(--vf-wash); border-color: transparent; }

${QUICK}, [data-slot="tooltip-content"], ${TOAST}[data-styled="true"] { ${DISPLAY_TOKENS} }
${QUICK} {
  border-radius: 16px; background: var(--vf-display); color: var(--vf-display-fg);
  box-shadow: inset 0 0 0 1px var(--vf-display-edge), var(--shadow-layer);
}
${ROWS} { border-radius: 10px; }
${ROW_ON} {
  background-color: oklch(1 0 0 / 8%) !important; color: var(--vf-display-fg);
  box-shadow: inset 0 0 0 1.5px oklch(1 0 0 / 50%);
}
[data-slot="dropdown-menu-label"], [data-slot="select-label"] { color: var(--vf-display-muted); opacity: 1; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: var(--vf-display-edge); }

${WORK} { background: var(--popover); }
[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"]), [data-slot="dialog-content"] {
  border-radius: 20px; box-shadow: var(--shadow-layer);
}
[data-slot="popup-content"][data-shape="panel"] { border-radius: 20px 0 0 20px; box-shadow: var(--shadow-layer); border: 0; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 22px 22px 0 0; box-shadow: var(--shadow-layer); border: 0; }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; background: var(--background); }
${OVERLAYS} { background: oklch(0 0 0 / 52%); -webkit-backdrop-filter: none; backdrop-filter: none; }

[data-slot="tooltip-content"] {
  border-radius: 10px; background: var(--vf-display); color: var(--vf-display-fg);
  box-shadow: inset 0 0 0 1px var(--vf-display-edge), var(--shadow-layer);
}
[data-slot="tooltip-arrow"] { background: var(--vf-display); fill: var(--vf-display); }

${TOAST}[data-styled="true"] {
  border-radius: 16px !important; border: 0 !important; background: var(--vf-display) !important; color: var(--vf-display-fg) !important;
  box-shadow: inset 0 0 0 1px var(--vf-display-edge), var(--shadow-layer) !important;
}

[data-slot="code-mat"] { border-radius: 14px; box-shadow: var(--shadow-lift); }
`;

/* ── CORNERS: the viewfinder's own frame ──────────────────────────────── */

/**
 * CORNERS: a surface is framed, not boxed. A card is its tone with four
 * corner marks and no line; a floating panel is square-cornered with its
 * marks and the layer's shadow; the highlighted row wears the frame itself,
 * the lock as selection; the code's mat stands inside a scanner's frame.
 */
const CORNERS = `
${CARDS} {
  border-radius: 2px; background-color: var(--card); box-shadow: none;
  --m-c: var(--vf-ring-strong); --m-a: 11px; --m-w: 1.5px; ${MARKS}
}
[data-slot="card-footer"] { background: transparent; border-color: var(--border); }

${QUICK} {
  border-radius: 3px; background-color: var(--popover); color: var(--popover-foreground);
  --m-c: var(--foreground); --m-a: 10px; --m-w: 1.5px; ${MARKS}
  box-shadow: var(--shadow-layer);
}
${ROWS} { border-radius: 0; }
${ROW_ON} {
  background-color: var(--vf-wash) !important; color: var(--foreground);
  --m-c: var(--foreground); --m-a: 6px; --m-w: 1.5px; ${MARKS}
}
[data-slot="dropdown-menu-label"], [data-slot="select-label"] { color: var(--muted-foreground); opacity: 1; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: var(--border); }

${WORK} { background-color: var(--popover); }
[data-slot="popup-content"]:is([data-shape="dialog"],[data-shape="wide"]), [data-slot="dialog-content"],
[data-slot="popup-content"][data-shape="panel"], [data-slot="popup-content"][data-shape="sheet"] {
  border-radius: 3px; border: 0; box-shadow: var(--shadow-layer);
  --m-c: var(--foreground); --m-a: 14px; --m-w: 2px; ${MARKS}
}
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; background: var(--background); background-image: none; }
${OVERLAYS} { background: oklch(0 0 0 / 50%); -webkit-backdrop-filter: none; backdrop-filter: none; }

[data-slot="tooltip-content"] { border-radius: 2px; background: var(--foreground); color: var(--background); box-shadow: var(--shadow-layer); }
[data-slot="tooltip-arrow"] { background: var(--foreground); fill: var(--foreground); border-radius: 0; }

${TOAST}[data-styled="true"] {
  border-radius: 3px !important; border: 0 !important; background-color: var(--popover) !important; color: var(--popover-foreground) !important;
  --m-c: var(--foreground); --m-a: 10px; --m-w: 1.5px; ${MARKS.replace(/;/g, " !important;")}
  box-shadow: var(--shadow-layer) !important;
}

[data-slot="code-mat"] { border-radius: 2px; box-shadow: var(--shadow-lift); }
[data-slot="code-mat"]::before {
  content: ""; position: absolute; inset: -9px; pointer-events: none;
  --m-c: var(--foreground); --m-a: 14px; --m-w: 2px; ${MARKS}
}
${TOAST} [data-button] { border-radius: 2px !important; }
`;

export const LAYERS_CSS: Record<LayersId, string> = {
  matte: BASE + MATTE,
  display: BASE + DISPLAY,
  corners: BASE + CORNERS,
};
