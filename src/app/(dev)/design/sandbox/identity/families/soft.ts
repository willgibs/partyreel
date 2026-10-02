import {
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
 * SOFT: TONAL, ROUND, PRESSABLE.
 *
 * Objects a thumb presses. Nothing on a page is outlined: a control is a tone
 * a step off its ground, a surface is a lighter tone lying on a soft shadow,
 * and depth is light falling from above rather than a hairline. Every action
 * is a pill, every surface a continuous corner (16px, layers 22px),
 * photographs round to 8px, and the controls speak in Urbanist, the face the
 * round shapes were drawn for. Sized for a thumb: the everyday control is
 * 40px, the loudest 52px.
 *
 * Motion is physical: a press sinks and springs back, a switch's knob is
 * thrown and settles, a chosen segment slides.
 */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const SOFT_CSS = `
/* ── material: tone on tone, light from above ───────────────────────── */
:root, .surface-paper {
  --background: oklch(0.968 0.004 286);
  --foreground: oklch(0.17 0.006 286);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.17 0.006 286);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.17 0.006 286);
  --primary: oklch(0.17 0.006 286);
  --primary-foreground: oklch(0.99 0.001 286);
  --secondary: oklch(0.925 0.005 286);
  --secondary-foreground: oklch(0.17 0.006 286);
  --muted: oklch(0.94 0.004 286);
  --muted-foreground: oklch(0.47 0.009 286);
  --faint: oklch(0.62 0.008 286);
  --accent: oklch(0.935 0.005 286);
  --accent-foreground: oklch(0.17 0.006 286);
  --border: oklch(0.17 0.006 286 / 7%);
  --input: oklch(0.17 0.006 286 / 10%);
  --ring: oklch(0.17 0.006 286 / 28%);
  --shadow-lift: 0 1px 2px oklch(0.2 0.01 286 / 0.05), 0 6px 18px -6px oklch(0.2 0.01 286 / 0.12);
  --shadow-layer: 0 2px 6px oklch(0.2 0.01 286 / 0.06), 0 18px 44px -10px oklch(0.2 0.01 286 / 0.22);
}
.dark {
  --background: oklch(0.13 0.005 286);
  --foreground: oklch(0.965 0.004 286);
  --card: oklch(0.195 0.006 286);
  --card-foreground: oklch(0.965 0.004 286);
  --popover: oklch(0.235 0.006 286);
  --popover-foreground: oklch(0.965 0.004 286);
  --primary: oklch(0.965 0.004 286);
  --primary-foreground: oklch(0.13 0.005 286);
  --secondary: oklch(0.265 0.006 286);
  --secondary-foreground: oklch(0.965 0.004 286);
  --muted: oklch(0.205 0.006 286);
  --muted-foreground: oklch(0.72 0.01 286);
  --faint: oklch(0.56 0.008 286);
  --accent: oklch(0.29 0.006 286);
  --accent-foreground: oklch(0.965 0.004 286);
  --border: oklch(1 0 0 / 6%);
  --input: oklch(1 0 0 / 9%);
  --ring: oklch(0.965 0.004 286 / 30%);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.35), 0 8px 20px -6px oklch(0 0 0 / 0.5);
  --shadow-layer: 0 2px 8px oklch(0 0 0 / 0.4), 0 22px 48px -10px oklch(0 0 0 / 0.7);
}
:root {
  --radius: 1rem;
  --radius-action: 999px;
  --radius-action-sm: 999px;
  --radius-float: 1.375rem;
  --radius-tile: 8px;
}

/* ── actions: pills you press ───────────────────────────────────────── */
[data-slot="button"] {
  border: 0; border-radius: 999px; font-family: var(--font-display); font-weight: 600;
  font-size: 15px; letter-spacing: -0.005em;
  transition: background-color 160ms var(--ease-emphasis), color 160ms var(--ease-emphasis),
    box-shadow 160ms var(--ease-emphasis), scale 260ms ${SPRING};
}
[data-slot="button"][data-size="default"] { height: 40px; padding-inline: 18px; }
[data-slot="button"][data-size="sm"] { height: 34px; padding-inline: 14px; font-size: 14px; }
[data-slot="button"][data-size="xs"] { height: 28px; padding-inline: 12px; font-size: 13px; }
[data-slot="button"][data-size="lg"] { height: 44px; padding-inline: 20px; }
[data-slot="button"][data-size="cta"] { height: 52px; padding-inline: 26px; font-size: 16px; }
[data-slot="button"][data-size="icon"] { width: 40px; height: 40px; }
[data-slot="button"][data-size="icon-sm"] { width: 34px; height: 34px; }
[data-slot="button"][data-size="icon-xs"] { width: 28px; height: 28px; }
[data-slot="button"][data-size="icon-lg"] { width: 44px; height: 44px; }
[data-slot="button"]${PRESS} { scale: 0.95; transition-duration: 160ms, 160ms, 160ms, 90ms; }
[data-slot="button"][data-variant="default"] { background: var(--primary); color: var(--primary-foreground); }
[data-slot="button"][data-variant="default"]${HOVER} { background: color-mix(in oklab, var(--primary) 86%, var(--background)); }
[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"]) {
  background: var(--secondary); color: var(--secondary-foreground); box-shadow: none;
}
[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"])${HOVER} {
  background: color-mix(in oklab, var(--secondary) 82%, var(--foreground));
}
[data-slot="button"][data-variant="ghost"] { background: transparent; }
[data-slot="button"][data-variant="ghost"]${HOVER} { background: var(--secondary); }
[data-slot="button"][data-variant="destructive"] {
  background: color-mix(in oklab, var(--destructive) 13%, var(--background)); color: var(--destructive);
}
[data-slot="button"][data-variant="destructive"]${HOVER} { background: color-mix(in oklab, var(--destructive) 22%, var(--background)); }
[data-slot="button"][data-variant="link"] { height: auto; padding-inline: 0; font-family: var(--font-sans); font-weight: 500; font-size: 14px; }
[data-slot="button"]${FOCUS} {
  outline: none;
  box-shadow: 0 0 0 2px var(--background), 0 0 0 5px color-mix(in oklab, var(--foreground) 26%, transparent);
}
[data-slot="button"]:disabled { opacity: 0.38; }

[data-slot="toggle-group"] { gap: 6px; }
[data-slot="toggle-group-item"] {
  border: 0; border-radius: 999px; background: var(--secondary); color: var(--foreground);
  font-family: var(--font-display); font-weight: 600; font-size: 14px; height: 34px; padding-inline: 14px;
  transition: background-color 160ms var(--ease-emphasis), color 160ms var(--ease-emphasis), scale 260ms ${SPRING};
}
[data-slot="toggle-group-item"]${HOVER} { background: color-mix(in oklab, var(--secondary) 82%, var(--foreground)); }
[data-slot="toggle-group-item"]${PRESS} { scale: 0.95; }
[data-slot="toggle-group-item"]:is([data-state="on"],[aria-pressed="true"]) {
  background: var(--primary); color: var(--primary-foreground);
}
[data-slot="toggle-group-item"]${FOCUS} { box-shadow: 0 0 0 2px var(--background), 0 0 0 5px color-mix(in oklab, var(--foreground) 26%, transparent); }

/* ── fields: a well, filled, that brightens when it is yours ────────── */
${FIELDS} {
  border: 0; border-radius: 14px; background: var(--muted); height: 46px; padding-inline: 16px;
  font-size: 16px; box-shadow: none;
  transition: background-color 160ms var(--ease-emphasis), box-shadow 160ms var(--ease-emphasis);
}
.dark :is(${FIELDS}) { background: var(--muted); }
${each(FIELDS, FOCUS)} {
  background: var(--card); outline: none;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--foreground) 12%, transparent), var(--shadow-lift);
}
${each(FIELDS, '[aria-invalid="true"]')} {
  background: color-mix(in oklab, var(--destructive) 8%, var(--card));
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--destructive) 22%, transparent);
}
${each(FIELDS, ":disabled")} { opacity: 0.45; }
[data-slot="label"], [data-slot="form-label"] { font-size: 13px; font-weight: 500; color: var(--muted-foreground); }

[data-slot="switch"] {
  width: 46px; height: 28px; border: 0; border-radius: 999px; box-shadow: none;
  background: color-mix(in oklab, var(--foreground) 14%, var(--background)) !important;
  transition: background-color 220ms var(--ease-in-out-strong);
}
[data-slot="switch"][data-state="checked"] { background: var(--primary) !important; }
[data-slot="switch-thumb"] {
  width: 24px; height: 24px; background: oklch(1 0 0) !important;
  box-shadow: 0 1px 2px oklch(0 0 0 / 0.18), 0 3px 8px oklch(0 0 0 / 0.14);
  translate: 2px 0 !important; transition: translate 300ms ${SPRING};
}
[data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] { translate: 20px 0 !important; }
[data-slot="switch"]${FOCUS} { box-shadow: 0 0 0 2px var(--background), 0 0 0 5px color-mix(in oklab, var(--foreground) 26%, transparent); }

[data-slot="tabs-list"] {
  height: 42px !important; padding: 4px; border-radius: 999px; background: var(--secondary); gap: 2px;
}
[data-slot="tabs-trigger"] {
  border: 0; border-radius: 999px; height: 100% !important; padding-inline: 16px;
  font-family: var(--font-display); font-weight: 600; font-size: 14px; color: var(--muted-foreground);
  transition: background-color 200ms var(--ease-in-out-strong), color 200ms var(--ease-in-out-strong), box-shadow 200ms;
}
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] {
  background: var(--card) !important; color: var(--foreground); box-shadow: var(--shadow-lift);
}
.dark [data-slot="tabs-trigger"][data-state="active"] { background: var(--accent) !important; }

/* ── surfaces: tone on a soft shadow, never a line ──────────────────── */
[data-slot="card"], ${RINGED} {
  box-shadow: var(--shadow-lift); background: var(--card);
}
[data-slot="card"] { border-radius: 20px; padding-block: 20px; }
[data-slot="card-header"], [data-slot="card-content"] { padding-inline: 20px; }
[data-slot="card-footer"] { background: transparent; border-top: 0; padding: 4px 20px 20px; }
${PANELS} { border-radius: 22px; box-shadow: var(--shadow-layer); }
${ROWS} { border-radius: 14px; min-height: 40px; }
${ROW_ON} { background: var(--muted) !important; }
[data-slot="dropdown-menu-separator"], [data-slot="select-separator"] { background: transparent; height: 6px; }
[data-slot="popup-overlay"] { background: oklch(0.1 0.01 286 / 22%); }
[data-slot="tooltip-content"] {
  border-radius: 999px; font-family: var(--font-display); font-weight: 600; font-size: 13px; padding: 6px 12px;
}
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  border-radius: 999px !important; border: 0 !important; padding-inline: 18px !important;
  background: var(--foreground) !important; color: var(--background) !important;
  font-family: var(--font-display) !important; font-weight: 600 !important; font-size: 15px !important;
}
[data-sonner-toaster] [data-sonner-toast][data-type="success"] [data-icon] { color: var(--success) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="warning"] [data-icon] { color: var(--warning) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="error"] [data-icon] { color: var(--destructive) !important; }

/* ── status: tinted pills, a thick bar, a breathing block ───────────── */
[data-slot="badge"] {
  height: 24px; padding-inline: 10px; border: 0; font-family: var(--font-display); font-weight: 600;
  font-size: 12.5px;
}
[data-slot="badge"]:is([data-variant="secondary"],[data-variant="outline"]) { background: var(--secondary); color: var(--foreground); }
[data-slot="badge"][data-variant="success"] { background: color-mix(in oklab, var(--success) 16%, var(--background)); }
[data-slot="badge"][data-variant="warning"] { background: color-mix(in oklab, var(--warning) 30%, var(--background)); }
[data-slot="progress"] { height: 10px; background: var(--secondary); }
[data-slot="progress-indicator"] { border-radius: 999px; background: var(--primary); }
[data-slot="skeleton"] { border-radius: 14px; }
[data-slot="avatar"]::after { border: 0 !important; box-shadow: inset 0 0 0 1px oklch(0 0 0 / 6%); }
[data-slot="avatar-group"] > [data-slot="avatar"] { box-shadow: 0 0 0 3px var(--background); }

/* ── the screens' own parts, wearing the family ─────────────────────── */
[data-code-mark] { box-shadow: 0 0 0 3px var(--background), var(--shadow-lift) !important; height: 26px !important; min-width: 26px !important; }
[data-code-door] button[aria-label^="Show the code"] { border-radius: 22px; box-shadow: var(--shadow-lift); }
[role="group"][aria-label="This event"] > a, [role="group"][aria-label="This event"] > button {
  border: 0 !important; border-radius: 22px; background: var(--card); box-shadow: var(--shadow-lift);
}
[data-checklist] { border-radius: 24px; }
[data-checklist] .border-t, [data-checklist] .divide-y > *, [data-checklist] .divide-x > * { border-color: transparent; }
[role="group"][aria-label="What the link opens"] { border-radius: 999px !important; background: var(--secondary) !important; padding: 4px !important; }
[data-door-choice] { border-radius: 999px !important; font-family: var(--font-display); font-weight: 600; height: 36px; }
[data-door-choice][data-state="on"] { background: var(--card) !important; box-shadow: var(--shadow-lift); }
.dark [data-door-choice][data-state="on"] { background: var(--accent) !important; }
[data-door-gate] { border: 0 !important; border-radius: 16px !important; background: var(--muted) !important; }
[data-door-gate][data-state="on"] { background: var(--card) !important; box-shadow: inset 0 0 0 2px var(--foreground), var(--shadow-lift) !important; }
[data-guest-dock] > [role="group"] { box-shadow: 0 -10px 30px -12px oklch(0 0 0 / 0.18); }
header.sticky.border-b { border-bottom-color: transparent; }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; box-shadow: none; }
[data-slot="popup-content"][data-shape="panel"] { border-radius: 22px 0 0 22px; border: 0; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 22px 22px 0 0; border: 0; }

[data-slot="responsive-menu-item"] { font-family: var(--font-display); font-weight: 600; font-size: 17px; gap: 14px; }
[data-slot="responsive-menu-item"] > svg {
  box-sizing: content-box; padding: 9px; border-radius: 999px; background: var(--secondary);
  color: var(--foreground) !important;
}
[data-slot="responsive-menu"] [data-slot="responsive-menu-item"] { font-size: 15px; }
[data-slot="responsive-menu"] [data-slot="responsive-menu-item"] > svg { padding: 6px; }

/* ── on a photograph: soft white pills and tonal rounds ─────────────── */
[data-eh="photo-type"] { letter-spacing: -0.03em; }
[data-on-photo] [data-eh="live"] {
  height: 28px; padding-inline: 12px; font-family: var(--font-display); font-weight: 600; font-size: 13px;
  background: oklch(1 0 0 / 22%); box-shadow: none;
}
[data-on-photo] [data-eh="round"] { width: 40px; height: 40px; background: oklch(1 0 0 / 22%); box-shadow: none; }
[data-on-photo] [data-slot="button"][data-variant="default"] {
  background: oklch(1 0 0); color: oklch(0.17 0.006 286); box-shadow: 0 4px 14px -4px oklch(0 0 0 / 0.4);
}
[data-eh="shutter"] {
  width: 72px; height: 72px;
  background:
    radial-gradient(closest-side, oklch(1 0 0) calc(100% - 9px), transparent calc(100% - 8px)),
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 30%) 0);
  box-shadow: 0 6px 20px -6px oklch(0 0 0 / 0.45);
}
[data-eh="shutter"]:active { scale: 0.92; transition: scale 260ms ${SPRING}; }
[data-eh="code-chip"] { width: 36px; height: 36px; border-radius: 12px; box-shadow: var(--shadow-lift); }
[data-eh="number-door"] { border-radius: 18px; padding: 10px 14px; }
[data-eh="number-door"]:hover { background: var(--secondary); }
[data-eh="number-door"] > span { font-family: var(--font-display); font-weight: 600; font-size: 13px; }
`;
