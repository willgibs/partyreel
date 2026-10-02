import {
  BTN,
  each,
  FIELDS,
  FOCUS,
  HOVER,
  PANELS,
  PRESS,
  RINGED,
  ROW_ON,
  ROWS,
} from "./states";

/**
 * VIEWFINDER: A CAMERA'S INSTRUMENTS.
 *
 * The controls of the thing everybody at the party is holding. A body of
 * matte black (a silver one on paper), precise 6px corners, round buttons
 * where a camera has a dial or a key, and the readouts a camera prints over
 * its picture: small capitals, wide tracking, figures that never change
 * width. Its signature is focus: whatever has the keyboard, and whatever is
 * chosen, is framed by four corner marks that close in on it, the way a camera
 * locks focus. One signal light, the recording red, marks what is live.
 *
 * Motion is mechanical and quick: brackets lock in 160ms, a key clicks down,
 * nothing floats or bounces.
 */
const BRACKETS = (c: string, arm = "7px", w = "1.5px") => `
  background:
    linear-gradient(${c} 0 0) top left / ${arm} ${w}, linear-gradient(${c} 0 0) top left / ${w} ${arm},
    linear-gradient(${c} 0 0) top right / ${arm} ${w}, linear-gradient(${c} 0 0) top right / ${w} ${arm},
    linear-gradient(${c} 0 0) bottom left / ${arm} ${w}, linear-gradient(${c} 0 0) bottom left / ${w} ${arm},
    linear-gradient(${c} 0 0) bottom right / ${arm} ${w}, linear-gradient(${c} 0 0) bottom right / ${w} ${arm};
  background-repeat: no-repeat;
`;
const READOUT = `
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  font-variant-numeric: tabular-nums slashed-zero;
`;
/** The lock: marks that sit out at rest and close in on focus. */
const LOCK_AT_REST = `
  content: ""; position: absolute; inset: -11px; pointer-events: none; opacity: 0;
  ${BRACKETS("var(--foreground)")}
  transition: inset 160ms var(--ease-emphasis), opacity 100ms linear;
`;
const LOCKED = `opacity: 1; inset: -5px;`;

export const VIEWFINDER_CSS = `
/* ── material: a matte body, a silver one on paper ──────────────────── */
:root, .surface-paper {
  --background: oklch(0.972 0.002 286);
  --foreground: oklch(0.12 0.004 286);
  --card: oklch(0.993 0.001 286);
  --card-foreground: oklch(0.12 0.004 286);
  --popover: oklch(0.99 0.001 286);
  --popover-foreground: oklch(0.12 0.004 286);
  --primary: oklch(0.12 0.004 286);
  --primary-foreground: oklch(0.985 0.001 286);
  --secondary: oklch(0.93 0.003 286);
  --secondary-foreground: oklch(0.12 0.004 286);
  --muted: oklch(0.945 0.003 286);
  --muted-foreground: oklch(0.42 0.006 286);
  --faint: oklch(0.6 0.006 286);
  --accent: oklch(0.91 0.003 286);
  --accent-foreground: oklch(0.12 0.004 286);
  --border: oklch(0.12 0.004 286 / 13%);
  --input: oklch(0.12 0.004 286 / 22%);
  --ring: oklch(0.12 0.004 286);
  --signal: oklch(0.6 0.22 27);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.08), 0 4px 10px -2px oklch(0 0 0 / 0.1);
  --shadow-layer: 0 2px 6px oklch(0 0 0 / 0.1), 0 12px 28px -6px oklch(0 0 0 / 0.2);
}
.dark {
  --background: oklch(0.085 0.003 286);
  --foreground: oklch(0.97 0.002 286);
  --card: oklch(0.15 0.004 286);
  --card-foreground: oklch(0.97 0.002 286);
  --popover: oklch(0.17 0.004 286);
  --popover-foreground: oklch(0.97 0.002 286);
  --primary: oklch(0.97 0.002 286);
  --primary-foreground: oklch(0.085 0.003 286);
  --secondary: oklch(0.21 0.004 286);
  --secondary-foreground: oklch(0.97 0.002 286);
  --muted: oklch(0.13 0.004 286);
  --muted-foreground: oklch(0.7 0.006 286);
  --faint: oklch(0.52 0.006 286);
  --accent: oklch(0.24 0.004 286);
  --accent-foreground: oklch(0.97 0.002 286);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 18%);
  --ring: oklch(0.97 0.002 286);
  --signal: oklch(0.66 0.22 27);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.5), 0 4px 12px -2px oklch(0 0 0 / 0.6);
  --shadow-layer: 0 2px 8px oklch(0 0 0 / 0.6), 0 16px 36px -6px oklch(0 0 0 / 0.8);
}
:root {
  --radius: 0.375rem;
  --radius-action: 0.5rem;
  --radius-action-sm: 0.375rem;
  --radius-float: 0.625rem;
  --radius-tile: 2px;
}
body { font-variant-numeric: tabular-nums; }

/* ── actions: keys and dials; focus is a lock ───────────────────────── */
${BTN} {
  position: relative; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.005em;
  transition: background-color 90ms linear, color 90ms linear, box-shadow 90ms linear, scale 80ms linear;
}
${BTN}::after { ${LOCK_AT_REST} }
${BTN}${FOCUS} { outline: none; box-shadow: none; }
${BTN}${FOCUS}::after { ${LOCKED} }
${BTN}${PRESS} { scale: 0.96; }
${BTN}[data-variant="default"] { background: var(--primary); color: var(--primary-foreground); border-color: transparent; }
${BTN}[data-variant="default"]${HOVER} { background: color-mix(in oklab, var(--primary) 88%, var(--background)); }
${BTN}:is([data-variant="outline"],[data-variant="secondary"]) {
  background: var(--secondary); color: var(--foreground); border-color: transparent;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 70%), inset 0 -1px 0 oklch(0 0 0 / 7%), inset 0 0 0 1px var(--border);
}
.dark ${BTN}:is([data-variant="outline"],[data-variant="secondary"]) {
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 7%), inset 0 -1px 0 oklch(0 0 0 / 40%), inset 0 0 0 1px var(--border);
}
${BTN}[data-variant="default"] { box-shadow: inset 0 1px 0 oklch(1 0 0 / 14%), inset 0 -1px 0 oklch(0 0 0 / 30%); }
.dark ${BTN}[data-variant="default"] { box-shadow: inset 0 -1px 0 oklch(0 0 0 / 22%); }
${BTN}:is([data-variant="outline"],[data-variant="secondary"])${HOVER} { background: var(--accent); }
${BTN}[data-variant="ghost"] { background: transparent; }
${BTN}[data-variant="ghost"]${HOVER} { background: var(--secondary); }
${BTN}[data-variant="destructive"] {
  background: var(--secondary); color: var(--signal); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--signal) 40%, transparent);
}
${BTN}[data-variant="destructive"]${HOVER} { background: color-mix(in oklab, var(--signal) 14%, var(--secondary)); }
${BTN}[data-variant="link"] { ${READOUT} height: auto; padding-inline: 0; text-decoration: none; }
${BTN}[data-variant="link"]::before { content: "→"; order: 2; letter-spacing: 0; }
${BTN}:is([data-size="icon"],[data-size="icon-sm"],[data-size="icon-xs"],[data-size="icon-lg"]) { border-radius: 999px; }
${BTN}:is([data-size="icon"],[data-size="icon-sm"],[data-size="icon-xs"],[data-size="icon-lg"])::after { border-radius: 999px; }
${BTN}:disabled { opacity: 0.32; }

[data-slot="toggle-group"] { gap: 4px; }
[data-slot="toggle-group-item"] {
  position: relative; border: 0; border-radius: 999px; background: var(--secondary); color: var(--muted-foreground);
  ${READOUT} min-width: 34px; height: 30px;
}
[data-slot="toggle-group-item"]::after { ${LOCK_AT_REST} }
[data-slot="toggle-group-item"]${HOVER} { color: var(--foreground); }
[data-slot="toggle-group-item"]:is([data-state="on"],[aria-pressed="true"]) { background: var(--primary); color: var(--primary-foreground); }
[data-slot="toggle-group-item"]${FOCUS} { box-shadow: none; outline: none; }
[data-slot="toggle-group-item"]${FOCUS}::after { ${LOCKED} }

/* ── fields: a well, framed when it has focus ───────────────────────── */
${FIELDS} {
  border: 0; border-radius: 6px; height: 38px; background-color: var(--muted);
  box-shadow: inset 0 0 0 1px var(--border); padding-inline: 12px;
  ${BRACKETS("transparent", "8px", "1.5px")}
  background-color: var(--muted);
}
${each(FIELDS, FOCUS)} {
  outline: none; box-shadow: inset 0 0 0 1px var(--input);
  ${BRACKETS("var(--foreground)", "8px", "1.5px")}
  background-color: var(--muted);
}
${each(FIELDS, '[aria-invalid="true"]')} {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--signal) 50%, transparent);
  ${BRACKETS("var(--signal)", "8px", "1.5px")}
  background-color: var(--muted);
}
${each(FIELDS, ":disabled")} { opacity: 0.4; }
[data-slot="label"], [data-slot="form-label"] { ${READOUT} color: var(--muted-foreground); }

[data-slot="switch"] {
  position: relative; width: 38px; height: 22px; border-radius: 5px; border: 0;
  background: var(--secondary) !important; box-shadow: inset 0 0 0 1px var(--border);
}
[data-slot="switch"][data-state="checked"] { background: var(--primary) !important; }
[data-slot="switch-thumb"] {
  width: 16px; height: 16px; border-radius: 3px; translate: 3px 0 !important;
  background: var(--muted-foreground) !important; transition: translate 110ms var(--ease-emphasis);
}
[data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] { translate: 19px 0 !important; background: var(--primary-foreground) !important; }
[data-slot="switch"]::after { ${LOCK_AT_REST} }
[data-slot="switch"]${FOCUS} { box-shadow: inset 0 0 0 1px var(--border); }
[data-slot="switch"]${FOCUS}::after { ${LOCKED} }

/* segmented: a mode dial: the mode in white, a dot under it */
[data-slot="tabs-list"] { background: transparent; padding: 0; gap: 18px; height: auto; }
[data-slot="tabs-trigger"] {
  position: relative; flex: none; height: 32px; padding: 0 2px; border: 0; background: transparent !important;
  ${READOUT} color: var(--muted-foreground); box-shadow: none !important;
}
[data-slot="tabs-trigger"][data-state="active"] { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"]::before {
  content: ""; position: absolute; left: 50%; bottom: -2px; width: 4px; height: 4px; margin-left: -2px;
  border-radius: 999px; background: var(--foreground);
}
[data-slot="tabs-trigger"]::after { ${LOCK_AT_REST} opacity: 0 !important; }
[data-slot="tabs-trigger"]${FOCUS}::after { ${LOCKED} opacity: 1 !important; }

/* ── surfaces: body panels; layers framed like a viewfinder ─────────── */
[data-slot="card"], ${RINGED} {
  border-radius: 6px; background: var(--card);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 5%), inset 0 0 0 1px var(--border);
}
[data-slot="card-footer"] { background: transparent; border-color: var(--border); }
[data-slot="card-title"] { letter-spacing: -0.01em; }
${PANELS} { border-radius: 10px; box-shadow: inset 0 0 0 1px var(--border), var(--shadow-layer); }
${ROWS} { border-radius: 5px; }
${ROW_ON} { background: var(--accent) !important; box-shadow: inset 2px 0 0 var(--foreground); }
[data-slot="dropdown-menu-label"], [data-slot="select-label"] { ${READOUT} opacity: 1; color: var(--muted-foreground); }
[data-slot="popup-overlay"] { background: oklch(0 0 0 / 45%); }
[data-slot="tooltip-content"] { border-radius: 4px; ${READOUT} background: oklch(0.06 0 0 / 88%); color: oklch(0.97 0 0); }
[data-slot="tooltip-arrow"] { background: oklch(0.06 0 0 / 88%); fill: transparent; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  border-radius: 8px !important; border: 0 !important; background: oklch(0.06 0 0 / 92%) !important;
  color: oklch(0.97 0 0) !important; box-shadow: inset 0 0 0 1px oklch(1 0 0 / 12%), var(--shadow-layer) !important;
  font-size: 11.5px !important; font-weight: 600 !important; letter-spacing: 0.12em !important; text-transform: uppercase;
}
[data-sonner-toaster] [data-sonner-toast][data-type="success"] [data-icon] { color: var(--success) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="warning"] [data-icon] { color: var(--warning) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="error"] [data-icon] { color: var(--signal) !important; }

/* ── status: readouts ───────────────────────────────────────────────── */
[data-slot="badge"] {
  ${READOUT} height: 20px; padding-inline: 7px; gap: 5px; border-radius: 4px; border: 0;
  background: var(--secondary); color: var(--foreground);
}
[data-slot="badge"]:is([data-variant="success"],[data-variant="warning"],[data-variant="destructive"],[data-variant="info"])::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: currentColor; flex: none;
}
[data-slot="badge"][data-variant="default"] { background: var(--primary); color: var(--primary-foreground); }
[data-slot="badge"][data-variant="success"] { color: var(--success); background: var(--secondary); }
[data-slot="badge"][data-variant="destructive"] { color: var(--signal); }
[data-slot="badge"][data-variant="warning"] { color: oklch(0.55 0.13 70); }
.dark [data-slot="badge"][data-variant="warning"] { color: var(--warning); }
[data-slot="progress"] {
  height: 8px; border-radius: 2px; background-color: transparent;
  background-image: repeating-linear-gradient(90deg, var(--input) 0 1px, transparent 1px 6px);
}
[data-slot="progress-indicator"] {
  background-color: transparent;
  background-image: repeating-linear-gradient(90deg, var(--foreground) 0 3px, transparent 3px 6px);
}
[data-slot="skeleton"] {
  border-radius: 4px; background-color: var(--muted);
  background-image: linear-gradient(90deg, transparent 46%, color-mix(in oklab, var(--foreground) 16%, transparent) 50%, transparent 54%);
}
[data-slot="avatar"]::after { border-color: var(--input) !important; }

/* ── the screens' own parts, wearing the family ─────────────────────── */
[data-code-mark] {
  border-radius: 4px !important; ${READOUT} background: var(--secondary) !important; color: var(--foreground) !important;
  box-shadow: 0 0 0 2px var(--background), inset 0 0 0 1px var(--border) !important;
}
[data-code-mark].bg-warning { color: oklch(0.45 0.12 70) !important; }
.dark [data-code-mark].bg-warning { color: var(--warning) !important; }
[data-code-door] button[aria-label^="Show the code"] { border-radius: 4px; position: relative; overflow: visible; }
[data-code-door] button[aria-label^="Show the code"]::after {
  content: ""; position: absolute; inset: -9px; pointer-events: none;
  ${BRACKETS("var(--foreground)", "12px", "2px")}
}
[role="group"][aria-label="This event"] > a, [role="group"][aria-label="This event"] > button {
  border-radius: 6px; border-color: transparent !important; background: var(--card);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 5%), inset 0 0 0 1px var(--border);
}
[data-checklist] { border-radius: 8px; }
[role="group"][aria-label="What the link opens"] { background: transparent !important; padding: 0 !important; gap: 4px !important; }
[data-door-choice] {
  position: relative; border-radius: 999px !important; background: var(--secondary) !important; ${READOUT}
}
[data-door-choice][data-state="on"] { background: var(--primary) !important; color: var(--primary-foreground) !important; }
[data-door-gate] { border-radius: 6px !important; border-color: var(--border) !important; background: var(--card) !important; overflow: visible; }
[data-door-gate][data-state="on"] { border-color: transparent !important; }
[data-door-gate][data-state="on"]::after {
  content: ""; position: absolute; inset: 3px; pointer-events: none; ${BRACKETS("var(--foreground)", "10px", "1.5px")}
}
[data-door-step] > span > span.rounded-full { border-radius: 4px !important; ${READOUT} font-size: 10px; }
[data-guest-dock] > [role="group"] { box-shadow: inset 0 1px 0 var(--border); }
[data-upload-terms] { ${READOUT} font-size: 10px; }
[data-checklist] span[aria-hidden].h-1\.5 {
  height: 8px; border-radius: 1px; background-color: transparent;
  background-image: repeating-linear-gradient(90deg, var(--input) 0 1px, transparent 1px 6px);
}
[data-checklist] span[aria-hidden].h-1\.5 > span {
  border-radius: 0; background-color: transparent !important;
  background-image: repeating-linear-gradient(90deg, var(--foreground) 0 3px, transparent 3px 6px);
}
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; }
[data-slot="popup-content"][data-shape="panel"] { border-radius: 10px 0 0 10px; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 10px 10px 0 0; }

[data-slot="responsive-menu-item"] { font-weight: 600; gap: 12px; }
[data-slot="responsive-menu-item"] > svg {
  box-sizing: content-box; padding: 7px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--input);
  color: var(--foreground) !important;
}
[data-slot="responsive-menu-rows"] h2 { ${READOUT} font-size: 10px; }

/* a hand's whole-screen shapes are the page itself: opaque, on the ground */
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) {
  background: var(--background); -webkit-backdrop-filter: none; backdrop-filter: none;
}

/* ── on a photograph, and the head's new atoms: the camera's overlay ─── */
[data-on-photo] [data-eh="live"] {
  border-radius: 3px; background: oklch(0 0 0 / 55%); box-shadow: inset 0 0 0 1px oklch(1 0 0 / 14%);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); ${READOUT} font-size: 10px; color: oklch(1 0 0);
}
[data-on-photo] [data-eh="live"]::before { background: var(--signal); box-shadow: 0 0 8px var(--signal); }
[data-on-photo] [data-eh="round"] {
  background: oklch(0 0 0 / 45%); box-shadow: inset 0 0 0 1px oklch(1 0 0 / 22%);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
}
[data-on-photo] ${BTN}[data-variant="default"] { background: oklch(1 0 0); color: oklch(0.1 0 0); }
/* the shutter is a camera's: a white disc inside its own ring */
[data-eh="shutter"] {
  color: oklch(0.1 0 0);
  background:
    radial-gradient(closest-side, oklch(1 0 0) calc(100% - 9px), transparent calc(100% - 8.5px)),
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 30%) 0);
  -webkit-mask: radial-gradient(closest-side, #000 calc(100% - 9px), transparent calc(100% - 8.5px) calc(100% - 4.5px), #000 calc(100% - 4px));
  mask: radial-gradient(closest-side, #000 calc(100% - 9px), transparent calc(100% - 8.5px) calc(100% - 4.5px), #000 calc(100% - 4px));
}
[data-eh="code-chip"] { position: relative; border-radius: 3px; }
[data-eh="code-chip"]::after { content: ""; position: absolute; inset: -5px; pointer-events: none; ${BRACKETS("var(--foreground)", "6px", "1.5px")} }
[data-eh="number-door"] > [data-eh-n="word"], [data-eh="number-door"] > [data-eh-n="sub"] { ${READOUT} font-size: 10px; }
[data-eh="number-door"] > b {
  font-family: var(--font-sans); font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums slashed-zero;
}
`;
