import type { FieldsId } from "../model";

import {
  lockAt,
  locked,
  MARK_IMAGES,
  MARK_POSITIONS,
  MARK_SIZES,
  MARKS,
} from "./marks";
import { BUSY, each, ERROR, FIELDS, FOCUS, HOVER, LIVE, OFF } from "./states";

/**
 * FIELDS: TEXT FIELDS, SELECTS, SWITCHES, CHECKS, RADIOS (AND RADIO CARDS),
 * SLIDERS AND TABS. Three builds, every state drawn: rest, hover, focus, off,
 * loading (a field checking what was typed, `aria-busy`) and error.
 *
 * ★ CHECKS, RADIOS AND SLIDERS ARE STAND-INS: production has no primitive for
 * them yet (a check lives inside a menu, a radio is a card on Settings' door),
 * so the specimen draws each on shadcn's own hooks (`checkbox`,
 * `radio-group-item`, `slider`) and a fourth, `radio-card`, the door's gates;
 * the pick wires them as primitives with those names.
 */

/** Laid out once: the stand-ins have no classes of their own. */
const BASE = `
[data-slot="checkbox"], [data-slot="radio-group-item"] {
  position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 18px; height: 18px; padding: 0; border: 0; outline: none; cursor: pointer; color: var(--primary-foreground);
  transition: background-color 120ms linear, box-shadow 120ms linear, scale 120ms var(--ease-emphasis);
}
[data-slot="checkbox-indicator"] { display: none; align-items: center; justify-content: center; }
[data-slot="checkbox-indicator"] svg { width: 12px; height: 12px; stroke-width: 3.2; }
[data-slot="checkbox"][data-state="checked"] [data-slot="checkbox-indicator"] { display: flex; }
[data-slot="radio-group-indicator"] { display: none; width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
[data-slot="radio-group-item"][data-state="checked"] [data-slot="radio-group-indicator"] { display: block; }
[data-slot="slider"] {
  position: relative; display: flex; align-items: center; width: 100%; height: 26px; touch-action: none; cursor: pointer;
}
[data-slot="slider-track"] { position: relative; flex: 1; overflow: hidden; }
[data-slot="slider-range"] { position: absolute; inset-block: 0; left: 0; }
[data-slot="slider-thumb"] {
  position: absolute; top: 50%; translate: -50% -50%; outline: none; cursor: grab;
  transition: box-shadow 120ms linear, scale 120ms var(--ease-emphasis);
}
[data-slot="radio-card"] { position: relative; cursor: pointer; transition: background-color 120ms linear, box-shadow 120ms linear; }
[data-slot="tabs-list"] { position: relative; }
[data-slot="tabs-trigger"] { position: relative; flex: none; }
`;

/* ── WELLS: r1's wells, refined ───────────────────────────────────────── */

/**
 * WELLS: every field a recess in the body, a shade inside its top edge; it
 * lights a step when it has focus and the lock's marks sit on its corners. A
 * switch is a recessed track with a thumb that rides in it; a check and a
 * radio are small wells that fill with ink; a slider is a groove; tabs are the
 * camera's mode dial, the mode named with a dot under it.
 */
const WELLS = `
${FIELDS} {
  --m-c: transparent; --m-a: 9px; --m-w: 1.5px;
  height: 38px; border: 0; border-radius: 9px; padding-inline: 12px; font-size: 14px;
  background-color: var(--muted); ${MARKS}
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
  transition: box-shadow 120ms linear, background-color 120ms linear;
}
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, HOVER + LIVE)} { box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
${each(FIELDS, FOCUS)} {
  outline: none; --m-c: var(--foreground);
  background-color: color-mix(in oklab, var(--muted) 55%, var(--card));
  box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, ERROR)} {
  --m-c: var(--destructive);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--destructive) 60%, transparent), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, BUSY)} {
  background-image: ${MARK_IMAGES}, linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: ${MARK_SIZES}, 30% 2px;
  background-position: ${MARK_POSITIONS}, 12% calc(100% - 1px);
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
[data-slot="switch"]${FOCUS} { outline: none; box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 3px var(--vf-well-shade); }
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

[data-slot="radio-card"] {
  border: 0 !important; border-radius: 10px !important; background: var(--muted) !important;
  box-shadow: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
[data-slot="radio-card"]${HOVER} { box-shadow: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
[data-slot="radio-card"]:is([data-state="on"],[data-state="checked"]) {
  background: var(--card) !important; box-shadow: inset 0 0 0 1.5px var(--foreground), var(--shadow-lift);
}

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

/* ── RINGS: a phone's soft outlines ───────────────────────────────────── */

/**
 * RINGS: a field is a soft-cornered ring you see the body through; focus
 * draws the ring in ink and a second, faint ring closes in round it. A switch
 * is an outlined pill that fills with ink, a check and a radio are circles,
 * a slider a hairline with an ink run and a round thumb, and tabs a pill
 * track with the chosen one solid.
 */
const RINGS = `
${FIELDS} {
  height: 40px; border: 0; border-radius: 12px; padding-inline: 14px; font-size: 14px;
  background-color: transparent; background-image: none; box-shadow: inset 0 0 0 1.5px var(--vf-ring);
  outline: 1.5px solid transparent; outline-offset: 6px;
  transition: box-shadow 120ms linear, outline-offset 160ms var(--ease-emphasis), outline-color 100ms linear;
}
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
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

/* ── CORNERS: the viewfinder's own frame ──────────────────────────────── */

/**
 * CORNERS: a field is four corner marks over a line to write on, the frame a
 * camera draws round what it will focus; focus thickens and lengthens the
 * marks and inks the line. A switch is a framed lever with a block that
 * slides, a check is a frame that fills, a radio a point that lights with its
 * frame, a slider an exposure scale read by a needle, and tabs move the frame
 * from mode to mode.
 */
const CORNERS = `
${FIELDS} {
  --m-c: var(--vf-ring-strong); --m-a: 7px; --m-w: 1.5px;
  height: 38px; border: 0; border-radius: 0; padding-inline: 11px; font-size: 14px;
  background-color: transparent; ${MARKS}
  box-shadow: inset 0 -1px 0 var(--vf-ring);
  transition: background-color 120ms linear, box-shadow 120ms linear;
}
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, HOVER + LIVE)} { --m-c: color-mix(in oklab, var(--foreground) 70%, transparent); }
${each(FIELDS, FOCUS)} {
  outline: none; --m-c: var(--foreground); --m-w: 2px; --m-a: 10px;
  background-color: var(--vf-wash); box-shadow: inset 0 -1.5px 0 var(--foreground);
}
${each(FIELDS, ERROR)} { --m-c: var(--destructive); box-shadow: inset 0 -1.5px 0 var(--destructive); }
${each(FIELDS, OFF)} { opacity: 0.4; }
${each(FIELDS, BUSY)} {
  background-image: ${MARK_IMAGES}, linear-gradient(90deg, transparent, var(--foreground), transparent);
  background-size: ${MARK_SIZES}, 30% 2px;
  background-position: ${MARK_POSITIONS}, 12% calc(100% - 1px);
  animation: vf-field-scan 1.1s linear infinite;
}

[data-slot="switch"] {
  width: 46px; height: 24px; border: 0; border-radius: 1px; background: transparent; box-shadow: none;
}
[data-slot="switch"]::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  --m-c: var(--vf-ring-strong); --m-a: 6px; --m-w: 1.5px; ${MARKS}
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) { background: var(--vf-wash-strong); }
[data-slot="switch"]:is([data-state="checked"],[data-checked])::before { --m-c: var(--foreground); }
[data-slot="switch-thumb"] {
  width: 18px; height: 14px; border-radius: 1px; translate: 4px 0; background: var(--vf-ring-strong); box-shadow: none;
  transition: translate 160ms var(--ease-in-out-strong), background-color 120ms linear;
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) [data-slot="switch-thumb"] { translate: 24px 0; background: var(--foreground); }
[data-slot="switch"]${FOCUS} { outline: none; }
[data-slot="switch"]${FOCUS}::before { --m-c: var(--foreground); --m-w: 2px; --m-a: 8px; inset: -3px; }
[data-slot="switch"]${OFF} { opacity: 0.4; }

[data-slot="checkbox"] {
  width: 18px; height: 18px; border-radius: 0; background-color: transparent; color: var(--primary-foreground);
  --m-c: var(--vf-ring-strong); --m-a: 5px; --m-w: 1.5px; ${MARKS}
}
[data-slot="checkbox"]${HOVER}${LIVE} { --m-c: var(--foreground); }
[data-slot="checkbox"] [data-slot="checkbox-indicator"] { width: 10px; height: 10px; background: var(--foreground); }
[data-slot="checkbox"] [data-slot="checkbox-indicator"] svg { display: none; }
[data-slot="checkbox"][data-state="checked"] { --m-c: var(--foreground); }
[data-slot="radio-group-item"] {
  width: 16px; height: 16px; border-radius: 999px; background: transparent; color: var(--foreground);
  box-shadow: inset 0 0 0 1.5px var(--vf-ring-strong);
}
[data-slot="radio-group-item"]${HOVER}${LIVE} { box-shadow: inset 0 0 0 1.5px var(--foreground); }
[data-slot="radio-group-item"][data-state="checked"] { box-shadow: none; }
[data-slot="radio-group-item"][data-state="checked"] [data-slot="radio-group-indicator"] { width: 8px; height: 8px; }
[data-slot="radio-group-item"]::before {
  content: ""; position: absolute; inset: -4px; pointer-events: none; opacity: 0;
  --m-c: var(--foreground); --m-a: 5px; --m-w: 1.5px; ${MARKS}
  transition: opacity 100ms linear, inset 140ms var(--ease-emphasis);
}
[data-slot="radio-group-item"][data-state="checked"]::before { opacity: 1; inset: -3px; }
[data-slot="checkbox"]${FOCUS}, [data-slot="radio-group-item"]${FOCUS} { outline: none; }
[data-slot="checkbox"]${FOCUS} { --m-c: var(--foreground); --m-w: 2px; }
[data-slot="radio-group-item"]${FOCUS}::before { opacity: 1; --m-w: 2px; }
[data-slot="checkbox"]${ERROR} { --m-c: var(--destructive); }
[data-slot="radio-group-item"]${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
[data-slot="checkbox"]${OFF}, [data-slot="radio-group-item"]${OFF} { opacity: 0.4; }

[data-slot="slider-track"] {
  height: 12px; overflow: visible; background-color: transparent;
  background-image: repeating-linear-gradient(90deg, var(--vf-ring-strong) 0 1px, transparent 1px 8px),
    linear-gradient(var(--vf-ring-strong) 0 0);
  background-size: 100% 6px, 1px 12px; background-position: 0 100%, 50% 0; background-repeat: repeat-x, no-repeat;
}
[data-slot="slider-range"] { top: auto; bottom: 0; height: 2px; background: var(--foreground); }
[data-slot="slider-thumb"] {
  width: 12px; height: 24px; border-radius: 0; background-color: transparent; box-shadow: none;
  background-image: conic-gradient(from 150deg at 50% 0, var(--foreground) 0 60deg, transparent 0), linear-gradient(var(--foreground) 0 0);
  background-size: 12px 7px, 2px 100%; background-position: 50% 0, 50% 0; background-repeat: no-repeat;
}
[data-slot="slider-thumb"]::after { ${lockAt("8px")} --m-a: 5px; }
[data-slot="slider-thumb"]${FOCUS}::after { ${locked("4px")} }
[data-slot="slider"]${OFF} { opacity: 0.4; }

[data-slot="radio-card"] {
  border: 0 !important; border-radius: 0 !important; background-color: transparent !important; box-shadow: none;
  --m-c: var(--vf-ring); --m-a: 9px; --m-w: 1.5px; ${MARKS}
}
[data-slot="radio-card"]${HOVER} { --m-c: var(--vf-ring-strong); }
[data-slot="radio-card"]:is([data-state="on"],[data-state="checked"]) { --m-c: var(--foreground); --m-w: 2px; background-color: var(--vf-wash) !important; }

[data-slot="tabs-list"] { height: auto; gap: 4px; padding: 0; background: transparent; border-radius: 0; }
[data-slot="tabs-trigger"] {
  height: 30px; padding: 0 12px; border: 0; border-radius: 0; background-color: transparent !important; box-shadow: none !important;
  color: var(--muted-foreground);
}
[data-slot="tabs-trigger"]::after {
  content: ""; position: absolute; inset: 0 !important; width: auto; height: auto; opacity: 0 !important; pointer-events: none;
  background-color: transparent !important; --m-c: var(--foreground); --m-a: 7px; --m-w: 1.5px; ${MARKS}
  transition: opacity 100ms linear;
}
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"]::after { opacity: 1 !important; }
[data-slot="tabs-trigger"]${FOCUS} { outline: none; }
[data-slot="tabs-trigger"]${FOCUS}::after { opacity: 1 !important; --m-w: 2px; }
`;

const KEYFRAMES = `
@keyframes vf-field-scan {
  from { background-position: ${MARK_POSITIONS}, -60% calc(100% - 1px); }
  to { background-position: ${MARK_POSITIONS}, 160% calc(100% - 1px); }
}
@keyframes vf-field-scan-one {
  from { background-position: -60% calc(100% - 3px); }
  to { background-position: 160% calc(100% - 3px); }
}
`;

export const FIELDS_CSS: Record<FieldsId, string> = {
  wells: BASE + WELLS + KEYFRAMES,
  rings: BASE + RINGS + KEYFRAMES,
  corners: BASE + CORNERS + KEYFRAMES,
};
