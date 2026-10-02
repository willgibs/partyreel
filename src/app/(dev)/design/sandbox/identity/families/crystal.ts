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
 * CRYSTAL: THE GLASS, ON EVERYTHING.
 *
 * Partyreel's own material, which today only the media chrome wears, made the
 * material of every control and layer. A surface is a pane: it lets the page
 * and its photographs through, blurred and dimmed, and catches the light on
 * its top edge. A primary is a lit pearl (ink on paper), a secondary is clear
 * glass, a field is a pane set into the surface, a layer floats over a page it
 * blurs. Actions are pills, surfaces round to 16px and layers to 24px, and
 * the colour of a layer is whatever photograph it floats over.
 *
 * Motion is light: a hover brightens the pane, a press dims it, focus lights
 * its edge; an overlay's page goes soft as the layer arrives.
 */
const PANE_DARK = `
  background: linear-gradient(180deg, oklch(1 0 0 / 9%), oklch(1 0 0 / 4%));
  -webkit-backdrop-filter: blur(22px) saturate(1.7); backdrop-filter: blur(22px) saturate(1.7);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 16%), inset 0 0 0 1px oklch(1 0 0 / 8%);
`;
/**
 * ★ A PANE LYING FLAT CASTS NOTHING. Its edge is light (a bright lip on top,
 * a shade at the foot) and a hairline, never a shadow: a shadow under every
 * card is Soft's answer, and on paper the two would read alike. Only a layer,
 * which really floats, takes the layer's shadow.
 */
const PANE_LIGHT = `
  background: linear-gradient(180deg, oklch(1 0 0 / 92%), oklch(1 0 0 / 70%));
  -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8);
  box-shadow: inset 0 1px 0 oklch(1 0 0), inset 0 -1px 0 oklch(0.2 0.01 286 / 6%),
    inset 0 0 0 1px oklch(0.2 0.01 286 / 9%);
`;
const LAYER_DARK = `
  background: oklch(0.22 0.006 286 / 62%);
  -webkit-backdrop-filter: blur(40px) saturate(1.9) brightness(0.85); backdrop-filter: blur(40px) saturate(1.9) brightness(0.85);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 18%), inset 0 0 0 1px oklch(1 0 0 / 10%), var(--shadow-layer);
`;
const LAYER_LIGHT = `
  background: oklch(1 0 0 / 74%);
  -webkit-backdrop-filter: blur(36px) saturate(1.9); backdrop-filter: blur(36px) saturate(1.9);
  box-shadow: inset 0 1px 0 oklch(1 0 0), inset 0 0 0 1px oklch(0.2 0.01 286 / 8%), var(--shadow-layer);
`;
const PEARL_DARK = `
  background: linear-gradient(180deg, oklch(0.995 0.002 286), oklch(0.88 0.005 286));
  color: oklch(0.12 0.005 286);
  box-shadow: inset 0 1px 0 oklch(1 0 0), inset 0 -1px 0 oklch(0 0 0 / 14%), 0 1px 3px oklch(0 0 0 / 35%),
    0 0 0 1px oklch(1 0 0 / 22%);
`;
const PEARL_LIGHT = `
  background: linear-gradient(180deg, oklch(0.34 0.006 286), oklch(0.16 0.006 286));
  color: oklch(0.99 0.001 286);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 22%), 0 1px 2px oklch(0 0 0 / 22%), 0 4px 12px -4px oklch(0 0 0 / 30%);
`;
const WELL_DARK = `
  background: oklch(0 0 0 / 30%);
  box-shadow: inset 0 1px 2px oklch(0 0 0 / 45%), inset 0 0 0 1px oklch(1 0 0 / 8%), 0 1px 0 oklch(1 0 0 / 6%);
`;
const WELL_LIGHT = `
  background: oklch(0.2 0.01 286 / 4%);
  box-shadow: inset 0 1px 2px oklch(0.2 0.01 286 / 12%), inset 0 0 0 1px oklch(0.2 0.01 286 / 9%), 0 1px 0 oklch(1 0 0);
`;
const HALO = `0 0 0 3px color-mix(in oklab, var(--foreground) 20%, transparent), 0 0 18px color-mix(in oklab, var(--foreground) 22%, transparent)`;

export const CRYSTAL_CSS = `
/* ── material: panes over the page, lit on the edge ─────────────────── */
:root, .surface-paper {
  --background: oklch(0.982 0.003 286);
  --card: oklch(0.995 0.002 286);
  --popover: oklch(0.995 0.001 286);
  --secondary: oklch(0.93 0.004 286);
  --muted: oklch(0.945 0.004 286);
  --accent: oklch(0.93 0.004 286);
  --border: oklch(0.2 0.01 286 / 8%);
  --input: oklch(0.2 0.01 286 / 12%);
  --ring: oklch(0.2 0.01 286 / 50%);
  --shadow-lift: 0 1px 2px oklch(0.2 0.02 286 / 0.06), 0 8px 24px -6px oklch(0.2 0.02 286 / 0.14);
  --shadow-layer: 0 2px 8px oklch(0.2 0.02 286 / 0.08), 0 24px 56px -12px oklch(0.2 0.02 286 / 0.28);
}
.dark {
  --background: oklch(0.1 0.006 286);
  --card: oklch(0.2 0.006 286);
  --popover: oklch(0.24 0.006 286);
  --secondary: oklch(0.28 0.006 286);
  --muted: oklch(0.17 0.006 286);
  --accent: oklch(0.3 0.006 286);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(1 0 0 / 55%);
  --shadow-lift: 0 1px 2px oklch(0 0 0 / 0.4), 0 10px 28px -8px oklch(0 0 0 / 0.6);
  --shadow-layer: 0 2px 10px oklch(0 0 0 / 0.45), 0 28px 64px -12px oklch(0 0 0 / 0.75);
}
:root {
  --radius: 1rem;
  --radius-action: 999px;
  --radius-action-sm: 999px;
  --radius-float: 1.5rem;
  --radius-tile: 6px;
}

/* ── actions: a lit pearl, clear glass ──────────────────────────────── */
[data-slot="button"] {
  border: 0; border-radius: 999px; font-weight: 600; letter-spacing: -0.005em;
  transition: filter 160ms var(--ease-emphasis), box-shadow 200ms var(--ease-emphasis),
    background-color 160ms var(--ease-emphasis), scale 150ms var(--ease-emphasis);
}
[data-slot="button"][data-size="default"] { height: 36px; padding-inline: 16px; }
[data-slot="button"][data-size="sm"] { height: 32px; padding-inline: 13px; }
[data-slot="button"][data-size="lg"] { height: 40px; padding-inline: 18px; }
[data-slot="button"][data-size="cta"] { height: 48px; padding-inline: 24px; }
[data-slot="button"][data-size="icon"] { width: 36px; height: 36px; }
[data-slot="button"][data-size="icon-sm"] { width: 32px; height: 32px; }
[data-slot="button"][data-size="icon-lg"] { width: 40px; height: 40px; }
[data-slot="button"]${HOVER} { filter: brightness(1.07); }
[data-slot="button"]${PRESS} { filter: brightness(0.92); scale: 0.97; }
[data-slot="button"][data-variant="default"] { ${PEARL_LIGHT} }
.dark [data-slot="button"][data-variant="default"] { ${PEARL_DARK} }
[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"]) { ${PANE_LIGHT} color: var(--foreground); }
.dark [data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"]) { ${PANE_DARK} color: var(--foreground); }
[data-slot="button"][data-variant="ghost"] { background: transparent; }
[data-slot="button"][data-variant="ghost"]${HOVER} { ${PANE_LIGHT} filter: none; }
.dark [data-slot="button"][data-variant="ghost"]${HOVER} { ${PANE_DARK} }
[data-slot="button"][data-variant="destructive"] {
  background: color-mix(in oklab, var(--destructive) 14%, transparent); color: var(--destructive);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 14%), inset 0 0 0 1px color-mix(in oklab, var(--destructive) 26%, transparent);
}
[data-slot="button"][data-variant="link"] { height: auto; padding-inline: 0; background: none; box-shadow: none; font-weight: 500; }
[data-slot="button"]${FOCUS} { outline: none; box-shadow: ${HALO}; }
[data-slot="button"][data-variant="default"]${FOCUS} {
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 30%), ${HALO};
}
[data-slot="button"]:disabled { opacity: 0.4; filter: saturate(0.6); }

[data-slot="toggle-group"] { gap: 6px; }
[data-slot="toggle-group-item"] {
  border: 0; border-radius: 999px; ${PANE_LIGHT} color: var(--foreground); font-weight: 600;
  transition: filter 160ms var(--ease-emphasis), box-shadow 200ms var(--ease-emphasis);
}
.dark [data-slot="toggle-group-item"] { ${PANE_DARK} }
[data-slot="toggle-group-item"]${HOVER} { filter: brightness(1.08); }
[data-slot="toggle-group-item"]:is([data-state="on"],[aria-pressed="true"]) { ${PEARL_LIGHT} }
.dark [data-slot="toggle-group-item"]:is([data-state="on"],[aria-pressed="true"]) { ${PEARL_DARK} }
[data-slot="toggle-group-item"]${FOCUS} { box-shadow: ${HALO}; }

/* ── fields: a pane set into the surface ────────────────────────────── */
${FIELDS} {
  border: 0; border-radius: 12px; height: 40px; padding-inline: 14px; ${WELL_LIGHT}
  transition: box-shadow 200ms var(--ease-emphasis), background-color 200ms var(--ease-emphasis);
}
.dark :is(${FIELDS}) { ${WELL_DARK} }
${each(FIELDS, FOCUS)} {
  outline: none;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 40%, transparent), ${HALO};
}
${each(FIELDS, '[aria-invalid="true"]')} {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--destructive) 60%, transparent),
    0 0 0 3px color-mix(in oklab, var(--destructive) 18%, transparent), 0 0 18px color-mix(in oklab, var(--destructive) 24%, transparent);
}
${each(FIELDS, ":disabled")} { opacity: 0.45; }
[data-slot="label"], [data-slot="form-label"] { font-weight: 500; color: var(--muted-foreground); }

[data-slot="switch"] {
  width: 44px; height: 26px; border: 0; border-radius: 999px; ${WELL_LIGHT}
}
.dark [data-slot="switch"] { ${WELL_DARK} }
[data-slot="switch"][data-state="checked"] { ${PEARL_LIGHT} }
.dark [data-slot="switch"][data-state="checked"] { background: oklch(0.9 0.004 286); box-shadow: inset 0 1px 2px oklch(0 0 0 / 20%), 0 0 14px oklch(1 0 0 / 22%); }
[data-slot="switch-thumb"] {
  width: 22px; height: 22px; translate: 2px 0 !important;
  background: linear-gradient(180deg, oklch(1 0 0), oklch(0.92 0.004 286)) !important;
  box-shadow: inset 0 1px 0 oklch(1 0 0), 0 1px 2px oklch(0 0 0 / 25%), 0 2px 8px oklch(0 0 0 / 18%);
  transition: translate 220ms var(--ease-in-out-strong);
}
[data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] { translate: 20px 0 !important; }
.dark [data-slot="switch"][data-state="checked"] [data-slot="switch-thumb"] { background: linear-gradient(180deg, oklch(0.3 0.006 286), oklch(0.18 0.006 286)) !important; }
[data-slot="switch"]${FOCUS} { box-shadow: ${HALO}; }

[data-slot="tabs-list"] { height: 40px !important; padding: 4px; border-radius: 999px; ${WELL_LIGHT} gap: 2px; }
.dark [data-slot="tabs-list"] { ${WELL_DARK} }
[data-slot="tabs-trigger"] {
  border: 0; border-radius: 999px; height: 100% !important; padding-inline: 16px; font-weight: 600;
  color: var(--muted-foreground);
  transition: color 200ms var(--ease-in-out-strong), box-shadow 200ms, background 200ms;
}
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] { ${PANE_LIGHT} color: var(--foreground); }
.dark [data-slot="tabs-trigger"][data-state="active"] {
  background: linear-gradient(180deg, oklch(1 0 0 / 20%), oklch(1 0 0 / 11%)) !important;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 25%), inset 0 0 0 1px oklch(1 0 0 / 10%), 0 2px 8px oklch(0 0 0 / 35%);
}

/* ── surfaces: panes; layers float over a page they blur ────────────── */
[data-slot="card"], ${RINGED} { ${PANE_LIGHT} }
.dark :is([data-slot="card"], ${RINGED}) { ${PANE_DARK} }
[data-slot="card-footer"] { background: transparent; border-color: var(--border); }
${PANELS} { ${LAYER_LIGHT} border-radius: 24px; border-color: transparent; }
.dark :is(${PANELS}) { ${LAYER_DARK} }
${ROWS} { border-radius: 14px; }
${ROW_ON} { background: color-mix(in oklab, var(--foreground) 8%, transparent) !important; }
[data-slot="popup-overlay"] {
  background: oklch(0.1 0.01 286 / 16%); -webkit-backdrop-filter: blur(10px) saturate(1.2); backdrop-filter: blur(10px) saturate(1.2);
}
[data-slot="tooltip-content"] {
  background: oklch(0.16 0.006 286 / 72%); color: oklch(0.98 0 0);
  -webkit-backdrop-filter: blur(16px) saturate(1.6); backdrop-filter: blur(16px) saturate(1.6);
  border-radius: 999px; box-shadow: inset 0 1px 0 oklch(1 0 0 / 18%), var(--shadow-layer);
}
[data-slot="tooltip-arrow"] { background: oklch(0.16 0.006 286 / 72%); fill: transparent; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  border-radius: 999px !important; border: 0 !important; color: var(--foreground) !important;
  ${LAYER_LIGHT.replace(/;/g, " !important;")}
}
.dark [data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
  ${LAYER_DARK.replace(/;/g, " !important;")}
}
[data-sonner-toaster] [data-sonner-toast][data-type="success"] [data-icon] { color: var(--success) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="warning"] [data-icon] { color: var(--warning) !important; }
[data-sonner-toaster] [data-sonner-toast][data-type="error"] [data-icon] { color: var(--destructive) !important; }

/* ── status: glass chips, a lit bar ─────────────────────────────────── */
[data-slot="badge"] { height: 22px; padding-inline: 9px; border: 0; ${PANE_LIGHT} color: var(--foreground); }
.dark [data-slot="badge"] { ${PANE_DARK} }
[data-slot="badge"][data-variant="default"] { ${PEARL_LIGHT} }
.dark [data-slot="badge"][data-variant="default"] { ${PEARL_DARK} }
[data-slot="badge"][data-variant="success"] { color: var(--success); background: color-mix(in oklab, var(--success) 16%, transparent); }
[data-slot="badge"][data-variant="warning"] { color: oklch(0.5 0.12 70); background: color-mix(in oklab, var(--warning) 26%, transparent); }
.dark [data-slot="badge"][data-variant="warning"] { color: var(--warning); }
[data-slot="badge"][data-variant="destructive"] { color: var(--destructive); background: color-mix(in oklab, var(--destructive) 14%, transparent); }
[data-slot="progress"] { height: 8px; ${WELL_LIGHT} }
.dark [data-slot="progress"] { ${WELL_DARK} }
[data-slot="progress-indicator"] { border-radius: 999px; ${PEARL_LIGHT} }
.dark [data-slot="progress-indicator"] { ${PEARL_DARK} box-shadow: 0 0 12px oklch(1 0 0 / 45%); }
[data-slot="skeleton"] {
  border-radius: 12px; background-color: color-mix(in oklab, var(--foreground) 6%, transparent);
  background-image: linear-gradient(100deg, transparent 40%, oklch(1 0 0 / 22%) 50%, transparent 60%);
}
[data-slot="avatar"]::after { border-color: oklch(1 0 0 / 30%) !important; mix-blend-mode: normal !important; }

/* ── the screens' own parts, wearing the family ─────────────────────── */
[data-code-mark] {
  background: oklch(0.16 0.006 286 / 70%) !important; color: oklch(0.98 0 0) !important;
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 22%), 0 0 0 1px oklch(1 0 0 / 10%), var(--shadow-lift) !important;
}
[data-code-mark].bg-warning { background: color-mix(in oklab, var(--warning) 88%, transparent) !important; color: var(--warning-foreground) !important; }
[data-code-door] button[aria-label^="Show the code"] {
  border-radius: 18px; box-shadow: inset 0 0 0 1px oklch(0 0 0 / 6%), var(--shadow-lift);
}
[role="group"][aria-label="This event"] > a, [role="group"][aria-label="This event"] > button {
  border: 0 !important; border-radius: 20px; ${PANE_LIGHT}
}
.dark :is([role="group"][aria-label="This event"] > a, [role="group"][aria-label="This event"] > button) { ${PANE_DARK} }
[data-checklist] { border-radius: 22px; }
[role="group"][aria-label="What the link opens"] { border-radius: 999px !important; padding: 4px !important; ${WELL_LIGHT} }
.dark [role="group"][aria-label="What the link opens"] { ${WELL_DARK} }
[data-door-choice] { border-radius: 999px !important; font-weight: 600; }
[data-door-choice][data-state="on"] { ${PANE_LIGHT} }
.dark [data-door-choice][data-state="on"] {
  background: linear-gradient(180deg, oklch(1 0 0 / 20%), oklch(1 0 0 / 11%)) !important;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 25%), inset 0 0 0 1px oklch(1 0 0 / 10%) !important;
}
[data-door-gate] { border: 0 !important; border-radius: 16px !important; ${PANE_LIGHT} }
.dark [data-door-gate] { ${PANE_DARK} }
[data-door-gate][data-state="on"] { box-shadow: inset 0 1px 0 oklch(1 0 0), inset 0 0 0 1.5px color-mix(in oklab, var(--foreground) 45%, transparent), ${HALO} !important; }
[data-guest-dock] > [role="group"] { ${LAYER_LIGHT} background: oklch(1 0 0 / 60%); border-radius: 26px 26px 0 0; }
.dark [data-guest-dock] > [role="group"] { ${LAYER_DARK} border-radius: 26px 26px 0 0; }
[data-guest-dock] > [aria-hidden] { display: none; }
header.sticky.border-b { -webkit-backdrop-filter: blur(24px) saturate(1.8); backdrop-filter: blur(24px) saturate(1.8); }
/* a desk's panel floats inset, a pane over the page; a hand's screen is the screen */
[data-slot="popup-content"][data-shape="panel"] { top: 12px; bottom: 12px; right: 12px; border-left: 0; }
[data-slot="popup-content"]:is([data-shape="screen"],[data-shape="cover"]) { border-radius: 0; }
[data-slot="popup-content"][data-shape="sheet"] { border-radius: 24px 24px 0 0; }

[data-slot="responsive-menu-item"] { font-weight: 600; }
[data-slot="responsive-menu-item"] > svg { color: var(--foreground) !important; }

/* ── on a photograph: the house glass, lit, and a pearl ─────────────── */
[data-on-photo] [data-eh="live"], [data-on-photo] [data-eh="round"] {
  background: linear-gradient(180deg, oklch(1 0 0 / 28%), oklch(1 0 0 / 8%));
  -webkit-backdrop-filter: blur(16px) saturate(1.8); backdrop-filter: blur(16px) saturate(1.8);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 50%), inset 0 0 0 1px oklch(1 0 0 / 18%), 0 4px 14px oklch(0 0 0 / 0.25);
}
[data-on-photo] [data-eh="live"]::before { box-shadow: 0 0 8px var(--success); }
[data-on-photo] [data-slot="button"][data-variant="default"] { ${PEARL_DARK} }
[data-eh="shutter"] {
  background:
    radial-gradient(closest-side, oklch(0.99 0.002 286) calc(100% - 8px), transparent calc(100% - 7px)),
    conic-gradient(oklch(1 0 0) var(--p, 0%), oklch(1 0 0 / 22%) 0);
  box-shadow: 0 0 18px oklch(1 0 0 / 35%), 0 4px 14px oklch(0 0 0 / 0.3);
}
[data-eh="code-chip"] { border-radius: 10px; box-shadow: inset 0 1px 0 oklch(1 0 0), inset 0 0 0 1px oklch(0.2 0.01 286 / 10%), var(--shadow-lift); }
[data-eh="number-door"] { border-radius: 16px; }
[data-eh="number-door"]:hover { ${PANE_LIGHT} }
.dark [data-eh="number-door"]:hover { ${PANE_DARK} }
`;
