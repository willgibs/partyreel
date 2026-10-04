import type { FieldId } from "../model";

import {
  BTN,
  each,
  ERROR,
  FIELDS,
  FOCUS,
  HOVER,
  LIVE,
  OFF,
  RADIO_CARD,
  SEGMENTS,
  TABS,
} from "./states";

/**
 * WHAT HOLDS A VALUE: a line typed in, a box of lines, a choice from a list,
 * and the things that hold a choice the same way (a segmented control's track
 * and a tab list's, a radio card at rest). Its body at rest, under a pointer,
 * in use, in error and held off; the focus MARK is the focus trait's, drawn
 * over this.
 *
 * ★ EVERY FIELD GROWS TO AT LEAST 40PX, WHATEVER IT IS DRAWN AS (r2's
 * carried call, kept): a field is found and pressed in a hand, so the three
 * differ by their drawing alone. A key standing beside a field (Account's Save) takes the
 * field's height, so the pair reads as one line; every other action keeps
 * production's.
 *
 * ★ IN USE IS THE FIELD'S OWN, NOT THE FOCUS MARK: a well lifts a step toward
 * the card while it is typed in, a ring darkens a step, a tone steps up; the
 * mark round it (a halo, an outline, the cursor) is drawn by `focus.ts` on top.
 *
 * ★ LIT FROM ABOVE, AS EVERYTHING IS (the fresh-eyes pass: one light for the
 * whole product). A well is a recess, so its top edge is in shade and its foot
 * catches the light; a ring is a line in that light, darker along its foot on
 * paper and brighter along its top in the room; a tone has no edge to light.
 * In the room a well goes deeper than the page under it (the room's steps were
 * too small to read as depth: a well a hair under its card read as an outline).
 *
 * The corners stay on the panel scale (A1, the carried call `corner-scale`): a
 * field at 8px or 10px, a card that holds a choice at 10px or 12px.
 *
 * H3, Settings' dates: two of these joined by "to", never a range picker, so
 * the range is drawn by whichever field is picked (the carried call `dates`).
 */

/** Laid out once for every field: the box every build draws on. */
/**
 * ★ A FIELD'S OWN SIZE IS ITS SCREEN'S: the trait sets a floor (40px) and
 * never a height, a type size or a right padding, which a field's own place
 * sets for a reason (the guest's door is 44px with 16px type, which stops a
 * phone zooming on focus, and keeps 40px clear on its right for its eye).
 */
const BOX = `
${FIELDS} {
  border: 0; padding-left: 12px; background-image: none;
  transition: background-color 140ms linear, box-shadow 140ms linear, color 140ms linear;
}
[data-slot="input"], [data-slot="select-trigger"] { min-height: 40px; }
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, OFF)} { opacity: 0.45; }
${each(FIELDS, ` + ${BTN}`)} { height: auto; align-self: stretch; }
${SEGMENTS}, ${TABS} { gap: 2px; padding: 3px; }
`;

/**
 * A WELL (keys and wells): sunk into the body (Will, r2: "I like wells,
 * especially recessed inputs for subtle difference against page color"). On
 * paper a step darker than the page, its top edge a line of shade fading
 * down three pixels, its sides and foot faint, a lip of light along its foot;
 * in the room a hole deeper than the page, its foot lip lit. In use it lifts a
 * step toward the card, still sunk. Its tokens are every well's (`base.ts`):
 * a switch, a check and a segmented control's track are wells too.
 */
const RECESS = (rim = "var(--vf-well-rim)") =>
  `inset 0 1px 0 0 var(--vf-well-top), inset 0 2px 3px 0 var(--vf-well-fade), inset 0 -1px 0 0 var(--vf-well-lip), inset 0 0 0 1px ${rim}`;
const WELL = `
${FIELDS} { border-radius: 8px; background-color: var(--vf-well); --i-body: ${RECESS()}; }
${each(FIELDS, HOVER + LIVE)} { --i-body: ${RECESS("var(--vf-well-rim-hover)")}; }
${each(FIELDS, FOCUS)} {
  outline: none; background-color: color-mix(in oklab, var(--vf-well) 50%, var(--card));
  --i-body: ${RECESS("var(--vf-well-rim-hover)")};
}
${each(FIELDS, ERROR)} {
  --i-body: ${RECESS("color-mix(in oklab, var(--destructive) 75%, transparent)")};
}
${SEGMENTS}, ${TABS} { border-radius: 10px; background: var(--vf-well); box-shadow: ${RECESS()}; }
${RADIO_CARD} {
  --rc-r: 10px; border: 0 !important; border-radius: var(--rc-r) !important; background: var(--vf-well) !important;
  --i-body: ${RECESS()};
}
${RADIO_CARD}${HOVER} { --i-body: ${RECESS("var(--vf-well-rim-hover)")}; }
`;

/**
 * A RING (all rings): drawn in line, a soft-cornered 1.5px ring you see the
 * page through, lit from above as everything is (a shade along its foot on
 * paper, a light along its top in the room), so it is ours rather than the
 * stock input; in use it darkens a step (never to ink: the focus mark round it
 * would make it a double frame).
 */
const RING_TOKENS = `
:root, .surface-paper { --vf-ring-top: transparent; --vf-ring-foot: oklch(0.14 0.004 286 / 22%); }
.dark, .surface-display { --vf-ring-top: oklch(1 0 0 / 26%); --vf-ring-foot: transparent; }
`;
const LINE = (ring = "var(--vf-ring)") =>
  `inset 0 1.5px 0 0 var(--vf-ring-top), inset 0 -1.5px 0 0 var(--vf-ring-foot), inset 0 0 0 1.5px ${ring}`;
const RING = `
${RING_TOKENS}
${FIELDS} { border-radius: 10px; padding-left: 14px; background-color: transparent; --i-body: ${LINE()}; }
${each(FIELDS, HOVER + LIVE)} { --i-body: ${LINE("var(--vf-ring-strong)")}; }
${each(FIELDS, FOCUS)} { outline: none; --i-body: ${LINE("var(--vf-ring-strong)")}; }
${each(FIELDS, ERROR)} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${SEGMENTS}, ${TABS} { border-radius: 999px; background: transparent; box-shadow: ${LINE()}; }
${RADIO_CARD} {
  --rc-r: 12px; border: 0 !important; border-radius: var(--rc-r) !important; background: transparent !important;
  --i-body: ${LINE()};
}
${RADIO_CARD}${HOVER} { --i-body: ${LINE("var(--vf-ring-strong)")}; }
`;

/**
 * A TONE (ink): a quiet fill of the ground's own ink and no line at all, so a
 * page of fields reads as calm as its type; in use it steps up a tone. Firm
 * enough to read as a field at arm's length, and always a step under any tone
 * an action wears (`button.ts`), so a field never reads as a key beside one.
 */
const TONE_TOKENS = `
:root, .surface-paper { --vf-tone-field: 9%; --vf-tone-field-up: 13%; }
.dark, .surface-display { --vf-tone-field: 6%; --vf-tone-field-up: 10%; }
`;
const TONED = (p: string) =>
  `color-mix(in oklab, var(--foreground) var(${p}), transparent)`;
const TONE = `
${TONE_TOKENS}
${FIELDS} {
  border-radius: 10px; padding-left: 13px; background-color: ${TONED("--vf-tone-field")}; caret-color: currentColor;
}
${each(FIELDS, HOVER + LIVE)} { background-color: ${TONED("--vf-tone-field-up")}; }
${each(FIELDS, FOCUS)} { outline: none; background-color: ${TONED("--vf-tone-field-up")}; }
${each(FIELDS, ERROR)} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${SEGMENTS}, ${TABS} { border-radius: 12px; background: ${TONED("--vf-tone-field")}; box-shadow: none; }
${RADIO_CARD} {
  --rc-r: 12px; border: 0 !important; border-radius: var(--rc-r) !important; background: ${TONED("--vf-tone-field")} !important;
}
${RADIO_CARD}${HOVER} { background: ${TONED("--vf-tone-field-up")} !important; }
`;

export const FIELD_CSS: Record<FieldId, string> = {
  well: BOX + WELL,
  ring: BOX + RING,
  tone: BOX + TONE,
};
