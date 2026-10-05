import {
  ATOMS,
  BTN,
  btn,
  CHECK,
  CHIP,
  CHIPS,
  each,
  FIELDS,
  OFF,
  RADIO,
  RADIO_CARD,
  SEGMENT,
  SEGMENTS,
  SLIDER,
  SLIDER_THUMB,
  SWITCH,
  SWITCH_ON,
  TAB,
  TABS,
  THUMB,
  PRESS,
  LIVE,
} from "./states";

/**
 * WHAT EVERY SET STANDS ON: the ink and tone steps, the shared geometry, the
 * one rule that composes the layers, and the stand-ins' own layout. Nothing
 * here is a set's look: a frame with its set sheet removed still lays out.
 *
 * ★ EVERYTHING BUT A FEW CONSTRUCTIONS IS SHARED (the r5 brief: "differing
 * in a few load-bearing constructions and sharing everything else (the 40px
 * field, the 8px corner scale, the ink and tone steps, spacing)"). So the
 * field's 40px floor and 8px corner, the action ladder's own corners (0.4 of
 * a key's height, production's), a chip's 28px, a segment's 30px in a 3px
 * track, the switch's 40 by 24, an 18px check and radio, a slider's 20px
 * thumb, every transition and the disabled step are laid once, here; a set
 * draws bodies, never boxes.
 *
 * ★ A TOKEN THAT DEPENDS ON ITS GROUND IS DECLARED ON EVERY GROUND: a frame can
 * draw paper and the room in one document, and a `var()` inside a custom
 * property resolves where it is declared, so a value declared once on the root
 * would carry paper's tone into the room. The tones are read on the atom
 * itself (`:where(atoms)`), where its own foreground is.
 */

/**
 * THE INK AND TONE STEPS: ink is the house's one strong value (near-black on
 * paper, white in the room); a tone is the ground's own ink at a few percent,
 * four steps. Every set reads these and no other grey.
 */
const TOKENS = `
:where(${ATOMS}, ${CHIPS}, ${SEGMENTS}, ${TABS}, ${SLIDER}, ${THUMB}, [data-slot="slider-track"]) {
  --ink: var(--primary); --ink-fg: var(--primary-foreground);
  --tone-1: color-mix(in oklab, var(--foreground) 4%, transparent);
  --tone-2: color-mix(in oklab, var(--foreground) 7%, transparent);
  --tone-3: color-mix(in oklab, var(--foreground) 11%, transparent);
  --tone-4: color-mix(in oklab, var(--foreground) 16%, transparent);
}
`;

/**
 * THE COMPOSITION (`states.ts`'s note): each trait writes its own layer, this
 * rule draws all of them. Registered so a layer never inherits into an atom
 * inside another, and so a press's scale and a focus's halo add up.
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
 * Laid out once for every set: the stand-ins (production has no check, radio,
 * slider or radio card primitive yet: `views/atoms.tsx`).
 */
const STAND_INS = `
${CHECK}, ${RADIO} {
  position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 18px; height: 18px; padding: 0; border: 0; outline: none; cursor: pointer; color: var(--ink-fg);
}
[data-slot="checkbox-indicator"] { display: none; align-items: center; justify-content: center; }
[data-slot="checkbox-indicator"] svg { width: 12px; height: 12px; stroke-width: 3.2; }
${CHECK}[data-state="checked"] [data-slot="checkbox-indicator"] { display: flex; }
[data-slot="radio-group-indicator"] { display: none; width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
${RADIO}[data-state="checked"] [data-slot="radio-group-indicator"] { display: block; }
${SLIDER} {
  position: relative; display: flex; align-items: center; width: 100%; height: 26px; touch-action: none; cursor: pointer;
}
[data-slot="slider-track"] { position: relative; flex: 1; overflow: hidden; height: 6px; border-radius: 999px; }
[data-slot="slider-range"] { position: absolute; inset-block: 0; left: 0; border-radius: 999px; }
/* The thumb is centred by its margins, never its translate (the press owns that). */
${SLIDER_THUMB} {
  position: absolute; top: 50%; outline: none; cursor: grab; border-radius: 999px;
  width: 20px; height: 20px; margin-top: -10px; margin-left: -10px;
}
${RADIO_CARD} { position: relative; cursor: pointer; }
${TABS} { position: relative; }
${TAB} { position: relative; flex: none; }
`;

/**
 * THE SHARED GEOMETRY. A set may never move a box: two sets differ by how a
 * part is built, so the same screen lays out alike in all four.
 *
 * ★ A FIELD'S OWN SIZE IS ITS SCREEN'S: the floor is 40px and never a height,
 * a type size or a right padding, which a field's own place sets for a reason
 * (the guest's door is 44px with 16px type, which stops a phone zooming on
 * focus, and keeps 40px clear on its right for its eye). A key standing
 * beside a field (Account's Save) takes the field's height, so the pair reads
 * as one line.
 */
const GEOMETRY = `
${FIELDS} {
  border: 0; border-radius: 8px; padding-left: 12px; background-image: none;
  transition: background-color 140ms linear, box-shadow 140ms linear, color 140ms linear;
}
[data-slot="input"], [data-slot="select-trigger"] { min-height: 40px; }
[data-slot="textarea"] { height: auto; min-height: 84px; padding-block: 10px; }
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, ` + ${BTN}`)} { height: auto; align-self: stretch; }

${BTN} {
  border-color: transparent; background-clip: border-box;
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear, scale 140ms var(--ease-emphasis);
}
/* Positioned for what a set or a working state draws on it, unless it is placed already: an unlayered
   position would outrank a popup's absolute close and drop it into the flow. */
${BTN}:not(.absolute,.fixed,.sticky) { position: relative; }
${BTN}${OFF} { opacity: 0.4; }
${btn("link")} { height: auto; padding: 0; gap: 6px; background: none; color: var(--foreground); --i-body: 0 0 #0000; }
${btn("link")}:is(:hover,[data-demo~="hover"]) { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }

${CHIPS} { gap: 6px; }
${CHIP} {
  position: relative; height: 28px; min-width: 0; padding: 0 11px; border: 0; border-radius: 11px;
  color: var(--muted-foreground);
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear, scale 140ms var(--ease-emphasis);
}
${CHIP}${OFF} { opacity: 0.4; }

${SEGMENTS}, ${TABS} { gap: 2px; padding: 3px; border-radius: 11px; height: auto; }
${SEGMENT}, ${TAB} {
  position: relative; height: 30px; min-width: 32px; padding: 0 11px; border: 0; border-radius: 8px;
  white-space: nowrap; background: transparent; color: var(--muted-foreground);
  transition: background-color 120ms linear, color 120ms linear, box-shadow 120ms linear, scale 140ms var(--ease-emphasis);
}
${SEGMENT}:is(:hover,[data-demo~="hover"]), ${TAB}:is(:hover,[data-demo~="hover"]) { color: var(--foreground); }
${SEGMENT}${OFF}, ${TAB}${OFF} { opacity: 0.4; }
${TAB}::after { display: none; }

${RADIO_CARD} {
  --rc-r: 12px; border: 0 !important; border-radius: var(--rc-r) !important;
  transition: background-color 140ms linear, box-shadow 140ms linear;
}

${SWITCH} {
  width: 40px; height: 24px; border: 0; border-radius: 999px;
  transition: background-color 160ms var(--ease-in-out-strong), box-shadow 120ms linear;
}
${THUMB} {
  position: relative; width: 18px; height: 18px; border-radius: 999px; translate: 3px 0;
  transition: translate 180ms var(--ease-in-out-strong), width 120ms var(--ease-emphasis), background-color 120ms linear, box-shadow 120ms linear;
}
${SWITCH}${SWITCH_ON} ${THUMB} { translate: 19px 0; }
/* A held switch's give: its thumb widens toward where it will go, then lands. */
${SWITCH}${PRESS}${LIVE} ${THUMB} { width: 22px; }
${SWITCH}${SWITCH_ON}${PRESS}${LIVE} ${THUMB} { translate: 15px 0; }
${SWITCH}${OFF}, ${CHECK}${OFF}, ${RADIO}${OFF}, ${SLIDER}${OFF} { opacity: 0.4; cursor: not-allowed; }
${CHECK} { border-radius: 5px; }
${RADIO} { border-radius: 999px; }
${CHECK}, ${RADIO} { transition: background-color 120ms linear, box-shadow 120ms linear, color 120ms linear; }
${SLIDER_THUMB} { transition: box-shadow 120ms linear, background-color 120ms linear; }
`;

/**
 * ★ REDUCED MOTION IS THE GLOBAL GUARD'S (globals.css): every loop a working
 * state runs plays once at 0.01ms and rests on its base style, which each
 * working option draws to read as working on its own. `.identity-still`
 * applies the same guard to a subtree, so a frame can show a loop beside its
 * still (the loading ask's twin).
 */
const STILL = `
.identity-still, .identity-still *, .identity-still *::before, .identity-still *::after {
  animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important; animation-delay: 0ms !important;
}
`;

export const BASE_CSS = TOKENS + COMPOSE + STAND_INS + GEOMETRY + STILL;
