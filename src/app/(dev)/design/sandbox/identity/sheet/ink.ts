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
 * INK: WHATEVER YOU ARE ON TURNS TO INK (the third idea, this lane's own).
 *
 * Every control rests as a quiet tone of its ground, with no line and no
 * bevel, so a page of them reads as calm as its type; and the one you are on
 * turns to solid ink: the field you type in, the key you press, the chip you
 * chose, the segment that is on. Ink is the house's own word for the primary
 * (`design-system.md`): near-black on paper, so a pressed key or a field in
 * use is a piece of the camera's own screen on the white body (your layers
 * pick, "black surfaces getting attention on white body"), and white in the
 * room, its brightest point.
 *
 * ★ THE CURSOR IS THE ONE FOCUS MARK: a plate under the keyboard turns to ink
 * with a thin ring of the inverse inside it (the display's own chosen-row
 * cursor, worn on the control), and a small toggle that is already ink when
 * on (a switch, a check, a radio, a thumb) wears the cursor as an ink ring
 * round it. No corner, no ring that moves.
 *
 * A press is a blink: a tone key snaps to ink under the finger and fades back
 * as it lifts, the way a camera's screen blacks out on the shutter. Working,
 * the key stays ink and fills with light from the left, its words kept; a
 * field checking what was typed fills an ink line along its floor.
 */

/** The ink and its inverse: near-black and white on paper, white and near-black in the room. */
const INK = `
  --ink: var(--primary); --ink-fg: var(--primary-foreground);
  --tone: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tone-up: color-mix(in oklab, var(--foreground) 13%, transparent);
`;

/** Every other control the system draws, by its hook. */
const INKED = [
  FIELDS,
  '[data-slot="switch"]',
  '[data-slot="checkbox"]',
  '[data-slot="radio-group-item"]',
  '[data-slot="radio-card"]',
  '[data-slot="slider"]',
  '[data-slot="tabs-list"]',
  '[data-slot="tabs-trigger"]',
  '[data-slot="shutter"]',
  '[data-slot="code-chip"]',
].join(", ");

/** The cursor inside an ink plate: a ring of the inverse, two pixels in. */
const CURSOR = (c = "var(--ink-fg)") =>
  `inset 0 0 0 2px var(--ink), inset 0 0 0 3.5px ${c}`;

/** The cursor round a small toggle: an ink ring, two pixels out. */
const AROUND = "0 0 0 2px var(--background), 0 0 0 3.5px var(--ink)";

/**
 * Working: the plate stays ink, its words kept, and a line of light fills
 * along its floor from the left (`vf-ink-fill`); still, it rests part full,
 * which reads as working on its own.
 */
const FILLING = `
  background-image: linear-gradient(var(--ink-fg) 0 0);
  background-repeat: no-repeat; background-size: calc((100% - 16px) * 0.42) 2px; background-position: 8px calc(100% - 4px);
  animation: vf-ink-fill 1.3s var(--ease-in-out-strong) infinite;
`;

const ACTIONS = `
/* every control reads its ink and its tones off its own ground */
:where(${BTN}, ${CHIPS}, ${CHIP}, ${SEGMENTS}, ${SEGMENT}, ${INKED}) { ${INK} }
${BTN} {
  position: relative; border-radius: 10px; border-color: transparent;
  transition: background-color 160ms linear, color 160ms linear, box-shadow 120ms linear;
}
${BTN}[data-size="xs"] { border-radius: 7px; }
${BTN}[data-size="sm"] { border-radius: 8px; }
${BTN}[data-size="lg"] { border-radius: 11px; }
${BTN}[data-size="cta"] { border-radius: 13px; }
${BTN}:is([data-size="icon"],[data-size="icon-xs"],[data-size="icon-sm"],[data-size="icon-lg"],[data-size="icon-cta"]) { border-radius: 999px; }
${BTN}${FOCUS} { outline: none; }
${BTN}${PRESS}${LIVE} { scale: none; transition-duration: 0ms; }

${btn("default")} {
  background: var(--ink); color: var(--ink-fg);
  box-shadow: inset 0 1px 0 var(--vf-ink-hi);
}
${btn("default")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--ink) 86%, var(--background)); }
${btn("default")}${PRESS}${LIVE} { background: var(--ink); box-shadow: inset 0 1px 3px oklch(0 0 0 / 45%); }

${btn("secondary", "outline")} { background: var(--tone); color: var(--foreground); box-shadow: none; }
${btn("secondary", "outline")}${HOVER}${LIVE} { background: var(--tone-up); }

${btn("ghost")} { background: transparent; color: var(--foreground); box-shadow: none; }
${btn("ghost")}${HOVER}${LIVE} { background: var(--tone); }

${btn("secondary", "outline", "ghost")}${PRESS}${LIVE} { background: var(--ink); color: var(--ink-fg); }
${btn("default", "secondary", "outline", "ghost")}${FOCUS} { background: var(--ink); color: var(--ink-fg); box-shadow: ${CURSOR()}; }

${btn("destructive")} { background: color-mix(in oklab, var(--destructive) 11%, transparent); color: var(--destructive); box-shadow: none; }
${btn("destructive")}${HOVER}${LIVE} { background: color-mix(in oklab, var(--destructive) 17%, transparent); }
${btn("destructive")}${PRESS}${LIVE} { background: var(--destructive); color: oklch(1 0 0); }
${btn("destructive")}${FOCUS} {
  background: var(--destructive); color: oklch(1 0 0);
  box-shadow: inset 0 0 0 2px var(--destructive), inset 0 0 0 3.5px oklch(1 0 0);
}

${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; box-shadow: none; color: var(--foreground); border-radius: 4px; }
${btn("link")}${HOVER}${LIVE} { text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 4px; }
${btn("link")}${FOCUS} { background: var(--ink); color: var(--ink-fg); box-shadow: 0 0 0 4px var(--ink); text-decoration: none; }

${BTN}${OFF} { opacity: 0.38; }
${BTN}${BUSY}:not([data-variant="link"]) { cursor: progress; background-color: var(--ink); color: var(--ink-fg); box-shadow: none; ${FILLING} }
${btn("destructive")}${BUSY} { background-color: var(--destructive); color: oklch(1 0 0); --ink-fg: oklch(1 0 0); }
${BTN}${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
${btn("default")}${ERROR} { box-shadow: inset 0 0 0 2px var(--ink), inset 0 0 0 3.5px var(--destructive); }

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 11px; border: 0; border-radius: 8px;
  background: var(--tone); color: var(--muted-foreground); box-shadow: none;
  transition: background-color 160ms linear, color 160ms linear, box-shadow 120ms linear;
}
${CHIP}${HOVER}${LIVE} { background: var(--tone-up); color: var(--foreground); }
${CHIP}${PRESS}${LIVE} { background: var(--ink); color: var(--ink-fg); transition-duration: 0ms; scale: none; }
${CHIP}${ON} { background: var(--ink); color: var(--ink-fg); }
${CHIP}${FOCUS} { outline: none; background: var(--ink); color: var(--ink-fg); box-shadow: ${CURSOR()}; }
${CHIP}${OFF} { opacity: 0.38; }

${SEGMENTS} { gap: 2px; padding: 3px; border-radius: 12px; background: var(--tone); box-shadow: none; }
${SEGMENT} {
  position: relative; height: 30px; min-width: 34px; padding: 0 10px; border: 0; border-radius: 9px; white-space: nowrap;
  background: transparent; color: var(--muted-foreground); box-shadow: none;
  transition: background-color 160ms linear, color 160ms linear, box-shadow 120ms linear;
}
${SEGMENT}${HOVER}${LIVE} { color: var(--foreground); background: var(--tone); }
${SEGMENT}${PRESS}${LIVE} { background: var(--ink); color: var(--ink-fg); transition-duration: 0ms; scale: none; }
${SEGMENT}${ON} { background: var(--ink); color: var(--ink-fg); }
${SEGMENT}${FOCUS} { outline: none; background: var(--ink); color: var(--ink-fg); box-shadow: ${CURSOR()}; }
${SEGMENT}${OFF} { opacity: 0.38; }

/* on a photograph the ink is white already: a white plate, and the cursor a white ring round it */
${btn("on-photo")} { background: oklch(1 0 0); color: oklch(0.13 0.004 286); box-shadow: 0 1px 3px oklch(0 0 0 / 28%); }
${btn("on-photo")}${HOVER}${LIVE} { background: oklch(0.93 0 0); }
${btn("on-photo")}${PRESS}${LIVE} { background: oklch(0.86 0 0); }
${PHOTO} ${BTN}${FOCUS}, ${btn("on-photo", "glass")}${FOCUS} {
  background: oklch(1 0 0); color: oklch(0.13 0.004 286);
  box-shadow: 0 0 0 2px oklch(0 0 0 / 35%), 0 0 0 3.5px oklch(1 0 0);
}

/* the head's atoms keep their surfaces and take the cursor */
[data-slot="shutter"] { box-shadow: none !important; outline: none; }
[data-slot="shutter"]${FOCUS} { box-shadow: 0 0 0 9px var(--background), 0 0 0 11px var(--ink) !important; }
[data-slot="code-chip"] { border-radius: 11px; box-shadow: var(--shadow-lift) !important; }
[data-slot="code-chip"]${FOCUS} { box-shadow: var(--shadow-lift), ${AROUND} !important; }
`;

const FIELDS_CSS = `
${FIELDS} {
  height: 40px; border: 0; border-radius: 12px; padding-inline: 13px; font-size: 14px;
  background-color: var(--tone); background-image: none; box-shadow: none; caret-color: currentColor;
  transition: background-color 160ms linear, color 160ms linear, box-shadow 120ms linear;
}
${each(FIELDS, "::placeholder")} { color: var(--faint); transition: color 160ms linear; }
${each(FIELDS, HOVER + LIVE)} { background-color: var(--tone-up); }
${each(FIELDS, FOCUS)} { outline: none; background-color: var(--ink); color: var(--ink-fg); box-shadow: ${CURSOR("color-mix(in oklab, var(--ink-fg) 55%, transparent)")}; }
${each(FIELDS, FOCUS + "::placeholder")} { color: color-mix(in oklab, var(--ink-fg) 55%, transparent); }
${each(FIELDS, FOCUS + "::selection")} { background: color-mix(in oklab, var(--ink-fg) 30%, transparent); color: var(--ink-fg); }
[data-slot="select-trigger"]${FOCUS} svg { color: var(--ink-fg) !important; opacity: 0.8; }
${each(FIELDS, ERROR)} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
${each(FIELDS, ERROR + FOCUS)} { box-shadow: ${CURSOR("var(--destructive)")}; }
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, BUSY)} {
  background-image: linear-gradient(var(--ink) 0 0);
  background-repeat: no-repeat; background-size: 42% 2px; background-position: 0 100%;
  animation: vf-ink-line 1.3s var(--ease-in-out-strong) infinite;
}

[data-slot="switch"] {
  width: 44px; height: 26px; border: 0; border-radius: 999px; background: var(--tone-up); box-shadow: none; outline: none;
  transition: background-color 160ms linear, box-shadow 120ms linear;
}
[data-slot="switch"]:is([data-state="checked"],[data-checked]) { background: var(--ink); }
[data-slot="switch-thumb"] {
  width: 20px; height: 20px; border-radius: 999px; translate: 3px 0; background: var(--card); box-shadow: 0 1px 2px oklch(0 0 0 / 25%);
  transition: translate 180ms var(--ease-in-out-strong), background-color 120ms linear;
}
.dark [data-slot="switch"]:not(:is([data-state="checked"],[data-checked])) [data-slot="switch-thumb"] { background: color-mix(in oklab, var(--foreground) 62%, var(--background)); }
.surface-paper [data-slot="switch"]:not(:is([data-state="checked"],[data-checked])) [data-slot="switch-thumb"] { background: var(--card); }
[data-slot="switch"]:is([data-state="checked"],[data-checked]) [data-slot="switch-thumb"] { translate: 21px 0; background: var(--ink-fg); }
[data-slot="switch"]${FOCUS} { box-shadow: ${AROUND}; }
[data-slot="switch"]${OFF} { opacity: 0.4; }

[data-slot="checkbox"], [data-slot="radio-group-item"] {
  width: 20px; height: 20px; background: var(--tone-up); box-shadow: none; color: var(--ink-fg);
}
[data-slot="checkbox"] { border-radius: 6px; }
[data-slot="radio-group-item"] { border-radius: 999px; }
[data-slot="checkbox"]${HOVER}${LIVE}, [data-slot="radio-group-item"]${HOVER}${LIVE} { background: color-mix(in oklab, var(--foreground) 20%, transparent); }
[data-slot="checkbox"][data-state="checked"], [data-slot="radio-group-item"][data-state="checked"] { background: var(--ink); }
[data-slot="checkbox"]${FOCUS}, [data-slot="radio-group-item"]${FOCUS} { box-shadow: ${AROUND}; }
[data-slot="checkbox"]${ERROR}, [data-slot="radio-group-item"]${ERROR} { box-shadow: inset 0 0 0 1.5px var(--destructive); }
[data-slot="checkbox"]${OFF}, [data-slot="radio-group-item"]${OFF} { opacity: 0.4; }

[data-slot="slider-track"] { height: 6px; border-radius: 999px; background: var(--tone-up); }
[data-slot="slider-range"] { background: var(--ink); border-radius: 999px; }
[data-slot="slider-thumb"] {
  width: 18px; height: 18px; border-radius: 999px; background: var(--ink);
  box-shadow: 0 0 0 3px var(--background);
}
[data-slot="slider-thumb"]${FOCUS} { box-shadow: 0 0 0 3px var(--background), 0 0 0 5px var(--ink); }
[data-slot="slider-thumb"]:active { scale: 1.12; }
[data-slot="slider"]${OFF} { opacity: 0.4; }

/* a radio card holds more than its words (a gate holds its password), so it is never
   inverted: the chosen card steps up a tone, framed in ink, its radio inked */
[data-slot="radio-card"] {
  border: 0 !important; border-radius: 13px !important; background: var(--tone) !important; box-shadow: none;
}
[data-slot="radio-card"]${HOVER} { background: var(--tone-up) !important; }
[data-slot="radio-card"]:is([data-state="on"],[data-state="checked"]) {
  background: var(--tone-up) !important; box-shadow: inset 0 0 0 2px var(--ink);
}

/* tabs: a tone track, the tab you are on in ink */
[data-slot="tabs-list"] { height: auto; gap: 2px; padding: 3px; border-radius: 12px; background: var(--tone); }
[data-slot="tabs-trigger"] {
  height: 30px; padding: 0 13px; border: 0; border-radius: 9px; background: transparent !important; box-shadow: none !important;
  color: var(--muted-foreground); transition: background-color 160ms linear, color 160ms linear;
}
[data-slot="tabs-trigger"]::after { display: none !important; }
[data-slot="tabs-trigger"]${HOVER} { color: var(--foreground); }
[data-slot="tabs-trigger"][data-state="active"] { background: var(--ink) !important; color: var(--ink-fg); }
[data-slot="tabs-trigger"]${FOCUS} { outline: none; background: var(--ink) !important; color: var(--ink-fg); box-shadow: ${CURSOR()} !important; }

@keyframes vf-ink-fill { from { background-size: 0 2px; } to { background-size: calc(100% - 16px) 2px; } }
@keyframes vf-ink-line { from { background-size: 0% 2px; } to { background-size: 100% 2px; } }
`;

export const INK_CSS = ACTIONS + FIELDS_CSS;
