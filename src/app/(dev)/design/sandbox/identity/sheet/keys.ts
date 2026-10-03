import {
  lockAt,
  locked,
  MARK_IMAGES,
  MARK_POSITIONS_IN,
  MARK_SIZES,
  MARKS,
} from "./marks";
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
  ICON,
  LIVE,
  OFF,
  ON,
  PHOTO,
  PRESS,
  SEGMENT,
  SEGMENTS,
} from "./states";

/**
 * KEYS AND WELLS: CARVED FROM THE BODY. What you press stands up out of the
 * body as a key, in a machined bevel (a light edge above, a shade below), and
 * travels a pixel when pressed; what holds a value sinks into it as a well, a
 * subtle difference against the page (Will: "I like wells, especially
 * recessed inputs for subtle difference against page color"). A chosen thing
 * rises out of its well as a key: a segment, a radio card.
 *
 * ★ THE LOCK IS THE ONE FOCUS MARK, ON EVERYTHING (his note: "don't mind
 * using the viewfinder corners for focus only, including last answer"): four
 * marks out at rest that close in on whatever has focus, a key, a field, a
 * switch, a check, a tab. Nowhere else does a corner appear.
 *
 * Loading is three lights breathing in the key's place (the key keeps its
 * width), never the marks hunting; a field checking what was typed lights a
 * band along its floor.
 */

/* ── keys ─────────────────────────────────────────────────────────────── */

const KEYS = `
${BTN} {
  --k-r: 7px; position: relative; border-radius: var(--k-r); border-color: transparent;
  transition: background-color 90ms linear, color 90ms linear, box-shadow 90ms linear, translate 70ms linear;
}
${BTN}[data-size="xs"] { --k-r: 5px; }
${BTN}[data-size="sm"] { --k-r: 6px; }
${BTN}[data-size="lg"] { --k-r: 8px; }
${BTN}[data-size="cta"] { --k-r: 10px; }
${BTN}${ICON}, ${BTN}[data-size="icon-cta"] { --k-r: 999px; }
${BTN}::after { ${lockAt("10px")} }
${BTN}${FOCUS} { outline: none; }
${BTN}${FOCUS}::after { ${locked("4px")} }
${BTN}${PRESS}${LIVE} { translate: 0 1px; scale: none; }

${btn("default")} {
  --k-ink: var(--primary-foreground); background: var(--primary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo);
}
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--primary) 86%, var(--background)); }
${btn("default")}${PRESS}${LIVE} { box-shadow: inset 0 1px 2px oklch(0 0 0 / 38%); }

${btn("secondary", "outline")} {
  --k-ink: var(--foreground); background: var(--secondary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border);
}
${btn("outline")} { background: var(--card); }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: var(--accent); }
${btn("secondary", "outline")}${PRESS}${LIVE} {
  box-shadow: inset 0 1px 2px var(--vf-key-lo), inset 0 0 0 1px var(--border);
}

${btn("ghost")} { --k-ink: var(--foreground); background: transparent; color: var(--k-ink); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--secondary); box-shadow: inset 0 0 0 1px var(--border); }
${btn("ghost")}${PRESS}${LIVE} { background: var(--secondary); box-shadow: inset 0 1px 2px var(--vf-key-lo), inset 0 0 0 1px var(--border); }

${btn("destructive")} {
  --k-ink: var(--destructive); background: var(--secondary); color: var(--k-ink);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo),
    inset 0 0 0 1px color-mix(in oklab, var(--destructive) 38%, transparent);
}
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 12%, var(--secondary)); }

${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground); }
${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }

${BTN}${OFF} { opacity: 0.36; }
${BTN}${BUSY} { cursor: progress; color: transparent; }
${BTN}${BUSY} > * { visibility: hidden; }
${BTN}${BUSY}:not([data-variant="link"])::before {
  content: ""; position: absolute; left: 50%; top: 50%; width: 22px; height: 6px; margin: -3px 0 0 -11px; pointer-events: none;
  background:
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 0 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 8px 0 / 6px 6px no-repeat,
    radial-gradient(circle closest-side, var(--k-ink) 90%, transparent) 16px 0 / 6px 6px no-repeat;
  animation: vf-breathe-dots 700ms ease-in-out infinite alternate;
}
${BTN}${ERROR} {
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1.5px var(--destructive);
}

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 10px; border: 0; border-radius: 6px;
  background: var(--secondary); color: var(--muted-foreground);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border);
  transition: background-color 90ms linear, color 90ms linear, translate 70ms linear;
}
${CHIP}${HOVER}${LIVE} { background: var(--accent); color: var(--foreground); }
${CHIP}${PRESS}${LIVE} { translate: 0 1px; scale: none; }
${CHIP}${ON} {
  background: var(--primary); color: var(--primary-foreground);
  box-shadow: inset 0 1px 0 var(--vf-ink-hi), inset 0 -1px 0 var(--vf-ink-lo);
}
${CHIP}::after { ${lockAt("9px")} }
${CHIP}${FOCUS} { outline: none; }
${CHIP}${FOCUS}::after { ${locked("4px")} }
${CHIP}${OFF} { opacity: 0.36; }

/* a segmented control: a well holding its choices, the chosen one a key risen out of it */
${SEGMENTS} {
  gap: 2px; padding: 3px; border-radius: 10px; background: var(--muted);
  box-shadow: inset 0 1px 2px var(--vf-well-shade), inset 0 0 0 1px var(--border);
}
${SEGMENT} {
  position: relative; height: 30px; min-width: 32px; padding: 0 10px; border: 0; border-radius: 7px; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); }
${SEGMENT}${ON} {
  background: var(--card); color: var(--foreground);
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1px var(--border), var(--shadow-lift);
}
${SEGMENT}::after { ${lockAt("8px")} }
${SEGMENT}${FOCUS} { outline: none; }
${SEGMENT}${FOCUS}::after { ${locked("3px")} }
${SEGMENT}${OFF} { opacity: 0.36; }

/* on a photograph: the white primary a key, the glass round a dial, the lock in white */
${btn("on-photo")} {
  --k-ink: oklch(0.13 0.004 286); background: oklch(1 0 0); color: var(--k-ink);
  box-shadow: inset 0 -1px 0 oklch(0 0 0 / 20%), 0 1px 3px oklch(0 0 0 / 30%);
}
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }
${btn("glass")} { --k-ink: oklch(1 0 0); }
${PHOTO} ${BTN}${FOCUS}::after { --m-c: oklch(1 0 0); }

/* the head's atoms keep their surfaces and take the lock */
[data-slot="shutter"] { outline: none; box-shadow: none !important; }
[data-slot="shutter"]::after { ${lockAt("12px")} --m-c: var(--foreground); }
[data-slot="shutter"]${FOCUS}::after { ${locked("6px")} }
[data-slot="code-chip"] { box-shadow: inset 0 -1px 0 oklch(0 0 0 / 14%), 0 0 0 1px var(--border), var(--shadow-lift) !important; border-radius: 9px; }
[data-slot="code-chip"]::after { ${lockAt("9px")} }
[data-slot="code-chip"]${FOCUS}::after { ${locked("4px")} }
[data-slot="code-chip"]${PRESS} { translate: 0 1px; scale: none; }
`;

/* ── wells ────────────────────────────────────────────────────────────── */

const WELLS = `
${FIELDS} {
  --m-c: transparent; --m-a: 8px; --m-w: 1.5px;
  height: 40px; border: 0; border-radius: 9px; padding-inline: 12px; font-size: 14px;
  background-color: var(--muted); ${MARKS} background-position: ${MARK_POSITIONS_IN};
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
  transition: box-shadow 120ms linear, background-color 120ms linear;
}
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, HOVER + LIVE)} { box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
${each(FIELDS, FOCUS)} {
  outline: none; --m-c: var(--foreground);
  background-color: color-mix(in oklab, var(--muted) 55%, var(--card));
  box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, ERROR)} {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--destructive) 70%, transparent), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, ERROR + FOCUS)} { --m-c: var(--destructive); }
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, BUSY)} {
  background-image: ${MARK_IMAGES}, linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: ${MARK_SIZES}, 30% 2px;
  background-position: ${MARK_POSITIONS_IN}, 12% calc(100% - 1px);
  animation: vf-field-scan 1.1s linear infinite;
}

[data-slot="switch"] {
  width: 42px; height: 24px; border: 0; border-radius: 999px;
  background: var(--muted); box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 3px var(--vf-well-shade);
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) {
  background: var(--primary); box-shadow: inset 0 1px 2px oklch(0 0 0 / 28%);
}
[data-slot="switch-thumb"] {
  width: 18px; height: 18px; border-radius: 999px; translate: 2px 0; background: var(--vf-thumb);
  box-shadow: 0 1px 2px oklch(0 0 0 / 30%), inset 0 0 0 0.5px oklch(0 0 0 / 10%);
  transition: translate 180ms var(--ease-in-out-strong), background-color 120ms linear;
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) [data-slot="switch-thumb"] { translate: 21px 0; background: var(--primary-foreground); }
[data-slot="switch"]::before { ${lockAt("9px")} }
[data-slot="switch"]${FOCUS} { outline: none; }
[data-slot="switch"]${FOCUS}::before { ${locked("4px")} }
[data-slot="switch"]${OFF} { opacity: 0.4; }

[data-slot="checkbox"] {
  border-radius: 5px; background: var(--muted); box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="radio-group-item"] {
  border-radius: 999px; background: var(--muted); box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="checkbox"]${HOVER}${LIVE}, [data-slot="radio-group-item"]${HOVER}${LIVE} { box-shadow: inset 0 0 0 1px var(--vf-ring-strong), inset 0 1px 2px var(--vf-well-shade); }
[data-slot="checkbox"][data-state="checked"], [data-slot="radio-group-item"][data-state="checked"] {
  background: var(--primary); box-shadow: inset 0 1px 0 var(--vf-ink-hi);
}
[data-slot="checkbox"]::after, [data-slot="radio-group-item"]::after { ${lockAt("8px")} --m-a: 5px; }
[data-slot="checkbox"]${FOCUS}::after, [data-slot="radio-group-item"]${FOCUS}::after { ${locked("4px")} }
[data-slot="checkbox"]${ERROR}, [data-slot="radio-group-item"]${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
[data-slot="checkbox"]${OFF}, [data-slot="radio-group-item"]${OFF} { opacity: 0.4; }

[data-slot="slider-track"] {
  height: 8px; border-radius: 999px; background: var(--muted);
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="slider-range"] { background: var(--primary); border-radius: 999px; }
[data-slot="slider-thumb"] {
  width: 20px; height: 20px; border-radius: 999px; background: var(--vf-thumb);
  box-shadow: 0 1px 3px oklch(0 0 0 / 30%), inset 0 0 0 1px var(--border);
}
[data-slot="slider-thumb"]::after { ${lockAt("8px")} --m-a: 5px; }
[data-slot="slider-thumb"]${FOCUS}::after { ${locked("4px")} }
[data-slot="slider"]${OFF} { opacity: 0.4; }

/* a radio card: a well, the chosen one risen out of it as a key */
[data-slot="radio-card"] {
  border: 0 !important; border-radius: 10px !important; background: var(--muted) !important;
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="radio-card"]${HOVER} { box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
[data-slot="radio-card"]:is([data-state="on"],[data-state="checked"]) {
  background: var(--card) !important;
  box-shadow: inset 0 1px 0 var(--vf-key-hi), inset 0 -1px 0 var(--vf-key-lo), inset 0 0 0 1.5px var(--foreground), var(--shadow-lift);
}

/* tabs: the camera's mode dial, the mode named with a dot under it */
[data-slot="tabs-list"] { height: auto; gap: 20px; padding: 0; background: transparent; border-radius: 0; }
[data-slot="tabs-trigger"] {
  height: 30px; padding: 0 2px; border: 0; background: transparent !important; box-shadow: none !important;
  color: var(--muted-foreground);
}
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] { color: var(--foreground); }
[data-slot="tabs-trigger"]::after {
  content: ""; position: absolute; inset: auto auto -3px 50% !important; width: 4px; height: 4px; margin-left: -2px;
  border-radius: 999px; background: var(--foreground) !important; opacity: 0 !important; transition: opacity 120ms linear;
}
[data-slot="tabs-trigger"][data-state="active"]::after { opacity: 1 !important; }
[data-slot="tabs-trigger"]::before { ${lockAt("9px")} }
[data-slot="tabs-trigger"]${FOCUS} { outline: none; }
[data-slot="tabs-trigger"]${FOCUS}::before { ${locked("3px")} }
`;

export const KEYS_CSS = KEYS + WELLS;
