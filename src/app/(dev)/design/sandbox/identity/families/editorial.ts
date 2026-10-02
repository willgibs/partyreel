import {
  each,
  FIELDS,
  FOCUS,
  HOVER,
  PANELS,
  PRESS,
  RINGED,
  ROW_ON,
  rowOnThen,
  ROWS,
} from "./states";

/**
 * EDITORIAL: TYPE AND HAIRLINES.
 *
 * The printed page as a material. Structure comes from type and from one ink
 * line, never from boxes and shades: an action is a line or a slab of ink, a
 * field is the line you write on, a card is the rule a section opens under, a
 * layer is a sheet framed in ink and lying flat. Corners are square (2px, so
 * an edge still reads as made rather than cut), photographs are prints
 * (square), and every control speaks in small capitals on the label step's
 * tracking. Nothing glows and nothing casts a shadow: the photographs are the
 * only thing on the page with depth.
 *
 * Motion is a printer's: a line inverts, an underline draws, a press sets the
 * key down a pixel. No control grows or shrinks.
 */
export const EDITORIAL_CSS = `
/* ── material: paper and ink ─────────────────────────────────────────── */
:root, .surface-paper {
  --background: oklch(0.993 0.0015 286);
  --foreground: oklch(0.13 0.006 286);
  --card: oklch(0.993 0.0015 286);
  --card-foreground: oklch(0.13 0.006 286);
  --popover: oklch(0.997 0.001 286);
  --popover-foreground: oklch(0.13 0.006 286);
  --primary: oklch(0.13 0.006 286);
  --primary-foreground: oklch(0.993 0.0015 286);
  --secondary: oklch(0.945 0.003 286);
  --secondary-foreground: oklch(0.13 0.006 286);
  --muted: oklch(0.955 0.003 286);
  --muted-foreground: oklch(0.43 0.008 286);
  --faint: oklch(0.6 0.007 286);
  --accent: oklch(0.945 0.003 286);
  --accent-foreground: oklch(0.13 0.006 286);
  --border: oklch(0.13 0.006 286 / 14%);
  --input: oklch(0.13 0.006 286 / 40%);
  --ring: oklch(0.13 0.006 286);
  --shadow-lift: 0 0 0 0 oklch(0 0 0 / 0);
  --shadow-layer: 0 0 0 0 oklch(0 0 0 / 0);
}
.dark {
  --background: oklch(0.115 0.004 286);
  --foreground: oklch(0.965 0.003 286);
  --card: oklch(0.115 0.004 286);
  --card-foreground: oklch(0.965 0.003 286);
  --popover: oklch(0.145 0.004 286);
  --popover-foreground: oklch(0.965 0.003 286);
  --primary: oklch(0.965 0.003 286);
  --primary-foreground: oklch(0.115 0.004 286);
  --secondary: oklch(0.2 0.004 286);
  --secondary-foreground: oklch(0.965 0.003 286);
  --muted: oklch(0.165 0.004 286);
  --muted-foreground: oklch(0.72 0.008 286);
  --faint: oklch(0.56 0.007 286);
  --accent: oklch(0.2 0.004 286);
  --accent-foreground: oklch(0.965 0.003 286);
  --border: oklch(0.965 0.003 286 / 16%);
  --input: oklch(0.965 0.003 286 / 42%);
  --ring: oklch(0.965 0.003 286);
  --shadow-lift: 0 0 0 0 oklch(0 0 0 / 0);
  --shadow-layer: 0 0 0 0 oklch(0 0 0 / 0);
}
:root {
  --radius: 0.125rem;
  --radius-action: 0.1875rem;
  --radius-action-sm: 0.125rem;
  --radius-float: 0.125rem;
  --radius-tile: 0px;
}

/* ── actions: a slab of ink, a line of ink, small capitals ───────────── */
[data-slot="button"] {
  border-radius: 2px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  transition: background-color 140ms var(--ease-emphasis), color 140ms var(--ease-emphasis),
    border-color 140ms var(--ease-emphasis), box-shadow 140ms var(--ease-emphasis), translate 90ms linear;
}
[data-slot="button"]:is([data-size="sm"],[data-size="xs"]) { font-size: 10.5px; }
[data-slot="button"][data-size="cta"] { font-size: 12.5px; letter-spacing: 0.1em; }
[data-slot="button"]${PRESS} { scale: 1; translate: 0 1px; }
[data-slot="button"][data-variant="default"] {
  background: var(--foreground); color: var(--background); border-color: var(--foreground);
}
[data-slot="button"][data-variant="default"]${HOVER} {
  background: color-mix(in oklab, var(--foreground) 82%, var(--background));
}
[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"]) {
  background: transparent; color: var(--foreground); border-color: var(--foreground);
}
[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"])${HOVER} {
  background: var(--foreground); color: var(--background);
}
[data-slot="button"][data-variant="ghost"] { background: transparent; }
[data-slot="button"][data-variant="ghost"]${HOVER} {
  background: transparent; color: var(--foreground); box-shadow: inset 0 -1px 0 currentColor;
}
[data-slot="button"][data-variant="ghost"]:is([data-size^="icon"])${HOVER} {
  background: var(--muted); box-shadow: none;
}
[data-slot="button"][data-variant="destructive"] {
  background: transparent; color: var(--destructive); border-color: currentColor;
}
[data-slot="button"][data-variant="destructive"]${HOVER} {
  background: var(--destructive); color: var(--background); border-color: var(--destructive);
}
[data-slot="button"][data-variant="link"] {
  text-transform: none; letter-spacing: 0; font-size: 14px; font-weight: 500;
  text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px;
  padding-inline: 0; height: auto;
}
[data-slot="button"][data-variant="link"]${HOVER} { text-decoration-thickness: 2px; }
[data-slot="button"]${FOCUS} {
  outline: 1.5px solid var(--foreground); outline-offset: 3px; box-shadow: none;
}
[data-slot="button"]:disabled {
  opacity: 1; background: transparent; color: var(--faint); border-color: var(--border);
}
[data-slot="button"][data-variant="default"]:disabled { background: var(--muted); border-color: var(--muted); }

/* chips: words in a hairline box; on is the ink slab */
[data-slot="toggle-group"] { gap: 0; border-radius: 0; }
[data-slot="toggle-group-item"] {
  border-radius: 0; border: 1px solid var(--foreground); margin-left: -1px;
  background: transparent; color: var(--foreground);
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
  transition: background-color 120ms linear, color 120ms linear;
}
[data-slot="toggle-group-item"]:first-child { margin-left: 0; }
[data-slot="toggle-group-item"]${HOVER} { background: var(--muted); }
[data-slot="toggle-group-item"]:is([data-state="on"],[aria-pressed="true"]) {
  background: var(--foreground); color: var(--background);
}
[data-slot="toggle-group-item"]${FOCUS} { outline: 1.5px solid var(--foreground); outline-offset: 3px; box-shadow: none; z-index: 1; }

/* ── fields: the line you write on ──────────────────────────────────── */
${FIELDS} {
  border-width: 0 0 1px; border-style: solid; border-color: var(--input);
  border-radius: 0; background: transparent; padding-inline: 0; height: 36px;
  font-size: 15px; box-shadow: none;
  transition: border-color 140ms var(--ease-emphasis), box-shadow 140ms var(--ease-emphasis);
}
${each(FIELDS, FOCUS)} {
  border-color: var(--foreground); box-shadow: 0 1px 0 0 var(--foreground); outline: none;
}
${each(FIELDS, '[aria-invalid="true"]')} {
  border-color: var(--destructive); box-shadow: 0 1px 0 0 var(--destructive);
}
${each(FIELDS, ":disabled")} {
  opacity: 1; color: var(--faint); border-bottom-style: dashed; background: transparent;
}
[data-slot="select-trigger"] { gap: 12px; }
[data-slot="label"], [data-slot="form-label"] {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--muted-foreground);
}

/* the switch: a square key in a frame */
[data-slot="switch"] {
  border-radius: 1px; width: 34px; height: 18px; border: 1px solid var(--foreground);
  background: transparent !important; box-shadow: none;
}
[data-slot="switch"][data-state="checked"] { background: var(--foreground) !important; }
[data-slot="switch-thumb"] {
  border-radius: 0; width: 12px; height: 12px; background: var(--foreground) !important;
  translate: 2px 0 !important; transition: translate 140ms var(--ease-in-out-strong);
}
[data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] {
  background: var(--background) !important; translate: 18px 0 !important;
}
[data-slot="switch"]${FOCUS} { outline: 1.5px solid var(--foreground); outline-offset: 3px; box-shadow: none; }
[data-slot="switch"]:disabled { opacity: 0.35; }

/* segmented: section words over one rule, the chosen one underlined */
[data-slot="tabs-list"] {
  background: transparent; border-radius: 0; padding: 0; gap: 22px; height: auto;
  box-shadow: inset 0 -1px 0 var(--border);
}
[data-slot="tabs-trigger"] {
  flex: none; height: 34px; padding: 0; border: 0; border-radius: 0; background: transparent !important;
  color: var(--muted-foreground); font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em;
  text-transform: uppercase; box-shadow: none;
}
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] {
  color: var(--foreground); box-shadow: inset 0 -2px 0 var(--foreground) !important;
}
[data-slot="tabs-trigger"]${FOCUS} { outline: 1.5px solid var(--foreground); outline-offset: 2px; }

/* ── surfaces: a rule opens a section; a layer is a framed sheet ─────── */
[data-slot="card"], ${RINGED} {
  border-radius: 0; background: transparent; box-shadow: none;
  border-top: 1px solid var(--foreground);
}
[data-slot="card-title"] { letter-spacing: -0.01em; }
[data-slot="card-footer"] { background: transparent; border-top: 1px solid var(--border); }
${PANELS} {
  border-radius: 2px; background: var(--popover); box-shadow: 0 0 0 1px var(--foreground);
}
[data-slot="responsive-menu-rows"] { gap: 6px; }
${ROWS} { border-radius: 0; }
${ROW_ON} { background: var(--foreground) !important; color: var(--background) !important; }
${rowOnThen("svg")} { color: var(--background) !important; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: var(--foreground); opacity: 0.16; }
[data-slot="dropdown-menu-label"], [data-slot="select-label"] {
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; opacity: 1;
  color: var(--muted-foreground);
}
[data-slot="popup-overlay"] { background: color-mix(in oklab, var(--background) 72%, transparent); backdrop-filter: none; }
[data-slot="popup-header"] [data-slot="button"][data-popup-up] { text-transform: uppercase; }
[data-slot="tooltip-content"] {
  border-radius: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  box-shadow: none;
}
[data-slot="tooltip-arrow"] { border-radius: 0; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  border-radius: 2px !important; box-shadow: none !important; border: 0 !important;
  background: var(--foreground) !important; color: var(--background) !important;
  font-size: 11.5px !important; font-weight: 600 !important; letter-spacing: 0.08em !important; text-transform: uppercase;
}
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="success"] { box-shadow: inset 3px 0 0 var(--success) !important; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="warning"] { box-shadow: inset 3px 0 0 var(--warning) !important; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="error"] { box-shadow: inset 3px 0 0 var(--destructive) !important; }
[data-sonner-toaster] [data-sonner-toast] [data-icon] { color: var(--background) !important; }

/* ── status: a mark is a word in a frame ────────────────────────────── */
[data-slot="badge"] {
  border-radius: 0; border: 1px solid currentColor; background: transparent;
  height: 18px; padding-inline: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase;
}
[data-slot="badge"][data-variant="default"] { background: var(--foreground); color: var(--background); border-color: var(--foreground); }
[data-slot="badge"]:is([data-variant="secondary"],[data-variant="outline"]) { color: var(--foreground); }
[data-slot="badge"][data-variant="warning"] { color: oklch(0.55 0.13 70); }
.dark [data-slot="badge"][data-variant="warning"] { color: var(--warning); }
[data-slot="progress"] { height: 2px; border-radius: 0; background: var(--border); }
[data-slot="progress-indicator"] { background: var(--foreground); }
[data-slot="skeleton"] { border-radius: 0; background-color: var(--muted); }
[data-slot="avatar"], [data-slot="avatar"]::after { border-radius: 2px !important; }
[data-slot="avatar-group-count"] { border-radius: 2px; }
[data-slot="separator"] { background: var(--border); }

/* ── the screens' own parts, wearing the family ─────────────────────── */
h1.font-heading, h2.font-heading { letter-spacing: -0.03em; }
[data-code-mark] {
  border-radius: 0 !important; box-shadow: 0 0 0 2px var(--background) !important;
  background: var(--foreground) !important; color: var(--background) !important;
}
[data-code-door] button[aria-label^="Show the code"] { border-radius: 0; outline: 1px solid var(--foreground); outline-offset: -1px; }
[role="group"][aria-label="This event"] > a, [role="group"][aria-label="This event"] > button {
  border-radius: 0; border-color: transparent; border-top: 1px solid var(--foreground);
  background: transparent;
}
[data-checklist] .rounded-full { border-radius: 0 !important; }
[data-checklist-item] .bg-success { background: var(--foreground) !important; color: var(--background) !important; }
[data-checklist] .bg-success { background: var(--foreground) !important; }
[data-door-choice] {
  border-radius: 0 !important; background: transparent !important; box-shadow: none !important;
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
}
[data-door-choice][data-state="on"] { color: var(--foreground); box-shadow: inset 0 -2px 0 var(--foreground) !important; }
[data-door-choice] svg { display: none; }
[role="group"][aria-label="What the link opens"] {
  background: transparent !important; border-radius: 0; padding: 0; gap: 0;
  box-shadow: inset 0 -1px 0 var(--border);
}
[data-door-gate] { border-radius: 0 !important; border-width: 0 0 1px !important; border-color: var(--border) !important; background: transparent !important; padding-inline: 0 !important; }
[data-door-gate][data-state="on"] { border-color: var(--foreground) !important; }
[data-door-step] > span > span.rounded-full { border-radius: 0 !important; background: transparent; box-shadow: inset 0 0 0 1px var(--foreground); color: var(--foreground); }
[data-checklist] span[aria-hidden].h-1\.5 { height: 2px; }
[data-guest-dock] > [role="group"] { border-top: 1px solid var(--foreground); }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"],[data-shape="panel"]) { box-shadow: none; }
[data-slot="popup-content"][data-shape="panel"] { box-shadow: -1px 0 0 var(--foreground); }

[data-slot="responsive-menu-item"] {
  font-size: 12px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
}
[data-slot="responsive-menu-item"] + [data-slot="responsive-menu-item"] { box-shadow: inset 0 1px 0 var(--border); }
[data-slot="responsive-menu-rows"] h2, [data-slot="responsive-menu-note"] {
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
}

/* ── on a photograph: labels and keys, cut square ───────────────────── */
[data-eh="photo-type"] { text-transform: uppercase; letter-spacing: -0.025em; }
[data-on-photo] [data-eh="live"], [data-on-photo] [data-eh="round"] { border-radius: 0; }
[data-on-photo] [data-eh="live"] { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
[data-on-photo] [data-slot="button"][data-variant="default"] { background: oklch(1 0 0); color: oklch(0.13 0.006 286); border-color: oklch(1 0 0); }
[data-eh="shutter"] {
  border-radius: 0; border: 3px solid transparent;
  background: linear-gradient(oklch(1 0 0), oklch(1 0 0)) padding-box,
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 30%) 0) border-box;
  box-shadow: inset 0 0 0 3px oklch(0 0 0 / 0.35);
}
[data-eh="code-chip"] { border-radius: 0; box-shadow: inset 0 0 0 1px var(--foreground); }
[data-eh="number-door"] { border-radius: 0; padding-inline: 0; }
[data-eh="number-door"]:hover { background: transparent; box-shadow: inset 0 -1px 0 var(--foreground); }
[data-eh="number-door"] > span { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
`;
