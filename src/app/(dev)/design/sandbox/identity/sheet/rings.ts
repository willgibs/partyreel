import {
  BTN,
  btn,
  BUSY,
  CHIP,
  CHIPS,
  each,
  ERROR,
  FIELDS,
  FOCUS,
  HOVER,
  LIVE,
  OFF,
  ON,
  PHOTO,
  PRESS,
  SEGMENT,
  SEGMENTS,
} from "./states";

/**
 * ALL RINGS: DRAWN IN LINE, a phone camera's round controls. Actions are pills
 * and circles: the primary solid ink, an outline a ring you see the page
 * through, a secondary a tonal pill; a field is a soft-cornered ring; a switch
 * an outlined pill that fills with ink; a check and a radio are circles; tabs
 * a pill track with the chosen one solid.
 *
 * ★ THE RING IS THE ONE FOCUS MARK, ON EVERYTHING: a ring that closes in from
 * six pixels to two round whatever has focus, a key, a field, a switch, a
 * check. No corner appears anywhere.
 *
 * Loading is an arc running round the control (the ring itself, working),
 * which keeps its words; a field checking what was typed runs a light along
 * its floor. Pressed, a control gives a little, the way a phone's does.
 */

const ACTIONS = `
${BTN} {
  position: relative; border-radius: 999px; border-color: transparent;
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear,
    scale 140ms var(--ease-emphasis), outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${BTN}${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; box-shadow: none; }
${BTN}${PRESS}${LIVE} { scale: 0.96; }

${btn("default")} { --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink); box-shadow: none; }
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 84%, var(--background)); }

${btn("outline")} {
  --k-ink: var(--foreground); background: transparent; color: var(--k-ink);
  box-shadow: inset 0 0 0 1.5px var(--vf-ring);
}
${btn("outline")}${HOVER}${LIVE} { background: var(--vf-wash); box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
${btn("outline")}${PRESS}${LIVE} { background: var(--vf-wash-strong); }
${btn("outline")}${FOCUS} { box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }

${btn("secondary")} { --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink); box-shadow: none; }
${btn("secondary")}${HOVER}${LIVE} { background: var(--accent); }

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--vf-wash); }
${btn("ghost")}${PRESS}${LIVE} { background: var(--vf-wash-strong); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: transparent; color: var(--k-ink);
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--destructive) 55%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 9%, transparent); }
${btn("destructive")}${FOCUS} { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--destructive) 55%, transparent); }

${btn("link")} {
  height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground);
  text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 5px;
  text-decoration-color: var(--vf-ring); border-radius: 4px;
}
${btn("link")}${HOVER}${LIVE} { text-decoration-color: var(--foreground); }

${BTN}${OFF} { opacity: 0.35; }
${BTN}${BUSY} { cursor: progress; }
${BTN}${BUSY}:not([data-variant="link"])::before {
  content: ""; position: absolute; inset: -4px; border-radius: 999px; padding: 1.5px; pointer-events: none;
  background: conic-gradient(from var(--vf-spin), var(--foreground) 0 24%, transparent 24% 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: vf-spin 900ms linear infinite;
}
${PHOTO} ${BTN}${BUSY}::before { background: conic-gradient(from var(--vf-spin), oklch(1 0 0) 0 24%, transparent 24% 100%); }
${BTN}${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 12px; border: 0; border-radius: 999px;
  background: transparent; color: var(--muted-foreground); box-shadow: inset 0 0 0 1.5px var(--vf-ring);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: background-color 120ms linear, color 120ms linear, scale 140ms var(--ease-emphasis), outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${CHIP}${HOVER}${LIVE} { background: var(--vf-wash); color: var(--foreground); }
${CHIP}${PRESS}${LIVE} { scale: 0.96; }
${CHIP}${ON} { background: var(--primary); color: var(--primary-foreground); box-shadow: none; }
${CHIP}${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
${CHIP}${OFF} { opacity: 0.35; }

${SEGMENTS} { gap: 0; padding: 3px; border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring); }
${SEGMENT} {
  position: relative; height: 30px; min-width: 34px; padding: 0 10px; border: 0; border-radius: 999px; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  outline: 1.5px solid transparent; outline-offset: 5px;
  transition: background-color 140ms var(--ease-in-out-strong), color 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); }
${SEGMENT}${ON} { background: var(--primary); color: var(--primary-foreground); }
${SEGMENT}${FOCUS} { outline-color: var(--foreground); outline-offset: 2px; }
${SEGMENT}${OFF} { opacity: 0.35; }

/* on a photograph: the white primary a pill, the glass round's ring in white */
${btn("on-photo")} { --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink); box-shadow: 0 1px 3px oklch(0 0 0 / 28%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.92 0 0); }
${btn("glass")} { --k-ink: oklch(1 0 0); }
${PHOTO} ${BTN}${FOCUS} { outline-color: oklch(1 0 0); }

/* the head's atoms keep their surfaces and take the ring */
[data-slot="shutter"] {
  box-shadow: none !important; outline: 1.5px solid transparent; outline-offset: 12px;
  transition: outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="shutter"]${FOCUS} { outline-color: var(--foreground); outline-offset: 7px; }
[data-slot="code-chip"] {
  border-radius: 12px; box-shadow: var(--shadow-lift) !important;
  outline: 1.5px solid var(--vf-ring); outline-offset: 3px;
  transition: outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear, scale 140ms var(--ease-emphasis);
}
[data-slot="code-chip"]${HOVER} { outline-color: var(--vf-ring-strong); }
[data-slot="code-chip"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2px; }
`;

const FIELDS_CSS = `
${FIELDS} {
  height: 40px; border: 0; border-radius: 12px; padding-inline: 14px; font-size: 14px;
  background-color: transparent; background-image: none; box-shadow: inset 0 0 0 1.5px var(--vf-ring);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: box-shadow 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, HOVER + LIVE)} { box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
${each(FIELDS, FOCUS)} {
  box-shadow: inset 0 0 0 1.5px var(--foreground);
  outline-color: color-mix(in oklab, var(--foreground) 20%, transparent); outline-offset: 2px; outline-width: 3px;
}
${each(FIELDS, ERROR)} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
${each(FIELDS, ERROR + FOCUS)} { outline-color: color-mix(in oklab, var(--destructive) 22%, transparent); }
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: 26% 2px; background-repeat: no-repeat; background-position: 12% calc(100% - 3px);
  animation: vf-field-scan-one 1.1s linear infinite;
}

[data-slot="switch"] {
  width: 42px; height: 26px; border: 0; border-radius: 999px; background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: background-color 160ms var(--ease-in-out-strong), box-shadow 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) { background: var(--primary); box-shadow: inset 0 0 0 1.5px var(--primary); }
[data-slot="switch-thumb"] {
  width: 18px; height: 18px; border-radius: 999px; translate: 4px 0; background: var(--vf-ring-strong); box-shadow: none;
  transition: translate 180ms var(--ease-in-out-strong), background-color 120ms linear, width 140ms var(--ease-emphasis);
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) [data-slot="switch-thumb"] { translate: 20px 0; background: var(--primary-foreground); }
[data-slot="switch"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
[data-slot="switch"]${OFF} { opacity: 0.4; }

[data-slot="checkbox"], [data-slot="radio-group-item"] {
  width: 20px; height: 20px; border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong);
  outline: 1.5px solid transparent; outline-offset: 5px;
  transition: background-color 120ms linear, box-shadow 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="checkbox"]${HOVER}${LIVE}, [data-slot="radio-group-item"]${HOVER}${LIVE} { box-shadow: inset 0 0 0 1.5px var(--foreground); }
[data-slot="checkbox"][data-state="checked"] { background: var(--primary); box-shadow: none; }
[data-slot="radio-group-item"] { color: var(--foreground); }
[data-slot="radio-group-item"][data-state="checked"] { box-shadow: inset 0 0 0 1.5px var(--foreground); }
[data-slot="checkbox"]${FOCUS}, [data-slot="radio-group-item"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
[data-slot="checkbox"]${ERROR}, [data-slot="radio-group-item"]${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
[data-slot="checkbox"]${OFF}, [data-slot="radio-group-item"]${OFF} { opacity: 0.4; }

[data-slot="slider-track"] { height: 3px; border-radius: 999px; background: var(--vf-ring); }
[data-slot="slider-range"] { background: var(--foreground); border-radius: 999px; }
[data-slot="slider-thumb"] {
  width: 22px; height: 22px; border-radius: 999px; background: var(--card);
  box-shadow: inset 0 0 0 1.5px var(--foreground), 0 1px 3px oklch(0 0 0 / 25%);
  outline: 1.5px solid transparent; outline-offset: 5px;
  transition: outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear, scale 120ms var(--ease-emphasis);
}
[data-slot="slider-thumb"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2.5px; }
[data-slot="slider-thumb"]:active { scale: 1.08; }
[data-slot="slider"]${OFF} { opacity: 0.4; }

[data-slot="radio-card"] {
  border: 0 !important; border-radius: 14px !important; background: transparent !important;
  box-shadow: inset 0 0 0 1.5px var(--vf-ring);
}
[data-slot="radio-card"]${HOVER} { box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong); }
[data-slot="radio-card"]:is([data-state="on"],[data-state="checked"]) {
  background: var(--vf-wash) !important; box-shadow: inset 0 0 0 1.5px var(--foreground);
}

[data-slot="tabs-list"] {
  height: auto; gap: 0; padding: 3px; border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring);
}
[data-slot="tabs-trigger"] {
  height: 30px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent !important; box-shadow: none !important;
  color: var(--muted-foreground); outline: 1.5px solid transparent; outline-offset: 5px;
  transition: background-color 160ms var(--ease-in-out-strong), color 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="tabs-trigger"]::after { display: none !important; }
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] { background: var(--primary) !important; color: var(--primary-foreground); }
[data-slot="tabs-trigger"]${FOCUS} { outline-color: var(--foreground); outline-offset: 2px; }
`;

export const RINGS_CSS = ACTIONS + FIELDS_CSS;
