import {
  ATOMS,
  CHIPS,
  RADIO,
  RADIO_CARD,
  SEGMENTS,
  SLIDER,
  SLIDER_THUMB,
  TAB,
  TABS,
} from "./states";

/**
 * WHAT EVERY MIX STANDS ON: the tokens the traits read, the one rule that
 * composes their layers, and the stand-ins' own layout. Nothing here is a
 * trait's look; a frame with every trait sheet removed still lays out.
 *
 * ★ PRODUCTION'S MATERIAL IS THE GROUND NOW. Viewfinder's body, the camera
 * voice, the display and the lights are wired (`identity-wiring`), so this
 * declares only what the traits add to them: a key's bevel, a well's shade, a
 * ring's line, a wash, a thumb's grey, each on both grounds and on the display
 * (a field inside a popover reads the screen's own greys), and ink's two tones
 * on each atom itself, where its own foreground is.
 *
 * ★ A TOKEN THAT DEPENDS ON ITS GROUND IS DECLARED ON EVERY GROUND: a frame can
 * draw paper and the room in one document, and a `var()` inside a custom
 * property resolves where it is declared, so a value declared once on the root
 * would carry paper's bevel into the room.
 */
const TOKENS = `
:root, .surface-paper {
  --vf-key-hi: oklch(1 0 0 / 85%);
  --vf-key-lo: oklch(0 0 0 / 9%);
  --vf-ink-hi: oklch(1 0 0 / 16%);
  --vf-ink-lo: oklch(0 0 0 / 38%);
  --vf-well-shade: oklch(0 0 0 / 7%);
  --vf-ring: oklch(0.14 0.004 286 / 24%);
  --vf-ring-strong: oklch(0.14 0.004 286 / 48%);
  --vf-wash: oklch(0.14 0.004 286 / 6%);
  --vf-wash-strong: oklch(0.14 0.004 286 / 10%);
  --vf-thumb: oklch(1 0 0);
}
.dark {
  --vf-key-hi: oklch(1 0 0 / 8%);
  --vf-key-lo: oklch(0 0 0 / 45%);
  --vf-ink-hi: oklch(1 0 0 / 75%);
  --vf-ink-lo: oklch(0 0 0 / 20%);
  --vf-well-shade: oklch(0 0 0 / 40%);
  --vf-ring: oklch(1 0 0 / 22%);
  --vf-ring-strong: oklch(1 0 0 / 46%);
  --vf-wash: oklch(1 0 0 / 6%);
  --vf-wash-strong: oklch(1 0 0 / 11%);
  --vf-thumb: oklch(0.64 0.005 286);
}
.surface-display {
  --vf-key-hi: oklch(1 0 0 / 9%);
  --vf-key-lo: oklch(0 0 0 / 45%);
  --vf-ink-hi: oklch(1 0 0 / 75%);
  --vf-ink-lo: oklch(0 0 0 / 20%);
  --vf-well-shade: oklch(0 0 0 / 40%);
  --vf-ring: oklch(1 0 0 / 24%);
  --vf-ring-strong: oklch(1 0 0 / 50%);
  --vf-wash: oklch(1 0 0 / 7%);
  --vf-wash-strong: oklch(1 0 0 / 12%);
  --vf-thumb: oklch(0.7 0.005 286);
}
/* Ink and its two tones, read on the atom itself, where its own ground is. */
:where(${ATOMS}, ${CHIPS}, ${SEGMENTS}, ${TABS}, ${SLIDER}) {
  --ink: var(--primary); --ink-fg: var(--primary-foreground);
  --tone: color-mix(in oklab, var(--foreground) 8%, transparent);
  --tone-up: color-mix(in oklab, var(--foreground) 13%, transparent);
}
`;

/**
 * THE COMPOSITION (`states.ts`'s note): each trait writes its own layer, this
 * rule draws all of them. Registered so a layer never inherits into an atom
 * inside another, and so a press's travel and a focus's lift add up.
 */
const COMPOSE = `
@property --i-focus { syntax: "*"; inherits: false; }
@property --i-sel { syntax: "*"; inherits: false; }
@property --i-press { syntax: "*"; inherits: false; }
@property --i-body { syntax: "*"; inherits: false; }
@property --i-press-y { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --i-focus-y { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --i-press-s { syntax: "<number>"; inherits: false; initial-value: 1; }
${ATOMS} {
  box-shadow: var(--i-focus, 0 0 #0000), var(--i-sel, 0 0 #0000), var(--i-press, 0 0 #0000), var(--i-body, 0 0 #0000);
  translate: 0 calc(var(--i-press-y) + var(--i-focus-y));
  scale: var(--i-press-s);
}
`;

/**
 * Laid out once for every mix: the stand-ins (production has no check, radio,
 * slider or radio card primitive yet: `views/atoms.tsx`) and the shared loops.
 */
const STAND_INS = `
[data-slot="checkbox"], ${RADIO} {
  position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 18px; height: 18px; padding: 0; border: 0; outline: none; cursor: pointer; color: var(--primary-foreground);
}
[data-slot="checkbox-indicator"] { display: none; align-items: center; justify-content: center; }
[data-slot="checkbox-indicator"] svg { width: 12px; height: 12px; stroke-width: 3.2; }
[data-slot="checkbox"][data-state="checked"] [data-slot="checkbox-indicator"] { display: flex; }
[data-slot="radio-group-indicator"] { display: none; width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
${RADIO}[data-state="checked"] [data-slot="radio-group-indicator"] { display: block; }
${SLIDER} {
  position: relative; display: flex; align-items: center; width: 100%; height: 26px; touch-action: none; cursor: pointer;
}
[data-slot="slider-track"] { position: relative; flex: 1; overflow: hidden; }
[data-slot="slider-range"] { position: absolute; inset-block: 0; left: 0; }
/* The thumb is centred by its margins, never its translate (the press and the focus lift own that);
   a toggles sheet sizes it through --thumb-size. */
${SLIDER_THUMB} {
  position: absolute; top: 50%; outline: none; cursor: grab;
  width: var(--thumb-size, 20px); height: var(--thumb-size, 20px);
  margin-top: calc(var(--thumb-size, 20px) / -2); margin-left: calc(var(--thumb-size, 20px) / -2);
}
${RADIO_CARD} { position: relative; cursor: pointer; }
${TABS} { position: relative; }
${TAB} { position: relative; flex: none; }
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
`;

/**
 * ★ REDUCED MOTION IS THE GLOBAL GUARD'S (globals.css): every loop a trait
 * runs plays once at 0.01ms and rests on its base style, which each working
 * state draws to read as working on its own, never as nothing.
 */
export const BASE_CSS = TOKENS + COMPOSE + STAND_INS;
