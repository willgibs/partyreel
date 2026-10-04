import type { FieldId } from "../model";

import {
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
 * and a tab list's, a radio card at rest). Its body at rest, under a pointer, in use, in
 * error and held off; the focus MARK is the focus trait's, drawn over this.
 *
 * ★ EVERY FIELD GROWS TO 40PX, WHATEVER IT IS DRAWN AS (r2's carried call, kept):
 * a field is found and pressed in a hand, so the three differ by their drawing
 * alone, and every action keeps production's height.
 *
 * ★ IN USE IS THE FIELD'S OWN, NOT THE FOCUS MARK: a well lifts a step toward
 * the card while it is typed in, a ring darkens to ink, a tone steps up; the
 * mark round it (a halo, an outline, the cursor) is drawn by `focus.ts` on top.
 *
 * H3, Settings' dates: two of these joined by "to", never a range picker, so
 * the range is drawn by whichever field is picked (the carried call `dates`).
 */

/** Laid out once for every field: the box every build draws on. */
const BOX = `
${FIELDS} {
  height: 40px; border: 0; padding-inline: 12px; font-size: 14px; background-image: none;
  transition: background-color 140ms linear, box-shadow 140ms linear, color 140ms linear;
}
${each(FIELDS, "::placeholder")} { color: var(--faint); }
${each(FIELDS, OFF)} { opacity: 0.45; }
${SEGMENTS}, ${TABS} { gap: 2px; padding: 3px; }
`;

/**
 * A WELL (keys and wells): sunk into the body, a subtle step darker than the
 * page with a shade inside its top edge (Will, r2: "I like wells, especially
 * recessed inputs for subtle difference against page color"); in use it lifts
 * a step toward the card, still sunk.
 */
const WELL = `
${FIELDS} {
  border-radius: 9px; background-color: var(--muted);
  --i-body: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, HOVER + LIVE)} { --i-body: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
${each(FIELDS, FOCUS)} {
  outline: none; background-color: color-mix(in oklab, var(--muted) 55%, var(--card));
  --i-body: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade);
}
${each(FIELDS, ERROR)} {
  --i-body: inset 0 0 0 1px color-mix(in oklab, var(--destructive) 70%, transparent), inset 0 1px 2px var(--vf-well-shade);
}
${SEGMENTS}, ${TABS} {
  border-radius: 10px; background: var(--muted);
  box-shadow: inset 0 1px 2px var(--vf-well-shade), inset 0 0 0 1px var(--border);
}
${RADIO_CARD} {
  border: 0 !important; border-radius: 10px !important; background: var(--muted) !important;
  --i-body: inset 0 0 0 1px var(--border), inset 0 1px 2px var(--vf-well-shade);
}
${RADIO_CARD}${HOVER} { --i-body: inset 0 0 0 1px var(--input), inset 0 1px 2px var(--vf-well-shade); }
`;

/**
 * A RING (all rings): drawn in line, a soft-cornered 1.5px ring you see the
 * page through; in use the ring darkens a step (never to ink: the focus mark
 * round it would make it a double frame).
 */
const RING = `
${FIELDS} {
  border-radius: 12px; padding-inline: 14px; background-color: transparent;
  --i-body: inset 0 0 0 1.5px var(--vf-ring);
}
${each(FIELDS, HOVER + LIVE)} { --i-body: inset 0 0 0 1.5px var(--vf-ring-strong); }
${each(FIELDS, FOCUS)} { outline: none; --i-body: inset 0 0 0 1.5px var(--vf-ring-strong); }
${each(FIELDS, ERROR)} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${SEGMENTS}, ${TABS} { border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--vf-ring); }
${RADIO_CARD} {
  border: 0 !important; border-radius: 14px !important; background: transparent !important;
  --i-body: inset 0 0 0 1.5px var(--vf-ring);
}
${RADIO_CARD}${HOVER} { --i-body: inset 0 0 0 1.5px var(--vf-ring-strong); }
`;

/**
 * A TONE (ink): a quiet fill of the ground's own ink and no line at all, so a
 * page of fields reads as calm as its type; in use it steps up a tone.
 */
const TONE = `
${FIELDS} {
  border-radius: 12px; padding-inline: 13px; background-color: var(--tone); caret-color: currentColor;
}
${each(FIELDS, HOVER + LIVE)} { background-color: var(--tone-up); }
${each(FIELDS, FOCUS)} { outline: none; background-color: var(--tone-up); }
${each(FIELDS, ERROR)} { --i-body: inset 0 0 0 1.5px var(--destructive); }
${SEGMENTS}, ${TABS} { border-radius: 12px; background: var(--tone); box-shadow: none; }
${RADIO_CARD} { border: 0 !important; border-radius: 13px !important; background: var(--tone) !important; }
${RADIO_CARD}${HOVER} { background: var(--tone-up) !important; }
`;

export const FIELD_CSS: Record<FieldId, string> = {
  well: BOX + WELL,
  ring: BOX + RING,
  tone: BOX + TONE,
};
