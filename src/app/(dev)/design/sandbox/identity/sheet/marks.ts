/**
 * THE FOUR CORNER MARKS: the frame a camera puts round what it focuses on, and
 * since round two only that (Will: "the viewfinder's corners survive only as a
 * focus mark, never a style"), so the one option that wears them, the r3 mark,
 * wears them on focus alone (`focus.ts`, `identity.test.ts`). Eight background
 * layers (an arm along each edge at each corner), driven by three variables so
 * a state only swaps a variable: `--m-c` the colour, `--m-a` the arm, `--m-w`
 * the weight.
 *
 * ★ BACKGROUNDS, NOT BORDERS OR PSEUDO-ELEMENTS, WHERE THE ATOM IS A FIELD. An
 * `<input>` takes no `::before` or `::after`, so a field's marks are its own
 * background layers; a button's sit on a pseudo-element, which can stand
 * outside its box (the lock).
 *
 * ★ A ROUNDED BOX CLIPS ITS OWN BACKGROUND, so marks drawn on a field with a
 * corner sit on the curve: their arms show, the very corner does not. Marks
 * that must stay crisp stand on a box with a corner under 3px, or outside it.
 */
const ARM = "var(--m-a, 7px)";
const WEIGHT = "var(--m-w, 1.5px)";
const INK = "linear-gradient(var(--m-c, transparent) 0 0)";

export const MARK_IMAGES = Array.from({ length: 8 }, () => INK).join(", ");
export const MARK_SIZES = Array.from(
  { length: 4 },
  () => `${ARM} ${WEIGHT}, ${WEIGHT} ${ARM}`,
).join(", ");
export const MARK_POSITIONS =
  "top left, top left, top right, top right, bottom left, bottom left, bottom right, bottom right";

/**
 * The marks drawn a few pixels inside a box's own edge, where a field (which
 * takes no pseudo-element) wears the lock: inside its rounded corner, so each
 * mark is a whole L rather than an arm the curve has clipped.
 */
export const MARK_POSITIONS_IN = [
  "left 4px top 4px",
  "left 4px top 4px",
  "right 4px top 4px",
  "right 4px top 4px",
  "left 4px bottom 4px",
  "left 4px bottom 4px",
  "right 4px bottom 4px",
  "right 4px bottom 4px",
].join(", ");

/** The marks as the whole background of a box (a pseudo-element, a mark-only atom). */
export const MARKS = `
  background-image: ${MARK_IMAGES};
  background-size: ${MARK_SIZES};
  background-position: ${MARK_POSITIONS};
  background-repeat: no-repeat;
`;

/**
 * THE LOCK: the marks standing outside an atom on a pseudo-element, out at
 * rest and closing in on focus, the way a camera locks focus. 160ms on the
 * house entrance curve; nothing bounces.
 */
export const lockAt = (out = "10px") => `
  content: ""; position: absolute; inset: calc(-1 * ${out}); pointer-events: none; opacity: 0;
  border-radius: 0; --m-c: var(--foreground);
  ${MARKS}
  transition: inset 160ms var(--ease-emphasis), opacity 90ms linear;
`;
export const locked = (at = "4px") => `opacity: 1; inset: calc(-1 * ${at});`;
